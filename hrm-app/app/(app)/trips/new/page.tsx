import { requireUser } from '@/lib/auth/guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TripRequestForm } from './trip-request-form';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewTripPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data: colleagues } = await supabase
    .from('hrm_employees')
    .select('id, name_ko, email, employee_no')
    .eq('employment_status', 'active')
    .neq('id', user.employeeId)
    .order('name_ko');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">출장 신청</h1>
        <p className="text-sm text-muted-foreground">출장 정보를 입력하고 결재를 요청하세요.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>신청 내용</CardTitle>
          <CardDescription>정확한 정보를 입력하면 결재가 빨라집니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <TripRequestForm
            colleagues={(colleagues ?? []).map((c) => ({
              id: c.id,
              name: c.name_ko,
              employeeNo: c.employee_no ?? '',
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
