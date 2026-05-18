// 휴가 취소 가능 여부 판정 (v1.1). DB의 can_cancel_request()와 동일한 규칙을
// 클라이언트에서도 미리 보여주기 위한 순수 함수. 실제 권위는 DB.

export type LeaveCancellationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'system_cancelled';

export type CanCancelInput = {
  status: LeaveCancellationStatus;
  startDate: Date;
  asOf: Date;
};

export type CanCancelResult =
  | { canCancel: true; reason: 'pending_self' | 'approved_before_start' }
  | { canCancel: false; reason: 'not_pending_or_approved' | 'approved_past_start' | 'already_cancelled' };

export function canCancelLeaveRequest(input: CanCancelInput): CanCancelResult {
  const { status, startDate, asOf } = input;

  if (status === 'cancelled' || status === 'system_cancelled') {
    return { canCancel: false, reason: 'already_cancelled' };
  }
  if (status === 'rejected') {
    return { canCancel: false, reason: 'not_pending_or_approved' };
  }
  if (status === 'pending') {
    return { canCancel: true, reason: 'pending_self' };
  }
  // approved
  if (startDate <= asOf) {
    return { canCancel: false, reason: 'approved_past_start' };
  }
  return { canCancel: true, reason: 'approved_before_start' };
}

export const CANCEL_REASON_LABEL: Record<CanCancelResult['reason'], string> = {
  pending_self: '신청 대기 상태 — 즉시 취소 가능',
  approved_before_start: '승인됨 — 시작일 이전이라 취소 가능',
  not_pending_or_approved: '취소 대상이 아닌 상태',
  approved_past_start: '시작일이 지나 본인 취소 불가 — 관리자 문의',
  already_cancelled: '이미 취소된 신청',
};
