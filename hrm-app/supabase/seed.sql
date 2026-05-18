-- HRM v1.1 — 시드 데이터 (데모용)
-- ⚠️ 데모용 계정·데이터. 실 운영 환경에서는 사용 금지.
--
-- 직원/Auth 계정은 supabase/seed-auth.sql 또는 admin UI에서 별도 처리.
-- 이 파일은 마스터 데이터 + 부서 + leave_policies + leave_types만 시드한다.
-- Auth 계정 의존 데이터(직원, 잔여, 신청)는 별도 스크립트로 생성.

BEGIN;

-- ============================
-- 1) 휴가 정책 (회사 전체 1행)
-- ============================
INSERT INTO hrm_leave_policies (id, basis, fiscal_year_start_month, fiscal_year_start_day, max_carryover_days)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fiscal_year',
  1, 1,
  0
) ON CONFLICT (id) DO NOTHING;

-- ============================
-- 2) 휴가 유형 마스터
-- ============================
INSERT INTO hrm_leave_types (code, name, is_paid, deducts_from_annual, requires_attachment, sort_order) VALUES
  ('annual', '연차',          true,  true,  false, 1),
  ('half_am', '오전 반차',    true,  true,  false, 2),
  ('half_pm', '오후 반차',    true,  true,  false, 3),
  ('sick', '병가',            true,  false, true,  4),
  ('personal', '개인사유',    true,  true,  false, 5),
  ('family_event', '경조사',  true,  false, true,  6),
  ('maternity', '출산휴가',   true,  false, true,  7),
  ('paternity', '배우자 출산휴가', true, false, true, 8),
  ('special', '특별휴가',     true,  false, false, 9),
  ('unpaid', '무급휴가',      false, false, false, 10)
ON CONFLICT (code) DO NOTHING;

-- ============================
-- 3) 부서 (4개)
-- ============================
INSERT INTO hrm_departments (id, name, code, parent_id, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', '경영지원본부', 'MGMT', NULL, 1),
  ('10000000-0000-0000-0000-000000000002', '개발본부',     'DEV',  NULL, 2),
  ('10000000-0000-0000-0000-000000000003', '디자인팀',     'DSGN', '10000000-0000-0000-0000-000000000002', 3),
  ('10000000-0000-0000-0000-000000000004', '인사팀',       'HR',   '10000000-0000-0000-0000-000000000001', 4)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================
-- 직원/Auth 시드는 supabase/seed-demo-users.sql 참고
-- 실제 Auth 계정 생성은 Supabase Dashboard 또는 CLI로 수행 후
-- 이 스크립트가 hrm_employees 메타데이터를 채운다.
-- ============================
