import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, ok } from '@/lib/api/response';

// 단일 알림 읽음 처리. RPC가 본인 + 인앱 채널 확인 후 read_at = now.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const { id } = await params;

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('mark_notification_read', { p_notification_id: id });
  if (error) return failFromPg(error.message);
  return ok({ notificationId: id });
}
