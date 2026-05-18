import { requireAdmin } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { LeaveStatusBadge } from '@/components/common/leave-status-badge';

export const dynamic = 'force-dynamic';

export default async function AdminLeaveOverviewPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const year = new Date().getFullYear();

  const [balancesRes, requestsRes] = await Promise.all([
    supabase
      .from('hrm_leave_balances_view')
      .select('employee_id, year, granted_days, used_days, pending_days, remaining_days, hrm_employees!hrm_leave_balances_employee_id_fkey(name_ko, hrm_departments(name))')
      .eq('year', year),
    supabase
      .from('hrm_leave_requests')
      .select('id, start_date, end_date, total_days, status, hrm_employees!hrm_leave_requests_employee_id_fkey(name_ko), hrm_leave_types(name)')
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`)
      .order('start_date', { ascending: false })
      .limit(20),
  ]);

  const balances = balancesRes.data ?? [];
  const requests = requestsRes.data ?? [];

  const summary = balances.reduce(
    (acc, b) => ({
      granted: acc.granted + Number(b.granted_days ?? 0),
      used: acc.used + Number(b.used_days ?? 0),
      pending: acc.pending + Number(b.pending_days ?? 0),
      remaining: acc.remaining + Number(b.remaining_days ?? 0),
    }),
    { granted: 0, used: 0, pending: 0, remaining: 0 },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">휴가 현황</h1>
          <p className="text-sm text-muted-foreground">{year}년 전사 휴가 통계</p>
        </div>
        <a href="/api/exports/leave-csv" download>
          <Button variant="outline" className="h-11 md:h-9"><Download className="h-4 w-4" /> 휴가 CSV</Button>
        </a>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 부여" value={summary.granted} />
        <StatCard label="사용" value={summary.used} />
        <StatCard label="대기" value={summary.pending} />
        <StatCard label="잔여" value={summary.remaining} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>직원별 잔여</CardTitle>
          <CardDescription>{year}년 — {balances.length}명</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">이름</th>
                  <th className="px-4 py-2 font-medium">부서</th>
                  <th className="px-4 py-2 font-medium text-right">부여</th>
                  <th className="px-4 py-2 font-medium text-right">사용</th>
                  <th className="px-4 py-2 font-medium text-right">대기</th>
                  <th className="px-4 py-2 font-medium text-right">잔여</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b, idx) => {
                  const emp = (b as { hrm_employees?: { name_ko?: string; hrm_departments?: { name?: string } } }).hrm_employees;
                  return (
                    <tr key={`${b.employee_id}-${idx}`} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{emp?.name_ko ?? '-'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{emp?.hrm_departments?.name ?? '-'}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(b.granted_days).toFixed(1)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(b.used_days).toFixed(1)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(b.pending_days).toFixed(1)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-primary">{Number(b.remaining_days).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 신청 (20건)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {requests.map((r) => {
              const emp = (r as { hrm_employees?: { name_ko?: string } }).hrm_employees;
              return (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {emp?.name_ko ?? '-'} · {r.hrm_leave_types?.name ?? '휴가'} · {r.start_date}~{r.end_date}
                    </div>
                    <div className="text-xs text-muted-foreground">{Number(r.total_days).toFixed(1)}일</div>
                  </div>
                  <LeaveStatusBadge status={r.status} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl md:text-3xl font-bold tabular-nums">{value.toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">일</span></div>
      </CardContent>
    </Card>
  );
}
