# 사내 인사관리 시스템(HRM) 웹 개발 설계서 v1.1

> **프로젝트 코드명**: `hrm-app`
> **기술 스택**: Next.js 15 (App Router) · TweakCN (shadcn/ui 기반) · Supabase
> **문서 버전**: 1.1
> **변경 이력**:
> - v1.0 (초안)
> - **v1.1**: ① 휴가 신청 취소 기능 추가, ② 퇴사자 정보 보관 정책 명확화, ③ **관리자 페이지 모바일 지원**, ④ 알림 채널을 이메일 단일로 단순화, ⑤ CSV 내보내기 컬럼 범위 명시
> **작성 목적**: Claude Code 구현 단계에서 참조할 통합 계획서

---

## 1. 프로젝트 컨텍스트

### 1.1 배경 및 목적

중소형 회사(임직원 약 10~200명 규모)가 인사 정보, 휴가/연차, 조직도, 상급자-부하 관계를 통합 관리할 수 있는 사내 웹 애플리케이션. 외부 HR SaaS(Flex, 시프티 등) 구독이 부담스럽거나 회사 특수 요구사항을 반영해야 하는 조직을 대상으로 한다.

핵심 가치 제안:
- **단순함**: 중소기업이 자체 운영 가능한 수준의 기능과 UI
- **법규 준수**: 한국 근로기준법 기준 연차 자동 산정(하이브리드 — 자동 계산 + 관리자 수동 조정)
- **권한 분리**: 본인 정보 / 상급자 권한 / HR 관리자 권한의 명확한 분리
- **언제 어디서나 결재 가능**: PC 중심 설계이되, **관리자 부재 시(출장·외근) 모바일에서도 핵심 관리 기능 사용 가능**
- **확장성**: 초기에는 기본 기능, 향후 평가/급여/근태 모듈 추가 가능한 구조

### 1.2 대상 사용자

| 역할 | 권한 코드 | 주요 사용 시나리오 |
|------|----------|-----------------|
| 일반 직원 (Employee) | `employee` | 본인 인사정보 조회/일부 수정, 휴가 신청/조회, 잔여 연차 확인, **본인 신청 취소** |
| 상급자 (Manager) | `manager` | 본인 + 지정된 부하직원의 정보 조회, 부하직원 휴가 승인 |
| HR 관리자 (Admin) | `admin` | 전사 인사정보 CRUD, 상급자-부하 관계 지정, 연차 정책 설정, 통계 조회 |

> **권한 모델**: A안 (3계층). 상급자는 부하직원에 대해 **조회 + 휴가 승인**까지 가능하며, **인사정보 직접 수정은 불가**(HR 관리자만 가능).

### 1.3 핵심 기능 요약

1. **계정/인증**: 이메일+비밀번호 로그인 (Supabase Auth), 비밀번호 재설정
2. **인사정보 관리**: 13개 카테고리 인적 정보의 CRUD (빈 필드 허용)
3. **휴가/연차 관리**: 자동 산정 + 수동 조정 하이브리드, 반차/시간 단위 휴가
4. **휴가 신청/승인 워크플로**: 직원 신청 → 상급자 승인 → 자동 차감 (이메일 알림)
5. **휴가 신청 취소 (v1.1 신규)**: 신청자가 본인 신청을 취소 가능 — 승인 전/후 상태에 따라 처리 분기
6. **조직 및 상급자 관계 관리**: 관리자가 직원별 상급자 지정
7. **대시보드**: 역할별 맞춤 홈 화면 (본인 잔여연차, 결재 대기 건, 전사 현황 등)
8. **모바일 결재 (v1.1 강화)**: 관리자·상급자가 출장 중에도 모바일에서 결재·승인 처리

### 1.4 입력/출력 정의

- **입력 데이터**: 직원 인사정보(폼 입력), 휴가 신청, 관리자의 정책/조직 설정
- **출력 결과물**:
  - 직원 정보 카드 화면 및 PDF 출력(인사기록카드)
  - 휴가 신청서 PDF 다운로드(선택)
  - 휴가 승인/반려 이메일 알림 (Resend)
  - 부서별/월별 휴가 사용률 통계 (관리자 대시보드)
  - **CSV 내보내기 (민감정보 제외) — 휴가 사용 내역, 출근/부서 통계 위주**

### 1.5 제약조건

| 영역 | 조건 |
|------|------|
| **보안** | RLS(Row Level Security) 모든 테이블 적용, 급여 정보는 별도 권한 |
| **법규 준수** | 한국 근로기준법 제60조 연차 산정 규칙 반영, 개인정보보호법 고려 (주민번호 저장 금지 — 생년월일만) |
| **성능** | 직원 500명 기준 목록 로딩 < 1초, 휴가 신청 처리 < 500ms |
| **접근성** | WCAG 2.1 AA 수준 (키보드 내비게이션, 색상 대비) |
| **반응형 (v1.1 변경)** | **데스크탑 우선**(1280px+ 최적화), 태블릿(768px+) 대응, **모바일에서도 결재/조회 등 핵심 기능 사용 가능** — 대용량 데이터 입력 위주의 일부 페이지만 PC 권장 안내 |
| **브라우저** | Chrome, Edge, Safari 최신 2개 버전 (모바일 Safari, Chrome 포함) |

### 1.6 용어 정의

| 용어 | 정의 |
|------|------|
| **연차유급휴가** | 근로기준법 제60조에 따른 유급휴가 (이하 "연차") |
| **회계연도 기준** | 매년 1월 1일을 기준으로 연차를 일괄 부여하는 방식 |
| **입사일 기준** | 직원 개인의 입사일을 기준으로 연차를 부여하는 방식 |
| **상급자(Manager)** | HR 관리자가 지정한, 특정 직원의 휴가 승인 권한을 가진 직원 |
| **반차** | 0.5일 단위 휴가 (오전/오후) |
| **시간 휴가** | 1시간 단위 휴가 (1일 = 8시간) |
| **연차촉진제** | 미사용 연차 소멸 6개월·2개월 전 사용 촉구 후 수당 지급 의무 면제 제도 |
| **신청 취소 (v1.1)** | 신청자 본인이 휴가 신청을 철회하는 행위. 승인 전/후 상태에 따라 처리 흐름이 다름 |

---

## 2. 페이지 목록 및 사용자 흐름

### 2.1 페이지 목록

