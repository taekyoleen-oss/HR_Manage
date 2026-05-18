-- HRM v1.1 — 마이그레이션 #3: 직원 상세 정보 (학력/경력/자격/가족/문서/급여)

BEGIN;

-- ============================
-- hrm_employee_education
-- ============================
CREATE TABLE hrm_employee_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  degree text,                  -- 학사/석사/박사/고졸
  major text,
  start_date date,
  end_date date,
  is_graduated boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_education_employee ON hrm_employee_education(employee_id);
CREATE TRIGGER trg_education_updated_at BEFORE UPDATE ON hrm_employee_education
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_employee_career
-- ============================
CREATE TABLE hrm_employee_career (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  position text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_career_employee ON hrm_employee_career(employee_id);
CREATE TRIGGER trg_career_updated_at BEFORE UPDATE ON hrm_employee_career
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_employee_certifications
-- ============================
CREATE TABLE hrm_employee_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  issued_date date,
  expires_date date,
  certificate_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_certifications_employee ON hrm_employee_certifications(employee_id);
CREATE TRIGGER trg_certifications_updated_at BEFORE UPDATE ON hrm_employee_certifications
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_employee_family (연말정산용)
-- ============================
CREATE TABLE hrm_employee_family (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL,         -- 배우자, 자녀, 부모, ...
  birth_year int,                  -- 생년만 저장 (개보법 고려)
  is_dependent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_family_employee ON hrm_employee_family(employee_id);
CREATE TRIGGER trg_family_updated_at BEFORE UPDATE ON hrm_employee_family
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

-- ============================
-- hrm_employee_documents (Storage 연계)
-- ============================
CREATE TABLE hrm_employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  document_type text NOT NULL,    -- contract, resume, ...
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_employee ON hrm_employee_documents(employee_id);

-- ============================
-- hrm_employee_compensation (admin 전용)
-- ============================
CREATE TABLE hrm_employee_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  effective_to date,
  base_salary numeric(12,2),
  currency text DEFAULT 'KRW',
  bank_name text,
  bank_account_masked text,       -- 뒤 4자리만
  notes text,
  created_by uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_compensation_employee ON hrm_employee_compensation(employee_id);
CREATE TRIGGER trg_compensation_updated_at BEFORE UPDATE ON hrm_employee_compensation
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_employee_compensation IS '급여 정보 — admin RLS 전용. CSV 익스포트 절대 금지.';

COMMIT;
