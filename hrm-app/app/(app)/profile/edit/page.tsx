import { requireUser } from '@/lib/auth/guards';
import { getEmployeeById } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileEditForm } from './profile-edit-form';

export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
  const user = await requireUser();
  const emp = await getEmployeeById(user.employeeId);
  if (!emp) return <p>직원 정보를 찾을 수 없습니다.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">내 정보 수정</h1>
        <p className="text-sm text-muted-foreground">연락처, 주소, 비상 연락처를 수정할 수 있습니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>수정 가능 항목</CardTitle>
          <CardDescription>사번, 입사일, 직책 등은 관리자만 변경할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            initial={{
              phone: emp.phone ?? '',
              address: emp.address ?? '',
              emergencyContactName: emp.emergency_contact_name ?? '',
              emergencyContactPhone: emp.emergency_contact_phone ?? '',
              emergencyContactRelation: emp.emergency_contact_relation ?? '',
              smsOptIn: emp.sms_opt_in ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
