// 한국 공휴일 데이터 + 영업일 계산.
// 음력 공휴일(설/추석/석가탄신일)이 매년 다르므로 연도별로 명시 관리.
// 새 연도 추가 시 KOREAN_HOLIDAYS에 항목 추가.

export type Holiday = {
  date: string;
  name: string;
  isSubstitute?: boolean;
};

export const KOREAN_HOLIDAYS_2025: Holiday[] = [
  { date: '2025-01-01', name: '신정' },
  { date: '2025-01-28', name: '설날 연휴' },
  { date: '2025-01-29', name: '설날' },
  { date: '2025-01-30', name: '설날 연휴' },
  { date: '2025-03-01', name: '삼일절' },
  { date: '2025-03-03', name: '대체공휴일(삼일절)', isSubstitute: true },
  { date: '2025-05-05', name: '어린이날·석가탄신일' },
  { date: '2025-05-06', name: '대체공휴일(어린이날)', isSubstitute: true },
  { date: '2025-06-06', name: '현충일' },
  { date: '2025-08-15', name: '광복절' },
  { date: '2025-10-03', name: '개천절' },
  { date: '2025-10-05', name: '추석 연휴' },
  { date: '2025-10-06', name: '추석' },
  { date: '2025-10-07', name: '추석 연휴' },
  { date: '2025-10-08', name: '대체공휴일(추석)', isSubstitute: true },
  { date: '2025-10-09', name: '한글날' },
  { date: '2025-12-25', name: '성탄절' },
];

export const KOREAN_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날 연휴' },
  { date: '2026-02-17', name: '설날' },
  { date: '2026-02-18', name: '설날 연휴' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-03-02', name: '대체공휴일(삼일절)', isSubstitute: true },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '석가탄신일' },
  { date: '2026-05-25', name: '대체공휴일(석가탄신일)', isSubstitute: true },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-08-17', name: '대체공휴일(광복절)', isSubstitute: true },
  { date: '2026-09-24', name: '추석 연휴' },
  { date: '2026-09-25', name: '추석' },
  { date: '2026-09-26', name: '추석 연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '성탄절' },
];

export const KOREAN_HOLIDAYS_2027: Holiday[] = [
  { date: '2027-01-01', name: '신정' },
  { date: '2027-02-06', name: '설날 연휴' },
  { date: '2027-02-07', name: '설날' },
  { date: '2027-02-08', name: '설날 연휴' },
  { date: '2027-02-09', name: '대체공휴일(설)', isSubstitute: true },
  { date: '2027-03-01', name: '삼일절' },
  { date: '2027-05-05', name: '어린이날' },
  { date: '2027-05-13', name: '석가탄신일' },
  { date: '2027-06-06', name: '현충일' },
  { date: '2027-06-07', name: '대체공휴일(현충일)', isSubstitute: true },
  { date: '2027-08-15', name: '광복절' },
  { date: '2027-08-16', name: '대체공휴일(광복절)', isSubstitute: true },
  { date: '2027-09-14', name: '추석 연휴' },
  { date: '2027-09-15', name: '추석' },
  { date: '2027-09-16', name: '추석 연휴' },
  { date: '2027-10-03', name: '개천절' },
  { date: '2027-10-04', name: '대체공휴일(개천절)', isSubstitute: true },
  { date: '2027-10-09', name: '한글날' },
  { date: '2027-10-11', name: '대체공휴일(한글날)', isSubstitute: true },
  { date: '2027-12-25', name: '성탄절' },
];

const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: KOREAN_HOLIDAYS_2025,
  2026: KOREAN_HOLIDAYS_2026,
  2027: KOREAN_HOLIDAYS_2027,
};

export function getHolidays(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}

export function getHolidaysBetween(start: Date, end: Date): Holiday[] {
  const years = new Set<number>();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y);
  const all = Array.from(years).flatMap(getHolidays);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  return all.filter((h) => h.date >= startIso && h.date <= endIso);
}

export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const iso = toIsoDate(date);
  return getHolidays(year).some((h) => h.date === iso);
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

// 휴가 일수 계산 - 시작/종료 날짜 + start/end_period로 0.5 단위 산정.
export type LeavePeriod = 'full_day' | 'am_half' | 'pm_half' | 'hourly';

export function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  startPeriod: LeavePeriod = 'full_day',
  endPeriod: LeavePeriod = 'full_day',
): number {
  if (endDate < startDate) {
    throw new Error('end_date must be >= start_date');
  }

  // 시간 단위는 별도 처리 (백오피스 입력) - 여기서는 일 단위로만.
  if (startPeriod === 'hourly' || endPeriod === 'hourly') {
    throw new Error('hourly period must be calculated with explicit hours, not via this function');
  }

  // 같은 날 + 반차 → 0.5
  const sameDay = toIsoDate(startDate) === toIsoDate(endDate);
  if (sameDay) {
    if (!isBusinessDay(startDate)) return 0;
    if (startPeriod === 'full_day' && endPeriod === 'full_day') return 1;
    if (startPeriod === 'am_half' || startPeriod === 'pm_half') return 0.5;
    return 1;
  }

  // 여러 날: 영업일 카운트 + 양 끝 반차 보정
  let businessDayCount = 0;
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (isBusinessDay(cursor)) businessDayCount++;
    cursor.setDate(cursor.getDate() + 1);
  }

  // 시작일이 반차면 -0.5, 종료일이 반차면 -0.5
  let total = businessDayCount;
  if ((startPeriod === 'am_half' || startPeriod === 'pm_half') && isBusinessDay(startDate)) {
    total -= 0.5;
  }
  if ((endPeriod === 'am_half' || endPeriod === 'pm_half') && isBusinessDay(endDate)) {
    total -= 0.5;
  }

  return Math.max(0, total);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export { toIsoDate };