| 경로 | 페이지명 | 설명 | 인증 | 접근 권한 | 모바일 지원 |
|------|---------|------|------|----------|-----------|
| `/login` | 로그인 | 이메일+비밀번호 로그인 | ❌ | 비로그인 | ✅ |
| `/reset-password` | 비밀번호 재설정 | 이메일 링크 기반 재설정 | ❌ | 비로그인 | ✅ |
| `/dashboard` | 대시보드 | 역할별 맞춤 홈 | ✅ | 전체 | ✅ |
| `/profile` | 내 인사정보 | 본인 정보 조회/일부 수정 | ✅ | 전체 | ✅ (조회) |
| `/profile/edit` | 내 정보 수정 | 연락처 등 본인 수정 가능 항목 편집 | ✅ | 전체 | ✅ |
| `/leave` | 휴가 관리 (메인) | 본인 잔여연차, 신청 내역, 캘린더 뷰 | ✅ | 전체 | ✅ |
| `/leave/request` | 휴가 신청 | 휴가 신청 폼 | ✅ | 전체 | ✅ |
| `/leave/history` | 휴가 이력 | 본인 휴가 사용 이력 + **취소 버튼 (v1.1)** | ✅ | 전체 | ✅ |
| `/approvals` | 결재함 | 부하직원 휴가 승인 대기/처리 내역 | ✅ | manager, admin | ✅ **(중요)** |
| `/team` | 우리 팀 | 부하직원 목록 및 정보 조회 | ✅ | manager, admin | ✅ |
| `/team/[employeeId]` | 부하직원 상세 | 특정 부하직원 인사정보 조회 | ✅ | manager(지정된 부하만), admin | ✅ (조회) |
| `/admin/employees` | 직원 관리 | 전사 직원 목록 (CRUD) | ✅ | admin | ✅ (조회 중심) |
| `/admin/employees/new` | 직원 등록 | 신규 직원 등록 | ✅ | admin | ⚠️ PC 권장 |
| `/admin/employees/[id]` | 직원 상세 (관리자) | 모든 필드 편집 가능 | ✅ | admin | ✅ (필드별 단계 편집) |
| `/admin/organization` | 조직 관리 | 부서 관리, 상급자 지정 | ✅ | admin | ⚠️ PC 권장 (드래그앤드롭) |
| `/admin/leave-policy` | 휴가 정책 | 연차 산정 기준일, 가산 정책 등 설정 | ✅ | admin | ✅ |
| `/admin/leave-overview` | 휴가 현황 | 부서별/월별 휴가 사용 통계 | ✅ | admin | ✅ |
| `/admin/settings` | 시스템 설정 | 회사 정보, 이메일 템플릿 등 | ✅ | admin | ✅ |

> **모바일 지원 원칙 (v1.1)**: 출장·외근 중에도 결재·승인·정보 조회는 모바일에서 무리 없이 가능해야 한다. 대용량 입력(신규 직원 등록 폼 전체, 조직도 드래그앤드롭)만 데스크탑 권장 배너 표시.

### 2.2 핵심 사용자 흐름

#### Flow A: 휴가 신청 → 승인 → (선택) 취소

```
[직원] /leave/request
    ↓ (휴가 유형, 시작/종료일, 사유 입력)
    ↓ 클라이언트: 잔여 연차 검증, 중복 일자 검증
    ↓ 서버: Zod 스키마 검증 → leave_requests INSERT (status: pending)
    ↓ 이메일: 상급자에게 "휴가 승인 요청" 발송 (Resend)
    ↓
[상급자] 이메일 클릭 → /approvals (모바일 가능)
    ↓ 승인 또는 반려 + 코멘트
    ↓ 서버: leave_requests UPDATE (status: approved/rejected)
    ↓ 승인 시: leave_balances 자동 차감 (트랜잭션)
    ↓ 이메일: 신청자에게 결과 메일 발송
    ↓
[직원] /leave/history에서 결과 확인
    ↓ (필요 시) 취소 버튼 클릭 — Flow A-1로 이어짐
```

#### Flow A-1: 휴가 신청 취소 (v1.1 신규)

신청 상태에 따라 처리 흐름이 분기된다:

```
[직원] /leave/history에서 [취소] 버튼 클릭
    ↓
신청 상태 분기
    ├─ status = 'pending' (승인 전)
    │   → 즉시 status = 'cancelled' 업데이트
    │   → pending_days 환원
    │   → 상급자에게 "신청 취소" 알림 메일 발송
    │
    ├─ status = 'approved' (승인 후, 휴가 시작일 이전)
    │   → 즉시 status = 'cancelled' 업데이트
    │   → used_days 환원 (트랜잭션, leave_transactions 기록)
    │   → 상급자에게 "승인된 휴가 취소" 알림 메일 발송
    │
    ├─ status = 'approved' (휴가 시작일 이후)
    │   → 취소 버튼 비활성화 (사후 취소 불가)
    │   → 안내 메시지: "이미 사용 중이거나 종료된 휴가는 취소할 수 없습니다. 관리자에게 문의하세요."
    │
    └─ status = 'rejected' | 'cancelled'
        → 취소 버튼 미노출
```

**상급자 변경 시 처리 (v1.1)**:
- 기존 휴가 신청(`pending`, `approved`)은 **승인 정보 그대로 유지** (`approver_id` 보존)
- 신규 신청부터 새 상급자에게 라우팅
- 단, 신청자가 원치 않으면 `/leave/history`에서 본인이 취소 후 재신청 가능

#### Flow B: 신규 직원 등록 (관리자)

```
[관리자] /admin/employees/new (PC 권장 — 모바일 접근 시 안내 배너)
    ↓ 기본 정보 입력 (이름, 이메일, 입사일, 부서, 고용형태 등)
    ↓ 서버: Supabase Auth에 계정 생성 (초대 이메일 발송) + employees 테이블 INSERT
    ↓ 연차 자동 계산: leave_policy 기반으로 leave_balances 초기값 생성
    ↓ 신규 직원에게 비밀번호 설정 링크 이메일 발송
```

#### Flow C: 상급자 지정 (관리자)

```
[관리자] /admin/organization (PC 권장 — 드래그앤드롭 UX)
    ↓ 직원 선택 → 상급자 드래그앤드롭 또는 선택
    ↓ 서버: employees.manager_id UPDATE
    ↓ 진행 중인 휴가 신청 처리: 기존 승인 그대로 유지 (v1.1)
    ↓ 상급자의 RLS 정책에 의해 즉시 부하직원 정보 열람 가능
    ↓ 변경 이력은 hrm_audit_logs에 기록
```

