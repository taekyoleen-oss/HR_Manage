import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { leaveRejectSchema } from '@/lib/validations/leave';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role === 'employee') return fail('FORBIDDEN', '결재 권한이 없습니다', 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400);
  }

  const parsed = leaveRejectSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('reject_leave_request', {
    req_id: parsed.data.requestId,
    p_reason: parsed.data.reason,
  });
  if (error) return failFromPg(error.message);

  // 신청자에게 반려 알림 (사유 포함)
  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: r } = await admin
        .from('hrm_leave_requests')
        .select('employee_id, start_date, end_date, leave_type_id')
        .eq('id', parsed.data.requestId)
        .maybeSingle();
      if (!r) return;
      const { data: t } = await admin
        .from('hrm_leave_types')
        .select('name')
        .eq('id', r.leave_type_id)
        .maybeSingle();
      await notify({
        kind: 'leave_rejected',
        recipientEmployeeId: r.employee_id,
        senderEmployeeId: user.employeeId,
        relatedResourceType: 'leave_request',
        relatedResourceId: parsed.data.requestId,
        vars: {
          leaveTypeName: t?.name ?? '휴가',
          period: `${r.start_date}~${r.end_date}`,
          rejectionReason: parsed.data.reason,
        },
      });
    } catch {
      // ignore
    }
  })();

  return ok({ requestId: parsed.data.requestId });
}
