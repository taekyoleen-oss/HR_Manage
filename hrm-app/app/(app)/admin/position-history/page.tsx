import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { POSITION_CHANGE_LABEL, type PositionChangeType } from '@/types/hrm';
import { EmptyState } from '@/components/common/empty-state';
import { PositionHistoryForm } from './position-history-form';

export const dynamic = 'force-dynamic';

export default async function PositionHistoryPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const [{ data: history }, { data: employees }, { data: departments }] = await Promise.all([
    supabase
      .from('hrm_position_history')
      .select(`id, employee_id, change_type, effective_date,
        from_department_id, to_department_id, from_position, to_position, from_role, to_role, notes, created_at,
        hrm_employees!hrm_position_history_employee_id_fkey(name_ko, employee_no)`)
      .order('effective_date', { ascending: false })
      .limit(200),
    supabase.from('hrm_employees').select('id, name_ko, employee_no').order('name_ko'),
    supabase.from('hrm_departments').select('id, name').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">인사이동 이력</h1>
        <p className="text-sm text-muted-foreground">입사·승진·부서 이동·퇴사 이력을 기록합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>새 이력 추가</CardTitle>
          <CardDescription>적용일·변경 유형·전후 값을 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <PositionHistoryForm
            employees={(employees ?? []).map((e) => ({ id: e.id, name: e.name_ko, employeeNo: e.employee_no ?? '' }))}
            departments={(departments ?? []).map((d) => ({ id: d.id, name: d.name }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 이력 ({history?.length ?? 0}건)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(history?.length ?? 0) === 0 ? (
            <EmptyState title="아직 기록된 이력이 없습니다" description="상단 폼으로 첫 이력을 추가하세요." />
          ) : (
            history!.map((h) => {
              const emp = (h as { hrm_employees?: { name_ko?: string; employee_no?: string } }).hrm_employees;
              return (
                <Link
                  key={h.id}
                  href={`/admin/employees/${h.employee_id}`}
                  className="block border-b border-border last:border-0 py-3 -mx-3 px-3 rounded hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">
                        {emp?.name_ko ?? '직원'}
                        <span className="text-muted-foreground"> · {h.effective_date}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {h.from_position && h.to_position ? `${h.from_position} → ${h.to_position}` : null}
                        {h.notes ? ` · ${h.notes}` : ''}
                      </div>
                    </div>
                    <Badge variant="outline">{POSITION_CHANGE_LABEL[h.change_type as PositionChangeType]}</Badge>
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
