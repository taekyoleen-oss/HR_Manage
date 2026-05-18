---
name: korean-holidays
description: 한국 공휴일(법정 공휴일 + 대체공휴일) 데이터를 제공하고, 휴가 일수 계산 시 공휴일·주말을 제외한 실제 영업일(working days) 산정 함수를 제공한다.
---

# korean-holidays

## 목적
휴가 신청 시 시작일~종료일 사이의 실제 차감 일수를 계산하려면 주말·공휴일을 제외해야 한다. 이 스킬은 공휴일 데이터와 영업일 계산 유틸을 제공한다.

## 입력
- `startDate: Date`, `endDate: Date`
- `startPeriod`, `endPeriod`: 시작/종료 시점의 반차/시간 단위 정보

## 출력
- `totalDays: number` — 실제 차감 일수 (주말·공휴일 제외, 반차 반영)

## 데이터 위치

`lib/leave/holidays.ts`에 연도별 공휴일 배열:

```ts
// 법정 공휴일 + 대체공휴일
export const KOREAN_HOLIDAYS: Record<number, { date: string; name: string }[]> = {
  2026: [
    { date: '2026-01-01', name: '신정' },
    { date: '2026-02-16', name: '설날 연휴' },
    { date: '2026-02-17', name: '설날' },
    { date: '2026-02-18', name: '설날 연휴' },
    { date: '2026-03-01', name: '삼일절' },
    { date: '2026-03-02', name: '대체공휴일(삼일절)' },
    { date: '2026-05-05', name: '어린이날' },
    { date: '2026-05-24', name: '부처님오신날' },
    { date: '2026-05-25', name: '대체공휴일(부처님오신날)' },
    { date: '2026-06-06', name: '현충일' },
    { date: '2026-08-15', name: '광복절' },
    { date: '2026-08-17', name: '대체공휴일(광복절)' },
    { date: '2026-09-24', name: '추석 연휴' },
    { date: '2026-09-25', name: '추석' },
    { date: '2026-09-26', name: '추석 연휴' },
    { date: '2026-10-03', name: '개천절' },
    { date: '2026-10-05', name: '대체공휴일(개천절)' },
    { date: '2026-10-09', name: '한글날' },
    { date: '2026-12-25', name: '크리스마스' },
  ],
  2027: [
    // 운영 단계에서 갱신
  ],
};

export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const iso = date.toISOString().slice(0, 10);
  return KOREAN_HOLIDAYS[year]?.some(h => h.date === iso) ?? false;
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}
```

## 영업일 계산 함수

```ts
export function calculateLeaveDays(input: {
  startDate: Date;
  endDate: Date;
  startPeriod: 'full_day' | 'am_half' | 'pm_half' | 'hourly';
  endPeriod: 'full_day' | 'am_half' | 'pm_half' | 'hourly';
  hourlyStart?: number; // 0-8
  hourlyEnd?: number;
}): number {
  if (input.startDate > input.endDate) throw new Error('INVALID_DATE_RANGE');

  let days = 0;
  const cursor = new Date(input.startDate);

  while (cursor <= input.endDate) {
    if (!isWeekend(cursor) && !isHoliday(cursor)) {
      const isFirst = cursor.getTime() === input.startDate.getTime();
      const isLast = cursor.getTime() === input.endDate.getTime();

      if (isFirst && isLast) {
        // 하루짜리 휴가
        days += dayFraction(input.startPeriod);
      } else if (isFirst) {
        days += dayFractionStart(input.startPeriod);
      } else if (isLast) {
        days += dayFractionEnd(input.endPeriod);
      } else {
        days += 1;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.round(days * 10) / 10; // 0.5 단위
}

function dayFraction(period: string): number {
  switch (period) {
    case 'am_half':
    case 'pm_half': return 0.5;
    case 'hourly': return 0.125 * (hours ?? 1); // 1시간 = 1/8일
    default: return 1;
  }
}
```

## UI 사용
- 캘린더 컴포넌트에서 공휴일을 빨간색 + 툴팁
- 휴가 신청 폼에서 실시간으로 `totalDays` 표시

## 유지보수 정책
- **연 1회 1월에 다음 해 공휴일 추가** — 대체공휴일 확정 후
- 정부 발표(인사혁신처) 변경 시 갱신
- 음력 기반 공휴일(설날, 추석, 부처님오신날)은 매년 양력 환산 확인

## 향후 확장 (v2.0)
- 회사별 휴무일 추가 (창립기념일 등) — `hrm_leave_policies.company_holidays JSONB`
- API 자동 동기화 (공공데이터 포털 — 특일정보 API)

## 금지 사항
- 공휴일 수동 추가 시 음력→양력 환산 오류 (반드시 정부 발표 기준 확인)
- 주말/공휴일을 차감 일수에 포함 (반드시 영업일만)