#### Flow D: 퇴사 처리 (v1.1 명시)

```
[관리자] /admin/employees/[id]
    ↓ 퇴사일 입력, employment_status = 'resigned' 변경
    ↓ Supabase Auth 계정: 비활성화(로그인 차단) — 단, 데이터는 그대로 보존
    ↓ 진행 중인 휴가 신청: 자동 취소 (system_cancelled)
    ↓ 부하직원 보유 시: 해당 직원들의 manager_id 자동 NULL → admin이 재지정 필요 (대시보드 알림)
    ↓ 데이터 보존: 인사정보·휴가 이력 모두 그대로 유지 (별도 파기 정책 없음)
```

#### 인증/권한 분기 조건

```
요청 도착
    ↓
세션 확인 (Supabase Auth)
    ├─ 비로그인 → /login 리디렉션
    └─ 로그인됨
        ↓
        employment_status 확인
            ├─ 'resigned' → 로그인 차단 (별도 안내 페이지)
            └─ 'active' | 'on_leave'
                ↓
                역할 확인 (employees.role)
                    ├─ employee → /admin/*, /approvals, /team/* 차단
                    ├─ manager → /admin/* 차단, /team/[id]는 지정된 부하만 접근
                    └─ admin → 전체 접근
```

### 2.3 LLM 판단 영역 vs 코드 처리 영역

| 코드(스크립트)로 처리 | 에이전트(LLM)가 직접 결정 |
|---------------------|------------------------|
| 연차 자동 산정 로직 (결정론적 계산) | 연차 산정 정책 옵션 설계 (회계연도 vs 입사일 기준 토글) |
| Supabase 마이그레이션 SQL 생성 | 스키마 설계 (테이블 분리, 정규화 수준) |
| RLS 정책 SQL 작성 | RLS 정책 설계 (어떤 컬럼·역할 분기) |
| Route Handler 보일러플레이트 | API 응답 구조 설계 (에러 코드, 응답 포맷) |
| TypeScript 타입 생성 (Supabase CLI) | 도메인 타입 정의 (`LeaveType`, `EmployeeStatus` 등 enum) |
| 이메일 템플릿 렌더링 | 이메일 카피 및 톤 작성 |
| 폼 검증 스키마 (Zod) | 검증 규칙 결정 (필수/선택 필드 분류) |
| 취소 가능 여부 판정 (날짜·상태 비교) | 취소 가능 시나리오 정의 (v1.1) |
| 모바일 레이아웃 분기 (반응형 CSS) | 모바일 모드 UI 패턴 결정 (v1.1) |

---

## 3. 데이터 모델 (Supabase)

### 3.1 테이블 목록

| 테이블명 | 설명 | RLS | 비고 |
|---------|------|-----|------|
| `hrm_employees` | 직원 마스터 (인사 핵심 정보) | ✅ | Supabase Auth 사용자와 1:1, 퇴사자도 그대로 보존 |
| `hrm_departments` | 부서 정보 | ✅ | self-referencing (상위 부서) |
| `hrm_employee_education` | 학력 정보 (1:N) | ✅ | 빈 허용 |
| `hrm_employee_career` | 경력 정보 (1:N) | ✅ | 빈 허용 |
| `hrm_employee_certifications` | 자격증/교육 이력 (1:N) | ✅ | 빈 허용 |
| `hrm_employee_family` | 가족사항 (1:N) | ✅ | 빈 허용, 연말정산용 |
| `hrm_employee_documents` | 첨부파일 (계약서 등) | ✅ | Supabase Storage 연계 |
| `hrm_employee_compensation` | 급여 정보 (별도 권한) | ✅ | admin 전용 RLS |
| `hrm_leave_policies` | 회사 휴가 정책 | ✅ | admin 수정, 전체 읽기 |
| `hrm_leave_types` | 휴가 유형 마스터 | ✅ | seed 데이터 |
| `hrm_leave_balances` | 직원별 연차 잔여 | ✅ | 연도별 row |
| `hrm_leave_requests` | 휴가 신청 내역 | ✅ | `cancelled` 상태 포함 |
| `hrm_leave_transactions` | 연차 변동 이력 (감사 로그) | ✅ | 차감/적립/조정/취소 환원 기록 |
| `hrm_audit_logs` | 인사정보 수정 이력 | ✅ | admin 조회 전용 |
| `hrm_email_logs` | 이메일 발송 로그 | ✅ | admin 조회 전용 |

> **테이블 접두사**: 다른 프로젝트와 Supabase 프로젝트 공유 시 충돌 방지를 위해 `hrm_` 접두사 사용.

### 3.2 주요 테이블 스키마 개요

#### `hrm_employees` (핵심 테이블)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK | Supabase Auth user.id와 동일 |
| `employee_no` | text | UNIQUE | 사번 |
| `email` | text | UNIQUE, NOT NULL | 로그인 이메일 |
| `name_ko` | text | NOT NULL | 한글 이름 |
| `name_en` | text | NULL | 영문명 |
| `role` | enum | NOT NULL | `employee` / `manager` / `admin` |
| `manager_id` | uuid | FK → employees.id | 상급자 (NULL 가능) |
| `department_id` | uuid | FK → departments.id | 부서 |
| `position` | text | NULL | 직급 |
| `job_title` | text | NULL | 직책 |
| `employment_type` | enum | NOT NULL | `regular` / `contract` / `intern` / `part_time` |
| `employment_status` | enum | NOT NULL | `active` / `on_leave` / `resigned` |
| `hire_date` | date | NOT NULL | 입사일 |
| `resignation_date` | date | NULL | 퇴사일 (퇴사자도 row 유지) |
| `birth_date` | date | NULL | 생년월일 |
| `gender` | enum | NULL | `male` / `female` / `other` |
| `phone` | text | NULL | 휴대폰 |
| `address` | text | NULL | 주소 |
| `emergency_contact_name` | text | NULL | 비상연락처 이름 |
| `emergency_contact_phone` | text | NULL | 비상연락처 번호 |
| `emergency_contact_relation` | text | NULL | 관계 |
| `profile_image_url` | text | NULL | Supabase Storage URL |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

> **개인정보보호법 고려**: 주민번호는 저장하지 않음. 생년월일만 저장.
> **v1.1**: 퇴사자(`employment_status='resigned'`)도 같은 테이블에 그대로 보존. 별도 아카이브 테이블/파기 정책 없음. 단, Auth 계정은 비활성화하여 로그인 차단.

