---
name: supabase-schema-gen
description: Supabase 마이그레이션 SQL을 생성하는 스킬. 테이블/컬럼/인덱스/제약/enum 정의에서 시간 정렬된 마이그레이션 파일을 만들고 타입을 재생성한다. 신규 테이블 추가, 컬럼 변경, enum 확장 시 사용.
---

# supabase-schema-gen

## 목적
DB 스키마 변경 요구사항을 Supabase CLI 호환 마이그레이션 SQL로 변환한다. `db-architect` 에이전트의 1차 도구.

## 입력
- 변경 명세 (자연어 또는 표): 테이블명, 컬럼, 제약, 인덱스, FK
- 기존 마이그레이션 파일 (충돌 검사용)

## 출력
- `supabase/migrations/<timestamp>_<snake_case_desc>.sql`
- 변경 요약 (영향 테이블, 신규 enum 등)

## 단계
1. **파일명 결정**: `date +%Y%m%d%H%M%S` 기반 prefix + `_<설명>.sql`
2. **트랜잭션 wrapping**: `BEGIN; ... COMMIT;`
3. **enum 정의 우선**: `CREATE TYPE ... AS ENUM (...)` (테이블 참조 전)
4. **테이블 생성**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()` + `BEFORE UPDATE` 트리거
   - FK는 `REFERENCES ... ON DELETE` 명시
5. **인덱스**: FK 컬럼, 자주 필터링되는 컬럼에 `CREATE INDEX`
6. **RLS 활성화**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` (정책은 별도 마이그레이션)
7. **코멘트 추가**: `COMMENT ON TABLE/COLUMN ... IS '...';`로 문서화
8. **타입 재생성** 안내: `supabase gen types typescript --linked > types/database.types.ts`

## 표준 헬퍼

### updated_at 트리거
```sql
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_<table>_updated_at
BEFORE UPDATE ON hrm_<table>
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
```

### Auth → employees 동기화 트리거
신규 Supabase Auth 사용자 생성 시 employees row 자동 생성은 admin이 명시적으로 관리한다 — 자동 동기화 트리거는 **사용하지 않는다**. 직원 등록 플로(`/admin/employees/new`)에서 Auth 초대 + employees INSERT를 묶어 처리.

## 금지 사항
- `DROP TABLE`을 추가 마이그레이션과 같은 파일에 두기
- 기존 마이그레이션 파일 수정 (이미 push된 것)
- timestamp 충돌 (같은 초에 두 파일)

## 산출 예시
```
supabase/migrations/20260517090000_create_hrm_employees.sql
supabase/migrations/20260517090100_create_hrm_leave_requests.sql
supabase/migrations/20260517090200_rls_employees.sql
```
