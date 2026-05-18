# CLAUDE.md — hrm-app 메인 에이전트 지침서

> **프로젝트**: 사내 인사관리 시스템(HRM) v1.1
> **기술 스택**: Next.js 15 (App Router) · TypeScript strict · TweakCN(shadcn/ui) · Supabase · Resend
> **상위 설계서**: `../HRM_웹개발_설계서_v1.1.md`

---

## 1. 프로젝트 개요

중소기업(임직원 10~200명) 대상 사내 HRM. 인사정보·연차/휴가·조직도·결재를 통합 관리한다. PC 중심이되 **모바일에서도 결재·조회·신청 모든 핵심 기능이 동작**해야 한다(v1.1).

### 기술 스택 (확정)
- **프레임워크**: Next.js 15 App Router, React 19, TypeScript (strict)
- **UI**: TweakCN(shadcn/ui), Tailwind CSS v4, Pretendard 폰트, lucide-react 아이콘
- **백엔드**: Supabase (Postgres + Auth + RLS + Storage + Realtime)
- **이메일**: Resend + React Email
- **검증**: Zod (서버/클라이언트 공용 스키마)
- **상태/폼**: React Hook Form + Zod resolver
- **테이블**: @tanstack/react-table 기반 shadcn DataTable
- **테스트**: Vitest (도메인 로직), Playwright (E2E는 후순위)

---

## 2. 폴더 구조 및 명명 규칙

```
hrm-app/
├── CLAUDE.md
├── .claude/
│   ├── agents/{db-architect,ui-builder,api-designer}/AGENT.md
│   └── skills/{9개 스킬}/SKILL.md
├── app/
│   ├── (auth)/{login,reset-password}/page.tsx
│   ├── (app)/                    # 인증 후 AppShell
│   │   ├── layout.tsx            # 권한 가드 + 모바일 하단 탭
│   │   ├── dashboard/page.tsx
│   │   ├── profile/...
│   │   ├── leave/...
│   │   ├── approvals/page.tsx
│   │   ├── team/...
│   │   └── admin/...
│   └── api/{leave,employees,exports,cron,webhooks}/...
├── components/{ui,app-shell,employee,leave,admin,common}/
├── lib/{supabase,auth,leave,email,export,validations,utils}/
├── types/
├── supabase/{migrations,seed.sql,functions}/
├── docs/{references,domain}/
└── output/                       # 에이전트 산출물 교환소
```

### 명명 규칙
- **테이블 접두사**: 모든 DB 테이블은 `hrm_` 접두사 사용 (예: `hrm_employees`)
- **파일/폴더**: kebab-case (예: `leave-request-form.tsx`)
- **컴포넌트**: PascalCase (예: `LeaveRequestForm`)
- **함수/변수**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **타입/인터페이스**: PascalCase, 인터페이스 접두사 `I` 금지
- **enum 값**: snake_case 문자열 리터럴 (DB와 일치)

---

## 3. 서브에이전트 호출 규칙

세 서브에이전트가 각자 책임 영역을 가진다. **메인 에이전트(이 지침서)가 작업을 분해해 호출하며, 서브에이전트 간 직접 호출은 금지한다.** 정보 교환은 메인을 거치거나 `/output/` 파일을 통해 한다.

| 서브에이전트 | 트리거 | 산출물 |
|------------|--------|--------|
| `db-architect` | 신규 테이블/컬럼/RLS/마이그레이션이 필요할 때 | `supabase/migrations/*.sql`, `types/database.types.ts` |
| `ui-builder` | 페이지·컴포넌트 신규 작성, 디자인 변경 시 | `app/**/page.tsx`, `components/**` |
| `api-designer` | Route Handler, Server Action, 이메일, CSV 익스포트 | `app/api/**`, `lib/**/queries`, Zod 스키마 |

**작업 분해 예시**: "휴가 신청 취소 기능 추가" 요청 시
1. `db-architect` → `hrm_leave_requests`에 cancellation 컬럼 추가, `can_cancel_request()` 함수 정의
2. `api-designer` → `POST /api/leave/cancel` Route Handler + Zod 스키마 + 이메일 발송
3. `ui-builder` → `CancelLeaveDialog` 컴포넌트, `/leave/history`에 취소 버튼 추가
4. 메인이 결과를 통합·검증 → `mobile-responsive-checker` 스킬로 모바일 검증

---

## 4. 코딩 컨벤션

