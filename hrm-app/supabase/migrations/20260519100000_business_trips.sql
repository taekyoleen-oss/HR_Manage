-- HRM v1.2 — 출장관리
-- 출장 신청·승인·복귀 보고 라이프사이클, 동료 동반 출장, 감사 로그
-- 작성일: 2026-05-19

BEGIN;

-- ============================
-- ENUM
-- ============================
CREATE TYPE hrm_business_trip_type AS ENUM ('domestic', 'overseas');

CREATE TYPE hrm_business_trip_transport AS ENUM (
  'flight', 'train', 'bus', 'car_company', 'car_personal', 'ship', 'other'
);

CREATE TYPE hrm_business_trip_status AS ENUM (
  'pending',       -- 신청 후 결재 대기
  'approved',      -- 승인 (출발 전)
  'rejected',      -- 반려
  'cancelled',     -- 신청자 본인 취소
  'in_progress',   -- 출장 진행 중 (시작일 도래 후)
  'completed'      -- 복귀 보고서 제출 완료
);

-- ============================
-- hrm_business_trips
-- ============================
CREATE TABLE hrm_business_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  trip_type hrm_business_trip_type NOT NULL,
  purpose text NOT NULL,
  destination_country text NOT NULL,
  destination_city text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  transportation hrm_business_trip_transport NOT NULL DEFAULT 'other',
  accommodation text,
  accompanying_employee_ids uuid[] DEFAULT ARRAY[]::uuid[],
  notes text,
  status hrm_business_trip_status NOT NULL DEFAULT 'pending',
  approver_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  cancellation_reason text,
  completion_report text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_dates_check CHECK (start_date <= end_date)
);

CREATE INDEX idx_trips_employee ON hrm_business_trips(employee_id);
CREATE INDEX idx_trips_status ON hrm_business_trips(status);
CREATE INDEX idx_trips_approver ON hrm_business_trips(approver_id);
CREATE INDEX idx_trips_dates ON hrm_business_trips(start_date, end_date);

CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON hrm_business_trips
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_business_trips IS '출장 신청·승인·진행·보고 마스터';
COMMENT ON COLUMN hrm_business_trips.accompanying_employee_ids IS '동반자 employee_id 배열. 표시용이며 별도 신청은 각자 등록 권장.';

-- ============================
-- 트랜잭션/감사 로그
-- ============================
CREATE TABLE hrm_business_trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES hrm_business_trips(id) ON DELETE CASCADE,
  event_type text NOT NULL,        -- submitted/approved/rejected/cancelled/started/completed
  performed_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trip_events_trip ON hrm_business_trip_events(trip_id);

-- ============================
-- RPC: submit / approve / reject / cancel / complete / promote_in_progress
-- ============================

CREATE OR REPLACE FUNCTION submit_business_trip(
  p_trip_type hrm_business_trip_type,
  p_purpose text,
  p_destination_country text,
  p_destination_city text,
  p_start_date date,
  p_end_date date,
  p_transportation hrm_business_trip_transport,
  p_accommodation text,
  p_accompanying uuid[],
  p_notes text
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
  IF p_purpose IS NULL OR length(trim(p_purpose)) = 0 THEN
    RAISE EXCEPTION 'PURPOSE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT manager_id INTO emp_manager FROM hrm_employees WHERE id = caller;

  INSERT INTO hrm_business_trips (
    employee_id, trip_type, purpose, destination_country, destination_city,
    start_date, end_date, transportation, accommodation,
    accompanying_employee_ids, notes, status, approver_id
  ) VALUES (
    caller, p_trip_type, p_purpose, p_destination_country, p_destination_city,
    p_start_date, p_end_date, p_transportation, p_accommodation,
    coalesce(p_accompanying, ARRAY[]::uuid[]), p_notes,
    'pending', emp_manager
  ) RETURNING id INTO new_id;

  INSERT INTO hrm_business_trip_events (trip_id, event_type, performed_by, notes)
  VALUES (new_id, 'submitted', caller, NULL);

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION approve_business_trip(req_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_business_trips;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_business_trips WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE hrm_business_trips
  SET status = 'approved', approver_id = caller, approved_at = now()
  WHERE id = req_id;

  INSERT INTO hrm_business_trip_events (trip_id, event_type, performed_by)
  VALUES (req_id, 'approved', caller);

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION reject_business_trip(req_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_business_trips;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_business_trips WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status != 'pending' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF NOT (is_admin() OR is_manager_of(r.employee_id)) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE hrm_business_trips
  SET status = 'rejected', approver_id = caller, approved_at = now(),
      rejection_reason = p_reason
  WHERE id = req_id;

  INSERT INTO hrm_business_trip_events (trip_id, event_type, performed_by, notes)
  VALUES (req_id, 'rejected', caller, p_reason);

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_business_trip(req_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_business_trips;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_business_trips WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.employee_id != caller THEN RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'P0001'; END IF;
  IF r.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;
  IF r.status = 'approved' AND r.start_date <= current_date THEN
    RAISE EXCEPTION 'PAST_START_DATE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE hrm_business_trips
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = caller,
      cancellation_reason = p_reason
  WHERE id = req_id;

  INSERT INTO hrm_business_trip_events (trip_id, event_type, performed_by, notes)
  VALUES (req_id, 'cancelled', caller, p_reason);

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION complete_business_trip(req_id uuid, p_report text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r hrm_business_trips;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_business_trips WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.employee_id != caller AND NOT is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;
  IF r.status NOT IN ('approved', 'in_progress') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;
  IF p_report IS NULL OR length(trim(p_report)) = 0 THEN
    RAISE EXCEPTION 'REPORT_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  UPDATE hrm_business_trips
  SET status = 'completed',
      completion_report = p_report,
      completed_at = now()
  WHERE id = req_id;

  INSERT INTO hrm_business_trip_events (trip_id, event_type, performed_by, notes)
  VALUES (req_id, 'completed', caller, NULL);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 시작일 도래한 approved 행을 in_progress로 일괄 전이 (cron에서 호출)
CREATE OR REPLACE FUNCTION promote_trips_in_progress() RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  changed int;
BEGIN
  WITH upd AS (
    UPDATE hrm_business_trips
    SET status = 'in_progress'
    WHERE status = 'approved'
      AND start_date <= current_date
      AND end_date >= current_date
    RETURNING id
  )
  SELECT count(*) INTO changed FROM upd;
  RETURN changed;
END;
$$;

-- ============================
-- RLS
-- ============================
ALTER TABLE hrm_business_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_business_trip_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_self_or_manager_or_admin"
  ON hrm_business_trips FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
    OR auth.uid() = ANY(accompanying_employee_ids)
  );

CREATE POLICY "trips_insert_self"
  ON hrm_business_trips FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "trips_update_self_or_manager_or_admin"
  ON hrm_business_trips FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin())
  WITH CHECK (employee_id = auth.uid() OR is_manager_of(employee_id) OR is_admin());

CREATE POLICY "trip_events_select_self_or_admin"
  ON hrm_business_trip_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hrm_business_trips t
      WHERE t.id = trip_id
        AND (t.employee_id = auth.uid() OR is_manager_of(t.employee_id) OR is_admin())
    )
  );

-- INSERT는 SECURITY DEFINER 함수만

COMMIT;
