import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getMyLeaveBalance, getMyLeaveRequests } from '@/lib/leave/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';
import { CalendarPlus, ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const user = await requireUser();
  const year = new Date().getFullYear();
  const [balance, requests] = await Promise.all([
    getMyLeaveBalance(user.employeeId, year),
    getMyLeaveRequests(user.employeeId, 5),
  ]);

  const remaining = balance?.remaining_days ?? 0;
  const used = balance?.used_days ?? 0;
  const pending = balance?.pending_days ?? 0;
  const granted = (balance?.granted_days ?? 0) + (balance?.adjusted_days ?? 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">휴가 관리</h1>
          <p className="text-sm text-muted-foreground">잔여 연차와 신청 현황을 확인하세요.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leave/request">
            <Button className="h-11 md:h-9"><CalendarPlus className="h-4 w-4" /> 휴가 신청</Button>
          </Link>
          <Link href="/leave/history">
            <Button variant="outline" className="h-11 md:h-9"><ListChecks className="h-4 w-4" /> 신청 이력</Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BalanceCard label="잔여" value={remaining} unit="일" tone="primary" />
        <BalanceCard label="사용" value={used} unit="일" tone="success" />
        <BalanceCard label="대기" value={pending} unit="일" tone="warning" />
        <BalanceCard label={`${year} 부여`} value={granted} unit="일" tone="muted" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>최근 신청</CardTitle>
          <CardDescription>가장 최근 5건 — 전체 이력은 신청 이력 페이지에서 확인</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <EmptyState
              title="아직 신청 내역이 없습니다"
              description="휴가 신청 버튼으로 첫 신청을 만들어보세요."
            />
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-border last:border-0 py-2 gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm md:text-base truncate">
                    {r.hrm_leave_types?.name ?? '휴가'} · {r.start_date} ~ {r.end_date}
                  </div>
                  <div className="text-xs text-muted-foreground">{Number(r.total_days)}일</div>
                </div>
                <LeaveStatusBadge status={r.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const toneClass: Record<typeof tone, string> = {
    primary: 'border-primary/30 bg-primary/5 text-primary',
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    muted: 'border-border bg-muted text-foreground',
  };
  return (
    <Card className={`border ${toneClass[tone]}`}>
      <CardContent className="p-4 md:p-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl md:text-3xl font-bold tabular-nums">
          {Number(value).toFixed(1)}
          <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
