-- HRM v1.1 — 마이그레이션 #5: 감사 로그, 이메일 로그

BEGIN;

-- ============================
-- hrm_audit_logs
-- ============================
CREATE TABLE hrm_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  action text NOT NULL,            -- 'employee.update', 'leave.approve', 'csv_export.leave_history', ...
  target_table text,
  target_id uuid,
  changes jsonb,                   -- before/after diff
  metadata jsonb,                  -- ip, user_agent, row_count 등
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON hrm_audit_logs(actor_id);
CREATE INDEX idx_audit_action ON hrm_audit_logs(action);
CREATE INDEX idx_audit_created ON hrm_audit_logs(created_at DESC);

COMMENT ON TABLE hrm_audit_logs IS '인사정보 변경 + CSV 익스포트 + 결재 등 감사 이벤트. admin 전용 조회.';

-- ============================
-- hrm_email_logs
-- ============================
CREATE TABLE hrm_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL,     -- leave_request_submitted, leave_approved, ...
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL,            -- sent, failed, retrying
  provider_id text,                -- Resend message id
  error_message text,
  attempt_count int NOT NULL DEFAULT 1,
  related_resource_type text,      -- leave_request, employee, ...
  related_resource_id uuid,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_logs_recipient ON hrm_email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON hrm_email_logs(status);
CREATE INDEX idx_email_logs_created ON hrm_email_logs(created_at DESC);

COMMIT;
