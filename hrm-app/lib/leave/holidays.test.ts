import { describe, expect, it } from 'vitest';
import { calculateLeaveDays, isBusinessDay, isHoliday, isWeekend } from './holidays';

describe('isWeekend / isHoliday', () => {
  it('일요일은 주말', () => {
    expect(isWeekend(new Date('2026-05-17'))).toBe(true);
  });
  it('월요일은 평일', () => {
    expect(isWeekend(new Date('2026-05-18'))).toBe(false);
  });
  it('2026-05-05는 어린이날(공휴일)', () => {
    expect(isHoliday(new Date('2026-05-05'))).toBe(true);
  });
  it('2026-05-04는 평일 + 공휴일 아님', () => {
    expect(isBusinessDay(new Date('2026-05-04'))).toBe(true);
  });
});

describe('calculateLeaveDays', () => {
  it('월요일 종일 1일', () => {
    const d = new Date('2026-05-18');
    expect(calculateLeaveDays(d, d, 'full_day', 'full_day')).toBe(1);
  });

  it('월요일 반차 0.5일', () => {
    const d = new Date('2026-05-18');
    expect(calculateLeaveDays(d, d, 'am_half', 'am_half')).toBe(0.5);
  });

  it('월~금 5영업일', () => {
    expect(calculateLeaveDays(new Date('2026-05-18'), new Date('2026-05-22'), 'full_day', 'full_day')).toBe(5);
  });

  it('월~다음주 월요일(주말 제외) 6영업일 — 공휴일 없는 주', () => {
    // 6/15(월) ~ 6/22(월): 주말 2일 제외, 공휴일 없음
    expect(calculateLeaveDays(new Date('2026-06-15'), new Date('2026-06-22'), 'full_day', 'full_day')).toBe(6);
  });

  it('금요일~다음주 화요일 (주말 2일 제외) = 3영업일', () => {
    // 6/19(금) ~ 6/23(화): 6/20, 6/21 주말 제외
    expect(calculateLeaveDays(new Date('2026-06-19'), new Date('2026-06-23'), 'full_day', 'full_day')).toBe(3);
  });

  it('공휴일(어린이날 5/5)이 포함된 5/4~5/6 = 2영업일', () => {
    expect(calculateLeaveDays(new Date('2026-05-04'), new Date('2026-05-06'), 'full_day', 'full_day')).toBe(2);
  });

  it('시작일이 오후 반차, 종료일은 종일 → -0.5', () => {
    // 월~수 영업일 3 - 0.5 = 2.5
    expect(calculateLeaveDays(new Date('2026-05-18'), new Date('2026-05-20'), 'pm_half', 'full_day')).toBe(2.5);
  });

  it('주말은 영업일 0일', () => {
    expect(calculateLeaveDays(new Date('2026-05-17'), new Date('2026-05-17'), 'full_day', 'full_day')).toBe(0);
  });
});
