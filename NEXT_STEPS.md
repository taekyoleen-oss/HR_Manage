# HRM 프로젝트 — 다음 단계 가이드

> **문서 위치**: 프로젝트 루트
> **현재 상태**: Phase 1~6 1차 구현 완료 (테스트 27/27, 빌드 19 페이지 통과)
> **작성일**: 2026-05-17, 최종 갱신 2026-05-18
> **참조 문서**: `HRM_웹개발_설계서_v1.1.md`, `hrm-app/CLAUDE.md`, `hrm-app/SETUP.md`

## ✅ 2026-05-18 1차 구현 완료 요약

| 영역 | 산출물 |
|------|--------|
| Phase 3 도메인 | `lib/leave/{calculator, cancellation, holidays, queries}.ts`, `lib/validations/leave.ts` |
| Phase 3 API | `/api/leave/{request, approve, reject, cancel}` |
| Phase 3 페이지 | `/leave`, `/leave/request`, `/leave/history`, `/approvals` (취소 다이얼로그 포함) |
| Phase 4 페이지 | `/dashboard`, `/profile{,/edit}`, `/team{,/[id]}`, `/admin/{employees,/new,/[id], organization, leave-policy, leave-overview, settings}` |
| Phase 4 API | `/api/employees{,/[id],/me}`, `/api/admin/{organization, leave-policy}` |
| Phase 5 이메일 | `lib/email/send.ts` 스텁 + Resend 실 발송(키 있을 때) + React Email 템플릿 5종 |
| Phase 5 CSV | `lib/export/csv.ts` + `/api/exports/{leave-csv, employees-csv}` (UTF-8 BOM, 민감 컬럼 화이트리스트) |
| Phase 5 Cron | `/api/cron/{annual-leave-grant, leave-expiration}` + `vercel.json` 등록 |
| Phase 6 테스트 | `lib/leave/*.test.ts` 27 케이스 통과 (1년 미만/이상, 회계연도 비례, 취소 시나리오 4종, 영업일 계산) |
| Phase 6 빌드 | `tsc --noEmit` 0 에러, `next build` 19 페이지 |

## ✅ 2026-05-18 타입 시스템 정식화 완료

- `supabase` Personal Access Token으로 HRM 프로젝트 link 성공
- `npm run db:types`로 정식 Database 타입 자동 생성 (1053줄)
- `types/database.types.ts` 하단에 도메인 named export (UserRole, LeavePeriod 등) 보강
- `@supabase/supabase-js` 2.47 → **2.105**, `@supabase/ssr` 0.5 → **0.10** 업그레이드 (자동 생성 타입의 `__InternalSupabase` 등 새 형식 호환을 위해)
- `lib/supabase/{server,client,middleware,admin}.ts`의 `: any` 제거 + `<Database>` generic 복원
- `tsconfig.json`에서 `noImplicitAny: false` 제거 (strict 모드 완전 복원)
- 잔여 타입 오류 3건 fix:
  - `app/(app)/leave/history/page.tsx` — `previousStatus`를 `'pending' | 'approved'`로 narrow
  - `app/api/employees/[id]/route.ts` / `me/route.ts` — patch 객체 타입을 `Database['public']['Tables']['hrm_employees']['Update']`로 명시
- 최종 검증 — vitest **27/27**, `tsc --noEmit` **0 에러**, `next build` **19 페이지**

## ✅ 2026-05-18 추가 마무리

- `seed-demo-users.sql` 보정 — auth.users INSERT 시 token 컬럼 8종 모두 ''로 명시. 신규 프로젝트에서는 `fix-demo-auth-tokens.sql` 불필요.
- `hrm-app/.env.local.example` 작성
- `hrm-app/README.md` 작성 (빠른 시작, 권한 모델, 배포 가이드, 트러블슈팅)
- `.gitignore`에 `.playwright-mcp/`, `output/` 추가
- Playwright admin/manager E2E 시연 — 신청·승인·반려·본인 취소·RLS 스코프 모두 검증

## ✅ 2026-05-18 알림 시스템 추가 완료

- 마이그레이션 #9 `hrm_notifications` + `hrm_employees.sms_opt_in` 적용
- `lib/notify/` 추상화 + 3개 driver(inapp/sms/email). 기존 `lib/email/send.ts` 제거.
- 라우팅 정책: 휴가 결재/승인/반려 → 인앱+SMS(opt-in) / 본인 취소 → 인앱 / 직원 초대 → 이메일
- 헤더 `NotificationBell` + 미읽음 카운트 30초 polling + 드롭다운(최근 10건)
- `/notifications` 전체 페이지 + `/profile/edit`에 SMS 토글
- `/api/notifications/{,unread-count,[id]/read,read-all}` 4개 라우트
- Playwright 시연 통과: employee 신청 → 결재자에게 종 배지 1 + 드롭다운 알림 + /approvals 이동 + read 처리

