-- HRM v1.1 — 마이그레이션 #1: 확장, ENUM, 헬퍼 함수
-- 작성일: 2026-05-17

BEGIN;

-- 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================
-- ENUM 타입
-- ============================

CREATE TYPE hrm_user_role AS ENUM ('employee', 'manager', 'admin');

CREATE TYPE hrm_employment_type AS ENUM ('regular', 'contract', 'intern', 'part_time');

CREATE TYPE hrm_employment_status AS ENUM ('active', 'on_leave', 'resigned');

CREATE TYPE hrm_gender AS ENUM ('male', 'female', 'other');

CREATE TYPE hrm_leave_period AS ENUM ('full_day', 'am_half', 'pm_half', 'hourly');

CREATE TYPE hrm_leave_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',          -- v1.1: 신청자 본인 취소
  'system_cancelled'    -- v1.1: 시스템 자동 취소 (퇴사 등)
);

CREATE TYPE hrm_leave_transaction_type AS ENUM (
  'grant',     -- 부여
  'deduct',    -- 차감(승인)
  'refund',    -- 환원(취소)
  'adjust',    -- 관리자 수동 조정
  'expire'     -- 소멸
);

CREATE TYPE hrm_leave_policy_basis AS ENUM ('hire_date', 'fiscal_year');

-- ============================
-- updated_at 트리거 함수
-- ============================

CREATE OR REPLACE FUNCTION hrm_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMIT;
