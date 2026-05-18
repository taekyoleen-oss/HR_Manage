# HRM — 사내 인사관리 시스템 v1.1

Next.js 15 + Supabase 기반 사내 HRM. 인사 정보·연차/휴가·조직도·결재를 통합 관리합니다. PC 중심이되 **모바일에서도 결재·조회·신청 모든 핵심 기능이 동작**합니다(v1.1).

## 스택

- Next.js 15 App Router · React 19 · TypeScript strict
- TweakCN(shadcn/ui) · Tailwind CSS v4 · Pretendard
- Supabase (Postgres + Auth + RLS + Storage)
- Resend + React Email
- Zod + React Hook Form
- Vitest (도메인 로직)

## 빠른 시작

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 설정
cp .env.local.example .env.local
# .env.local을 열어 Supabase URL/키 등 7개 변수 채우기

# 3) Supabase 마이그레이션 적용 (이미 supabase link 완료 가정)
supabase db push

# 4) (선택) 데모 데이터 시드
#    Supabase Dashboard > SQL Editor에서 supabase/seed-demo-users.sql 실행
#    → admin 1 + manager 2 + employee 10, 비밀번호 모두 password

# 5) dev 서버
npm run dev
# http://localhost:3000
```

## 주요 명령

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 운영 빌드 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest 도메인 로직 테스트 |
| `npm run db:push` | Supabase 마이그레이션 적용 |
| `npm run db:types` | 정식 Database 타입 자동 생성 (운영 전 권장) |

## 폴더 구조

```
hrm-app/
├── app/
│   ├── (auth)/{login,reset-password}/  # 인증 페이지
│   ├── (app)/                          # 인증 후 AppShell
│   │   ├── dashboard/
│   │   ├── leave/{,request,history}/
│   │   ├── approvals/
│   │   ├── profile/{,edit}/
│   │   ├── team/{,[id]}/
│   │   └── admin/{employees,organization,leave-policy,leave-overview,settings}/
│   └── api/{leave,employees,exports,cron,admin}/
├── components/{ui,app-shell,common}/
├── lib/{supabase,auth,leave,employees,email,export,validations,api,utils}/
├── supabase/{migrations,seed.sql,seed-demo-users.sql,fix-demo-auth-tokens.sql}/
└── types/database.types.ts
```

## 권한 모델 (v1.1)

| 역할 | 가능한 동작 |
|------|------------|
| `employee` | 본인 정보 조회/수정 · 휴가 신청 · 본인 신청 취소(pending/approved 시작일 전) |
| `manager` | + 부하 직원 휴가 결재 · 부하 정보 조회 |
| `admin` | + 직원 등록/수정/퇴사 · 조직 관리 · 휴가 정책 · 전사 통계 · CSV 익스포트 |

가드는 세 층으로 동작:
1. 사이드바 메뉴 (UI)
2. `app/(app)/layout.tsx`의 `requireUser` / `requireRole` (페이지 가드)
3. Supabase RLS (DB)

## 알림 시스템

`lib/notify/`가 인앱(`hrm_notifications`) / SMS(네이버 클라우드 SENS) / 이메일(Resend) 세 채널을 통합 관리. 호출은 한 곳:

```ts
import { notify } from '@/lib/notify';
await notify({
  kind: 'leave_approved',
  recipientEmployeeId: '...',
  vars: { leaveTypeName: '연차', period: '2026-06-15~17' },
});
```

채널 라우팅 정책 (`lib/notify/index.ts`):

| kind | 인앱 | SMS (opt-in 시) | 이메일 |
|------|:----:|:---------------:|:------:|
| `leave_request_submitted` (→결재자) | ✅ | ✅ | ❌ |
| `leave_approved` (→신청자) | ✅ | ✅ | ❌ |
| `leave_rejected` (→신청자) | ✅ | ✅ | ❌ |
| `leave_cancelled_by_employee` (→결재자) | ✅ | ❌ | ❌ |
| `employee_invitation` (→신규 직원) | ❌ | ❌ | ✅ |

- **인앱**: 헤더 종 아이콘 → 미읽음 카운트 30초 polling. `/notifications`에 전체 목록 100건.
- **SMS**: 직원이 `/profile/edit`에서 "SMS 알림 받기" 토글 ON + `phone` 등록 시에만 발송. 환경변수 미설정 시 `delivery_status='stubbed'`로 기록만.
- **이메일**: 직원 초대만. Supabase Auth invite는 별도로 자동 발송됨.

신규 kind를 추가하려면: `hrm_notification_kind` enum에 추가 → `lib/notify/templates.ts`의 `renderMessage` case 추가 → `lib/notify/index.ts`의 `CHANNEL_POLICY`에 채널 지정.

## 휴가 도메인 규칙

자세한 사양은 `../HRM_웹개발_설계서_v1.1.md` 참조.

- **연차 산정**: 한국 근로기준법 §60 (`lib/leave/calculator.ts`)
  - 1년 미만 → 매월 개근 1일 (최대 11일)
  - 1년 이상 → 15일 + 3년차부터 2년마다 1일 가산 (최대 25일)
  - 회계연도 기준 첫해 → 비례 계산
- **영업일 계산**: `lib/leave/holidays.ts` — 주말·한국 공휴일 제외, 반차 0.5일
- **본인 취소**: `lib/leave/cancellation.ts`
  - `pending` → 즉시 취소
  - `approved` + 시작일 이전 → 즉시 취소 (used_days 환원)
  - `approved` + 시작일 이후 → 불가 (관리자 문의)
- **이메일**: Resend 미설정 시에도 `hrm_email_logs`에 status='stubbed'로 기록

## 배포 (Vercel)

1. GitHub repo 연결 후 Vercel Project 생성
2. **Environment Variables** 7종 등록 (`.env.local.example` 참고)
3. **Cron Jobs**: `vercel.json`에 이미 등록됨
   - `/api/cron/annual-leave-grant` 매일 01:00 UTC
   - `/api/cron/leave-expiration` 매일 02:00 UTC
4. **Supabase Auth Redirect URL**에 운영 도메인 추가 (Dashboard > Authentication > URL Configuration)
5. **Resend 도메인 검증** (이메일 사용 시)

## 타입 시스템

`types/database.types.ts`는 `supabase gen types typescript --linked`로 자동 생성된 파일입니다. 스키마를 변경할 때마다 `npm run db:types`로 재생성하세요. `Database` generic이 `lib/supabase/{server,client,middleware,admin}.ts` 모두에 적용되어 있고, `tsconfig`는 `strict: true` + 기본 `noImplicitAny`로 동작합니다.

도메인 enum/상태 타입은 같은 파일 하단에 named export로 제공됩니다:

```ts
import type { UserRole, LeaveRequestStatus, LeavePeriod } from '@/types/database.types';
```

## 트러블슈팅

| 증상 | 1차 확인 |
|------|---------|
| 로그인 500 "Database error querying schema" | `supabase/fix-demo-auth-tokens.sql` 1회 실행. 신규 시드는 `seed-demo-users.sql`이 이미 token 컬럼을 ''로 채움 |
| `supabase db push` 실패 | timestamp 순서, DB password 정확성 |
| 휴가 신청 "INSUFFICIENT_BALANCE" | `hrm_leave_balances_view`에서 remaining_days 확인 |
| 모바일 레이아웃 깨짐 | DevTools 375px/390px 확인 + `useMediaQuery` 누락 여부 |
| 이메일 미발송 | `RESEND_API_KEY` 미설정이면 정상 (stub 동작). `hrm_email_logs`에서 status 확인 |

## 데모 계정

`seed-demo-users.sql` 실행 후:

| 이메일 | 비밀번호 | 역할 |
|-------|---------|------|
| admin@hrm.demo | password | admin (HR 매니저) |
| manager.dev@hrm.demo | password | manager (개발본부) |
| manager.design@hrm.demo | password | manager (디자인팀) |
| employee01@hrm.demo ~ employee10@hrm.demo | password | employee |

⚠️ 운영 환경 절대 사용 금지.
