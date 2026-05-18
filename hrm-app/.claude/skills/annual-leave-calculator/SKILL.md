---
name: annual-leave-calculator
description: 한국 근로기준법 제60조에 따라 직원의 연차 부여 일수를 계산하는 스킬. 입사일·정책(회계연도/입사일 기준)·현재 시점을 입력받아 부여 일수, 사용 가능 일수, 비례 계산을 산출한다.
---

# annual-leave-calculator

## 목적
입사일과 회사 정책에 따라 연차 부여 일수를 결정론적으로 계산한다.

## 입력
- `hireDate: Date` — 입사일
- `referenceDate: Date` — 기준 시점 (보통 오늘 또는 회계연도 시작일)
- `basis: 'hire_date' | 'fiscal_year'` — 회사 정책
- `fiscalYearStart?: { month: number; day: number }` — 회계연도 시작 (기본 1/1)

## 출력
```ts
{
  grantedDays: number;          // 부여 일수
  basisType: 'monthly' | 'annual' | 'tenured'; // 1년 미만 / 1년+ / 3년+
  nextAccrualDate: Date | null; // 다음 적립 예정일
  proratedFromHire: boolean;    // 비례 계산 적용 여부
  rationale: string;            // 사람이 읽을 수 있는 산정 근거
}
```

## 산정 규칙 (근로기준법 제60조)

### 1) 입사 후 1년 미만
- **매월 개근 시 1일** 부여 (최대 11일)
- 부여 시점: 입사일 기준 매월 같은 일자

### 2) 입사 1년 이상, 전년 출근율 80% 이상
- **연 15일** 부여

### 3) 입사 3년 이상 (계속 근로)
- `15 + floor((tenure_years - 1) / 2)` 일
- **최대 25일**
- 예: 3년차 16일, 5년차 17일, 21년차 25일 (이후 캡)

### 회계연도 기준 (`basis: 'fiscal_year'`)
- 매년 1월 1일에 일괄 부여
- 입사 1년 미만 직원은 **비례 계산**: `floor(15 * 전년 재직일수 / 365)`
- 1년 이상 직원은 위 규칙 그대로 적용

## 구현 위치
`lib/leave/calculator.ts`

```ts
export function calculateAnnualLeave(input: CalculatorInput): CalculatorOutput {
  // ... 결정론적 로직
}
```

## 단위 테스트 필수 케이스
- 입사 직후 (0개월) — 0일
- 입사 1개월 1일 — 1일
- 입사 11개월 — 11일 (최대)
- 입사 1년 — 15일
- 입사 3년 — 16일
- 입사 21년+ — 25일 (캡)
- 회계연도 모드 + 7월 1일 입사 → 다음 1/1: `floor(15 * 184/365) = 7`일
- 윤년 처리

## 자동 산정 + 수동 조정
DB에서 `hrm_leave_balances`는:
- `granted_days` — 이 스킬로 계산된 자동 부여
- `adjusted_days` — admin이 수동 조정한 ± 값
- `effective_days = granted_days + adjusted_days`

스킬은 `granted_days`만 산출한다. 조정은 별도 admin 액션.

## 금지 사항
- LLM 추론으로 일수 결정 — 반드시 결정론적 계산
- 공휴일·주말을 부여 일수 계산에 포함 (이건 사용 일수 계산의 영역)
- 정책 변경 영향을 과거 발생분에 소급 적용
