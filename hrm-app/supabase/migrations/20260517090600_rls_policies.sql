-- HRM v1.1 — 마이그레이션 #7: RLS 정책 (모든 테이블)

BEGIN;

-- ============================
-- hrm_departments: 인증 사용자 SELECT, admin CUD
-- ============================
ALTER TABLE hrm_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_authenticated"
  ON hrm_departments FOR SELECT TO authenticated
  USING (is_active_user());

CREATE POLICY "departments_admin_all"
  ON hrm_departments FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- hrm_employees
-- ============================
ALTER TABLE hrm_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_self_or_manager_or_admin"
  ON hrm_employees FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR manager_id = auth.uid()
    OR is_admin()
  );

-- 본인은 일부 필드만 — 컬럼 제한은 RPC 함수로 보장. RLS는 row만 통제
CREATE POLICY "employees_update_self_or_admin"
  ON hrm_employees FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY "employees_insert_admin"
  ON hrm_employees FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "employees_delete_admin"
  ON hrm_employees FOR DELETE TO authenticated
  USING (is_admin());

-- ============================
-- hrm_employee_education / career / certifications / family
-- 본인 또는 상급자 또는 admin SELECT, 본인 또는 admin CUD
-- ============================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'hrm_employee_education',
    'hrm_employee_career',
    'hrm_employee_certifications',
    'hrm_employee_family'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format($f$
      CREATE POLICY "%I_select_self_or_manager_or_admin"
        ON %I FOR SELECT TO authenticated
        USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin())
    $f$, t, t);

    EXECUTE format($f$
      CREATE POLICY "%I_modify_self_or_admin"
        ON %I FOR ALL TO authenticated
        USING (employee_id = auth.uid() OR is_admin())
        WITH CHECK (employee_id = auth.uid() OR is_admin())
    $f$, t, t);
  END LOOP;
END $$;

-- ============================
-- hrm_employee_documents: 본인 SELECT, admin CUD
-- ============================
ALTER TABLE hrm_employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_self_or_admin"
  ON hrm_employee_documents FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_admin());

CREATE POLICY "documents_modify_admin"
  ON hrm_employee_documents FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- hrm_employee_compensation: admin 전용
-- ============================
ALTER TABLE hrm_employee_compensation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compensation_admin_only"
  ON hrm_employee_compensation FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- hrm_leave_policies / hrm_leave_types: 전체 읽기, admin 쓰기
-- ============================
ALTER TABLE hrm_leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_policies_select_all" ON hrm_leave_policies FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "leave_policies_admin_modify" ON hrm_leave_policies FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "leave_types_select_all" ON hrm_leave_types FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "leave_types_admin_modify" ON hrm_leave_types FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- hrm_leave_balances: 본인/상급자/admin SELECT, admin 수정 (자동 갱신은 SECURITY DEFINER 함수)
-- ============================
ALTER TABLE hrm_leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balances_select_self_or_manager_or_admin"
  ON hrm_leave_balances FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin());

CREATE POLICY "balances_modify_admin"
  ON hrm_leave_balances FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================
-- hrm_leave_requests
-- ============================
ALTER TABLE hrm_leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_requests_select_self_or_approver_or_admin"
  ON hrm_leave_requests FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
  );

-- 신청은 본인만 (submit_leave_request RPC 권장)
CREATE POLICY "leave_requests_insert_self"
  ON hrm_leave_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- 업데이트는 본인(취소) 또는 상급자/admin (승인/반려). 트랜잭션은 RPC로
CREATE POLICY "leave_requests_update_self_or_approver_or_admin"
  ON hrm_leave_requests FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
  );

-- ============================
-- hrm_leave_transactions: 본인/admin SELECT only (INSERT는 SECURITY DEFINER 함수만)
-- ============================
ALTER TABLE hrm_leave_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_tx_select_self_or_admin"
  ON hrm_leave_transactions FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR is_admin());

-- INSERT 정책 없음 → SECURITY DEFINER 함수만 가능

-- ============================
-- hrm_audit_logs / hrm_email_logs: admin 전용
-- ============================
ALTER TABLE hrm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select" ON hrm_audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "email_logs_admin_select" ON hrm_email_logs FOR SELECT TO authenticated USING (is_admin());

COMMIT;
