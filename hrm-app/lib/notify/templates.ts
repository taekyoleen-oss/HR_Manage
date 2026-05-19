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

    // ============================
    // v1.2.1 — 출장
    // ============================
    case 'trip_submitted': {
      const emp = vars.employeeName ?? '직원';
      const dest = vars.destination ?? '';
      const period = vars.period ?? '';
      return {
        title: '[HRM] 출장 결재 요청',
        body: `${emp}님이 ${dest} 출장(${period})을 신청했습니다.`,
        linkPath: '/approvals',
      };
    }
    case 'trip_approved': {
      const dest = vars.destination ?? '';
      const period = vars.period ?? '';
      return {
        title: '[HRM] 출장 승인',
        body: `${dest} 출장(${period})이 승인되었습니다.`,
        linkPath: vars.tripId ? `/trips/${vars.tripId}` : '/trips',
      };
    }
    case 'trip_rejected': {
      const dest = vars.destination ?? '';
      const period = vars.period ?? '';
      const reason = vars.rejectionReason ? ` 사유: ${vars.rejectionReason}` : '';
      return {
        title: '[HRM] 출장 반려',
        body: `${dest} 출장(${period})이 반려되었습니다.${reason}`,
        linkPath: vars.tripId ? `/trips/${vars.tripId}` : '/trips',
      };
    }
    case 'trip_cancelled': {
      const emp = vars.employeeName ?? '직원';
      const dest = vars.destination ?? '';
      const period = vars.period ?? '';
      return {
        title: '[HRM] 출장 본인 취소',
        body: `${emp}님이 ${dest} 출장(${period}) 신청을 취소했습니다.`,
        linkPath: '/approvals',
      };
    }
    case 'trip_completed': {
      const emp = vars.employeeName ?? '직원';
      const dest = vars.destination ?? '';
      return {
        title: '[HRM] 출장 복귀 보고서 제출',
        body: `${emp}님이 ${dest} 출장 복귀 보고서를 제출했습니다.`,
        linkPath: vars.tripId ? `/trips/${vars.tripId}` : '/admin/trips',
      };
    }

    // ============================
    // v1.2.1 — 재택근무
    // ============================
    case 'remote_submitted': {
      const emp = vars.employeeName ?? '직원';
      const period = vars.period ?? '';
      const days = vars.totalDays ?? '';
      return {
        title: '[HRM] 재택근무 결재 요청',
        body: `${emp}님이 재택근무 ${days}일(${period})을 신청했습니다.`,
        linkPath: '/approvals',
      };
    }
    case 'remote_approved': {
      const period = vars.period ?? '';
      return {
        title: '[HRM] 재택근무 승인',
        body: `재택근무 신청(${period})이 승인되었습니다.`,
        linkPath: '/remote-work',
      };
    }
    case 'remote_rejected': {
      const period = vars.period ?? '';
      const reason = vars.rejectionReason ? ` 사유: ${vars.rejectionReason}` : '';
      return {
        title: '[HRM] 재택근무 반려',
        body: `재택근무 신청(${period})이 반려되었습니다.${reason}`,
        linkPath: '/remote-work',
      };
    }

    // ============================
    // v1.2.1 — 경조사
    // ============================
    case 'family_event_submitted': {
      const emp = vars.employeeName ?? '직원';
      const policyName = vars.policyName ?? '경조사';
      const period = vars.period ?? '';
      const days = vars.totalDays ?? '';
      return {
        title: '[HRM] 경조사 휴가 결재 요청',
        body: `${emp}님이 ${policyName} ${days}일(${period})을 신청했습니다.`,
        linkPath: '/approvals',
      };
    }

    // ============================
    // v1.2.1 — 공지사항
    // ============================
    case 'announcement_published': {
      const title = vars.announcementTitle ?? '신규 공지';
      return {
        title: '[HRM] 새 공지사항',
        body: title.toString(),
        linkPath: '/announcements',
      };
    }
  }
}
