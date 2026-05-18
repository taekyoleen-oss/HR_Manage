import { requireAdmin } from '@/lib/auth/guards';
import { listDepartments, listEmployees } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileWarningBanner } from '@/components/app-shell/mobile-warning-banner';
import { OrganizationEditor } from './organization-editor';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationPage() {
  await requireAdmin();
  const [departments, employees] = await Promise.all([
    listDepartments(),
    listEmployees({ includeResigned: false }),
  ]);

  return (
    <div className="space-y-6">
      <MobileWarningBanner reason="조직 구조 편집은 화면 폭이 넓을 때 더 편합니다." />

      <header>
        <h1 className="text-2xl font-bold">조직 관리</h1>
        <p className="text-sm text-muted-foreground">부서·상급자 관계 관리</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>부서 목록</CardTitle>
          <CardDescription>{departments.length}개 부서</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {departments.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.name}</div>
                  {d.code && <div className="text-xs text-muted-foreground">{d.code}</div>}
                </div>
                <div className="text-xs text-muted-foreground">{d.is_active ? '활성' : '비활성'}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상급자 / 부서 배정</CardTitle>
          <CardDescription>직원별로 부서와 상급자를 빠르게 변경합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationEditor
            employees={employees.map((e) => ({
              id: e.id,
              name: e.name_ko,
              departmentId: e.department_id,
              managerId: e.manager_id,
            }))}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            managers={employees.filter((e) => e.role !== 'employee').map((e) => ({ id: e.id, name: e.name_ko }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
