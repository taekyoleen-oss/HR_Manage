import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { leaveCancelSchema } from '@/lib/validations/leave';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

// v1.1: 본인이 자신의 휴가 신청을 취소. DB의 cancel_leave_request RPC가
// 권한·상태·날짜 규칙을 권위적으로 검증. 여기서는 인증과 입력만.
export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400);
  }

  const parsed = leaveCancelSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  const { data: result, error } = await supabase.rpc('cancel_leave_request', {
    req_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? '',
  });
  if (error) return failFromPg(error.message);

  // 결재자에게 본인 취소 알림
  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: r } = await admin
        .from('hrm_leave_requests')
        .select('approver_id, start_date, end_date, leave_type_id')
        .eq('id', parsed.data.requestId)
        .maybeSingle();
      if (!r?.approver_id) return;
      const { data: t } = await admin
        .from('hrm_leave_types')
        .select('name')
        .eq('id', r.leave_type_id)
        .maybeSingle();
      await notify({
        kind: 'leave_cancelled_by_employee',
        recipientEmployeeId: r.approver_id,
        senderEmployeeId: user.employeeId,
        relatedResourceType: 'leave_request',
        relatedResourceId: parsed.data.requestId,
        vars: {
          employeeName: user.name,
          leaveTypeName: t?.name ?? '휴가',
          period: `${r.start_date}~${r.end_date}`,
        },
      });
    } catch {
      // ignore
    }
  })();

  return ok({ requestId: parsed.data.requestId, result });
}
