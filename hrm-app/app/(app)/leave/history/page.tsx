import { requireUser } from '@/lib/auth/guards';
import { getMyLeaveRequests } from '@/lib/leave/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { CancelLeaveButton } from './cancel-leave-button';
import { canCancelLeaveRequest } from '@/lib/leave/cancellation';

export const dynamic = 'force-dynamic';

export default async function LeaveHistoryPage() {
  const user = await requireUser();
  const requests = await getMyLeaveRequests(user.employeeId, 100);
  const today = new Date();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">신청 이력</h1>
        <p className="text-sm text-muted-foreground">전체 휴가 신청 내역과 처리 결과</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{requests.length}건</CardTitle>
          <CardDescription>최근 100건까지 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {requests.length === 0 ? (
            <EmptyState title="신청 내역이 없습니다" />
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => {
                const canCancel = canCancelLeaveRequest({
                  status: r.status,
                  startDate: new Date(r.start_date),
                  asOf: today,
                });
                return (
                  <li key={r.id} className="py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.hrm_leave_types?.name ?? '휴가'}</span>
                        <LeaveStatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 text-sm">
                        {r.start_date} ~ {r.end_date} · {Number(r.total_days).toFixed(1)}일
                      </div>
                      {r.reason && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">사유: {r.reason}</div>}
                      {r.rejection_reason && (
                        <div className="mt-1 text-xs text-destructive line-clamp-2">반려 사유: {r.rejection_reason}</div>
                      )}
                      {r.cancellation_reason && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">취소 사유: {r.cancellation_reason}</div>
                      )}
                    </div>
                    {canCancel.canCancel && (
                      <CancelLeaveButton
                        requestId={r.id}
                        startDate={r.start_date}
                        endDate={r.end_date}
                        leaveTypeName={r.hrm_leave_types?.name ?? '휴가'}
                        totalDays={Number(r.total_days)}
                        previousStatus={r.status as 'pending' | 'approved'}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
