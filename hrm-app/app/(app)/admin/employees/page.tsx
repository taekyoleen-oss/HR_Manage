import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { listEmployees } from '@/lib/employees/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROLE_LABEL } from '@/lib/auth/permissions';
import { Plus, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { active: '재직', on_leave: '휴직', resigned: '퇴사' };

export default async function AdminEmployeesPage() {
  await requireAdmin();
  const employees = await listEmployees({ includeResigned: false });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">직원 관리</h1>
          <p className="text-sm text-muted-foreground">전체 {employees.length}명 · 재직 중</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/employees/new"><Button className="h-11 md:h-9"><Plus className="h-4 w-4" /> 신규 등록</Button></Link>
          <a href="/api/exports/employees-csv" download>
            <Button variant="outline" className="h-11 md:h-9"><Download className="h-4 w-4" /> CSV</Button>
          </a>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          {/* 데스크탑 테이블 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">부서</th>
                  <th className="px-4 py-3 font-medium">직책</th>
                  <th className="px-4 py-3 font-medium">권한</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">입사일</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const dept = (e as { hrm_departments?: { name?: string } }).hrm_departments;
                  return (
                    <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{e.name_ko}<div className="text-xs text-muted-foreground">{e.email}</div></td>
                      <td className="px-4 py-3 text-muted-foreground">{dept?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.job_title ?? e.position ?? '-'}</td>
                      <td className="px-4 py-3">{ROLE_LABEL[e.role]}</td>
                      <td className="px-4 py-3">{STATUS_LABEL[e.employment_status] ?? e.employment_status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.hire_date}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/employees/${e.id}`}>
                          <Button variant="outline" size="sm" className="h-8">상세</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <ul className="md:hidden divide-y divide-border">
            {employees.map((e) => {
              const dept = (e as { hrm_departments?: { name?: string } }).hrm_departments;
              return (
                <li key={e.id}>
                  <Link href={`/admin/employees/${e.id}`} className="block p-4 active:bg-muted/40">
                    <div className="font-medium">{e.name_ko}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.email}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span>{dept?.name ?? '-'}</span>
                      <span>{e.job_title ?? e.position ?? '-'}</span>
                      <span>{ROLE_LABEL[e.role]}</span>
                      <span>{STATUS_LABEL[e.employment_status] ?? e.employment_status}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
