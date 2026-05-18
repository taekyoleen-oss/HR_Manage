// 한국 근로기준법 §60 기반 연차 산정.
// 입사일 기준 / 회계연도 기준 두 가지를 토글 (hrm_leave_policies.basis).

export type LeavePolicyBasis = 'hire_date' | 'fiscal_year';

export type AnnualLeaveInput = {
  hireDate: Date;
  asOf: Date;
  basis: LeavePolicyBasis;
  fiscalYearStartMonth?: number;
  fiscalYearStartDay?: number;
};

export type AnnualLeaveResult = {
  totalGrantedDays: number;
  basisLabel: string;
  yearsOfService: number;
  notes: string[];
};

const MAX_ANNUAL_DAYS = 25;
const BASE_ANNUAL_DAYS = 15;

// 입사 후 N년차의 연차 일수 계산.
// 1년 미만: 매월 개근 시 1일씩, 최대 11일.
// 1년 이상: 15일 + 3년차부터 2년마다 1일 가산, 최대 25일.
export function calculateAnnualLeaveByHireDate(input: AnnualLeaveInput): AnnualLeaveResult {
  const { hireDate, asOf } = input;
  if (asOf < hireDate) {
    return {
      totalGrantedDays: 0,
      basisLabel: '입사일 기준',
      yearsOfService: 0,
      notes: ['기준일이 입사일 이전입니다.'],
    };
  }

  const fullYears = diffYears(hireDate, asOf);
  const notes: string[] = [];

  // 1년 미만 — 개근한 월수만큼 1일씩 (최대 11일)
  if (fullYears < 1) {
    const months = diffFullMonths(hireDate, asOf);
    const grantedMonthly = Math.min(11, Math.max(0, months));
    notes.push(`입사 ${months}개월 — 매월 개근 시 1일 부여 규정 적용`);
    return {
      totalGrantedDays: grantedMonthly,
      basisLabel: '입사일 기준 (1년 미만)',
      yearsOfService: 0,
      notes,
    };
  }

  // 1년 이상 — 15일 + 가산 (3년차부터 2년마다 1일)
  const additional = Math.max(0, Math.floor((fullYears - 1) / 2));
  const total = Math.min(MAX_ANNUAL_DAYS, BASE_ANNUAL_DAYS + additional);
  notes.push(`근속 ${fullYears}년 — 기본 ${BASE_ANNUAL_DAYS}일 + 가산 ${additional}일`);
  if (total === MAX_ANNUAL_DAYS) notes.push(`상한 ${MAX_ANNUAL_DAYS}일 도달`);

  return {
    totalGrantedDays: total,
    basisLabel: '입사일 기준',
    yearsOfService: fullYears,
    notes,
  };
}

// 회계연도 기준: 입사 1년차에는 비례 계산.
// 단순화 정책: (회계연도 잔여 일수 / 365) × 연간 한도(11일).
// 다음 회계연도부터는 근속 연수에 따른 정식 산정.
export function calculateAnnualLeaveByFiscalYear(input: AnnualLeaveInput): AnnualLeaveResult {
  const { hireDate, asOf, fiscalYearStartMonth = 1, fiscalYearStartDay = 1 } = input;
  const notes: string[] = [];

  if (asOf < hireDate) {
    return { totalGrantedDays: 0, basisLabel: '회계연도 기준', yearsOfService: 0, notes: ['기준일이 입사일 이전입니다.'] };
  }

  const fiscalStartThisYear = new Date(asOf.getFullYear(), fiscalYearStartMonth - 1, fiscalYearStartDay);
  const fiscalStart = asOf >= fiscalStartThisYear
    ? fiscalStartThisYear
    : new Date(asOf.getFullYear() - 1, fiscalYearStartMonth - 1, fiscalYearStartDay);
  const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, fiscalStart.getMonth(), fiscalStart.getDate() - 1);

  // 입사일이 현재 회계연도 시작 이후라면 비례 계산
  if (hireDate >= fiscalStart) {
    const totalFiscalDays = daysBetween(fiscalStart, fiscalEnd) + 1;
    const remainingDays = daysBetween(hireDate, fiscalEnd) + 1;
    const proRated = (remainingDays / totalFiscalDays) * 15;
    const rounded = Math.round(proRated * 10) / 10;
    notes.push(`회계연도 시작(${toIso(fiscalStart)}) 이후 입사 — 비례 ${remainingDays}/${totalFiscalDays}일`);

    // 입사 1년 미만이면 월 1일 부여와 비례 부여 중 더 큰 쪽이 아니라, 정책상 일반적으로 비례.
    // 여기서는 비례 결과를 반환 (1년 미만이라도).
    return {
      totalGrantedDays: rounded,
      basisLabel: '회계연도 기준 (입사 첫해 비례)',
      yearsOfService: 0,
      notes,
    };
  }

  // 회계연도 이전 입사 → 입사일 기준 연차와 동일하게 산정
  return calculateAnnualLeaveByHireDate(input);
}

export function calculateAnnualLeave(input: AnnualLeaveInput): AnnualLeaveResult {
  return input.basis === 'fiscal_year'
    ? calculateAnnualLeaveByFiscalYear(input)
    : calculateAnnualLeaveByHireDate(input);
}

function diffYears(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) years--;
  return years;
}

function diffFullMonths(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months--;
  return Math.max(0, months);
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