#### `hrm_leave_requests`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `employee_id` | uuid | FK |
| `leave_type_id` | uuid | FK → leave_types |
| `start_date` | date | 시작일 |
| `end_date` | date | 종료일 |
| `start_period` | enum | `full_day` / `am_half` / `pm_half` / `hourly` |
| `end_period` | enum | 동일 |
| `total_days` | numeric(5,1) | 차감 일수 (자동 계산) |
| `reason` | text | 사유 |
| `status` | enum | `pending` / `approved` / `rejected` / `cancelled` / `system_cancelled` |
| `approver_id` | uuid | FK → employees.id (승인자, 상급자 변경 후에도 유지) |
| `approved_at` | timestamptz | |
| `rejection_reason` | text | NULL |
| `cancellation_reason` | text | NULL (v1.1) — 취소 시 신청자가 입력 가능 |
| `cancelled_at` | timestamptz | NULL (v1.1) |
| `cancelled_by` | uuid | NULL (v1.1) — 신청자 자신 또는 system |
| `created_at` | timestamptz | |

> **v1.1 status 확장**:
> - `cancelled`: 신청자 본인이 취소
> - `system_cancelled`: 신청자 퇴사 등으로 시스템이 자동 취소

#### `hrm_leave_transactions` (감사 로그)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `employee_id` | uuid | FK |
| `transaction_type` | enum | `grant` / `deduct` / `refund` / `adjust` / `expire` |
| `days` | numeric(5,1) | 변동량 (+/-) |
| `related_request_id` | uuid | NULL — leave_requests.id (취소 환원 추적용) |
| `reason` | text | "휴가 신청 취소로 환원" 등 |
| `performed_by` | uuid | 수행 주체 |
| `created_at` | timestamptz | |

> **v1.1**: 취소 시 `transaction_type='refund'`로 환원 이력 명확히 기록.

### 3.3 주요 관계 (ERD 개요)

```
hrm_departments (1) ─── (N) hrm_employees
                              │
                              ├── (N) hrm_employee_education
                              ├── (N) hrm_employee_career
                              ├── (N) hrm_employee_certifications
                              ├── (N) hrm_employee_family
                              ├── (N) hrm_employee_documents
                              ├── (1) hrm_employee_compensation (admin only)
                              ├── (N) hrm_leave_balances (연도별)
                              └── (N) hrm_leave_requests
                                       │
                                       └── (N) hrm_leave_transactions

hrm_employees.manager_id ─── self FK (self-referencing)
hrm_leave_policies (1 row, 회사 전체 정책)
hrm_leave_types (master data)
```

### 3.4 RLS 정책 설계 개요

| 테이블 | SELECT 정책 | INSERT/UPDATE 정책 |
|--------|-----------|-------------------|
| `hrm_employees` | 본인 OR `manager_id = auth.uid()` OR role=admin | admin만 (본인은 일부 필드만 UPDATE) |
| `hrm_leave_requests` | 본인 OR 상급자 OR admin | 본인(생성·취소), 상급자/admin(승인·반려) |
| `hrm_leave_balances` | 본인 OR 상급자 OR admin | admin만 (시스템 트리거 제외) |
| `hrm_employee_compensation` | admin만 | admin만 |
| `hrm_audit_logs` | admin만 | 트리거에 의한 자동 생성 |

> 핵심 보조 함수: `is_admin()`, `is_manager_of(employee_id uuid)`, **`can_cancel_request(request_id uuid)` (v1.1)** — Postgres function으로 정의해 정책에서 재사용.

### 3.5 실시간 구독 대상

- `hrm_leave_requests` — 상급자가 결재함을 열고 있을 때 새 신청 / 취소 알림 즉시 반영
- `hrm_audit_logs` — 관리자 대시보드 활동 로그 실시간 표시 (선택)

### 3.6 Supabase Storage 버킷

| 버킷 | 용도 | 접근 정책 |
|------|------|----------|
| `profile-images` | 직원 프로필 사진 | 본인 업로드, 인증 사용자 조회 |
| `employee-documents` | 계약서, 신분증 사본 등 | admin만 조회/업로드 |

### 3.7 연차 자동 산정 로직 (핵심)

한국 근로기준법 제60조 기반:

| 조건 | 부여 일수 |
|------|----------|
| 입사 후 1년 미만, 월 개근 | 1개월당 1일 (최대 11일) |
| 1년 이상, 전년 출근율 80% 이상 | 15일 |
| 3년 이상 계속 근로 | 15 + (근속연수-1)/2 (소수점 버림) — 최대 25일 |

- **기준 방식 옵션**: `hrm_leave_policies.basis = 'hire_date' | 'fiscal_year'` (관리자가 회사 정책에 맞게 선택)
- **fiscal_year 모드**: 매년 1월 1일 일괄 부여, 입사 1년 미만 직원은 비례 계산 `15 * 전년 재직일수 / 365`
- **자동 산정 + 수동 조정**: `granted_days`는 자동 계산, `adjusted_days`로 관리자가 ± 조정 가능
- **소멸 처리**: 발생일+1년 경과 시 소멸. 야간 cron(Vercel Cron)으로 일일 점검
- **취소 환원 (v1.1)**: 승인된 휴가 취소 시 `used_days`에서 환원, `leave_transactions`에 `refund` 기록

---

## 4. UI/UX 설계 방향

### 4.1 디자인 컨셉 및 톤

**클린 코퍼레이트 (Clean Corporate)** — 신뢰감, 가독성, 매일 사용해도 피로하지 않은 밝은 톤.

근거: 인사 시스템은 직원 전체가 매일 접속하는 도구이며, 정확성과 신뢰감이 가장 중요하다. 다크 테크는 개발자/금융 도구에는 적합하나 일반 직원의 휴가 신청 같은 일상적 업무에는 부담스러울 수 있다.

핵심 미감:
- 충분한 여백 (8px 그리드 시스템)
- 카드 기반 정보 그루핑 (얕은 그림자, border 위주)
- 차분한 블루 계열 메인 컬러 + 강조 컬러 분리
- 산세리프 폰트 (Pretendard) — 한글 가독성 최적화

### 4.2 컬러 토큰 시스템

