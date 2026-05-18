import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { leaveRequestSchema } from '@/lib/validations/leave';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400);
  }

  const parsed = leaveRequestSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const { data: newId, error } = await supabase.rpc('submit_leave_request', {
    p_leave_type_id: v.leaveTypeId,
    p_start_date: v.startDate,
    p_end_date: v.endDate,
    p_start_period: v.startPeriod,
    p_end_period: v.endPeriod,
    p_total_days: v.totalDays,
    p_reason: v.reason ?? '',
  });

  if (error) return failFromPg(error.message);
  if (!newId) return fail('NO_ID', '신청 생성에 실패했습니다', 500);

  // 결재자(approver)에게 알림 — 신청 row에서 approver_id 조회 (RLS 우회 위해 admin)
  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: req } = await admin
        .from('hrm_leave_requests')
        .select('approver_id, employee_id, total_days')
        .eq('id', newId as string)
        .maybeSingle();
      const { data: type } = await admin
        .from('hrm_leave_types')
        .select('name')
        .eq('id', v.leaveTypeId)
        .maybeSingle();
      if (req?.approver_id) {
        await notify({
          kind: 'leave_request_submitted',
          recipientEmployeeId: req.approver_id,
          senderEmployeeId: user.employeeId,
          relatedResourceType: 'leave_request',
          relatedResourceId: newId as string,
          vars: {
            employeeName: user.name,
            leaveTypeName: type?.name ?? '휴가',
            period: `${v.startDate}~${v.endDate}`,
            totalDays: Number(req.total_days).toFixed(1),
          },
        });
      }
    } catch {
      // notify 실패는 응답을 막지 않음
    }
  })();

  return ok({ requestId: newId });
}

// 본인의 휴가 신청 목록 조회 (?status= 필터 지원)
const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'system_cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  let q = supabase
    .from('hrm_leave_requests')
    .select('*, hrm_leave_types(name, code, color_hint)')
    .eq('employee_id', user.employeeId)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.status) q = q.eq('status', parsed.data.status);

  const { data, error } = await q;
  if (error) return failFromPg(error.message);

  return ok({ requests: data ?? [] });
}
