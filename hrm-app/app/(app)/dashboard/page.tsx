import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getMyLeaveBalance, getMyLeaveRequests } from '@/lib/leave/queries';
import {
  getMyApprovalsCount,
  getTeamLeaveThisMonth,
} from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';
import { CalendarDays, Inbox, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const year = new Date().getFullYear();

  const [balance, myRecent, approvalsCount, teamLeaves] = await Promise.all([
    getMyLeaveBalance(user.employeeId, year),
    getMyLeaveRequests(user.employeeId, 3),
    user.role !== 'employee' ? getMyApprovalsCount(user.employeeId) : Promise.resolve(0),
    user.role !== 'employee' ? getTeamLeaveThisMonth(user.employeeId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">안녕하세요, {user.name}님</h1>
        <p className="text-sm text-muted-foreground">{year}년 {new Date().getMonth() + 1}월 — HRM 대시보드</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> 잔여 연차</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-primary">
              {Number(balance?.remaining_days ?? 0).toFixed(1)}<span className="ml-1 text-base text-muted-foreground">일</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            사용 {Number(balance?.used_days ?? 0).toFixed(1)}일 · 대기 {Number(balance?.pending_days ?? 0).toFixed(1)}일
            <div className="mt-3">
              <Link href="/leave/request">
                <Button size="sm" className="h-9">휴가 신청</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {user.role !== 'employee' && (
          <Card className="border-warning/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5"><Inbox className="h-4 w-4" /> 결재 대기</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-warning">
                {approvalsCount}<span className="ml-1 text-base text-muted-foreground">건</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <div className="mt-3">
                <Link href="/approvals">
                  <Button size="sm" variant="outline" className="h-9">결재함 열기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {user.role !== 'employee' && (
          <Card className="border-accent/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 이달 팀 휴가</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-accent">
                {teamLeaves.length}<span className="ml-1 text-base text-muted-foreground">건</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <div className="mt-3">
                <Link href="/team">
                  <Button size="sm" variant="outline" className="h-9">우리 팀 보기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>최근 내 신청</CardTitle>
          </CardHeader>
          <CardContent>
            {myRecent.length === 0 ? (
              <EmptyState title="신청 내역이 없습니다" />
            ) : (
              <ul className="divide-y divide-border">
                {myRecent.map((r) => (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.hrm_leave_types?.name ?? '휴가'} · {r.start_date}~{r.end_date}
                      </div>
                      <div className="text-xs text-muted-foreground">{Number(r.total_days).toFixed(1)}일</div>
                    </div>
                    <LeaveStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {user.role !== 'employee' && (
          <Card>
            <CardHeader>
              <CardTitle>이달 팀 휴가 일정</CardTitle>
              <CardDescription>승인됨 + 대기 포함</CardDescription>
            </CardHeader>
            <CardContent>
              {teamLeaves.length === 0 ? (
                <EmptyState title="이번 달 휴가 일정이 없습니다" />
              ) : (
                <ul className="divide-y divide-border">
                  {teamLeaves.slice(0, 6).map((r) => {
                    const emp = (r as { hrm_employees?: { name_ko?: string } }).hrm_employees;
                    return (
                      <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {emp?.name_ko ?? '직원'} · {r.start_date}~{r.end_date}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.hrm_leave_types?.name ?? '휴가'} · {Number(r.total_days).toFixed(1)}일
                          </div>
                        </div>
                        <LeaveStatusBadge status={r.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
