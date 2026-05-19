import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/guards';
import { getBusinessTrip } from '@/lib/business-trips/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TRIP_TYPE_LABEL } from '@/types/hrm';
import { ReportForm } from './report-form';

export const dynamic = 'force-dynamic';

export default async function TripReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const trip = await getBusinessTrip(id);
  if (!trip) notFound();
  if (trip.employee_id !== user.employeeId) redirect(`/trips/${id}`);
  if (trip.status !== 'approved' && trip.status !== 'in_progress') redirect(`/trips/${id}`);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">복귀 보고서</h1>
        <p className="text-sm text-muted-foreground">
          [{TRIP_TYPE_LABEL[trip.trip_type]}] {trip.destination_country}{trip.destination_city ? ` · ${trip.destination_city}` : ''} · {trip.start_date} ~ {trip.end_date}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>보고서 작성</CardTitle>
          <CardDescription>주요 활동, 성과, 후속 조치를 정리해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm tripId={trip.id} initialReport={trip.completion_report ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
