import { getAdminClient } from '@/lib/supabase/admin';
import type { NotifyInput, RenderedMessage } from '../types';

// 인앱 알림 — hrm_notifications에 channel='inapp'으로 INSERT.
// 권위 저장소이므로 실패 시 조용히 묻지 않고 상위로 throw.
export async function sendInApp(
  input: NotifyInput,
  message: RenderedMessage,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { error } = await admin.from('hrm_notifications').insert({
      recipient_employee_id: input.recipientEmployeeId,
      sender_employee_id: input.senderEmployeeId ?? null,
      channel: 'inapp',
      kind: input.kind,
      title: message.title,
      body: message.body,
      link_path: message.linkPath,
      related_resource_type: input.relatedResourceType ?? null,
      related_resource_id: input.relatedResourceId ?? null,
      delivery_status: 'sent',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