```css
/* Light mode (기본) */
--background: #FAFBFC;
--foreground: #1A1D24;
--card: #FFFFFF;
--card-foreground: #1A1D24;
--primary: #2563EB;            /* 신뢰의 블루 */
--primary-foreground: #FFFFFF;
--secondary: #F1F5F9;
--accent: #0EA5E9;             /* 보조 강조 */
--muted: #F8FAFC;
--muted-foreground: #64748B;
--border: #E2E8F0;
--success: #10B981;            /* 휴가 승인 */
--warning: #F59E0B;            /* 승인 대기 */
--destructive: #EF4444;        /* 반려/삭제/취소 */

/* Dark mode (옵션 — v2.0에서 추가) */
```

### 4.3 핵심 컴포넌트 목록 및 역할

| 컴포넌트 | 역할 | 주 사용 페이지 | 모바일 대응 |
|---------|------|--------------|-----------|
| `AppShell` | 사이드바 + 헤더 레이아웃 | 전체 인증 페이지 | 햄버거 + 하단 탭 |
| `Sidebar` | 역할별 메뉴 동적 렌더링 | AppShell 내부 | 모바일에서 Drawer |
| `MobileBottomNav` (v1.1 신규) | 모바일 전용 하단 탭 (홈/휴가/결재/내정보) | 모바일 < 768px | 핵심 |
| `EmployeeCard` | 직원 정보 카드 | 팀 페이지, 검색 결과 | 1열 |
| `EmployeeFormSection` | 인사정보 카테고리별 폼 섹션 | 직원 등록/수정 | 탭 분리 |
| `LeaveCalendar` | 휴가 캘린더 (월별 뷰) | /leave, /admin/leave-overview | 주간 뷰로 전환 |
| `LeaveRequestForm` | 휴가 신청 폼 (날짜+반차 선택) | /leave/request | 풀스크린 |
| `LeaveBalanceCard` | 잔여 연차 시각화 | /dashboard, /leave | 1열 |
| `ApprovalCard` (v1.1 신규) | 결재 카드형 UI | /approvals 모바일 | 모바일 결재 UX |
| `ApprovalTable` | 승인 대기/처리 테이블 | /approvals 데스크탑 | - |
| `OrgTreeView` | 조직도 트리 시각화 | /admin/organization | PC 권장 안내 |
| `AuditTimeline` | 변경 이력 타임라인 | /admin/employees/[id] | 1열 |
| `CancelLeaveDialog` (v1.1 신규) | 휴가 취소 확인 다이얼로그 | /leave/history | 풀스크린 Sheet |
| `MobileWarningBanner` (v1.1 신규) | "PC에서 사용 권장" 배너 | 등록 폼, 조직도 | 모바일 < 768px |
| `EmptyState` | 빈 데이터 상태 UI | 전체 | 그대로 |
| `ConfirmDialog` | 삭제 등 위험 작업 확인 | 전체 | Sheet 사용 |

### 4.4 TweakCN 활용 방향

shadcn/ui 기본 컴포넌트를 TweakCN으로 다음과 같이 커스터마이징:

| 기본 컴포넌트 | 커스터마이징 방향 |
|-------------|----------------|
| `Button` | 라운딩 `md` (8px), 폰트 weight 500, primary는 약간 진한 블루, 모바일에서 최소 터치 영역 44px |
| `Card` | border 1px solid `--border`, 그림자 최소화(`shadow-sm`만), padding 24px(데스크탑)/16px(모바일) |
| `Input` | height 40px(데스크탑)/48px(모바일), border 색상 hover/focus 시 primary, 에러 시 destructive |
| `Table` | 헤더 배경 `--muted`, row hover, 셀 padding 12px 16px. **모바일에서는 카드 뷰로 자동 전환** |
| `Badge` | 휴가 상태별 색상 (pending=warning, approved=success, rejected=destructive, cancelled=muted) |
| `Sheet` | 모바일에서 풀스크린 슬라이드 (휴가 신청, 직원 상세 편집) |
| `Dialog` | 데스크탑 중앙 모달, 모바일은 Sheet로 자동 전환 (`responsive` variant) |
| `Calendar` | 한국어 로케일, 휴가일 색상 마킹, 공휴일 표시 |
| `DataTable` | shadcn/ui 공식 DataTable + 컬럼 토글, CSV export 버튼, 모바일 카드 뷰 전환 |
| `Toast` (Sonner) | 우상단 위치(데스크탑) / 상단 풀폭(모바일), 4초 자동 닫힘 |
| `Tabs` | 인사정보 카테고리 분류 (기본/학력/경력/가족/문서) |
| `DropdownMenu` | 모바일에서는 ActionSheet 패턴으로 자동 전환 |

### 4.5 반응형 브레이크포인트 전략 (v1.1 대폭 변경)

데스크탑 우선이되, **모든 페이지가 모바일에서 동작 가능**해야 한다. 일부 대용량 입력 페이지만 PC 권장 안내.

| 브레이크포인트 | 너비 | 전략 |
|-------------|-----|------|
| `desktop` (기본) | 1280px+ | 사이드바 고정 + 메인 영역, 모든 기능 풀 UX |
| `laptop` | 1024-1279px | 사이드바 축소 가능(아이콘만), 테이블 가로 스크롤 허용 |
| `tablet` | 768-1023px | 사이드바 햄버거 메뉴, 카드 2열 → 1열, 일부 테이블 카드 전환 |
| `mobile` | <768px | **하단 탭 내비게이션 활성화**, 테이블 → 카드 뷰, Dialog → Sheet 자동 전환, 일부 페이지는 "PC 권장" 배너 표시 |

#### 모바일 우선 처리 페이지 (v1.1 핵심)

다음 페이지는 모바일에서도 풀 기능 사용 가능해야 한다:

| 페이지 | 모바일 핵심 UX |
|-------|--------------|
| `/dashboard` | 잔여연차 카드, 결재 대기 건수, 최근 활동 — 모바일 1열 스택 |
| `/approvals` | **카드형 결재 UI**, 한 카드당 [승인]/[반려] 큰 버튼, 스와이프 인터랙션 고려 |
| `/leave/request` | 풀스크린 Sheet, 단계별 입력(날짜→유형→사유) |
| `/leave/history` | 카드 리스트 + 취소 버튼 |
| `/admin/leave-overview` | 차트 → 모바일에서 세로 스택 + 스크롤 |
| `/team` | 부하직원 카드 그리드 → 1열 |
| `/admin/employees` | 직원 카드 리스트 + 검색·필터 sticky |

