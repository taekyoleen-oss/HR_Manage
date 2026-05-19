import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { getAllBusinessTripsForAdmin } from '@/lib/business-trips/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TripStatusBadge } from '@/components/common/trip-status-badge';
import { TRIP_TYPE_LABEL, TRIP_STATUS_LABEL, type BusinessTripStatus } from '@/types/hrm';
import { EmptyState } from '@/components/common/empty-state';

export const dynamic = 'force-dynamic';

const STATUS_TABS: { key: 'all' | BusinessTripStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: TRIP_STATUS_LABEL.pending },
  { key: 'approved', label: TRIP_STATUS_LABEL.approved },
  { key: 'in_progress', label: TRIP_STATUS_LABEL.in_progress },
  { key: 'completed', label: TRIP_STATUS_LABEL.completed },
  { key: 'rejected', label: TRIP_STATUS_LABEL.rejected },
  { key: 'cancelled', label: TRIP_STATUS_LABEL.cancelled },
];

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (sp.status ?? 'all') as 'all' | BusinessTripStatus;
  const year = sp.year ? Number(sp.year) : undefined;
  const trips = await getAllBusinessTripsForAdmin({
    status: status === 'all' ? undefined : status,
    year,
    limit: 200,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">출장 현황 (관리자)</h1>
          <p className="text-sm text-muted-foreground">전사 출장 신청·진행 현황을 한눈에 확인합니다.</p>
        </div>
        <a href="/api/exports/trips-csv">
          <Button variant="outline" className="h-11 md:h-9"><Download className="h-4 w-4" /> CSV 다운로드</Button>
        </a>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/admin/trips' : `/admin/trips?status=${t.key}`}
            className={`text-sm px-3 py-1.5 rounded-md border ${status === t.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/50'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>출장 목록</CardTitle>
          <CardDescription>{trips.length}건 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {trips.length === 0 ? (
            <EmptyState title="해당 조건의 출장이 없습니다" description="다른 상태 탭을 선택해 보세요." />
          ) : (
            trips.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="block border-b border-border last:border-0 py-3 -mx-3 px-3 rounded hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm md:text-base truncate">
                      {t.hrm_employees?.name_ko ?? ''}
                      <span className="text-muted-foreground"> · [{TRIP_TYPE_LABEL[t.trip_type]}] {t.destination_country}{t.destination_city ? ` · ${t.destination_city}` : ''}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.start_date} ~ {t.end_date} · {t.purpose}
                    </div>
                  </div>
                  <TripStatusBadge status={t.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