### TypeScript
- **strict 모드 필수**. `any` 금지, 불가피하면 `unknown` 후 narrowing
- 함수형 우선. 클래스는 라이브러리 어댑터에만 사용
- `async/await` 사용 (callback 금지)
- import 순서: 외부 → 내부 alias(`@/`) → 상대경로

### Next.js
- **Server Component 우선**. 클라이언트 상호작용이 필요할 때만 `'use client'`
- 데이터 페칭은 Server Component에서 직접 Supabase 호출
- Mutation은 Server Action 또는 Route Handler 사용
- `loading.tsx` + `error.tsx`를 라우트 그룹마다 배치

### 코딩 스타일
- 한 함수 50줄 이내 권장
- 매직 넘버 금지 → `lib/constants.ts`로 추출
- 주석은 "왜"만 작성. "무엇"은 코드와 식별자가 말한다
- 빈 카탈로그 파일·placeholder 금지

---

## 5. Supabase 사용 가이드라인

### 클라이언트 분리
- `lib/supabase/client.ts` — 브라우저용 (anon key)
- `lib/supabase/server.ts` — Server Component/Route Handler용 (쿠키 기반)
- `lib/supabase/middleware.ts` — Next.js middleware (세션 갱신)
- `lib/supabase/admin.ts` — service_role 전용 (서버 사이드만, 매우 제한적 사용)

### RLS 원칙
- **모든 테이블에 RLS 활성화**. 예외 없음
- 정책은 헬퍼 함수로 추상화: `is_admin()`, `is_manager_of(uuid)`, `can_cancel_request(uuid)`
- service_role 사용은 cron job, 시스템 트리거 등 RLS 우회가 필수인 곳에 한정

### 마이그레이션
- 모든 스키마 변경은 `supabase/migrations/*.sql`로 관리
- 파일명: `YYYYMMDDHHMMSS_description.sql` (Supabase CLI 표준)
- 수동 SQL 실행 금지. 반드시 마이그레이션 파일을 거친다

### 타입 생성
- 스키마 변경 후 `supabase gen types typescript --local > types/database.types.ts` 또는 `--linked`

---

## 6. TweakCN 토큰 사용 규칙

`app/globals.css`의 CSS 변수 토큰을 통해서만 색상을 사용한다. **하드코딩된 hex 색상 금지**.

### 토큰 (설계서 4.2)
```css
--background: #FAFBFC;
--foreground: #1A1D24;
--card: #FFFFFF;
--primary: #2563EB;          /* 신뢰 블루 */
--accent: #0EA5E9;
--muted: #F8FAFC;
--muted-foreground: #64748B;
--border: #E2E8F0;
--success: #10B981;          /* 휴가 승인 */
--warning: #F59E0B;          /* 승인 대기 */
--destructive: #EF4444;      /* 반려/삭제/취소 */
```

### 컴포넌트 커스터마이징
- shadcn 컴포넌트는 `npx shadcn@latest add <name>` 후 `tweakcn-component-customizer` 스킬을 따라 토큰 적용
- 컴포넌트 라운딩 기본값 `rounded-md` (8px)
- 모바일 터치 영역 최소 44×44px (Button height 48px on mobile)

---

## 7. 모바일 우선 컴포넌트 작성 규칙 (v1.1 핵심)

**모든 페이지·컴포넌트는 데스크탑/모바일 두 가지 레이아웃을 동시에 고려해 작성한다.**

### 자동 전환 패턴
| 데스크탑 | 모바일(<768px) | 구현 |
|---------|--------------|------|
| `Dialog` | `Sheet` (bottom slide) | `useMediaQuery('(max-width: 767px)')` 분기 또는 `ResponsiveDialog` wrapper |
| `Table` | 카드 리스트 | `DataTable`에 `mobileCard` prop, 또는 `hidden md:table` + `block md:hidden` 카드 |
| `Sidebar` | Drawer + 하단 탭(`MobileBottomNav`) | `<AppShell>`이 분기 처리 |
| `DropdownMenu` | ActionSheet | shadcn DropdownMenu + `Sheet` fallback |

### 모바일 우선 페이지 (풀 기능 의무)
- `/dashboard`, `/approvals`, `/leave/*`, `/team`, `/admin/leave-overview`, `/admin/employees`(조회), `/admin/leave-policy`, `/admin/settings`

### PC 권장 페이지 (모바일 접근 시 `MobileWarningBanner` 표시, 단 기능은 작동)
- `/admin/employees/new` (13 카테고리 폼)
- `/admin/organization` (드래그앤드롭 조직도)

