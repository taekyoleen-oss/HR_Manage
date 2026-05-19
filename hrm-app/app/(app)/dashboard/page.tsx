import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getMyLeaveBalance, getMyLeaveRequests } from '@/lib/leave/queries';
import {
  getMyApprovalsCount,
  getTeamLeaveThisMonth,
} from '@/lib/employees/queries';
import { getActiveAnnouncements } from '@/lib/announcements/queries';
import { getUpcomingAnniversaries } from '@/lib/anniversaries';
import { getAdminOperationalMetrics } from '@/lib/admin-metrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';
import { CalendarDays, Cake, Gift, Inbox, Megaphone, Users, Plane, UserPlus, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { ANNOUNCEMENT_CATEGORY_LABEL, type AnnouncementCategory } from '@/types/hrm';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const year = new Date().getFullYear();

  const [balance, myRecent, approvalsCount, teamLeaves, announcements, anniversaries, adminMetrics] = await Promise.all([
    getMyLeaveBalance(user.employeeId, year),
    getMyLeaveRequests(user.employeeId, 3),
    user.role !== 'employee' ? getMyApprovalsCount(user.employeeId) : Promise.resolve(0),
    user.role !== 'employee' ? getTeamLeaveThisMonth(user.employeeId) : Promise.resolve([]),
    getActiveAnnouncements(3),
    getUpcomingAnniversaries(14),
    user.role === 'admin' ? getAdminOperationalMetrics() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">안녕하세요, {user.name}님</h1>
        <p className="text-sm text-muted-foreground">{year}년 {new Date().getMonth() + 1}월 — HRM 대시보드</p>
      </header>

      {adminMetrics && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">관리자 운영 지표</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Inbox className="h-3.5 w-3.5" /> 전사 대기 결재</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {adminMetrics.pending.total}<span className="ml-1 text-xs text-muted-foreground font-medium">건</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  휴가 {adminMetrics.pending.leave} · 출장 {adminMetrics.pending.trip} · 재택 {adminMetrics.pending.remote}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Plane className="h-3.5 w-3.5" /> 오늘 출장중</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{adminMetrics.tripsInProgress}<span className="ml-1 text-xs text-muted-foreground font-medium">명</span></div>
                <div className="mt-1 text-[10px] text-muted-foreground">시작일 도래 + 미완료</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserPlus className="h-3.5 w-3.5" /> 이달 신규 입사</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{adminMetrics.newHiresThisMonth}<span className="ml-1 text-xs text-muted-foreground font-medium">명</span></div>
                <div className="mt-1 text-[10px] text-muted-foreground">활성 전체 {adminMetrics.activeEmployees}명</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Laptop className="h-3.5 w-3.5" /> 자산 배정</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{adminMetrics.assets.assigned}<span className="ml-1 text-xs text-muted-foreground font-medium">건</span></div>
                <div className="mt-1 text-[10px] text-muted-foreground">보관 중 {adminMetrics.assets.available}건</div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

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
            <div className="mt-3 flex gap-1.5">
              <Link href="/leave/request"><Button size="sm" className="h-9">휴가 신청</Button></Link>
              <Link href="/trips/new"><Button size="sm" variant="outline" className="h-9">출장 신청</Button></Link>
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
                <Link href="/approvals"><Button size="sm" variant="outline" className="h-9">결재함 열기</Button></Link>
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
                <Link href="/team"><Button size="sm" variant="outline" className="h-9">우리 팀 보기</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> 최근 공지사항</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <EmptyState title="등록된 공지가 없습니다" />
            ) : (
              <ul className="divide-y divide-border">
                {announcements.map((a) => (
                  <li key={a.id} className="py-2.5">
                    <Link href="/announcements" className="block">
                      <div className="text-sm font-medium truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ANNOUNCEMENT_CATEGORY_LABEL[a.category as AnnouncementCategory]} ·
                        {' '}{new Date(a.published_at).toLocaleDateString('ko-KR')}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/announcements"><Button size="sm" variant="outline" className="h-9">전체 보기</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cake className="h-5 w-5" /> 다가오는 기념일 (2주)</CardTitle>
            <CardDescription>생일·입사 N주년</CardDescription>
          </CardHeader>
          <CardContent>
            {anniversaries.birthdays.length === 0 && anniversaries.hireAnniversaries.length === 0 ? (
              <EmptyState title="2주 내 기념일이 없습니다" />
            ) : (
              <ul className="divide-y divide-border">
                {anniversaries.birthdays.map((b) => (
                  <li key={`b-${b.id}`} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        <Cake className="h-3.5 w-3.5 text-warning" /> {b.name_ko}님 생일
                      </div>
                      <div className="text-xs text-muted-foreground">{b.occurOn}</div>
                    </div>
                  </li>
                ))}
                {anniversaries.hireAnniversaries.map((h) => (
                  <li key={`h-${h.id}`} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-accent" /> {h.name_ko}님 입사 {h.years}주년
                      </div>
                      <div className="text-xs text-muted-foreground">{h.occurOn}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
