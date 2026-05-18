import type { NotifyKind, RenderedMessage } from './types';

// 각 kind별 메시지 빌더. 채널 무관 — 인앱/SMS/이메일 모두 같은 title/body 재사용.
// SMS는 body가 짧을수록 좋으므로 의도적으로 간결.

type Vars = Record<string, string | number>;

export function renderMessage(kind: NotifyKind, vars: Vars = {}): RenderedMessage {
  switch (kind) {
    case 'leave_request_submitted': {
      const emp = vars.employeeName ?? '직원';
      const type = vars.leaveTypeName ?? '휴가';
      const period = vars.period ?? '';
      const days = vars.totalDays ?? '';
      return {
        title: '[HRM] 휴가 결재 요청',
        body: `${emp}님이 ${type} ${days}일(${period})을 신청했습니다.`,
        linkPath: '/approvals',
      };
    }
    case 'leave_approved': {
      const type = vars.leaveTypeName ?? '휴가';
      const period = vars.period ?? '';
      return {
        title: '[HRM] 휴가 승인',
        body: `${type} 신청(${period})이 승인되었습니다.`,
        linkPath: '/leave/history',
      };
    }
    case 'leave_rejected': {
      const type = vars.leaveTypeName ?? '휴가';
      const period = vars.period ?? '';
      const reason = vars.rejectionReason ? ` 사유: ${vars.rejectionReason}` : '';
      return {
        title: '[HRM] 휴가 반려',
        body: `${type} 신청(${period})이 반려되었습니다.${reason}`,
        linkPath: '/leave/history',
      };
    }
    case 'leave_cancelled_by_employee': {
      const emp = vars.employeeName ?? '직원';
      const type = vars.leaveTypeName ?? '휴가';
      const period = vars.period ?? '';
      return {
        title: '[HRM] 휴가 본인 취소',
        body: `${emp}님이 ${type}(${period}) 신청을 취소했습니다. 잔여 환원되었습니다.`,
        linkPath: '/approvals',
      };
    }
    case 'employee_invitation': {
      const name = vars.employeeName ?? '신규 직원';
      const link = vars.inviteLink ?? '';
      return {
        title: '[HRM] 계정이 생성되었습니다',
        body: `${name}님, 사내 HRM 계정이 생성되었습니다. 비밀번호 설정 링크: ${link}`,
        linkPath: null,
      };
    }
  }
}
