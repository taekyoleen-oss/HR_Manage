-- HRM v1.2 — 경조사 기준 정책 + 휴가 신청 통합
-- 본인 결혼/자녀 출생/부모 사망 등 경조사 사유별 일수·첨부 기준을 관리.
-- 휴가 신청에서 family_event 타입 선택 시 정책을 함께 선택하면 기준 일수가 자동 적용된다.
-- 초과 신청 시 초과분은 연차에서 차감 또는 무급으로 처리 (의사결정: 신청 시 분리 신청).
-- 작성일: 2026-05-19

BEGIN;

-- ============================
-- ENUM: 가족 관계 / 경조사 사유 / 사용 한도
-- ============================
CREATE TYPE hrm_family_relation AS ENUM (
  'self',           -- 본인
  'spouse',         -- 배우자
  'child',          -- 자녀
  'parent',         -- 부모
  'parent_in_law',  -- 배우자 부모
  'sibling',        -- 형제자매
  'grandparent',    -- 조부모(본인/배우자)
  'grandchild'      -- 손주
);

CREATE TYPE hrm_family_event_kind AS ENUM (
  'wedding',     -- 결혼
  'funeral',     -- 사망
  'birth',       -- 출산(자녀)
  'maternity',   -- 본인 출산
  'sixtieth',    -- 회갑/칠순 등 회연
  'other'
);

CREATE TYPE hrm_family_event_usage_limit AS ENUM (
  'once_lifetime',  -- 평생 1회 (본인 결혼)
  'once_per_year',  -- 연 1회
  'once_per_target',-- 대상자별 1회 (자녀 출생: 자녀별)
  'unlimited'       -- 사망 등 사건별
);

-- ============================
-- hrm_family_event_policies
-- ============================
CREATE TABLE hrm_family_event_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  relation hrm_family_relation NOT NULL,
  event_kind hrm_family_event_kind NOT NULL,
  granted_days numeric(5,1) NOT NULL CHECK (granted_days >= 0),
  required_attachment_note text,
  usage_limit hrm_family_event_usage_limit NOT NULL DEFAULT 'unlimited',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (relation, event_kind)
);

CREATE INDEX idx_family_event_active ON hrm_family_event_policies(is_active);

CREATE TRIGGER trg_family_event_updated_at BEFORE UPDATE ON hrm_family_event_policies
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_family_event_policies IS '경조사 기준 정책. 관계×사유 조합이 PK.';

-- ============================
-- hrm_leave_requests에 family_event_policy_id FK 추가
--   - family_event 타입 신청 시 필수 (애플리케이션 레이어 검증)
--   - granted_days 초과분은 별도 휴가(annual/unpaid)로 분리 신청해야 함
-- ============================
ALTER TABLE hrm_leave_requests
  ADD COLUMN family_event_policy_id uuid REFERENCES hrm_family_event_policies(id) ON DELETE SET NULL;

CREATE INDEX idx_leave_req_family_policy ON hrm_leave_requests(family_event_policy_id)
  WHERE family_event_policy_id IS NOT NULL;

COMMENT ON COLUMN hrm_leave_requests.family_event_policy_id
  IS '경조사 휴가 신청 시 적용된 정책. family_event leave_type일 때 사용.';

