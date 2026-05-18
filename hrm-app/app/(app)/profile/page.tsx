import Link from 'next/link';
import { requireUser } from '@/lib/auth/guards';
import { getEmployeeById } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROLE_LABEL } from '@/lib/auth/permissions';
import { Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

const EMPLOYMENT_STATUS_LABEL: Record<string, string> = {
  active: '재직',
  on_leave: '휴직',
  resigned: '퇴사',
};

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  regular: '정규직',
  contract: '계약직',
  intern: '인턴',
  part_time: '파트타임',
};

export default async function ProfilePage() {
  const user = await requireUser();
  const emp = await getEmployeeById(user.employeeId);

  if (!emp) {
    return <p className="text-sm text-muted-foreground">직원 정보를 찾을 수 없습니다.</p>;
  }

  const manager = (emp as { manager?: { name_ko?: string; email?: string } }).manager;
  const dept = (emp as { hrm_departments?: { name?: string } }).hrm_departments;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">내 정보</h1>
          <p className="text-sm text-muted-foreground">본인 인사 정보 조회</p>
        </div>
        <Link href="/profile/edit">
          <Button variant="outline" className="h-10 md:h-9"><Pencil className="h-4 w-4" /> 수정</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{emp.name_ko}{emp.name_en ? ` (${emp.name_en})` : ''}</CardTitle>
          <CardDescription>
            {dept?.name ?? '미지정'} · {emp.job_title ?? emp.position ?? '직책 미지정'} · {ROLE_LABEL[emp.role]}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="사번" value={emp.employee_no ?? '-'} />
          <Field label="이메일" value={emp.email} />
          <Field label="입사일" value={emp.hire_date} />
          <Field label="고용 형태" value={EMPLOYMENT_TYPE_LABEL[emp.employment_type] ?? emp.employment_type} />
          <Field label="재직 상태" value={EMPLOYMENT_STATUS_LABEL[emp.employment_status] ?? emp.employment_status} />
          <Field label="상급자" value={manager?.name_ko ?? '없음'} />
          <Field label="연락처" value={emp.phone ?? '-'} />
          <Field label="주소" value={emp.address ?? '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비상 연락처</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <Field label="이름" value={emp.emergency_contact_name ?? '-'} />
          <Field label="관계" value={emp.emergency_contact_relation ?? '-'} />
          <Field label="연락처" value={emp.emergency_contact_phone ?? '-'} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-all">{value || '-'}</div>
    </div>
  );
}
