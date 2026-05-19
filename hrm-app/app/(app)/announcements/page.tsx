import { requireUser } from '@/lib/auth/guards';
import { getActiveAnnouncements } from '@/lib/announcements/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { Megaphone, Pin } from 'lucide-react';
import { ANNOUNCEMENT_CATEGORY_LABEL, type AnnouncementCategory } from '@/types/hrm';

export const dynamic = 'force-dynamic';

const CATEGORY_COLOR: Record<AnnouncementCategory, string> = {
  general: 'bg-muted text-muted-foreground border-border',
  policy: 'bg-primary/10 text-primary border-primary/30',
  event: 'bg-success/10 text-success border-success/30',
  system: 'bg-muted text-foreground border-border',
  hr: 'bg-accent/10 text-accent border-accent/30',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default async function AnnouncementsPage() {
  await requireUser();
  const items = await getActiveAnnouncements(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" /> 사내 공지사항
        </h1>
        <p className="text-sm text-muted-foreground">최근 공지부터 표시 · 고정 공지는 상단에 노출됩니다.</p>
      </header>

      {items.length === 0 ? (
        <EmptyState title="등록된 공지사항이 없습니다" description="관리자가 공지를 등록하면 여기 표시됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const cat = a.category as AnnouncementCategory;
            const author = (a as { hrm_employees?: { name_ko?: string } }).hrm_employees;
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      {a.is_pinned && <Pin className="h-4 w-4 text-warning" />}
                      {a.title}
                    </CardTitle>
                    <Badge variant="outline" className={CATEGORY_COLOR[cat]}>
                      {ANNOUNCEMENT_CATEGORY_LABEL[cat]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.published_at).toLocaleDateString('ko-KR')}
                    {author?.name_ko ? ` · ${author.name_ko}` : ''}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">{a.body}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
