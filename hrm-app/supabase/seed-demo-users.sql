-- HRM v1.1 — 데모 사용자 시드 (수동 실행, self-contained)
-- ⚠️ 이 스크립트는 supabase db push 후 SQL Editor에서 service_role로 실행한다.
-- 비밀번호: 모두 'password' (운영 환경 절대 사용 금지)
--
-- ⚠️ 중요: supabase db push는 원격 DB에 seed.sql을 자동 적용하지 않는다.
-- 이 파일은 self-contained로 만들어 부서·정책·휴가유형까지 한 번에 시드한다.
--
-- 실행 순서:
-- 1) supabase db push (마이그레이션 8종만 적용됨)
-- 2) 이 파일을 Supabase Dashboard > SQL Editor에서 실행 (마스터 데이터 + Auth + employees + 신청 한 번에)

-- ============================
-- A) 마스터 데이터 (seed.sql 내용 inline)
-- ============================

INSERT INTO hrm_leave_policies (id, basis, fiscal_year_start_month, fiscal_year_start_day, max_carryover_days)
VALUES ('00000000-0000-0000-0000-000000000001', 'fiscal_year', 1, 1, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hrm_leave_types (code, name, is_paid, deducts_from_annual, requires_attachment, sort_order) VALUES
  ('annual',       '연차',            true,  true,  false, 1),
  ('half_am',      '오전 반차',        true,  true,  false, 2),
  ('half_pm',      '오후 반차',        true,  true,  false, 3),
  ('sick',         '병가',            true,  false, true,  4),
  ('personal',     '개인사유',         true,  true,  false, 5),
  ('family_event', '경조사',          true,  false, true,  6),
  ('maternity',    '출산휴가',         true,  false, true,  7),
  ('paternity',    '배우자 출산휴가',  true,  false, true,  8),
  ('special',      '특별휴가',         true,  false, false, 9),
  ('unpaid',       '무급휴가',         false, false, false, 10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO hrm_departments (id, name, code, parent_id, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', '경영지원본부', 'MGMT', NULL, 1),
  ('10000000-0000-0000-0000-000000000002', '개발본부',     'DEV',  NULL, 2)
ON CONFLICT (id) DO NOTHING;

-- parent_id 의존성이 있는 부서는 부모 INSERT 후 실행
INSERT INTO hrm_departments (id, name, code, parent_id, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000003', '디자인팀', 'DSGN', '10000000-0000-0000-0000-000000000002', 3),
  ('10000000-0000-0000-0000-000000000004', '인사팀',   'HR',   '10000000-0000-0000-0000-000000000001', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================
-- B) Auth 계정 + 직원 메타 + 잔여 + 샘플 신청
-- ============================

DO $$
DECLARE
  admin_id uuid := '20000000-0000-0000-0000-000000000001';
  mgr1_id uuid := '20000000-0000-0000-0000-000000000002';
  mgr2_id uuid := '20000000-0000-0000-0000-000000000003';
  emp_ids uuid[] := ARRAY[
    '20000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000012',
    '20000000-0000-0000-0000-000000000013',
    '20000000-0000-0000-0000-000000000014',
    '20000000-0000-0000-0000-000000000015',
    '20000000-0000-0000-0000-000000000016',
    '20000000-0000-0000-0000-000000000017',
    '20000000-0000-0000-0000-000000000018',
    '20000000-0000-0000-0000-000000000019'
  ];
  dept_mgmt uuid := '10000000-0000-0000-0000-000000000001';
  dept_dev uuid := '10000000-0000-0000-0000-000000000002';
  dept_design uuid := '10000000-0000-0000-0000-000000000003';
  dept_hr uuid := '10000000-0000-0000-0000-000000000004';
  emp_names text[][] := ARRAY[
    ARRAY['김민준', 'employee01', 'dev'],
    ARRAY['이서연', 'employee02', 'dev'],
    ARRAY['박지호', 'employee03', 'dev'],
    ARRAY['최예린', 'employee04', 'design'],
    ARRAY['정도윤', 'employee05', 'design'],
    ARRAY['강하은', 'employee06', 'hr'],
    ARRAY['윤서준', 'employee07', 'hr'],
    ARRAY['임지우', 'employee08', 'mgmt'],
    ARRAY['오시우', 'employee09', 'mgmt'],
    ARRAY['한아라', 'employee10', 'dev']
  ];
  i int;
  emp_dept uuid;
  emp_manager uuid;
BEGIN
  -- ============================
  -- Auth 계정 생성
  -- ============================
  -- ⚠️ auth.users INSERT 시 confirmation_token 등 GoTrue가 not-null로 다루는
  --    token 컬럼은 반드시 ''로 명시. NULL로 두면 이후 모든 Auth API가
  --    "Database error querying schema" 500을 던진다.
  -- Admin
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, email_change, email_change_token_current, email_change_token_new,
    recovery_token, phone_change, phone_change_token, reauthentication_token
  )
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@hrm.demo',
    crypt('password', gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{}'::jsonb,
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Manager 1 (개발본부장)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, email_change, email_change_token_current, email_change_token_new,
    recovery_token, phone_change, phone_change_token, reauthentication_token
  )
  VALUES (mgr1_id, '00000000-0000-0000-0000-000000000000', 'manager.dev@hrm.demo',
    crypt('password', gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{}'::jsonb,
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Manager 2 (디자인팀장)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, email_change, email_change_token_current, email_change_token_new,
    recovery_token, phone_change, phone_change_token, reauthentication_token
  )
  VALUES (mgr2_id, '00000000-0000-0000-0000-000000000000', 'manager.design@hrm.demo',
    crypt('password', gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{}'::jsonb,
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- 일반 직원 10명
  FOR i IN 1..10 LOOP
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_current, email_change_token_new,
      recovery_token, phone_change, phone_change_token, reauthentication_token
    )
    VALUES (
      emp_ids[i],
      '00000000-0000-0000-0000-000000000000',
      emp_names[i][2] || '@hrm.demo',
      crypt('password', gen_salt('bf')),
      now(), '{"provider":"email"}'::jsonb, '{}'::jsonb,
      'authenticated', 'authenticated', now(), now(),
      '', '', '', '', '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- ============================
  -- hrm_employees 메타데이터
  -- ============================
  INSERT INTO hrm_employees (id, employee_no, email, name_ko, role, manager_id, department_id, position, employment_type, employment_status, hire_date)
  VALUES
    (admin_id, 'A001', 'admin@hrm.demo', '관리자', 'admin', NULL, dept_hr, 'HR 매니저', 'regular', 'active', '2022-01-03'),
    (mgr1_id, 'M001', 'manager.dev@hrm.demo', '서동현', 'manager', NULL, dept_dev, '본부장', 'regular', 'active', '2020-03-02'),
    (mgr2_id, 'M002', 'manager.design@hrm.demo', '문지영', 'manager', NULL, dept_design, '팀장', 'regular', 'active', '2021-07-05')
  ON CONFLICT (id) DO NOTHING;

  FOR i IN 1..10 LOOP
    -- 부서·상급자 라우팅
    CASE emp_names[i][3]
      WHEN 'dev'    THEN emp_dept := dept_dev;    emp_manager := mgr1_id;
      WHEN 'design' THEN emp_dept := dept_design; emp_manager := mgr2_id;
      WHEN 'hr'     THEN emp_dept := dept_hr;     emp_manager := admin_id;
      WHEN 'mgmt'   THEN emp_dept := dept_mgmt;   emp_manager := admin_id;
    END CASE;

    INSERT INTO hrm_employees (id, employee_no, email, name_ko, role, manager_id, department_id, position, employment_type, employment_status, hire_date)
    VALUES (
      emp_ids[i],
      'E' || lpad(i::text, 3, '0'),
      emp_names[i][2] || '@hrm.demo',
      emp_names[i][1],
      'employee',
      emp_manager,
      emp_dept,
      CASE WHEN i % 3 = 0 THEN '시니어' ELSE '주니어' END,
      'regular',
      'active',
      ('2023-' || lpad(((i % 12) + 1)::text, 2, '0') || '-15')::date
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- ============================
  -- 잔여 연차 (당해 연도)
  -- ============================
  INSERT INTO hrm_leave_balances (employee_id, year, granted_days, adjusted_days, used_days, pending_days, expires_at)
  SELECT
    id,
    EXTRACT(YEAR FROM current_date)::int,
    CASE
      WHEN current_date - hire_date >= 365 * 3 THEN 16
      WHEN current_date - hire_date >= 365 THEN 15
      ELSE floor(LEAST(11, (current_date - hire_date) / 30))::numeric
    END,
    0, 0, 0,
    (date_trunc('year', current_date) + interval '1 year - 1 day')::date
  FROM hrm_employees
  WHERE employment_status != 'resigned'
  ON CONFLICT (employee_id, year) DO NOTHING;

  -- ============================
  -- 샘플 휴가 신청 5건
  -- ============================
  INSERT INTO hrm_leave_requests (employee_id, leave_type_id, start_date, end_date, start_period, end_period, total_days, reason, status, approver_id, approved_at)
  SELECT
    emp_ids[1],
    (SELECT id FROM hrm_leave_types WHERE code = 'annual'),
    current_date + 7, current_date + 8, 'full_day', 'full_day',
    2, '여행', 'pending', mgr1_id, NULL
  WHERE NOT EXISTS (SELECT 1 FROM hrm_leave_requests WHERE employee_id = emp_ids[1] AND start_date = current_date + 7);

  INSERT INTO hrm_leave_requests (employee_id, leave_type_id, start_date, end_date, start_period, end_period, total_days, reason, status, approver_id, approved_at)
  SELECT
    emp_ids[2],
    (SELECT id FROM hrm_leave_types WHERE code = 'half_am'),
    current_date + 3, current_date + 3, 'am_half', 'am_half',
    0.5, '병원', 'approved', mgr1_id, now()
  WHERE NOT EXISTS (SELECT 1 FROM hrm_leave_requests WHERE employee_id = emp_ids[2] AND start_date = current_date + 3);

  INSERT INTO hrm_leave_requests (employee_id, leave_type_id, start_date, end_date, start_period, end_period, total_days, reason, status, approver_id, approved_at, rejection_reason)
  SELECT
    emp_ids[3],
    (SELECT id FROM hrm_leave_types WHERE code = 'annual'),
    current_date - 5, current_date - 3, 'full_day', 'full_day',
    3, '경조사', 'rejected', mgr1_id, now() - interval '4 days', '인력 부족으로 일정 조정 부탁드립니다'
  WHERE NOT EXISTS (SELECT 1 FROM hrm_leave_requests WHERE employee_id = emp_ids[3] AND start_date = current_date - 5);

  INSERT INTO hrm_leave_requests (employee_id, leave_type_id, start_date, end_date, start_period, end_period, total_days, reason, status, approver_id, approved_at, cancelled_at, cancelled_by, cancellation_reason)
  SELECT
    emp_ids[4],
    (SELECT id FROM hrm_leave_types WHERE code = 'annual'),
    current_date + 14, current_date + 15, 'full_day', 'full_day',
    2, '가족 일정', 'cancelled', mgr2_id, NULL, now() - interval '1 day', emp_ids[4], '일정 변경'
  WHERE NOT EXISTS (SELECT 1 FROM hrm_leave_requests WHERE employee_id = emp_ids[4] AND start_date = current_date + 14);

  INSERT INTO hrm_leave_requests (employee_id, leave_type_id, start_date, end_date, start_period, end_period, total_days, reason, status, approver_id, approved_at)
  SELECT
    emp_ids[5],
    (SELECT id FROM hrm_leave_types WHERE code = 'annual'),
    current_date + 21, current_date + 23, 'full_day', 'full_day',
    3, '리프레시', 'pending', mgr2_id, NULL
  WHERE NOT EXISTS (SELECT 1 FROM hrm_leave_requests WHERE employee_id = emp_ids[5] AND start_date = current_date + 21);

END $$;
