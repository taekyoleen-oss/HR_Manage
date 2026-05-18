import { describe, expect, it } from 'vitest';
import { calculateAnnualLeave, calculateAnnualLeaveByHireDate } from './calculator';

describe('calculateAnnualLeaveByHireDate', () => {
  it('입사 0개월: 0일', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2026-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(0);
  });

  it('입사 1개월: 1일', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2026-04-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(1);
  });

  it('입사 11개월: 11일 (1년 미만 상한)', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2025-06-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(11);
  });

  it('입사 1년: 15일', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2025-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(15);
  });

  it('근속 3년: 16일', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2023-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(16);
  });

  it('근속 21년: 25일 (상한)', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('2005-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(25);
  });

  it('근속 30년: 25일 (상한 고정)', () => {
    const r = calculateAnnualLeaveByHireDate({
      hireDate: new Date('1996-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'hire_date',
    });
    expect(r.totalGrantedDays).toBe(25);
  });
});

describe('calculateAnnualLeave (회계연도)', () => {
  it('회계연도 1월 1일 시작, 7월 입사 → 비례 계산', () => {
    const r = calculateAnnualLeave({
      hireDate: new Date('2026-07-01'),
      asOf: new Date('2026-07-01'),
      basis: 'fiscal_year',
      fiscalYearStartMonth: 1,
      fiscalYearStartDay: 1,
    });
    // 7/1~12/31 = 184일, 전체 365일 → 15 * 184/365 ≈ 7.6
    expect(r.totalGrantedDays).toBeGreaterThan(6);
    expect(r.totalGrantedDays).toBeLessThan(9);
  });

  it('회계연도 이전 입사 → 입사일 기준과 동일', () => {
    const r = calculateAnnualLeave({
      hireDate: new Date('2024-05-01'),
      asOf: new Date('2026-05-01'),
      basis: 'fiscal_year',
      fiscalYearStartMonth: 1,
      fiscalYearStartDay: 1,
    });
    expect(r.totalGrantedDays).toBe(15);
  });
});
