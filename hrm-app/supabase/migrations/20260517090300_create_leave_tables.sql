-- HRM v1.1 — 마이그레이션 #4: 휴가 정책/유형/잔여/신청/이력

BEGIN;

-- ============================
-- hrm_leave_policies (회사 전체 정책, 보통 1행)
-- ============================
CREATE TABLE hrm_leave_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basis hrm_leave_policy_basis NOT NULL DEFAULT 'fiscal_year',
  fiscal_year_start_month int NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  fiscal_year_start_day int NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_day BETWEEN 1 AND 31),
  max_carryover_days numeric(5,1) DEFAULT 0,    -- 이월 한도
  promotion_first_warn_months int DEFAULT 6,     -- 연차촉진 1차
  promotion_second_warn_months int DEFAULT 2,    -- 연차촉진 2차
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_leave_policies_updated_at BEFORE UPDATE ON hrm_leave_policies
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_leave_types (휴가 유형 마스터)
-- ============================
CREATE TABLE hrm_leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,        -- annual, sick, personal, special, ...
  name text NOT NULL,
  is_paid boolean NOT NULL DEFAULT true,
  deducts_from_annual boolean NOT NULL DEFAULT true,  -- 연차에서 차감 여부
  requires_attachment boolean DEFAULT false,
  max_days_per_request numeric(5,1),
  color_hint text,                  -- 캘린더 컬러 힌트 (저장만, UI에서 토큰으로 매핑)
  sort_order int DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_leave_types_updated_at BEFORE UPDATE ON hrm_leave_types
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_leave_balances (연도별 잔여)
-- ============================
CREATE TABLE hrm_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  year int NOT NULL,
  granted_days numeric(5,1) NOT NULL DEFAULT 0,     -- 자동 부여
  adjusted_days numeric(5,1) NOT NULL DEFAULT 0,    -- admin 수동 조정
  used_days numeric(5,1) NOT NULL DEFAULT 0,        -- 사용(승인된)
  pending_days numeric(5,1) NOT NULL DEFAULT 0,     -- 승인 대기 중
  expires_at date,                                   -- 소멸 예정일
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year)
);
CREATE INDEX idx_balances_employee_year ON hrm_leave_balances(employee_id, year);
CREATE TRIGGER trg_balances_updated_at BEFORE UPDATE ON hrm_leave_balances
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- 잔여 = granted + adjusted - used - pending (view로 노출)
CREATE OR REPLACE VIEW hrm_leave_balances_view AS
SELECT
  b.*,
  (b.granted_days + b.adjusted_days - b.used_days - b.pending_days) AS remaining_days
FROM hrm_leave_balances b;

-- ============================
-- hrm_leave_requests
-- ============================
CREATE TABLE hrm_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES hrm_leave_types(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_period hrm_leave_period NOT NULL DEFAULT 'full_day',
  end_period hrm_leave_period NOT NULL DEFAULT 'full_day',
  total_days numeric(5,1) NOT NULL,
  reason text,
  status hrm_leave_request_status NOT NULL DEFAULT 'pending',
  approver_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  cancellation_reason text,         -- v1.1
  cancelled_at timestamptz,         -- v1.1
  cancelled_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL, -- v1.1
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_dates_check CHECK (start_date <= end_date),
  CONSTRAINT leave_total_days_positive CHECK (total_days > 0)
);
CREATE INDEX idx_leave_req_employee ON hrm_leave_requests(employee_id);
CREATE INDEX idx_leave_req_status ON hrm_leave_requests(status);
CREATE INDEX idx_leave_req_approver ON hrm_leave_requests(approver_id);
CREATE INDEX idx_leave_req_dates ON hrm_leave_requests(start_date, end_date);
CREATE TRIGGER trg_leave_req_updated_at BEFORE UPDATE ON hrm_leave_requests
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON COLUMN hrm_leave_requests.approver_id IS '승인자. 상급자 변경 후에도 보존(v1.1).';
COMMENT ON COLUMN hrm_leave_requests.status IS 'pending/approved/rejected/cancelled(본인)/system_cancelled(퇴사 등)';

-- ============================
-- hrm_leave_transactions (감사 로그)
-- ============================
CREATE TABLE hrm_leave_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  transaction_type hrm_leave_transaction_type NOT NULL,
  days numeric(5,1) NOT NULL,
  related_request_id uuid REFERENCES hrm_leave_requests(id) ON DELETE SET NULL,
  reason text,
  performed_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leave_tx_employee ON hrm_leave_transactions(employee_id);
CREATE INDEX idx_leave_tx_request ON hrm_leave_transactions(related_request_id);

COMMIT;