### 신규 페이지 작성 체크리스트
1. 데스크탑 1280px 의도 레이아웃 확정
2. 768px 이하 모바일 레이아웃 작성 (또는 PC 권장 배너)
3. 터치 영역 ≥ 44px 검증
4. `mobile-responsive-checker` 스킬 실행
5. 다이얼로그/테이블 자동 전환 적용 여부 확인

---

## 8. 검증 규칙

| 검증 영역 | 도구 | 통과 기준 |
|----------|------|----------|
| 타입 | `tsc --noEmit` | 오류 0 |
| 스키마 적용 | `supabase db push` | 마이그레이션 오류 0 |
| 폼 입력 | Zod 공용 스키마 | 클라이언트·서버 양쪽 검증 |
| 연차 계산 | Vitest 단위 테스트 | 경계 조건(입사 1년 미만/이상/3년 이상) 포함 |
| 취소 트랜잭션 | Vitest + 통합 테스트 | `leave_balances` 정합성 유지 |
| RLS | 비권한 사용자 쿼리 | 모두 차단 |
| CSV 민감정보 | 스냅샷 grep | 금지 컬럼명 미포함 |
| 모바일 렌더 | `mobile-responsive-checker` | 375px/390px에서 핵심 동작 |
| 접근성 | Lighthouse | ≥ 90 |

---

## 9. 환경 변수 및 시크릿 관리

`.env.local`에만 작성. `.env.local.example`은 키 이름만 커밋.

| 변수 | 노출 | 용도 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | RLS 우회 (cron, 시스템 작업만) |
| `RESEND_API_KEY` | server | 이메일 발송 |
| `RESEND_FROM_EMAIL` | server | 발신 주소 |
| `NEXT_PUBLIC_APP_URL` | client | 이메일 내 링크용 |
| `CRON_SECRET` | server | Vercel Cron 인증 |

**금지 사항**: service_role key를 클라이언트 번들에 노출, .env 파일 git 커밋, 로그에 토큰 출력.

---

## 10. 신규 페이지 생성 시 체크리스트

1. [ ] 설계서 2.1 페이지 목록에서 경로·권한·모바일 지원 여부 확인
2. [ ] `app/(app)/layout.tsx`의 권한 가드에 해당 role 허용 여부 확인
3. [ ] `ui-builder` 호출 → 페이지 컴포넌트 작성 (데스크탑/모바일 동시)
4. [ ] 데이터 페칭이 필요하면 `api-designer` 호출 → `lib/supabase/queries/*` 또는 Route Handler 작성
5. [ ] 스키마 변경 시 `db-architect` 호출 → 마이그레이션 + RLS
6. [ ] Zod 스키마는 `lib/validations/`에 두고 클라/서버 공용
7. [ ] 로딩 상태: `loading.tsx` 또는 Skeleton
8. [ ] 에러 상태: `error.tsx` + Toast(Sonner)
9. [ ] 모바일 렌더링 검증: `mobile-responsive-checker` 스킬
10. [ ] 접근성: 키보드 내비게이션, 색상 대비 확인

---

## 11. 핵심 도메인 규칙 (요약)

자세한 사양은 `docs/domain/` 참조.

- **권한 3계층**: employee / manager / admin (설계서 1.2)
- **연차 산정**: 한국 근로기준법 제60조 (설계서 3.7), 산정 기준일은 `hrm_leave_policies.basis`로 토글
- **휴가 취소**:
  - `pending` → 즉시 취소, pending_days 환원
  - `approved` & 시작일 이전 → 즉시 취소, used_days 환원 (트랜잭션)
  - `approved` & 시작일 이후 → 취소 불가 (관리자 문의)
  - `rejected`, `cancelled` → 취소 버튼 미노출
- **퇴사 처리**: 데이터 보존 + Auth 비활성화 + 부하 manager_id NULL + 진행 중 신청 system_cancelled
- **CSV 내보내기**: 민감정보 컬럼 절대 미포함 (설계서 5.5)

---

## 12. 작업 흐름 표준

1. **요구 접수** → 메인이 작업을 도메인별로 분해
2. **계획 수립** → 어떤 서브에이전트가 어떤 산출물을 낼지 명세
3. **호출** → 서브에이전트 실행, 결과는 파일 또는 `/output/`으로 수신
4. **통합 검증** → 타입체크, 마이그레이션, 모바일 검증, 보안 검증
5. **에스컬레이션** → 디자인 모호, 보안 의심, 트랜잭션 정합성 깨짐 시 사용자에게 확인
