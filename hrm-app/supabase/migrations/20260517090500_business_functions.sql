-- HRM v1.1 — 마이그레이션 #6: 도메인 함수 (취소 가능 여부 판정, 취소 트랜잭션, 승인 트랜잭션)

BEGIN;

-- ============================
-- can_cancel_request: 취소 가능 여부 판정 (v1.1)
-- ============================
CREATE OR REPLACE FUNCTION can_cancel_request(req_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_leave_requests;
BEGIN
  SELECT * INTO r FROM hrm_leave_requests WHERE id = req_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF r.employee_id != auth.uid() THEN RETURN false; END IF;
  IF r.status NOT IN ('pending', 'approved') THEN RETURN false; END IF;
  IF r.status = 'approved' AND r.start_date <= current_date THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- ============================
-- cancel_leave_request: 취소 트랜잭션 (v1.1)
-- ============================
CREATE OR REPLACE FUNCTION cancel_leave_request(req_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_leave_requests;
  caller uuid := auth.uid();
BEGIN
  -- 행 잠금
  SELECT * INTO r FROM hrm_leave_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF r.employee_id != caller THEN
    RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'P0001';
  END IF;
  IF r.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;
  IF r.status = 'approved' AND r.start_date <= current_date THEN
    RAISE EXCEPTION 'PAST_START_DATE' USING ERRCODE = 'P0001';
  END IF;

  -- 1) 신청 상태 업데이트
  UPDATE hrm_leave_requests
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = caller,
      cancellation_reason = p_reason
  WHERE id = req_id;

  -- 2) 잔여 환원
  IF r.status = 'pending' THEN
    UPDATE hrm_leave_balances
    SET pending_days = pending_days - r.total_days
    WHERE employee_id = r.employee_id
      AND year = EXTRACT(YEAR FROM r.start_date)::int;
  ELSE -- approved
    UPDATE hrm_leave_balances
    SET used_days = used_days - r.total_days
    WHERE employee_id = r.employee_id
      AND year = EXTRACT(YEAR FROM r.start_date)::int;
  END IF;

  -- 3) 감사 로그 (leave_transactions)
  INSERT INTO hrm_leave_transactions (
    employee_id, transaction_type, days, related_request_id, reason, performed_by
  ) VALUES (
    r.employee_id,
    'refund',
    r.total_days,
    req_id,
    coalesce(p_reason, '신청자 본인 취소로 환원'),
    caller
  );

  RETURN jsonb_build_object(
    'ok', true,
    'refunded_days', r.total_days,
    'previous_status', r.status::text
  );
END;
$$;

-- ============================
-- submit_leave_request: 휴가 신청 (pending_days 증가)
-- ============================
CREATE OR REPLACE FUNCTION submit_leave_request(
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_start_period hrm_leave_period,
  p_end_period hrm_leave_period,
  p_total_days numeric,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  emp_manager uuid;
  new_id uuid;
  year_for_balance int := EXTRACT(YEAR FROM p_start_date)::int;
  current_remaining numeric;
BEGIN
  -- 상급자 조회
  SELECT manager_id INTO emp_manager FROM hrm_employees WHERE id = caller;

  -- 잔여 확인 (연차에서 차감되는 유형만)
  IF (SELECT deducts_from_annual FROM hrm_leave_types WHERE id = p_leave_type_id) THEN
    SELECT (granted_days + adjusted_days - used_days - pending_days)
      INTO current_remaining
      FROM hrm_leave_balances
      WHERE employee_id = caller AND year = year_for_balance;

    IF current_remaining IS NULL OR current_remaining < p_total_days THEN
      RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 신청 INSERT
  INSERT INTO hrm_leave_requests (
    employee_id, leave_type_id, start_date, end_date,
    start_period, end_period, total_days, reason,
    status, approver_id
  ) VALUES (
    caller, p_leave_type_id, p_start_date, p_end_date,
    p_start_period, p_end_period, p_total_days, p_reason,
    'pending', emp_manager
  ) RETURNING id INTO new_id;

  -- pending_days 증가
  IF (SELECT deducts_from_annual FROM hrm_leave_types WHERE id = p_leave_type_id) THEN
    INSERT INTO hrm_leave_balances (employee_id, year, pending_days)
    VALUES (caller, year_for_balance, p_total_days)
    ON CONFLICT (employee_id, year)
    DO UPDATE SET pending_days = hrm_leave_balances.pending_days + p_total_days;
  END IF;

  RETURN new_id;
END;
$$;

-- ============================
-- approve_leave_request: 승인 트랜잭션
-- ============================
CREATE OR REPLACE FUNCTION approve_leave_request(req_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_leave_requests;
  caller uuid := auth.uid();
  deducts boolean;
BEGIN
  SELECT * INTO r FROM hrm_leave_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  SELECT deducts_from_annual INTO deducts FROM hrm_leave_types WHERE id = r.leave_type_id;

  -- 신청 승인
  UPDATE hrm_leave_requests
  SET status = 'approved', approver_id = caller, approved_at = now()
  WHERE id = req_id;

  -- 잔여 차감 (pending → used)
  IF deducts THEN
    UPDATE hrm_leave_balances
    SET pending_days = pending_days - r.total_days,
        used_days = used_days + r.total_days
    WHERE employee_id = r.employee_id
      AND year = EXTRACT(YEAR FROM r.start_date)::int;
  END IF;

  -- 감사 로그
  INSERT INTO hrm_leave_transactions (
    employee_id, transaction_type, days, related_request_id, reason, performed_by
  ) VALUES (r.employee_id, 'deduct', r.total_days, req_id, '휴가 승인 차감', caller);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================
-- reject_leave_request: 반려
-- ============================
CREATE OR REPLACE FUNCTION reject_leave_request(req_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_leave_requests;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_leave_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE hrm_leave_requests
  SET status = 'rejected', approver_id = caller, approved_at = now(), rejection_reason = p_reason
  WHERE id = req_id;

  -- pending_days 환원
  UPDATE hrm_leave_balances
  SET pending_days = pending_days - r.total_days
  WHERE employee_id = r.employee_id
    AND year = EXTRACT(YEAR FROM r.start_date)::int;

  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMIT;
