-- HRM v1.1 — 마이그레이션 #9: 알림 시스템 (인앱 + SMS + 이메일 통합)
-- - hrm_notifications: 모든 채널의 알림을 한 테이블에 기록 (인앱은 권위 저장소, SMS/이메일은 발송 로그)
-- - hrm_employees.sms_opt_in: SMS 수신 동의 토글 (기본 false — 명시적 opt-in)

BEGIN;

-- ============================
-- ENUM
-- ============================
CREATE TYPE hrm_notification_channel AS ENUM ('inapp', 'sms', 'email');

CREATE TYPE hrm_notification_kind AS ENUM (
  'leave_request_submitted',         -- 결재자에게: 새 휴가 신청 접수
  'leave_approved',                  -- 신청자에게: 본인 휴가 승인됨
  'leave_rejected',                  -- 신청자에게: 본인 휴가 반려됨
  'leave_cancelled_by_employee',     -- 결재자에게: 본인 취소
  'employee_invitation'              -- 신규 직원에게: 비밀번호 설정 링크 (이메일 채널 전용)
);

CREATE TYPE hrm_notification_delivery_status AS ENUM (
  'pending',    -- 발송 대기
  'sent',       -- 발송 완료 (SMS/이메일)
  'stubbed',    -- 발송 환경 미설정 — 기록만
  'failed'      -- 발송 실패
);

-- ============================
-- hrm_employees.sms_opt_in 추가
-- ============================
ALTER TABLE hrm_employees
  ADD COLUMN sms_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN hrm_employees.sms_opt_in IS
  'SMS 알림 수신 동의. 기본 false — 본인이 프로필 수정 페이지에서 명시 opt-in.';

-- ============================
-- hrm_notifications
-- ============================
CREATE TABLE hrm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  sender_employee_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  channel hrm_notification_channel NOT NULL,
  kind hrm_notification_kind NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_path text,                        -- 앱 내부 경로 (예: '/approvals')
  related_resource_type text,            -- 'leave_request' 등
  related_resource_id uuid,
  delivery_status hrm_notification_delivery_status NOT NULL DEFAULT 'pending',
  delivery_error text,                   -- 실패 시 오류 메시지
  provider_id text,                      -- 외부 발송 ID (SMS/이메일 추적용)
  read_at timestamptz,                   -- 인앱 알림 — 본인이 확인한 시각. null=미읽음
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_created
  ON hrm_notifications(recipient_employee_id, created_at DESC);

-- 미읽음 조회 최적화: 본인 + 인앱 + 미읽음
CREATE INDEX idx_notifications_unread
  ON hrm_notifications(recipient_employee_id, channel)
  WHERE read_at IS NULL AND channel = 'inapp';

CREATE INDEX idx_notifications_kind ON hrm_notifications(kind);
CREATE INDEX idx_notifications_related
  ON hrm_notifications(related_resource_type, related_resource_id);

COMMENT ON TABLE hrm_notifications IS
  '모든 채널의 알림 로그 + 인앱 알림의 권위 저장소. channel=inapp이면 read_at로 미읽음 카운트 계산.';
COMMENT ON COLUMN hrm_notifications.link_path IS
  '인앱 알림 클릭 시 이동할 내부 경로. 예: /approvals 또는 /leave/history';
COMMENT ON COLUMN hrm_notifications.read_at IS
  'inapp 채널에서만 의미 있음. SMS/이메일은 항상 null.';

-- ============================
-- RLS
-- ============================
ALTER TABLE hrm_notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림 + admin은 모두 조회 가능
CREATE POLICY notifications_select_own_or_admin ON hrm_notifications
  FOR SELECT TO authenticated
  USING (recipient_employee_id = auth.uid() OR is_admin());

-- 본인이 자기 알림의 read_at만 변경 (다른 컬럼 변경은 RPC로만)
CREATE POLICY notifications_update_own_read_at ON hrm_notifications
  FOR UPDATE TO authenticated
  USING (recipient_employee_id = auth.uid())
  WITH CHECK (recipient_employee_id = auth.uid());

-- INSERT는 service_role만 (시스템 발송 경로). 일반 사용자가 직접 INSERT 금지.
-- DELETE도 service_role/admin만.
CREATE POLICY notifications_delete_admin ON hrm_notifications
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================
-- RPC: mark_notification_read / mark_all_notifications_read
-- ============================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE hrm_notifications
    SET read_at = COALESCE(read_at, now())
    WHERE id = p_notification_id
      AND recipient_employee_id = auth.uid()
      AND channel = 'inapp';
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE hrm_notifications
    SET read_at = now()
    WHERE recipient_employee_id = auth.uid()
      AND channel = 'inapp'
      AND read_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

COMMIT;
