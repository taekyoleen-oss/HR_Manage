import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { familyEventLeaveRequestSchema } from '@/lib/validations/family-event';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = familyEventLeaveRequestSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const { data: newId, error } = await supabase.rpc('submit_family_event_leave', {
    p_policy_id: v.policyId,
    p_start_date: v.startDate,
    p_end_date: v.endDate,
    p_total_days: v.totalDays,
    p_reason: v.reason ?? '',
  });

  if (error) return failFromPg(error.message);
  if (!newId) return fail('NO_ID', '신청 생성 실패', 500);
  return ok({ requestId: newId });
}