## 다음 단계 (남은 사용자 액션)

1. **Resend 도메인 검증** — resend.com에서 운영 도메인 등록 → `RESEND_API_KEY` / `RESEND_FROM_EMAIL` `.env.local`에 반영 (직원 초대 보조 메일용)
2. **네이버 클라우드 SENS** — console.ncloud.com에서 Service ID/Access Key/Secret Key/발신번호 발급 → 환경변수 4종(`NCP_SENS_*`) 등록 (SMS 사용 시)
3. **Vercel 배포** — `vercel.json` cron 이미 등록됨. 환경변수 9종(`.env.local.example` 참고) 등록. Supabase Auth > URL Configuration에 운영 도메인 추가
4. **Lighthouse 검증** — 모바일 접근성 ≥ 90 확인
5. (선택) **알림 보관 cron** — `hrm_notifications` 90일 후 자동 삭제 작업 — 후속 검토 예정

---

## 0. 지금까지 완료된 작업

| 영역 | 산출물 |
|------|--------|
| 메인 지침 | `hrm-app/CLAUDE.md` (12개 섹션) |
| 서브에이전트 3종 | `hrm-app/.claude/agents/{db-architect, ui-builder, api-designer}/AGENT.md` |
| 스킬 9종 | `hrm-app/.claude/skills/*/SKILL.md` |
| Next.js 부트스트랩 | `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `middleware.ts`, `components.json` + `node_modules/` (541패키지 설치) |
| TweakCN 토큰 | `hrm-app/app/globals.css` — 설계서 §4.2 컬러 토큰 HSL 적용 |
| Supabase 마이그레이션 | `hrm-app/supabase/migrations/*.sql` 8개 — 15개 `hrm_*` 테이블 + RLS + 헬퍼/도메인 함수 |
| Supabase 시드 | `supabase/seed.sql` (정책/유형/부서) + `seed-demo-users.sql` (admin 1 + manager 2 + employee 10 + 샘플 신청 5건) |
| Supabase 클라이언트 | `lib/supabase/{client,server,middleware}.ts` |
| 셋업 가이드 | `hrm-app/SETUP.md` |
| 빌드 검증 | `tsc --noEmit` 통과, `next build` 성공 |

---

## 1. ✅ Supabase 클라우드 연동 완료 (2026-05-17)

- Project: `hifozfxecdshahccsbom.supabase.co` (Northeast Asia Seoul)
- 마이그레이션 8종 적용 완료
- `seed-demo-users.sql` 실행 완료 (self-contained로 수정 후)
- `.env.local` 작성 완료 (CRON_SECRET 실 값 포함)
- Dev 서버 기동 + `/api/health` 검증 통과
- 최종 카운트 (service_role 우회 확인): departments=4 / leave_types=10 / leave_policies=1 / employees=13 / leave_requests=5 / leave_balances=13
- RLS 정상 동작 확인: 인증되지 않은 anon 호출은 count=0 (정책 차단)

### 남은 마무리 (선택)

| 항목 | 비고 |
|------|------|
| **TypeScript 타입 재생성** | `supabase login`을 hrm-app 프로젝트 소유 계정으로 다시 실행 후 `npm run db:types`. 다른 방법: Dashboard → API → "Generate types from your database" 결과를 `types/database.types.ts`에 복사 |
| **Resend API key** | 이메일 발송 사용 시. resend.com 가입 → API key 발급 → `.env.local`의 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` 갱신 |
| **`/api/health` 정리** | 셋업 검증용. 운영 전에 삭제 권장 (`?admin=1`로 service_role 우회) |

---

## 2. Phase 2 — 인증 & AppShell (예상 1세션)

### 2-1. 인증 페이지

| 파일 | 담당 | 비고 |
|------|------|------|
| `app/(auth)/login/page.tsx` | ui-builder + api-designer | 이메일+비밀번호, Supabase Auth, 모바일 풀 |
| `app/(auth)/reset-password/page.tsx` | ui-builder + api-designer | 이메일 링크 기반 |
| `app/(auth)/layout.tsx` | ui-builder | 인증 전용 미니멀 레이아웃 |

### 2-2. AppShell (인증 후 전체)

| 파일 | 담당 |
|------|------|
| `app/(app)/layout.tsx` — 권한 가드 + AppShell | api-designer (가드) + ui-builder (셸) |
| `components/app-shell/sidebar.tsx` — 역할별 메뉴 | ui-builder |
| `components/app-shell/header.tsx` — 유저 메뉴, 로그아웃 | ui-builder |
| `components/app-shell/mobile-bottom-nav.tsx` — v1.1 핵심 | ui-builder |
| `components/app-shell/mobile-warning-banner.tsx` — v1.1 | ui-builder |
| `components/common/responsive-dialog.tsx` — Dialog ↔ Sheet 자동 분기 | ui-builder |

### 2-3. 권한 가드 헬퍼

| 파일 | 내용 |
|------|------|
| `lib/auth/guards.ts` | `requireUser`, `requireRole(role[])`, `requireManagerOf(employeeId)` |
| `lib/auth/permissions.ts` | role × resource 매트릭스 |

---

## 3. Phase 3 — 휴가 도메인 (예상 1~2세션)

### 3-1. 도메인 로직 (lib)

| 파일 | 스킬 |
|------|------|
| `lib/leave/calculator.ts` | annual-leave-calculator |
| `lib/leave/cancellation.ts` | leave-cancellation-handler |
| `lib/leave/holidays.ts` | korean-holidays |
| `lib/validations/leave.ts` | Zod 스키마 (신청/취소/승인) |

### 3-2. API Route Handler

| 엔드포인트 | 메서드 | 비고 |
|----------|--------|------|
| `/api/leave/request` | POST | `submit_leave_request` RPC 호출 |
| `/api/leave/approve` | POST | `approve_leave_request` RPC |
| `/api/leave/reject` | POST | `reject_leave_request` RPC |
| `/api/leave/cancel` | POST | `cancel_leave_request` RPC (v1.1) |

### 3-3. 페이지

| 경로 | 비고 |
|------|------|
| `/leave` | 잔여연차 카드 + 캘린더 + 내 신청 요약 |
| `/leave/request` | 휴가 신청 폼 (모바일 풀스크린 Sheet) |
| `/leave/history` | 이력 + **취소 버튼 (v1.1)** + CancelLeaveDialog |
| `/approvals` | 결재함 — ApprovalTable(데스크탑) + ApprovalCard(모바일) |

### 3-4. 단위 테스트 (Vitest)

| 파일 | 케이스 |
|------|--------|
| `lib/leave/calculator.test.ts` | 입사 0/1개월/11개월/1년/3년/21년+, 회계연도 비례 |
| `lib/leave/cancellation.test.ts` | 4가지 시나리오 (pending/approved 전후/rejected/cancelled) |
| `lib/leave/holidays.test.ts` | 주말·공휴일·반차·시간 단위 |

---

## 4. Phase 4 — 직원/조직 관리 (예상 1세션)

### 4-1. 일반 사용자 페이지

| 경로 | 비고 |
|------|------|
| `/dashboard` | 역할별 위젯 (잔여연차/결재 대기/팀 현황) |
| `/profile` | 본인 정보 조회 |
| `/profile/edit` | 본인 수정 가능 필드 (연락처 등) |
| `/team` | 부하직원 카드 그리드 (모바일 1열) |
| `/team/[employeeId]` | 부하직원 상세 조회 |

### 4-2. 관리자 페이지

| 경로 | 비고 |
|------|------|
| `/admin/employees` | 직원 목록 (DataTable + 모바일 카드 분기) |
| `/admin/employees/new` | 신규 직원 등록 — **MobileWarningBanner 적용** |
| `/admin/employees/[id]` | 모든 필드 편집, AuditTimeline |
| `/admin/organization` | 부서 + 상급자 지정 (드래그앤드롭) — **MobileWarningBanner** |
| `/admin/leave-policy` | 회계연도/입사일 기준 토글, 가산 정책 |
| `/admin/leave-overview` | 부서별/월별 통계 차트 |
| `/admin/settings` | 회사 정보, 이메일 템플릿 설정 |

### 4-3. API

| 엔드포인트 | 비고 |
|----------|------|
| `/api/employees` GET/POST | admin: 목록/등록 (Auth 초대 메일 동시 발송) |
| `/api/employees/[id]` GET/PATCH/DELETE | 권한별 필드 마스킹 |
| `/api/admin/organization` POST | manager_id, department_id 갱신 |

---

## 5. Phase 5 — 이메일/CSV/Cron (예상 1세션)

### 5-1. 이메일 (Resend)

> 선택사항이지만 권장. Resend 가입(resend.com) → 도메인 검증 → API key 발급.

| 파일 | 비고 |
|------|------|
| `lib/email/send.ts` | Resend 클라이언트 + `hrm_email_logs` 기록 |
| `lib/email/templates/leave-request-submitted.tsx` | React Email |
| `lib/email/templates/leave-approved.tsx` | |
| `lib/email/templates/leave-rejected.tsx` | |
| `lib/email/templates/leave-cancelled-by-employee.tsx` | v1.1 |
| `lib/email/templates/employee-invitation.tsx` | 비밀번호 설정 링크 |

### 5-2. CSV 내보내기

| 파일 | 비고 |
|------|------|
| `lib/export/csv.ts` | ALLOWED_COLUMNS 화이트리스트 + 한글 헤더 + UTF-8 BOM |
| `app/api/exports/leave-csv/route.ts` | 권한별 스코프 + 감사 로그 |

### 5-3. Cron Job (Vercel Cron)

| 경로 | 주기 | 비고 |
|------|------|------|
| `/api/cron/annual-leave-grant` | 매일 01:00 | 회계연도/입사일 도래 시 부여 |
| `/api/cron/leave-expiration` | 매일 02:00 | 발생+1년 경과 소멸 |

---

## 6. Phase 6 — 검증 & 배포 (예상 0.5세션)

### 6-1. 검증

- [ ] Lighthouse 데스크탑 Accessibility ≥ 90
- [ ] Lighthouse 모바일 Accessibility ≥ 90
- [ ] `mobile-responsive-checker` 전 페이지 통과
- [ ] RLS 침투 테스트 (anon으로 다른 사용자 데이터 시도)
- [ ] CSV 익스포트 금지 컬럼 grep 통과
- [ ] Vitest 도메인 로직 100% 통과

### 6-2. 배포

| 단계 | 내용 |
|------|------|
| Vercel 프로젝트 연결 | GitHub 연동 또는 CLI |
| 환경 변수 | 7개 (URL, anon, service_role, RESEND_*, APP_URL, CRON_SECRET) |
| 도메인 연결 | 사내 도메인 또는 vercel.app |
| Supabase Auth Redirect URL 갱신 | 운영 도메인 추가 |

---

## 7. 디퍼된 기능 (v2.0 이후 — 설계서 §6)

- 근태/출퇴근, 급여명세서, 인사평가
- PWA 푸시 알림, Slack/카카오 알림톡
- OAuth/SSO (Google Workspace, Microsoft 365)
- 다크 모드, 다국어
- 인앱 알림 (헤더 종 아이콘)

---

## 8. 작업 진행 규칙

1. **신규 페이지마다 데스크탑/모바일 두 가지 레이아웃 동시 작성** — `mobile-responsive-checker` 스킬 실행 의무
2. **DB 스키마 변경은 항상 마이그레이션 파일** — 수동 SQL 금지
3. **모든 인터랙티브 요소 터치 영역 ≥ 44px**
4. **민감정보(주민번호, 급여, 연락처)는 CSV·로그·이메일 본문에 절대 미포함**
5. **다단계 데이터 변경은 Postgres 함수(RPC)** — 클라이언트 sequential 쿼리 금지
6. **이메일 발송 실패가 API 응답을 막지 않는다** — fire-and-forget + 재시도

---

## 9. 트러블슈팅 빠른 참조

| 증상 | 1차 확인 |
|------|---------|
| `supabase db push` 실패 | timestamp 순서, DB password 정확성 |
| RLS로 데이터 안 보임 | 로그인 후 본인/상급자/admin 권한으로 접근하는지 |
| 타입 에러 | `npm run db:types` 재실행 후 IDE 재시작 |
| 모바일 레이아웃 깨짐 | DevTools 375px/390px 확인 + `useMediaQuery` 누락 여부 |
| 이메일 발송 실패 | `hrm_email_logs` 조회, `RESEND_FROM_EMAIL` 도메인 검증 상태 |
| 휴가 신청 시 "INSUFFICIENT_BALANCE" | `hrm_leave_balances_view`에서 remaining_days 확인 |

---

## 10. 세션 시작 시 권장 프롬프트

다음 세션 시작 시 컨텍스트 복원을 위해 다음 중 하나로 시작:

```
NEXT_STEPS.md를 읽고 Phase 2(인증 + AppShell)부터 진행해 주세요.
```

또는

```
hrm-app/CLAUDE.md 지침을 따라 로그인 페이지를 ui-builder + api-designer로 구현해 주세요. NEXT_STEPS.md §2-1 참조.
```

---

**문서 끝.**
