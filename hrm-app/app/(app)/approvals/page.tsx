import { requireManagerOrAdmin } from '@/lib/auth/guards';
import { getApprovalsQueue } from '@/lib/leave/queries';
import { getPendingBusinessTripApprovals } from '@/lib/business-trips/queries';
import { getPendingRemoteWorkApprovals } from '@/lib/remote-work/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { ApprovalActions } from './approval-actions';
import { TripApprovalActions } from './trip-approval-actions';
import { RemoteApprovalActions } from './remote-approval-actions';
import { Inbox } from 'lucide-react';
import { TRIP_TYPE_LABEL } from '@/types/hrm';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const user = await requireManagerOrAdmin();
  const [leaveRows, tripRows, remoteRows] = await Promise.all([
    getApprovalsQueue(user.employeeId),
    getPendingBusinessTripApprovals(),
    getPendingRemoteWorkApprovals(),
  ]);

  const total = leaveRows.length + tripRows.length + remoteRows.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">결재함</h1>
        <p className="text-sm text-muted-foreground">대기 중인 결재 {total}건</p>
      </header>

      <Tabs defaultValue="leave">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="leave" className="flex-1 md:flex-initial">휴가 ({leaveRows.length})</TabsTrigger>
          <TabsTrigger value="trip" className="flex-1 md:flex-initial">출장 ({tripRows.length})</TabsTrigger>
          <TabsTrigger value="remote" className="flex-1 md:flex-initial">재택 ({remoteRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>휴가 결재 대기 {leaveRows.length}건</CardTitle>
              <CardDescription>오래된 신청 순으로 표시</CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRows.length === 0 ? (
                <EmptyState icon={Inbox} title="대기 중인 휴가 결재가 없습니다" description="새 휴가 신청이 들어오면 여기 표시됩니다." />
              ) : (
                <ul className="divide-y divide-border">
                  {leaveRows.map((r) => {
                    const emp = (r as { hrm_employees?: { name_ko?: string; email?: string } }).hrm_employees;
                    return (
                      <li key={r.id} className="py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{emp?.name_ko ?? '직원'} · {r.hrm_leave_types?.name ?? '휴가'}</div>
                          <div className="mt-1 text-sm">{r.start_date} ~ {r.end_date} · {Number(r.total_days).toFixed(1)}일</div>
                          {r.reason && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">사유: {r.reason}</div>}
                          <div className="mt-1 text-xs text-muted-foreground">신청 {formatDate(r.created_at)}</div>
                        </div>
                        <ApprovalActions
                          requestId={r.id}
                          employeeName={emp?.name_ko ?? '직원'}
                          summary={`${r.hrm_leave_types?.name ?? '휴가'} ${r.start_date}~${r.end_date}`}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip">
          <Card>
            <CardHeader>
              <CardTitle>출장 결재 대기 {tripRows.length}건</CardTitle>
            </CardHeader>
            <CardContent>
              {tripRows.length === 0 ? (
                <EmptyState icon={Inbox} title="대기 중인 출장 결재가 없습니다" />
              ) : (
                <ul className="divide-y divide-border">
                  {tripRows.map((t) => {
                    const emp = (t as { hrm_employees?: { name_ko?: string; email?: string } }).hrm_employees;
                    return (
                      <li key={t.id} className="py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            {emp?.name_ko ?? '직원'} · [{TRIP_TYPE_LABEL[t.trip_type]}] {t.destination_country}{t.destination_city ? ` · ${t.destination_city}` : ''}
                          </div>
                          <div className="mt-1 text-sm">{t.start_date} ~ {t.end_date}</div>
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">목적: {t.purpose}</div>
                          <div className="mt-1 text-xs text-muted-foreground">신청 {formatDate(t.created_at)}</div>
                        </div>
                        <TripApprovalActions tripId={t.id} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote">
          <Card>
            <CardHeader>
              <CardTitle>재택근무 결재 대기 {remoteRows.length}건</CardTitle>
            </CardHeader>
            <CardContent>
              {remoteRows.length === 0 ? (
                <EmptyState icon={Inbox} title="대기 중인 재택 결재가 없습니다" />
              ) : (
                <ul className="divide-y divide-border">
                  {remoteRows.map((r) => {
                    const emp = (r as { hrm_employees?: { name_ko?: string; email?: string } }).hrm_employees;
                    return (
                      <li key={r.id} className="py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{emp?.name_ko ?? '직원'} · 재택근무</div>
                          <div className="mt-1 text-sm">{r.start_date} ~ {r.end_date} · {r.total_days}일</div>
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">사유: {r.reason}</div>
                          <div className="mt-1 text-xs text-muted-foreground">신청 {formatDate(r.created_at)}</div>
                        </div>
                        <RemoteApprovalActions requestId={r.id} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
