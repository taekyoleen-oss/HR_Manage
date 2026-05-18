import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

// 본인의 인앱 알림 목록. RLS가 본인 row만 통과시킴.
export async function GET(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get('limit') ?? undefined,
    unreadOnly: url.searchParams.get('unreadOnly') ?? undefined,
  });
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  let q = supabase
    .from('hrm_notifications')
    .select('id, kind, title, body, link_path, related_resource_type, related_resource_id, read_at, created_at')
    .eq('recipient_employee_id', user.employeeId)
    .eq('channel', 'inapp')
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.unreadOnly) q = q.is('read_at', null);

  const { data, error } = await q;
  if (error) return failFromPg(error.message);

  return ok({ notifications: data ?? [] });
}
