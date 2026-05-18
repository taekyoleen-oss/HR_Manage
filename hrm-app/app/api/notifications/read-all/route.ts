import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, ok } from '@/lib/api/response';

// 본인의 모든 미읽음 인앱 알림 일괄 읽음 처리.
export async function POST() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  if (error) return failFromPg(error.message);
  return ok({ updated: data ?? 0 });
}
