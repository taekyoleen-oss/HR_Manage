import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { remoteWorkRequestSchema } from '@/lib/validations/remote-work';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = remoteWorkRequestSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const { data: newId, error } = await supabase.rpc('submit_remote_work', {
    p_start_date: v.startDate,
    p_end_date: v.endDate,
    p_total_days: v.totalDays,
    p_reason: v.reason,
    p_work_location: v.workLocation ?? '',
    p_contact_method: v.contactMethod ?? '',
  });
  if (error) return failFromPg(error.message);
  if (!newId) return fail('NO_ID', '신청 생성 실패', 500);

  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: r } = await admin
        .from('hrm_remote_work_requests')
        .select('approver_id')
        .eq('id', newId as string)
        .maybeSingle();
      if (r?.approver_id) {
        await notify({
          kind: 'remote_submitted',
          recipientEmployeeId: r.approver_id,
          senderEmployeeId: user.employeeId,
          relatedResourceType: 'remote_work',
          relatedResourceId: newId as string,
          vars: {
            employeeName: user.name,
            period: `${v.startDate}~${v.endDate}`,
            totalDays: v.totalDays,
          },
        });
      }
    } catch { /* ignore */ }
  })();

  return ok({ requestId: newId });
}
