import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail } from '@/lib/api/response';
import {
  EMPLOYEE_ALLOWED_COLUMNS,
  EMPLOYMENT_STATUS_LABEL_KO,
  ROLE_LABEL_KO,
  toCsv,
} from '@/lib/export/csv';

// 직원 CSV 익스포트. admin 전용. 연락처/주소/급여는 절대 미포함.
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('hrm_employees')
    .select('name_ko, email, role, employment_status, hire_date, job_title, position, hrm_departments(name)')
    .order('name_ko', { ascending: true });

  if (error) return fail('DB_ERROR', error.message, 500);

  const rows = (data ?? []).map((e) => {
    const dept = (e as { hrm_departments?: { name?: string } }).hrm_departments;
    return {
      이름: e.name_ko,
      이메일: e.email,
      부서: dept?.name ?? '-',
      직책: e.job_title ?? e.position ?? '-',
      권한: ROLE_LABEL_KO[e.role] ?? e.role,
      재직상태: EMPLOYMENT_STATUS_LABEL_KO[e.employment_status] ?? e.employment_status,
      입사일: e.hire_date,
    };
  });

  void supabase
    .from('hrm_audit_logs')
    .insert({
      actor_id: user.employeeId,
      action: 'export.employees_csv',
      target_table: 'hrm_employees',
      metadata: { rows: rows.length },
    })
    .then(() => undefined, () => undefined);

  const csv = toCsv(rows, EMPLOYEE_ALLOWED_COLUMNS as unknown as string[]);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="employees-${today}.csv"`,
    },
  });
}
