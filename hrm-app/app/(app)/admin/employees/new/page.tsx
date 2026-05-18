import { requireAdmin } from '@/lib/auth/guards';
import { listDepartments, listEmployees } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileWarningBanner } from '@/components/app-shell/mobile-warning-banner';
import { EmployeeCreateForm } from './employee-create-form';

export const dynamic = 'force-dynamic';

export default async function AdminEmployeeNewPage() {
  await requireAdmin();
  const [departments, employees] = await Promise.all([listDepartments(), listEmployees({ includeResigned: false })]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <MobileWarningBanner reason="신규 직원 등록 폼은 입력 항목이 많아 PC 권장." />

      <header>
        <h1 className="text-2xl font-bold">신규 직원 등록</h1>
        <p className="text-sm text-muted-foreground">기본 정보를 입력하면 Supabase Auth 계정과 직원 row가 함께 생성됩니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>이메일로 초대 메일이 발송됩니다. 비밀번호는 직원이 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeCreateForm
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            managers={employees.filter((e) => e.role !== 'employee').map((e) => ({ id: e.id, name: e.name_ko }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
