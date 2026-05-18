import type { NotifyInput, NotifyChannel } from './types';
import { renderMessage } from './templates';
import { sendInApp } from './drivers/inapp';
import { sendSms } from './drivers/sms';
import { sendEmail } from './drivers/email';

// kind별 채널 라우팅 정책. 사용자 결정 (2026-05-18):
// - 휴가 결재 요청 → 인앱 + SMS (opt-in 시)
// - 휴가 승인/반려 → 인앱 + SMS (opt-in 시)
// - 본인 취소 → 인앱만
// - 직원 초대 → 이메일만 (계정 미생성 상태라 인앱 불가)
const CHANNEL_POLICY: Record<NotifyInput['kind'], NotifyChannel[]> = {
  leave_request_submitted: ['inapp', 'sms'],
  leave_approved: ['inapp', 'sms'],
  leave_rejected: ['inapp', 'sms'],
  leave_cancelled_by_employee: ['inapp'],
  employee_invitation: ['email'],
};

// 단일 진입점. 라우팅 정책 → 채널별 driver 순차 호출.
// fire-and-forget 호출자가 await 안 해도 되도록 throw 대신 결과 객체 반환.
export async function notify(input: NotifyInput): Promise<{
  channels: { channel: NotifyChannel; ok: boolean; error?: string }[];
}> {
  const channels = input.forceChannels ?? CHANNEL_POLICY[input.kind];
  const message = renderMessage(input.kind, input.vars);

  const results: { channel: NotifyChannel; ok: boolean; error?: string }[] = [];
  for (const channel of channels) {
    try {
      if (channel === 'inapp') {
        const r = await sendInApp(input, message);
        results.push({ channel, ok: r.ok, error: r.error });
      } else if (channel === 'sms') {
        const r = await sendSms(input, message);
        results.push({ channel, ok: r.ok, error: r.error });
      } else if (channel === 'email') {
        const r = await sendEmail(input, message);
        results.push({ channel, ok: r.ok, error: r.error });
      }
    } catch (err) {
      results.push({
        channel,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { channels: results };
}
