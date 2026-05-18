-- HRM v1.1 — 마이그레이션 #2: 부서, 직원 마스터

BEGIN;

-- ============================
-- hrm_departments
-- ============================
CREATE TABLE hrm_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  parent_id uuid REFERENCES hrm_departments(id) ON DELETE SET NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_departments_parent ON hrm_departments(parent_id);

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON hrm_departments
FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_departments IS '부서 마스터. self-referencing으로 상위 부서 표현.';

-- ============================
-- hrm_employees (핵심)
-- ============================
CREATE TABLE hrm_employees (
  id uuid PRIMARY KEY,    -- Supabase Auth user.id와 동일
  employee_no text UNIQUE,
  email text UNIQUE NOT NULL,
  name_ko text NOT NULL,
  name_en text,
  role hrm_user_role NOT NULL DEFAULT 'employee',
  manager_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  department_id uuid REFERENCES hrm_departments(id) ON DELETE SET NULL,
  position text,
  job_title text,
  employment_type hrm_employment_type NOT NULL DEFAULT 'regular',
  employment_status hrm_employment_status NOT NULL DEFAULT 'active',
  hire_date date NOT NULL,
  resignation_date date,    -- 퇴사자도 row 유지 (v1.1)
  birth_date date,
  gender hrm_gender,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  profile_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_resignation_check
    CHECK (
      (employment_status = 'resigned' AND resignation_date IS NOT NULL)
      OR (employment_status != 'resigned')
    )
);

CREATE INDEX idx_employees_manager ON hrm_employees(manager_id);
CREATE INDEX idx_employees_department ON hrm_employees(department_id);
CREATE INDEX idx_employees_status ON hrm_employees(employment_status);
CREATE INDEX idx_employees_role ON hrm_employees(role);
CREATE INDEX idx_employees_email ON hrm_employees(email);

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON hrm_employees
FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_employees IS '직원 마스터. Supabase Auth와 1:1. 퇴사자도 그대로 보존(v1.1).';
COMMENT ON COLUMN hrm_employees.id IS 'Supabase Auth user.id';
COMMENT ON COLUMN hrm_employees.resignation_date IS '퇴사일. employment_status=resigned일 때 필수.';

-- ============================
-- 헬퍼 함수 (RLS 정책에서 재사용)
-- ============================

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM hrm_employees
    WHERE id = auth.uid()
      AND role = 'admin'
      AND employment_status != 'resigned'
  );
$$;

CREATE OR REPLACE FUNCTION is_manager_of(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM hrm_employees
    WHERE id = target AND manager_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_active_user() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM hrm_employees
    WHERE id = auth.uid() AND employment_status != 'resigned'
  );
$$;

COMMIT;
