import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { familyEventPolicyUpsertSchema } from '@/lib/validations/family-event';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = familyEventPolicyUpsertSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const row = {
    code: v.code,
    name: v.name,
    relation: v.relation,
    event_kind: v.eventKind,
    granted_days: v.grantedDays,
    required_attachment_note: v.requiredAttachmentNote ?? null,
    usage_limit: v.usageLimit,
    description: v.description ?? null,
    is_active: v.isActive,
    sort_order: v.sortOrder,
  };

  const { data, error } = v.id
    ? await supabase.from('hrm_family_event_policies').update(row).eq('id', v.id).select('id').maybeSingle()
    : await supabase.from('hrm_family_event_policies').insert(row).select('id').maybeSingle();

  if (error) return failFromPg(error.message);
  return ok({ id: data?.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return fail('BAD_REQUEST', 'id가 필요합니다', 400);

  const supabase = await createServerClient();
  // 사용 중인 정책은 비활성화만 권장
  const { error } = await supabase
    .from('hrm_family_event_policies')
    .update({ is_active: false })
    .eq('id', id);
  if (error) return failFromPg(error.message);
  return ok({ id });
}
