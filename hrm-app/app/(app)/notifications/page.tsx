import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { NotificationListClient } from './notification-list-client';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('hrm_notifications')
    .select('id, kind, title, body, link_path, read_at, created_at')
    .eq('recipient_employee_id', user.employeeId)
    .eq('channel', 'inapp')
    .order('created_at', { ascending: false })
    .limit(100);

  const items = data ?? [];
  const unreadCount = items.filter((i) => !i.read_at).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">알림</h1>
          <p className="text-sm text-muted-foreground">
            전체 {items.length}건 · 미읽음 {unreadCount}건
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>전체 알림 (최근 100건)</CardTitle>
          <CardDescription>
            <Link href="/profile/edit" className="hover:underline">알림 설정</Link>에서 SMS 수신을 켤 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Bell} title="알림이 없습니다" />
            </div>
          ) : (
            <NotificationListClient items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
