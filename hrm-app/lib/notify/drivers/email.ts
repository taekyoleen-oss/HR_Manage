import { getAdminClient } from '@/lib/supabase/admin';
import type { NotifyInput, RenderedMessage } from '../types';

// 이메일 driver — 직원 초대(employee_invitation)에만 사용. Resend 미설정 시 stubbed.
// 기존 hrm_email_logs와 별개로 hrm_notifications에도 기록 (단일 알림 진실 원천).

export async function sendEmail(
  input: NotifyInput,
  message: RenderedMessage,
): Promise<{ ok: boolean; status: 'sent' | 'stubbed' | 'failed'; providerId?: string; error?: string }> {
  const admin = getAdminClient();

  const { data: emp } = await admin
    .from('hrm_employees')
    .select('email')
    .eq('id', input.recipientEmployeeId)
    .maybeSingle();

  if (!emp?.email) {
    return { ok: false, status: 'failed', error: 'no_recipient_email' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  let status: 'sent' | 'stubbed' | 'failed' = 'stubbed';
  let providerId: string | null = null;
  let errorMessage: string | null = null;

  if (apiKey && fromEmail) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: fromEmail,
        to: emp.email,
        subject: message.title,
        html: htmlBody(message.body, message.linkPath),
      });
      if (result.error) {
        status = 'failed';
        errorMessage = result.error.message;
      } else {
        status = 'sent';
        providerId = result.data?.id ?? null;
      }
    } catch (err) {
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  await admin.from('hrm_notifications').insert({
    recipient_employee_id: input.recipientEmployeeId,
    sender_employee_id: input.senderEmployeeId ?? null,
    channel: 'email',
    kind: input.kind,
    title: message.title,
    body: message.body,
    link_path: message.linkPath,
    related_resource_type: input.relatedResourceType ?? null,
    related_resource_id: input.relatedResourceId ?? null,
    delivery_status: status,
    delivery_error: errorMessage,
    provider_id: providerId,
  });

  return { ok: status === 'sent', status, providerId: providerId ?? undefined, error: errorMessage ?? undefined };
}

function htmlBody(body: string, linkPath: string | null): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const linkHtml = linkPath
    ? `<p><a href="${appUrl}${linkPath}" style="color:#2563EB">HRM 바로가기</a></p>`
    : '';
  return `
    <div style="font-family: Pretendard, -apple-system, sans-serif; padding: 24px; max-width: 560px;">
      <p>${escapeHtml(body)}</p>
      ${linkHtml}
      <p style="color:#64748B;font-size:12px;">본 메일은 자동 발송되었습니다.</p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
