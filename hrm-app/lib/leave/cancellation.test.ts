import { describe, expect, it } from 'vitest';
import { canCancelLeaveRequest } from './cancellation';

const today = new Date('2026-05-18');

describe('canCancelLeaveRequest', () => {
  it('pending → 즉시 취소 가능', () => {
    const r = canCancelLeaveRequest({
      status: 'pending',
      startDate: new Date('2026-06-01'),
      asOf: today,
    });
    expect(r.canCancel).toBe(true);
  });

  it('approved + 시작일 이전 → 취소 가능', () => {
    const r = canCancelLeaveRequest({
      status: 'approved',
      startDate: new Date('2026-06-01'),
      asOf: today,
    });
    expect(r.canCancel).toBe(true);
    if (r.canCancel) expect(r.reason).toBe('approved_before_start');
  });

  it('approved + 시작일 = 오늘 → 취소 불가', () => {
    const r = canCancelLeaveRequest({
      status: 'approved',
      startDate: new Date('2026-05-18'),
      asOf: today,
    });
    expect(r.canCancel).toBe(false);
  });

  it('approved + 시작일 이전(과거) → 취소 불가', () => {
    const r = canCancelLeaveRequest({
      status: 'approved',
      startDate: new Date('2026-05-01'),
      asOf: today,
    });
    expect(r.canCancel).toBe(false);
  });

  it('rejected → 취소 대상 아님', () => {
    const r = canCancelLeaveRequest({
      status: 'rejected',
      startDate: new Date('2026-06-01'),
      asOf: today,
    });
    expect(r.canCancel).toBe(false);
  });

  it('cancelled → 이미 취소됨', () => {
    const r = canCancelLeaveRequest({
      status: 'cancelled',
      startDate: new Date('2026-06-01'),
      asOf: today,
    });
    expect(r.canCancel).toBe(false);
    if (!r.canCancel) expect(r.reason).toBe('already_cancelled');
  });
});