#### PC 권장 페이지 (모바일 접근 시 배너)

| 페이지 | PC 권장 사유 |
|-------|-----------|
| `/admin/employees/new` | 13개 카테고리 폼 — 입력 효율을 위해 |
| `/admin/organization` | 드래그앤드롭 조직도 — 모바일에서 조작 어려움 |

> 위 두 페이지도 모바일에서 **접근은 가능**하되 상단에 `MobileWarningBanner`로 PC 권장 안내. 긴급한 경우 모바일에서도 등록·수정 가능하도록 폼은 작동시킨다.

### 4.6 애니메이션·인터랙션 방향

- **과한 모션 지양**: 모든 트랜지션 200ms 이내, 컬러/배경 위주
- 페이지 전환: 페이드 인 (Next.js loading.tsx + skeleton)
- 캘린더 휴가일 hover 시 디테일 툴팁 (모바일은 탭)
- 폼 제출 시 버튼 로딩 스피너 (lucide-react `Loader2`)
- 토스트 알림으로 모든 성공/실패 피드백 (Sonner)
- 결재함의 새 신청 도착 시 Supabase Realtime + 차분한 펄스 효과
- **모바일 결재 카드 스와이프 (v1.1)**: 좌→우 스와이프 = 승인, 우→좌 = 반려 (탭 시 코멘트 입력 Sheet) — 단, 명시적 버튼도 함께 제공

---

## 5. 구현 스펙

### 5.1 폴더 구조

```
/hrm-app
  ├── CLAUDE.md                                # 메인 에이전트 지침 (구현 시 작성)
  ├── .claude/
  │   ├── skills/
  │   │   ├── supabase-schema-gen/             # 마이그레이션 SQL 생성
  │   │   ├── annual-leave-calculator/         # 연차 자동 산정 로직
  │   │   ├── email-template-renderer/         # Resend 이메일 템플릿
  │   │   ├── rls-policy-builder/              # RLS 정책 작성 도우미
  │   │   ├── tweakcn-component-customizer/    # TweakCN 토큰 적용
  │   │   ├── leave-cancellation-handler/      # v1.1 — 취소 시나리오 처리
  │   │   ├── mobile-responsive-checker/       # v1.1 — 모바일 레이아웃 검증
  │   │   ├── csv-exporter/                    # v1.1 — 민감정보 마스킹 CSV
  │   │   └── korean-holidays/                 # 공휴일 데이터
  │   └── agents/
  │       ├── db-architect/AGENT.md
  │       ├── ui-builder/AGENT.md
  │       └── api-designer/AGENT.md
  ├── app/
  │   ├── (auth)/                              # 인증 라우트 그룹
  │   │   ├── login/page.tsx
  │   │   └── reset-password/page.tsx
  │   ├── (app)/                               # 인증 후 라우트 그룹 (AppShell)
  │   │   ├── layout.tsx                       # AppShell + 권한 가드 + 모바일 하단 탭
  │   │   ├── dashboard/page.tsx
  │   │   ├── profile/
  │   │   │   ├── page.tsx
  │   │   │   └── edit/page.tsx
  │   │   ├── leave/
  │   │   │   ├── page.tsx
  │   │   │   ├── request/page.tsx
  │   │   │   └── history/page.tsx              # 취소 기능 포함
  │   │   ├── approvals/page.tsx               # 카드/테이블 반응형
  │   │   ├── team/
  │   │   │   ├── page.tsx
  │   │   │   └── [employeeId]/page.tsx
  │   │   └── admin/
  │   │       ├── layout.tsx
  │   │       ├── employees/
  │   │       │   ├── page.tsx
  │   │       │   ├── new/page.tsx              # PC 권장 배너
  │   │       │   └── [id]/page.tsx
  │   │       ├── organization/page.tsx         # PC 권장 배너
  │   │       ├── leave-policy/page.tsx
  │   │       ├── leave-overview/page.tsx
  │   │       └── settings/page.tsx
  │   ├── api/
  │   │   ├── leave/
  │   │   │   ├── request/route.ts             # POST 휴가 신청
  │   │   │   ├── approve/route.ts             # POST 승인/반려
  │   │   │   └── cancel/route.ts              # v1.1 — POST 취소
  │   │   ├── employees/route.ts
  │   │   ├── employees/[id]/route.ts
  │   │   ├── exports/
  │   │   │   └── leave-csv/route.ts           # v1.1 — CSV (민감정보 제외)
  │   │   ├── cron/
  │   │   │   ├── annual-leave-grant/route.ts
  │   │   │   └── leave-expiration/route.ts
  │   │   └── webhooks/resend/route.ts
  │   ├── layout.tsx                           # 루트 레이아웃 (Pretendard, Toaster)
  │   └── globals.css                          # TweakCN 토큰
  ├── components/
  │   ├── ui/                                  # TweakCN 커스텀된 shadcn 기본
  │   ├── app-shell/
  │   │   ├── sidebar.tsx
  │   │   ├── header.tsx
  │   │   ├── mobile-bottom-nav.tsx            # v1.1 신규
  │   │   ├── mobile-warning-banner.tsx        # v1.1 신규
  │   │   └── user-menu.tsx
  │   ├── employee/
  │   ├── leave/
  │   │   ├── leave-calendar.tsx
  │   │   ├── leave-request-form.tsx
  │   │   ├── leave-balance-card.tsx
  │   │   ├── approval-table.tsx               # 데스크탑
  │   │   ├── approval-card.tsx                # v1.1 — 모바일
  │   │   └── cancel-leave-dialog.tsx          # v1.1 신규
  │   ├── admin/
  │   └── common/
  ├── lib/
  │   ├── supabase/
  │   │   ├── client.ts
  │   │   ├── server.ts
  │   │   ├── middleware.ts
  │   │   └── queries/
  │   │       ├── employees.ts
  │   │       ├── leaves.ts
  │   │       └── departments.ts
  │   ├── auth/
  │   │   ├── guards.ts
  │   │   └── permissions.ts
  │   ├── leave/
  │   │   ├── calculator.ts
  │   │   ├── cancellation.ts                   # v1.1 — 취소 가능 여부 판정
  │   │   └── holidays.ts
  │   ├── email/
  │   │   ├── send.ts
  │   │   └── templates/                        # 신청/승인/반려/취소 알림
  │   ├── export/
  │   │   └── csv.ts                            # v1.1 — 민감정보 필터링 포함
  │   ├── validations/
  │   └── utils/
  │       ├── date.ts
  │       ├── format.ts
  │       └── use-media-query.ts                # v1.1 — 반응형 훅
  ├── types/
  ├── supabase/
  │   ├── migrations/
  │   ├── seed.sql
  │   └── functions/
  ├── public/
  ├── output/
  ├── docs/
  │   ├── references/
  │   └── domain/
  │       ├── schema.md
  │       ├── permissions-matrix.md
  │       ├── leave-calculation-rules.md
  │       ├── leave-cancellation-rules.md       # v1.1 신규
  │       ├── mobile-ux-spec.md                 # v1.1 신규
  │       ├── csv-export-policy.md              # v1.1 신규
  │       └── email-templates.md
  ├── .env.local.example
  ├── next.config.ts
  ├── tsconfig.json
  ├── components.json
  └── package.json
```

