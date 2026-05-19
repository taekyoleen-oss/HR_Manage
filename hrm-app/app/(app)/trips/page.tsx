import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getMyBusinessTrips } from '@/lib/business-trips/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TripStatusBadge } from '@/components/common/trip-status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Plane, Plus } from 'lucide-react';
import { TRIP_TYPE_LABEL } from '@/types/hrm';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const user = await requireUser();
  const trips = await getMyBusinessTrips(user.employeeId, 100);

  const counts = {
    pending: trips.filter((t) => t.status === 'pending').length,
    in_progress: trips.filter((t) => t.status === 'in_progress').length,
    completed: trips.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6" /> 출장 관리
          </h1>
          <p className="text-sm text-muted-foreground">출장 신청·진행·복귀 보고를 관리합니다.</p>
        </div>
        <Link href="/trips/new">
          <Button className="h-11 md:h-9"><Plus className="h-4 w-4" /> 출장 신청</Button>
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="결재 대기" value={counts.pending} />
        <StatCard label="진행 중" value={counts.in_progress} />
        <StatCard label="완료" value={counts.completed} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>내 출장 내역</CardTitle>
          <CardDescription>최근 신청부터 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {trips.length === 0 ? (
            <EmptyState
              title="아직 출장 내역이 없습니다"
              description="출장 신청 버튼으로 첫 신청을 만들어보세요."
            />
          ) : (
            trips.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="block border-b border-border last:border-0 py-3 hover:bg-muted/40 -mx-3 px-3 rounded transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm md:text-base truncate">
                      [{TRIP_TYPE_LABEL[t.trip_type]}] {t.destination_country}
                      {t.destination_city ? ` · ${t.destination_city}` : ''}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
