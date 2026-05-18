import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, ok } from '@/lib/api/response';

// 헤더 종 아이콘 배지용. 본인의 미읽음 인앱 알림 개수만.
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from('hrm_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_employee_id', user.employeeId)
    .eq('channel', 'inapp')
    .is('read_at', null);

  if (error) return failFromPg(error.message);
  return ok({ unreadCount: count ?? 0 });
}