### 5.2 CLAUDE.md 핵심 섹션 목록 (구현 단계에서 작성)

1. 프로젝트 개요 및 기술 스택
2. 폴더 구조 안내 및 명명 규칙
3. 서브에이전트 호출 규칙
4. 코딩 컨벤션 (TypeScript strict, 함수형, Server Component 우선)
5. Supabase 사용 가이드라인
6. TweakCN 토큰 사용 규칙
7. **모바일 우선 컴포넌트 작성 규칙 (v1.1)** — Dialog는 Sheet로 자동 전환, 테이블은 카드 뷰 전환 패턴 명시
8. 검증 규칙
9. 환경변수 및 시크릿 관리
10. 작업 흐름: 신규 페이지 생성 시 체크리스트 (모바일 검증 포함)

### 5.3 에이전트 구조

**서브에이전트 분리 채택**

| 서브에이전트 | 역할 | 트리거 조건 | 입력 | 출력 |
|------------|------|-----------|------|------|
| `db-architect` | Supabase 스키마, 마이그레이션 SQL, RLS 정책 | 신규 테이블 / 컬럼 추가 / 정책 변경 시 | 변경 요구사항, 기존 스키마 | `supabase/migrations/*.sql`, `types/database.types.ts` |
| `ui-builder` | 페이지·컴포넌트 구현, TweakCN 커스터마이징, **모바일 반응형 대응 (v1.1)** | 새 페이지/컴포넌트 생성 시 | 페이지 사양, 컴포넌트 목록 | `app/**/page.tsx`, `components/**` |
| `api-designer` | Route Handler, Server Action, 이메일 발송, **CSV 익스포트 (v1.1)** | 백엔드 로직 추가 시 | API 사양, 검증 규칙 | `app/api/**`, `lib/**/queries`, Zod 스키마 |

**오케스트레이션 규칙**:
- 메인 에이전트(CLAUDE.md)가 작업을 분해해 적절한 서브에이전트 호출
- 서브에이전트 간 직접 호출 금지 → 모든 정보 교환은 메인을 거치거나 `/output/` 파일을 통해
- **모바일 반응형은 `ui-builder`의 책임 (v1.1)** — 모든 페이지 생성 시 데스크탑/모바일 두 가지 레이아웃 동시 고려 의무화

### 5.4 스킬 목록

| 스킬명 | 역할 | 트리거 조건 |
|-------|------|----------|
| `supabase-schema-gen` | 테이블/컬럼 정의 → 마이그레이션 SQL 생성 | 스키마 변경 시 |
| `annual-leave-calculator` | 입사일·정책 기반 연차 일수 계산 | 직원 등록·연도 전환·정책 변경 시 |
| `leave-cancellation-handler` (v1.1) | 휴가 취소 가능 여부 판정 + 환원 처리 트랜잭션 | 취소 API 작성 시 |
| `email-template-renderer` | React Email 템플릿 + 변수 바인딩 | 이메일 발송 로직 작성 시 |
| `rls-policy-builder` | 역할별 RLS SQL 생성 | 신규 테이블 추가 시 |
| `tweakcn-component-customizer` | shadcn 컴포넌트에 토큰·variant 적용 | 신규 UI 컴포넌트 작성 시 |
| `mobile-responsive-checker` (v1.1) | 페이지 모바일 렌더링 점검, 터치 영역 검사 | 신규 페이지 완성 후 |
| `csv-exporter` (v1.1 강화) | 민감정보 필터링 + CSV 변환 | 관리자 데이터 내보내기 시 |
| `korean-holidays` | 한국 공휴일 데이터 제공 | 휴가 일수 계산, 캘린더 렌더링 시 |

### 5.5 CSV 내보내기 정책 (v1.1 신규)

`/docs/domain/csv-export-policy.md`에 상세 명시. 기본 원칙:

#### 내보내기 가능 항목 (안전)

| 카테고리 | 포함 컬럼 |
|---------|---------|
| 휴가 사용 내역 | 사번, 이름(한글), 부서, 직급, 휴가 유형, 시작일, 종료일, 일수, 상태, 신청일 |
| 잔여 연차 현황 | 사번, 이름, 부서, 부여일수, 사용일수, 잔여일수, 소멸예정일 |
| 부서별 통계 | 부서명, 인원수, 월별 휴가 사용일수 합계, 평균 사용률 |
| 출퇴근 통계 (향후) | 사번, 이름, 출근일수, 휴가일수 |

#### 내보내기 금지 항목 (민감정보)

다음 컬럼은 **CSV 어디에도 포함되지 않는다**:
- 주민등록번호 (저장 자체 안 함)
- 생년월일, 성별
- 휴대폰 번호, 주소, 비상연락처
- 가족사항
- 급여 정보 (`hrm_employee_compensation` 전체)
- 학력/경력 상세
- 첨부 문서 정보

#### 권한별 CSV 접근

| 역할 | 가능한 CSV |
|------|----------|
| `employee` | 본인 휴가 이력만 |
| `manager` | 본인 + 지정 부하직원의 휴가 이력 |
| `admin` | 전사 휴가 이력, 부서별 통계, 잔여 연차 현황 |

> CSV 다운로드 시 `hrm_audit_logs`에 누가 언제 어떤 범위를 내보냈는지 기록.

### 5.6 환경 변수

| 변수명 | 용도 | 노출 범위 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 (RLS 우회) | 서버만 |
| `RESEND_API_KEY` | 이메일 발송 | 서버만 |
| `RESEND_FROM_EMAIL` | 발신 이메일 주소 | 서버만 |
| `NEXT_PUBLIC_APP_URL` | 이메일 내 링크 생성용 | 클라이언트 |
| `CRON_SECRET` | Cron Job 인증 토큰 | 서버만 |

