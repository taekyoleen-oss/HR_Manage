-- HRM v1.2 — 재택근무 신청
-- 일 단위 재택근무 신청·승인 흐름. 연차 차감 없음.
-- 작성일: 2026-05-19

BEGIN;

CREATE TYPE hrm_remote_work_status AS ENUM (
  'pending', 'approved', 'rejected', 'cancelled'
);

CREATE TABLE hrm_remote_work_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days int NOT NULL CHECK (total_days > 0),
  reason text NOT NULL,
  work_location text,                       -- 재택지 (도시 정도)
  contact_method text,                       -- 비상 연락처/툴
  status hrm_remote_work_status NOT NULL DEFAULT 'pending',
  approver_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT remote_dates_check CHECK (start_date <= end_date)
);

CREATE INDEX idx_remote_employee ON hrm_remote_work_requests(employee_id);
CREATE INDEX idx_remote_status ON hrm_remote_work_requests(status);
CREATE INDEX idx_remote_dates ON hrm_remote_work_requests(start_date, end_date);

CREATE TRIGGER trg_remote_updated_at BEFORE UPDATE ON hrm_remote_work_requests
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- RPC
CREATE OR REPLACE FUNCTION submit_remote_work(
  p_start_date date,
  p_end_date date,
  p_total_days int,
  p_reason text,
  p_work_location text,
  p_contact_method text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  emp_manager uuid;
  new_id uuid;
BEGIN
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'INVALID_DATE_RANGE' USING ERRCODE = 'P0001';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'REASON_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT manager_id INTO emp_manager FROM hrm_employees WHERE id = caller;

  INSERT INTO hrm_remote_work_requests (
    employee_id, start_date, end_date, total_days, reason,
    work_location, contact_method, status, approver_id
  ) VALUES (
    caller, p_start_date, p_end_date, p_total_days, p_reason,
    p_work_location, p_contact_method, 'pending', emp_manager
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION approve_remote_work(req_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_remote_work_requests;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_remote_work_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;
  UPDATE hrm_remote_work_requests
  SET status = 'approved', approver_id = caller, approved_at = now()
  WHERE id = req_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION reject_remote_work(req_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_remote_work_requests;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_remote_work_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;
  UPDATE hrm_remote_work_requests
  SET status = 'rejected', approver_id = caller, approved_at = now(),
      rejection_reason = p_reason
  WHERE id = req_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_remote_work(req_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_remote_work_requests;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_remote_work_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.employee_id != caller THEN RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'P0001'; END IF;
  IF r.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;
  IF r.status = 'approved' AND r.start_date <= current_date THEN
    RAISE EXCEPTION 'PAST_START_DATE' USING ERRCODE = 'P0001';
  END IF;
  UPDATE hrm_remote_work_requests
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = caller
  WHERE id = req_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- RLS
ALTER TABLE hrm_remote_work_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "remote_select_self_or_manager_or_admin"
  ON hrm_remote_work_requests FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
  );

CREATE POLICY "remote_insert_self"
  ON hrm_remote_work_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "remote_update_self_or_manager_or_admin"
  ON hrm_remote_work_requests FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin())
  WITH CHECK (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin());

COMMIT;