-- ============================
-- RPC: 경조사 휴가 신청 (정책 일수 검증 + leave_balances pending 영향 없음, 연차 차감 X)
--   기존 submit_leave_request와 분리해 family_event 전용 흐름.
-- ============================
CREATE OR REPLACE FUNCTION submit_family_event_leave(
  p_policy_id uuid,
  p_start_date date,
  p_end_date date,
  p_total_days numeric,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  emp_manager uuid;
  policy hrm_family_event_policies;
  family_type_id uuid;
  used_count int;
  new_id uuid;
BEGIN
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'INVALID_DATE_RANGE' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO policy FROM hrm_family_event_policies WHERE id = p_policy_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'POLICY_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  IF p_total_days > policy.granted_days THEN
    RAISE EXCEPTION 'EXCEEDS_POLICY' USING ERRCODE = 'P0001';
  END IF;

  -- 사용 한도 검사
  IF policy.usage_limit = 'once_lifetime' THEN
    SELECT count(*) INTO used_count
      FROM hrm_leave_requests
      WHERE employee_id = caller
        AND family_event_policy_id = p_policy_id
        AND status IN ('pending', 'approved');
    IF used_count > 0 THEN
      RAISE EXCEPTION 'USAGE_LIMIT_EXCEEDED' USING ERRCODE = 'P0001';
    END IF;
  ELSIF policy.usage_limit = 'once_per_year' THEN
    SELECT count(*) INTO used_count
      FROM hrm_leave_requests
      WHERE employee_id = caller
        AND family_event_policy_id = p_policy_id
        AND status IN ('pending', 'approved')
        AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM p_start_date);
    IF used_count > 0 THEN
      RAISE EXCEPTION 'USAGE_LIMIT_EXCEEDED' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- family_event 타입 id
  SELECT id INTO family_type_id FROM hrm_leave_types WHERE code = 'family_event' LIMIT 1;
  IF family_type_id IS NULL THEN
    RAISE EXCEPTION 'LEAVE_TYPE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT manager_id INTO emp_manager FROM hrm_employees WHERE id = caller;

  INSERT INTO hrm_leave_requests (
    employee_id, leave_type_id, start_date, end_date,
    start_period, end_period, total_days, reason,
    status, approver_id, family_event_policy_id
  ) VALUES (
    caller, family_type_id, p_start_date, p_end_date,
    'full_day', 'full_day', p_total_days, p_reason,
    'pending', emp_manager, p_policy_id
  ) RETURNING id INTO new_id;

  -- family_event는 deducts_from_annual=false이므로 leave_balances 미영향
  RETURN new_id;
END;
$$;

-- ============================
-- RLS
-- ============================
ALTER TABLE hrm_family_event_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_policies_select_all"
  ON hrm_family_event_policies FOR SELECT TO authenticated
  USING (is_active_user());

CREATE POLICY "family_policies_admin_modify"
  ON hrm_family_event_policies FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- 기본 시드 (한국 노동관행 표준안)
-- ============================
INSERT INTO hrm_family_event_policies
  (code, name, relation, event_kind, granted_days, required_attachment_note, usage_limit, sort_order)
VALUES
  ('self_wedding',         '본인 결혼',          'self',          'wedding',  5, '청첩장 또는 혼인신고서',     'once_lifetime',  1),
  ('child_wedding',        '자녀 결혼',          'child',         'wedding',  1, '청첩장',                      'once_per_target', 2),
  ('sibling_wedding',      '형제자매 결혼',      'sibling',       'wedding',  1, '청첩장',                      'once_per_target', 3),
  ('child_birth',          '자녀 출생(배우자)',  'spouse',        'birth',   10, '출생증명서',                  'once_per_target', 4),
  ('maternity_self',       '본인 출산(여)',      'self',          'maternity', 90, '출생증명서·진단서',          'once_per_target', 5),
  ('parent_funeral',       '부모 사망',          'parent',        'funeral',  5, '사망진단서 또는 부고',        'unlimited',       6),
  ('parent_in_law_funeral','배우자 부모 사망',   'parent_in_law', 'funeral',  5, '사망진단서 또는 부고',        'unlimited',       7),
  ('spouse_funeral',       '배우자 사망',        'spouse',        'funeral',  5, '사망진단서 또는 부고',        'once_lifetime',   8),
  ('child_funeral',        '자녀 사망',          'child',         'funeral',  5, '사망진단서 또는 부고',        'unlimited',       9),
  ('sibling_funeral',      '형제자매 사망',      'sibling',       'funeral',  3, '사망진단서 또는 부고',        'unlimited',      10),
  ('grandparent_funeral',  '조부모 사망',        'grandparent',   'funeral',  3, '사망진단서 또는 부고',        'unlimited',      11),
  ('sixtieth_parent',      '부모 회갑',          'parent',        'sixtieth', 1, NULL,                          'once_per_target',12)
ON CONFLICT (code) DO NOTHING;

COMMIT;
