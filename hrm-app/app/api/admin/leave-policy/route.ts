import { NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { leavePolicyUpdateSchema } from '@/lib/validations/employee';

export async function PATCH(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  let body: unknown;
  try { body = await req.json(); } catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = leavePolicyUpdateSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('hrm_leave_policies')
    .update({
      basis: v.basis,
      fiscal_year_start_month: v.fiscalYearStartMonth,
      fiscal_year_start_day: v.fiscalYearStartDay,
      max_carryover_days: v.maxCarryoverDays,
      promotion_first_warn_months: v.promotionFirstWarnMonths,
      promotion_second_warn_months: v.promotionSecondWarnMonths,
    })
    .eq('id', v.id);
  if (error) return failFromPg(error.message);

  return ok({ policyId: v.id });
}
