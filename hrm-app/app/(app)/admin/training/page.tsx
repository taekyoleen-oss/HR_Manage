import { requireAdmin } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrainingManager } from './training-manager';

export const dynamic = 'force-dynamic';

export default async function AdminTrainingPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const [{ data: employees }, { data: records }] = await Promise.all([
    supabase.from('hrm_employees').select('id, name_ko, email, employee_no').eq('employment_status', 'active').order('name_ko'),
    supabase
      .from('hrm_training_records')
      .select('id, employee_id, title, provider, category, start_date, end_date, hours, cost, certificate_url, notes, hrm_employees!hrm_training_records_employee_id_fkey(name_ko)')
      .order('start_date', { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">교육·연수 관리</h1>
        <p className="text-sm text-muted-foreground">직원별 교육 이력을 등록·관리합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>교육 이력 ({records?.length ?? 0}건)</CardTitle>
          <CardDescription>최근 시작일 순으로 표시</CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingManager
            employees={(employees ?? []).map((e) => ({ id: e.id, name: e.name_ko, employeeNo: e.employee_no ?? '' }))}
            initialRecords={records ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
