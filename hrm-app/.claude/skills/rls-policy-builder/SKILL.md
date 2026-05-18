---
name: rls-policy-builder
description: 역할(employee/manager/admin)별 RLS SQL을 생성하는 스킬. 헬퍼 함수(is_admin, is_manager_of, can_cancel_request)를 재사용해 일관된 정책을 만든다. 신규 테이블 추가 시 SELECT/INSERT/UPDATE/DELETE 정책을 자동 생성한다.
---

# rls-policy-builder

## 목적
모든 `hrm_*` 테이블에 일관된 RLS 정책을 생성한다. 헬퍼 함수를 통한 추상화로 정책의 가독성과 유지보수성을 확보한다.

## 입력
- 테이블명, 컬럼 목록
- 접근 권한 매트릭스 (employee/manager/admin × SELECT/INSERT/UPDATE/DELETE)
- 특수 조건 (예: 본인 vs 부하 vs 전사)

## 출력
- `supabase/migrations/<timestamp>_rls_<table>.sql`
- 정책 이름은 `<action>_<scope>` (예: `select_self_or_manager_or_admin`)

## 표준 헬퍼 함수 (선행 마이그레이션에서 정의)

```sql
-- 현재 사용자가 admin인지
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM hrm_employees
    WHERE id = auth.uid()
      AND role = 'admin'
      AND employment_status != 'resigned'
  );
$$;

-- 현재 사용자가 target의 상급자인지
CREATE OR REPLACE FUNCTION is_manager_of(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM hrm_employees
    WHERE id = target AND manager_id = auth.uid()
  );
$$;

-- 본인 또는 admin
CREATE OR REPLACE FUNCTION is_self_or_admin(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT target = auth.uid() OR is_admin();
$$;
```

## 정책 매트릭스 (설계서 3.4)

| 테이블 | SELECT | INSERT/UPDATE | DELETE |
|--------|--------|--------------|--------|
| `hrm_employees` | 본인 OR 상급자(manager_id=auth.uid()) OR admin | admin만 (본인은 일부 필드 UPDATE 허용) | admin (실제로는 employment_status='resigned' 변경) |
| `hrm_leave_requests` | 본인 OR 상급자 OR admin | 본인(INSERT, UPDATE→status=cancelled), 상급자/admin(UPDATE→approved/rejected) | 없음 (취소는 UPDATE) |
| `hrm_leave_balances` | 본인 OR 상급자 OR admin | admin만 (또는 SECURITY DEFINER 함수) | 없음 |
| `hrm_leave_transactions` | 본인 OR admin | INSERT는 트리거/함수만 (SECURITY DEFINER) | 없음 |
| `hrm_employee_compensation` | admin만 | admin만 | admin만 |
| `hrm_audit_logs`, `hrm_email_logs` | admin만 | SECURITY DEFINER 함수만 | 없음 |
| `hrm_employee_*` (education, career, ...) | 본인 OR 상급자 OR admin | 본인(자기 것) OR admin | 본인 OR admin |
| `hrm_departments`, `hrm_leave_policies`, `hrm_leave_types` | 인증 사용자 전체 SELECT | admin만 | admin만 |

## 표준 정책 템플릿

### 본인 + 상급자 + admin SELECT
```sql
ALTER TABLE hrm_<table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>_select_self_or_manager_or_admin"
  ON hrm_<table> FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_of(employee_id)
    OR is_admin()
  );
```

### 본인 INSERT + admin INSERT
```sql
CREATE POLICY "<table>_insert_self_or_admin"
  ON hrm_<table> FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() OR is_admin());
```

### 본인 UPDATE (제한된 컬럼)
컬럼 제한은 RLS로 불가능 → Postgres 함수 + RPC 사용. RLS는 row 단위만 강제.

### 상급자/admin의 휴가 승인 UPDATE
```sql
CREATE POLICY "leave_requests_update_approver_or_admin"
  ON hrm_leave_requests FOR UPDATE TO authenticated
  USING (
    is_manager_of(employee_id) OR is_admin()
  )
  WITH CHECK (
    is_manager_of(employee_id) OR is_admin()
  );
```

## 검증 체크리스트

신규 테이블에 RLS 마이그레이션 작성 후:

1. [ ] `ENABLE ROW LEVEL SECURITY` 적용
2. [ ] SELECT 정책 1개 이상
3. [ ] INSERT/UPDATE/DELETE 각각 명시적 (없으면 deny)
4. [ ] service_role 우회 시나리오 확인 (cron, 시스템 트리거)
5. [ ] 정책 테스트: 비권한 사용자로 직접 쿼리해 차단되는지 확인
6. [ ] `is_admin()` 등 헬퍼만 사용, 인라인 EXISTS 금지

## 금지 사항
- `USING (true)` 정책 (전체 허용)
- `FOR ALL` 정책 (SELECT/INSERT/UPDATE/DELETE 명시적 분리 권장)
- 정책에서 `auth.uid()` 직접 비교만 사용 — 헬퍼 함수로 추상화
- RLS 없이 service_role 의존
