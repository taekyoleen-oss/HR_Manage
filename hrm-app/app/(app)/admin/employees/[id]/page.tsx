import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/guards';
import { getEmployeeById, listDepartments, listEmployees } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EmployeeEditForm } from './employee-edit-form';

export const dynamic = 'force-dynamic';

export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [emp, departments, employees] = await Promise.all([
    getEmployeeById(id),
    listDepartments(),
    listEmployees({ includeResigned: true }),
  ]);
  if (!emp) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/admin/employees">
          <Button variant="outline" size="icon-sm" aria-label="뒤로"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{emp.name_ko}</h1>
          <p className="text-sm text-muted-foreground">{emp.email}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>인사 정보 편집</CardTitle>
          <CardDescription>변경 사항은 즉시 저장됩니다. 퇴사 처리는 별도 토글.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeEditForm
            employee={{
              id: emp.id,
              email: emp.email,
              nameKo: emp.name_ko,
              nameEn: emp.name_en ?? '',
              employeeNo: emp.employee_no ?? '',
              role: emp.role,
              employmentType: emp.employment_type,
              employmentStatus: emp.employment_status,
              hireDate: emp.hire_date,
              resignationDate: emp.resignation_date,
              departmentId: emp.department_id,
              managerId: emp.manager_id,
              jobTitle: emp.job_title ?? '',
              position: emp.position ?? '',
              phone: emp.phone ?? '',
            }}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            managers={employees.filter((e) => e.id !== emp.id && e.role !== 'employee').map((e) => ({ id: e.id, name: e.name_ko }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
