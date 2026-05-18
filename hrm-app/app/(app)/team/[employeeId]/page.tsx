import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireManagerOrAdmin } from '@/lib/auth/guards';
import { getEmployeeById } from '@/lib/employees/queries';
import { getMyLeaveBalance, getMyLeaveRequests } from '@/lib/leave/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';
import { ROLE_LABEL } from '@/lib/auth/permissions';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';

export default async function TeamMemberPage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requireManagerOrAdmin();
  const { employeeId } = await params;
  const emp = await getEmployeeById(employeeId);
  if (!emp) notFound();

  const year = new Date().getFullYear();
  const [balance, requests] = await Promise.all([
    getMyLeaveBalance(emp.id, year),
    getMyLeaveRequests(emp.id, 10),
  ]);

  const dept = (emp as { hrm_departments?: { name?: string } }).hrm_departments;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/team">
          <Button variant="outline" size="icon-sm" aria-label="뒤로"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{emp.name_ko}</h1>
          <p className="text-sm text-muted-foreground">{dept?.name ?? '부서 미지정'} · {ROLE_LABEL[emp.role]}</p>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={emp.profile_image_url ?? undefined} alt={emp.name_ko} />
            <AvatarFallback>{emp.name_ko.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle>{emp.name_ko}</CardTitle>
            <CardDescription className="truncate">{emp.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="사번" value={emp.employee_no ?? '-'} />
          <Field label="직책" value={emp.job_title ?? emp.position ?? '-'} />
          <Field label="입사일" value={emp.hire_date} />
          <Field label="연락처" value={emp.phone ?? '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{year} 잔여 연차</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">잔여</div>
            <div className="text-2xl font-bold text-primary tabular-nums">{Number(balance?.remaining_days ?? 0).toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">사용</div>
            <div className="text-2xl font-bold text-success tabular-nums">{Number(balance?.used_days ?? 0).toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">대기</div>
            <div className="text-2xl font-bold text-warning tabular-nums">{Number(balance?.pending_days ?? 0).toFixed(1)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 휴가 신청</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">신청 내역 없음</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || '-'}</div>
    </div>
  );
}
