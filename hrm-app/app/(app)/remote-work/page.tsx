import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getMyRemoteWork } from '@/lib/remote-work/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RemoteWorkStatusBadge } from '@/components/common/trip-status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Home, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RemoteWorkPage() {
  const user = await requireUser();
  const requests = await getMyRemoteWork(user.employeeId, 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6" /> 재택근무
          </h1>
          <p className="text-sm text-muted-foreground">재택근무 신청 및 승인 현황</p>
        </div>
        <Link href="/remote-work/new">
          <Button className="h-11 md:h-9"><Plus className="h-4 w-4" /> 재택근무 신청</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>내 신청 내역</CardTitle>
          <CardDescription>최근 신청부터 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <EmptyState title="아직 재택근무 신청이 없습니다" description="우측 상단 버튼으로 첫 신청을 만들어 보세요." />
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-start justify-between border-b border-border last:border-0 py-3 gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm md:text-base">
                    {r.start_date} ~ {r.end_date} · {r.total_days}일
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.reason}</div>
                  {r.rejection_reason && (
                    <div className="text-xs text-destructive mt-1">반려: {r.rejection_reason}</div>
                  )}
                </div>
                <RemoteWorkStatusBadge status={r.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
