import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/guards';
import { getBusinessTrip, getBusinessTripEvents } from '@/lib/business-trips/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TripStatusBadge } from '@/components/common/trip-status-badge';
import { TRIP_TYPE_LABEL, TRIP_TRANSPORT_LABEL } from '@/types/hrm';
import { TripActions } from './trip-actions';

export const dynamic = 'force-dynamic';

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [trip, events] = await Promise.all([
    getBusinessTrip(id),
    getBusinessTripEvents(id),
  ]);
  if (!trip) notFound();

  const isOwner = trip.employee_id === user.employeeId;
  const canApprove =
    (user.role === 'admin' || user.role === 'manager') &&
    trip.status === 'pending' &&
    !isOwner;
  const canCancel =
    isOwner && (trip.status === 'pending' || (trip.status === 'approved' && trip.start_date > new Date().toISOString().slice(0, 10)));
  const canComplete = isOwner && (trip.status === 'approved' || trip.status === 'in_progress');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">출장 상세</h1>
          <p className="text-sm text-muted-foreground">신청 ID: {trip.id.slice(0, 8)}</p>
        </div>
        <TripStatusBadge status={trip.status} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>출장 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <KV label="신청자">{trip.hrm_employees?.name_ko ?? ''} <span className="text-muted-foreground">({trip.hrm_employees?.email})</span></KV>
          <KV label="구분">{TRIP_TYPE_LABEL[trip.trip_type]}</KV>
          <KV label="목적지">{trip.destination_country}{trip.destination_city ? ` · ${trip.destination_city}` : ''}</KV>
          <KV label="기간">{trip.start_date} ~ {trip.end_date}</KV>
          <KV label="교통수단">{TRIP_TRANSPORT_LABEL[trip.transportation]}</KV>
          {trip.accommodation && <KV label="숙소">{trip.accommodation}</KV>}
          <KV label="목적"><div className="whitespace-pre-wrap">{trip.purpose}</div></KV>
          {trip.notes && <KV label="참고"><div className="whitespace-pre-wrap text-muted-foreground">{trip.notes}</div></KV>}
          {trip.accompanying_employee_ids && trip.accompanying_employee_ids.length > 0 && (
            <KV label="동반자">{trip.accompanying_employee_ids.length}명</KV>
          )}
          {trip.rejection_reason && (
            <KV label="반려 사유"><span className="text-destructive">{trip.rejection_reason}</span></KV>
          )}
          {trip.cancellation_reason && (
            <KV label="취소 사유"><span className="text-muted-foreground">{trip.cancellation_reason}</span></KV>
          )}
        </CardContent>
      </Card>

      {trip.completion_report && (
        <Card>
          <CardHeader>
            <CardTitle>복귀 보고서</CardTitle>
            <CardDescription>{trip.completed_at ? `제출: ${new Date(trip.completed_at).toLocaleString('ko-KR')}` : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">{trip.completion_report}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>이력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">이력 없음</p>
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between text-sm border-b border-border last:border-0 py-1.5">
                <span className="font-medium">{labelForEvent(e.event_type)}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('ko-KR')}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        {canComplete && (
          <Link href={`/trips/${trip.id}/report`}>
            <Button>복귀 보고서 작성</Button>
          </Link>
        )}
        <TripActions
          tripId={trip.id}
          canApprove={canApprove}
          canReject={canApprove}
          canCancel={canCancel}
        />
      </div>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function labelForEvent(type: string) {
  switch (type) {
    case 'submitted': return '신청 제출';
    case 'approved': return '승인됨';
    case 'rejected': return '반려됨';
    case 'cancelled': return '취소됨';
    case 'started': return '출장 시작';
    case 'completed': return '복귀 보고 완료';
    default: return type;
  }
}
