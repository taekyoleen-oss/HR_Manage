import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { announcementUpsertSchema } from '@/lib/validations/announcement';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = announcementUpsertSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const row = {
    title: v.title,
    body: v.body,
    category: v.category,
    is_pinned: v.isPinned,
    is_published: v.isPublished,
    expires_at: v.expiresAt ?? null,
    author_id: user.employeeId,
  };

  const isNew = !v.id;
  const { data, error } = v.id
    ? await supabase.from('hrm_announcements').update(row).eq('id', v.id).select('id').maybeSingle()
    : await supabase.from('hrm_announcements').insert(row).select('id').maybeSingle();

  if (error) return failFromPg(error.message);

  // 신규 게시 공지는 전직원에게 인앱 알림 (urgent 카테고리만 SMS 동반)
  if (isNew && v.isPublished && data?.id) {
    void (async () => {
      try {
        const admin = getAdminClient();
        const { data: employees } = await admin
          .from('hrm_employees')
          .select('id')
          .eq('employment_status', 'active');
        if (!employees) return;
        for (const e of employees) {
          if (e.id === user.employeeId) continue;
          await notify({
            kind: 'announcement_published',
            recipientEmployeeId: e.id,
            senderEmployeeId: user.employeeId,
            relatedResourceType: 'announcement',
            relatedResourceId: data.id,
            vars: { announcementTitle: v.title },
            forceChannels: v.category === 'urgent' ? ['inapp', 'sms'] : ['inapp'],
          });
        }
      } catch { /* ignore */ }
    })();
  }

  return ok({ id: data?.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return fail('BAD_REQUEST', 'id가 필요합니다', 400);

  const supabase = await createServerClient();
  const { error } = await supabase.from('hrm_announcements').delete().eq('id', id);
  if (error) return failFromPg(error.message);
  return ok({ id });
}
