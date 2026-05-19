-- HRM v1.2 — 교육·자산·인사이동 (라이트)
-- 작성일: 2026-05-19

BEGIN;

-- ============================
-- 교육·연수 이력
-- ============================
CREATE TABLE hrm_training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  provider text,                  -- 제공처 (사내/외부 기관명)
  category text,                  -- 직무/리더십/안전/법정 등 자유 텍스트
  start_date date NOT NULL,
  end_date date,
  hours numeric(5,1),
  cost numeric(12,0),             -- 원 단위
  certificate_url text,           -- 수료증 등 첨부
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_employee ON hrm_training_records(employee_id);
CREATE INDEX idx_training_dates ON hrm_training_records(start_date);

CREATE TRIGGER trg_training_updated_at BEFORE UPDATE ON hrm_training_records
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

ALTER TABLE hrm_training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_select_self_or_manager_or_admin"
  ON hrm_training_records FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin());
CREATE POLICY "training_admin_modify"
  ON hrm_training_records FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- 자산 마스터 + 배정 이력
-- ============================
CREATE TYPE hrm_asset_status AS ENUM (
  'available',     -- 보관 중
  'assigned',      -- 직원에게 배정 중
  'in_repair',     -- 수리/점검 중
  'retired'        -- 폐기/매각
);

CREATE TABLE hrm_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_no text UNIQUE NOT NULL,  -- 자산번호 (예: NB-2024-001)
  category text NOT NULL,         -- laptop/monitor/phone/desk/...
  name text NOT NULL,             -- 모델명 (예: MacBook Pro 14 M3)
  serial_no text,                 -- 시리얼
  purchased_at date,
  purchase_price numeric(12,0),
  status hrm_asset_status NOT NULL DEFAULT 'available',
  current_assignee_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  current_assigned_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_status ON hrm_assets(status);
CREATE INDEX idx_assets_assignee ON hrm_assets(current_assignee_id);

CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON hrm_assets
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

CREATE TABLE hrm_asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES hrm_assets(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  condition_on_assign text,
  condition_on_return text,
  performed_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  notes text
);
CREATE INDEX idx_asset_assign_asset ON hrm_asset_assignments(asset_id);
CREATE INDEX idx_asset_assign_emp ON hrm_asset_assignments(employee_id);

ALTER TABLE hrm_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_self_or_admin"
  ON hrm_assets FOR SELECT TO authenticated
  USING (current_assignee_id = auth.uid() OR is_admin());
CREATE POLICY "assets_admin_modify"
  ON hrm_assets FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "asset_assign_select_self_or_admin"
  ON hrm_asset_assignments FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "asset_assign_admin_modify"
  ON hrm_asset_assignments FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- 인사이동·승진 이력
-- ============================
CREATE TYPE hrm_position_change_type AS ENUM (
  'hire',          -- 입사
  'promotion',     -- 승진
  'demotion',      -- 강등
  'transfer',      -- 부서 이동
  'role_change',   -- 권한 변경
  'resignation',   -- 퇴사
  'other'
);

CREATE TABLE hrm_position_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  change_type hrm_position_change_type NOT NULL,
  effective_date date NOT NULL,
  from_department_id uuid REFERENCES hrm_departments(id) ON DELETE SET NULL,
  to_department_id uuid REFERENCES hrm_departments(id) ON DELETE SET NULL,
  from_position text,
  to_position text,
  from_role hrm_user_role,
  to_role hrm_user_role,
  notes text,
  performed_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_position_history_emp ON hrm_position_history(employee_id, effective_date DESC);

ALTER TABLE hrm_position_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "position_history_select_self_or_manager_or_admin"
  ON hrm_position_history FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin());
CREATE POLICY "position_history_admin_modify"
  ON hrm_position_history FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
