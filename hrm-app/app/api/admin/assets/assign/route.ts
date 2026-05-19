import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

const assignSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  conditionOnAssign: z.string().trim().max(500).optional().nullable(),
});

const returnSchema = z.object({
  assetId: z.string().uuid(),
  conditionOnReturn: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user || user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'assign';

  const supabase = await createServerClient();

  if (action === 'assign') {
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return failZod(parsed.error);
    const v = parsed.data;
    const { error: aErr } = await supabase.from('hrm_asset_assignments').insert({
      asset_id: v.assetId,
      employee_id: v.employeeId,
      condition_on_assign: v.conditionOnAssign ?? null,
      performed_by: user.employeeId,
    });
    if (aErr) return failFromPg(aErr.message);
    const { error: uErr } = await supabase
      .from('hrm_assets')
      .update({
        status: 'assigned',
        current_assignee_id: v.employeeId,
        current_assigned_at: new Date().toISOString(),
      })
      .eq('id', v.assetId);
    if (uErr) return failFromPg(uErr.message);
    return ok({ assetId: v.assetId });
  }

  if (action === 'return') {
    const parsed = returnSchema.safeParse(body);
    if (!parsed.success) return failZod(parsed.error);
    const v = parsed.data;
    // 가장 최근 미반납 배정에 returned_at 기록
    const { data: latest } = await supabase
      .from('hrm_asset_assignments')
      .select('id')
      .eq('asset_id', v.assetId)
      .is('returned_at', null)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.id) {
      const { error: rErr } = await supabase
        .from('hrm_asset_assignments')
        .update({
          returned_at: new Date().toISOString(),
          condition_on_return: v.conditionOnReturn ?? null,
        })
        .eq('id', latest.id);
      if (rErr) return failFromPg(rErr.message);
    }
    const { error: uErr } = await supabase
      .from('hrm_assets')
      .update({ status: 'available', current_assignee_id: null, current_assigned_at: null })
      .eq('id', v.assetId);
    if (uErr) return failFromPg(uErr.message);
    return ok({ assetId: v.assetId });
  }

  return fail('BAD_ACTION', 'action은 assign 또는 return이어야 합니다', 400);
}