### 5.7 검증 패턴 적용

| 단계 | 성공 기준 | 검증 방법 | 실패 시 처리 |
|------|----------|----------|------------|
| 스키마 정의 | 마이그레이션 SQL이 Supabase에서 오류 없이 적용 | 규칙 기반 (`supabase db push`) | 자동 재시도 (3회) → 에스컬레이션 |
| 타입 정의 | TypeScript strict 컴파일 오류 0 | 규칙 기반 (`tsc --noEmit`) | 자동 재시도 |
| 폼 검증 | Zod 스키마 통과 | 타입/스키마 검증 | 사용자에게 에러 표시 |
| 휴가 일수 계산 | 단위 테스트 통과 (경계 조건 포함) | 규칙 기반 (Vitest) | 자동 재시도 |
| 휴가 취소 트랜잭션 (v1.1) | 환원 후 leave_balances 정합성 유지 | 단위 테스트 + 통합 테스트 | 트랜잭션 롤백 → 에스컬레이션 |
| RLS 정책 | 비권한 사용자 접근 차단 | 규칙 기반 (테스트 쿼리) | 에스컬레이션 (보안 이슈) |
| 데스크탑 UI 렌더링 | 1280px, 1440px에서 의도대로 표시 | LLM 자기 검증 + 사람 검토 | 폴백 UI |
| **모바일 UI 렌더링 (v1.1)** | 375px(iPhone SE), 390px(iPhone 14)에서 핵심 기능 동작 | `mobile-responsive-checker` 스킬 + 사람 검토 | 폴백 (PC 권장 배너) |
| 접근성 | Lighthouse Accessibility ≥ 90 (데스크탑·모바일 둘 다) | 규칙 기반 (Lighthouse CI) | 에스컬레이션 |
| 이메일 발송 | Resend API 200 응답, 발송 로그 기록 | 규칙 기반 | 자동 재시도 → 발송 실패 로그 |
| CSV 내보내기 (v1.1) | 민감정보 컬럼 미포함 검증 | 스냅샷 테스트 (금지 컬럼명 grep) | 빌드 차단 |

### 5.8 실패 처리 패턴 적용

| 영역 | 적용 패턴 |
|------|----------|
| 빌드/타입 오류 | 자동 재시도 (최대 3회) |
| 휴가 신청 시 잔여연차 부족 | 사용자에게 명확한 에러 + 신청 차단 |
| 휴가 취소 시도 — 휴가 시작일 경과 (v1.1) | 사용자에게 안내 + 관리자 문의 유도 |
| 이메일 발송 실패 | 자동 재시도 (지수 백오프) → 실패 시 admin에게 알림 + 로그 |
| 디자인 의사결정 모호 | 에스컬레이션 (사용자 확인) |
| 캘린더 렌더링 오류 | 폴백 UI (테이블 뷰) |
| 모바일 일부 컴포넌트 렌더링 실패 (v1.1) | 단순 뷰 폴백 + "PC 권장" 배너 |
| Supabase 일시적 장애 | 자동 재시도 + 로딩 상태 표시 |

---

## 6. 향후 확장 계획 (v2.0+ 디퍼)

- **근태 관리**: 출퇴근 기록, 출장 관리, 재택근무 신청
- **급여 명세서**: 월별 급여명세서 발급
- **인사평가/MBO**: 분기/연간 평가 워크플로
- **전자결재 확장**: 휴가 외 일반 품의서, 출장신청서
- **PWA / 네이티브 앱**: 모바일 알림 푸시
- **다국어**: 영문 지원
- **OAuth/SSO**: 구글 워크스페이스, Microsoft 365 연동
- **알림 채널 확장**: Slack, 카카오톡 알림톡 (v1.0은 이메일만)
- **인앱 알림**: 헤더 종 아이콘으로 결재 대기 표시
- **다크 모드**

---

## 7. 참고 자료

### 7.1 법규 및 도메인

- 근로기준법 제60조 (연차 유급휴가) — 국가법령정보센터
- 고용노동부 노동포털 연차 계산기 — https://labor.moel.go.kr/cmmt/calAnnlVctn.do
- 개인정보보호법 (인사정보 보유·파기 기준)

### 7.2 기술 문서

- Next.js 15 App Router — https://nextjs.org/docs
- Supabase (Auth, RLS, Storage) — https://supabase.com/docs
- TweakCN — https://tweakcn.com
- shadcn/ui — https://ui.shadcn.com
- Resend — https://resend.com/docs
- React Email — https://react.email
- Zod — https://zod.dev

### 7.3 벤치마킹

- Flex (flex.team) — 한국 HR SaaS UI 패턴
- 시프티 (shiftee.io) — 휴가 캘린더
- ZUZU HR — 연차 시뮬레이션
- 네이버웍스 근태 — 1년 미만 연차 옵션

### 7.4 디자인 레퍼런스

- Linear (linear.app) — 클린 코퍼레이트 톤
- Notion 워크스페이스 설정 — 폼 UX
- Vercel 대시보드 — 사이드바 + 메인 패턴

---

## 8. v1.1 변경사항 요약

| # | 변경 항목 | 영향받은 섹션 |
|---|---------|-------------|
| 1 | 휴가 신청 취소 기능 신설 (승인 전/후/시작일 이후 분기) | 2.2 Flow A-1, 3.2 `hrm_leave_requests`, 5.1 `/api/leave/cancel`, 스킬 `leave-cancellation-handler` |
| 2 | 퇴사자 정보 보관: 별도 파기 없이 그대로 보존, Auth만 비활성화 | 1.5 제약조건, 2.2 Flow D, 3.2 `hrm_employees` |
| 3 | **관리자 페이지 모바일 지원** — 결재·통계·정책 설정 모두 모바일 가능, 신규직원 등록과 조직도만 PC 권장 배너 | 1.5, 2.1, 4.3, 4.5, 5.1, 5.7 — **광범위 영향** |
| 4 | 알림 채널: 이메일만 (인앱 알림 v2.0 디퍼) | 1.3, 6 |
| 5 | CSV 내보내기 정책: 민감정보 제외, 휴가·통계만 | 1.4, 5.5 (신규 섹션) |

---

**문서 끝.** v1.1 확정 시 Claude Code 구현 단계 진입.
