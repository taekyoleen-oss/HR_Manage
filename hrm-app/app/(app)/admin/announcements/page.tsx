import { requireAdmin } from '@/lib/auth/guards';
import { getAllAnnouncementsForAdmin } from '@/lib/announcements/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnnouncementManager } from './announcement-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const items = await getAllAnnouncementsForAdmin(200);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <p className="text-sm text-muted-foreground">전직원이 열람하는 공지를 등록·수정·삭제합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>공지 목록 ({items.length}건)</CardTitle>
          <CardDescription>고정·카테고리·게시 여부를 관리할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementManager initialItems={items} />
        </CardContent>
      </Card>
    </div>
  );
}
