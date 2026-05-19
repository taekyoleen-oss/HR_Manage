import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail } from '@/lib/api/response';
import { TRAINING_ALLOWED_COLUMNS, toCsv } from '@/lib/export/csv';

// 교육·연수 이력 CSV. 관리자 전용 (RLS도 admin only modify, 본인은 본인 행만 SELECT).
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('hrm_training_records')
    .select(`
      id, title, provider, category, start_date, end_date, hours, cost,
      hrm_employees!hrm_training_records_employee_id_fkey(name_ko, hrm_departments(name))
    `)
    .order('start_date', { ascending: false })
    .limit(5000);

  if (error) return fail('DB_ERROR', error.message, 500);

  const rows = (data ?? []).map((r) => {
    const emp = (r as { hrm_employees?: { name_ko?: string; hrm_departments?: { name?: string } } }).hrm_employees;
    return {
      직원명: emp?.name_ko ?? '-',
      부서: emp?.hrm_departments?.name ?? '-',
      교육명: r.title,
      제공처: r.provider ?? '',
      카테고리: r.category ?? '',
      시작일: r.start_date,
      종료일: r.end_date ?? '',
      이수시간: r.hours != null ? String(r.hours) : '',
      비용: r.cost != null ? String(r.cost) : '',
    };
  });

  void supabase
    .from('hrm_audit_logs')
    .insert({
      actor_id: user.employeeId,
      action: 'export.training_csv',
      target_table: 'hrm_training_records',
      metadata: { rows: rows.length },
    })
    .then(() => undefined, () => undefined);

  const csv = toCsv(rows, TRAINING_ALLOWED_COLUMNS as unknown as string[]);
  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="training-${today}.csv"`,
    },
  });
}
