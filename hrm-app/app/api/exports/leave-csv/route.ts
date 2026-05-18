import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail } from '@/lib/api/response';
import {
  LEAVE_REQUEST_ALLOWED_COLUMNS,
  STATUS_LABEL_KO,
  toCsv,
} from '@/lib/export/csv';

// 휴가 신청 CSV 익스포트.
// admin: 전사 / manager: 부하 직원 / employee: 본인만.
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const supabase = await createServerClient();
  let query = supabase
    .from('hrm_leave_requests')
    .select('id, start_date, end_date, total_days, status, created_at, approved_at, employee_id, hrm_employees!hrm_leave_requests_employee_id_fkey(name_ko, hrm_departments(name)), hrm_leave_types(name)')
    .order('start_date', { ascending: false })
    .limit(2000);

  if (user.role === 'employee') {
    query = query.eq('employee_id', user.employeeId);
  } else if (user.role === 'manager') {
    // RLS 정책이 부하 직원만 노출. 별도 필터 불필요 (DB가 검증).
  }
  // admin: 모두

  const { data, error } = await query;
  if (error) return fail('DB_ERROR', error.message, 500);

  const rows = (data ?? []).map((r) => {
    const emp = (r as { hrm_employees?: { name_ko?: string; hrm_departments?: { name?: string } } }).hrm_employees;
    return {
      신청ID: r.id,
      직원명: emp?.name_ko ?? '-',
      부서: emp?.hrm_departments?.name ?? '-',
      휴가유형: r.hrm_leave_types?.name ?? '-',
      시작일: r.start_date,
      종료일: r.end_date,
      일수: Number(r.total_days).toFixed(1),
      상태: STATUS_LABEL_KO[r.status] ?? r.status,
      신청일: r.created_at?.slice(0, 10) ?? '',
      승인일: r.approved_at?.slice(0, 10) ?? '',
    };
  });

  // 감사 로그 기록 (best-effort) - DB의 hrm_audit_logs
  void supabase
    .from('hrm_audit_logs')
    .insert({
      actor_id: user.employeeId,
      action: 'export.leave_csv',
      target_table: 'hrm_leave_requests',
      metadata: { rows: rows.length, scope: user.role },
    })
    .then(() => undefined, () => undefined);

  const csv = toCsv(rows, LEAVE_REQUEST_ALLOWED_COLUMNS as unknown as string[]);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="leave-${today}.csv"`,
    },
  });
}
