# hrm-app 셋업 가이드

> 이 문서는 로컬 부트스트랩 이후 Supabase 클라우드 연동 및 첫 실행까지의 단계를 안내합니다.

---

## 1. 사전 준비

- Node.js 22+ / npm 10+ (이미 설치됨)
- Supabase CLI v2.75+ (`C:\Users\tklee\.local\bin\supabase.exe`)
- supabase.com 계정

## 2. Supabase 프로젝트 생성

1. https://supabase.com/dashboard 로그인
2. **New project** 클릭
3. 입력 값:
   - Name: `hrm-app`
   - Database Password: 안전한 비밀번호 (저장 필수)
   - Region: `Northeast Asia (Seoul)` 권장
4. 프로젝트 생성 완료까지 약 2분 대기

## 3. API 키 확보

프로젝트 페이지에서 **Project Settings → API**:
- `Project URL`: `https://<project-ref>.supabase.co`
- `anon public` key
- `service_role` key (절대 클라이언트 노출 금지)
- `Project Reference ID` (URL의 `<project-ref>` 부분)

## 4. `.env.local` 생성

```bash
# hrm-app 폴더에서
cp .env.local.example .env.local
```

`.env.local` 편집:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=$(openssl rand -hex 32)
# RESEND_API_KEY=re_...                     # Resend 가입 후 입력 (선택)
# RESEND_FROM_EMAIL="HRM <noreply@your-domain.com>"
```

## 5. CLI 로그인 + 프로젝트 링크

```bash
supabase login                                   # 브라우저 로그인
supabase link --project-ref <project-ref>        # DB password 입력 요청됨
```

## 6. 마이그레이션 push

```bash
npm run db:push     # = supabase db push
```

이 명령으로 다음 8개 마이그레이션이 순서대로 적용됩니다:
1. `init_extensions_and_enums` — 확장, ENUM 타입, updated_at 트리거 함수
2. `create_departments_and_employees` — 부서, 직원 + RLS 헬퍼 함수
3. `create_employee_details` — 학력/경력/자격/가족/문서/급여
4. `create_leave_tables` — 휴가 정책/유형/잔여/신청/이력
5. `create_audit_and_email_logs` — 감사 로그, 이메일 로그
6. `business_functions` — 취소/승인/반려/신청 트랜잭션 함수
7. `rls_policies` — 모든 테이블 RLS 정책
8. `storage_buckets` — profile-images, employee-documents 버킷

이어서 `seed.sql`이 자동 실행되어 부서·휴가 정책·휴가 유형이 시드됩니다.

## 7. 데모 사용자/잔여/신청 시드

데모 Auth 계정 + 직원 메타 + 잔여 연차 + 샘플 신청을 한 번에 시드:

1. Supabase Dashboard → **SQL Editor** 열기
2. `supabase/seed-demo-users.sql` 내용 복사 → 붙여넣기 → **Run**

데모 계정 (비밀번호 모두 `Demo!2026`):
| 이메일 | 역할 | 메모 |
|--------|------|------|
| `admin@hrm.demo` | admin | HR 매니저 |
| `manager.dev@hrm.demo` | manager | 개발본부장 (부하 4명) |
| `manager.design@hrm.demo` | manager | 디자인팀장 (부하 2명) |
| `employee01@hrm.demo` ~ `employee10@hrm.demo` | employee | 일반 직원 10명 |

## 8. 타입 재생성

```bash
npm run db:types    # = supabase gen types typescript --linked > types/database.types.ts
```

## 9. 첫 실행

```bash
npm run dev
```

→ http://localhost:3000 접속

## 10. 다음 단계

이후 단계(인증 페이지, 대시보드, 휴가 신청/취소, 결재함, 직원 관리 등)는 설계서 §5.1 폴더 구조에 따라 `ui-builder` / `api-designer` 서브에이전트를 호출해 페이지별로 구현합니다. `CLAUDE.md` §3, §10의 작업 흐름을 따르세요.

---

## 트러블슈팅

- **`supabase db push` 실패**: 마이그레이션 timestamp 순서 확인. 이미 적용된 마이그레이션은 건너뜁니다.
- **RLS로 인해 데이터가 안 보임**: Dashboard에서 service_role로 직접 쿼리해 데이터 존재 확인. 인증된 사용자로 로그인 후 접근.
- **타입 에러**: `npm run db:types` 재실행 → IDE 재시작.
- **모바일 미리보기**: Chrome DevTools → Responsive (iPhone SE 375px, iPhone 14 390px).
