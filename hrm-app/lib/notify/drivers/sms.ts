import { getAdminClient } from '@/lib/supabase/admin';
import type { NotifyInput, RenderedMessage } from '../types';

// SMS 발송 — 네이버 클라우드 SENS. 환경변수 미설정 시 stubbed로 기록만.
// 한국 통신사 단문(LMS/SMS) 90byte 권장. body가 길면 LMS로 자동 분류.

const NCP_SENS_API_BASE = 'https://sens.apigw.ntruss.com';

export async function sendSms(
  input: NotifyInput,
  message: RenderedMessage,
): Promise<{ ok: boolean; status: 'sent' | 'stubbed' | 'failed'; providerId?: string; error?: string }> {
  const admin = getAdminClient();

  // 1) 수신자 phone + sms_opt_in 조회
  const { data: emp } = await admin
    .from('hrm_employees')
    .select('phone, sms_opt_in, name_ko')
    .eq('id', input.recipientEmployeeId)
    .maybeSingle();

  if (!emp || !emp.phone || !emp.sms_opt_in) {
    // opt-out 또는 번호 없음 — 발송 자체를 시도하지 않음. log도 생략.
    return { ok: false, status: 'stubbed', error: 'recipient_not_opted_in_or_no_phone' };
  }

  const serviceId = process.env.NCP_SENS_SERVICE_ID;
  const accessKey = process.env.NCP_SENS_ACCESS_KEY;
  const secretKey = process.env.NCP_SENS_SECRET_KEY;
  const fromNumber = process.env.NCP_SENS_FROM_NUMBER;

  const fullText = `${message.title}\n${message.body}`;
  let status: 'sent' | 'stubbed' | 'failed' = 'stubbed';
  let providerId: string | null = null;
  let errorMessage: string | null = null;

  if (serviceId && accessKey && secretKey && fromNumber) {
    try {
      const timestamp = Date.now().toString();
      const method = 'POST';
      const url = `/sms/v2/services/${serviceId}/messages`;
      const signature = await makeNcpSignature(method, url, timestamp, accessKey, secretKey);

      const res = await fetch(`${NCP_SENS_API_BASE}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': accessKey,
          'x-ncp-apigw-signature-v2': signature,
        },
        body: JSON.stringify({
          type: fullText.length > 80 ? 'LMS' : 'SMS',
          from: fromNumber,
          content: fullText.slice(0, 2000),
          messages: [{ to: emp.phone.replace(/[^0-9]/g, '') }],
        }),
      });
      const json: { requestId?: string; statusCode?: string; statusName?: string } = await res.json();
      if (res.ok && json.statusCode === '202') {
        status = 'sent';
        providerId = json.requestId ?? null;
      } else {
        status = 'failed';
        errorMessage = json.statusName ?? `HTTP ${res.status}`;
      }
    } catch (err) {
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  // hrm_notifications에 SMS 로그 기록 (인앱과 별개 row)
  await admin.from('hrm_notifications').insert({
    recipient_employee_id: input.recipientEmployeeId,
    sender_employee_id: input.senderEmployeeId ?? null,
    channel: 'sms',
    kind: input.kind,
    title: message.title,
    body: message.body,
    link_path: null,
    related_resource_type: input.relatedResourceType ?? null,
    related_resource_id: input.relatedResourceId ?? null,
    delivery_status: status,
    delivery_error: errorMessage,
    provider_id: providerId,
  });

  return { ok: status === 'sent', status, providerId: providerId ?? undefined, error: errorMessage ?? undefined };
}

// NCP API Gateway 서명. HMAC-SHA256(secret, "METHOD SPACE URL\nTIMESTAMP\nACCESS_KEY") → base64.
async function makeNcpSignature(
  method: string,
  url: string,
  timestamp: string,
  accessKey: string,
  secretKey: string,
): Promise<string> {
  const message = `${method} ${url}\n${timestamp}\n${accessKey}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Buffer.from(sig).toString('base64');
}
