import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail } from '@/lib/api/response';
import {
  TRIP_ALLOWED_COLUMNS,
  TRIP_TYPE_LABEL_KO,
  TRIP_STATUS_LABEL_KO,
  TRIP_TRANSPORT_LABEL_KO,
  toCsv,
} from '@/lib/export/csv';

// 출장 CSV.
// admin: 전사 / manager: 부하 직원 (RLS 자동) / employee: 본인만 (RLS 자동)
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const supabase = await createServerClient();
  let query = supabase
    .from('hrm_business_trips')
    .select(`
      id, employee_id, trip_type, purpose, destination_country, destination_city,
      start_date, end_date, transportation, status,
      created_at, approved_at, completed_at,
      hrm_employees!hrm_business_trips_employee_id_fkey(name_ko, hrm_departments(name))
    `)
    .order('start_date', { ascending: false })
    .limit(2000);

  if (user.role === 'employee') {
    query = query.eq('employee_id', user.employeeId);
  }

  const { data, error } = await query;
  if (error) return fail('DB_ERROR', error.message, 500);

  const rows = (data ?? []).map((r) => {
    const emp = (r as { hrm_employees?: { name_ko?: string; hrm_departments?: { name?: string } } }).hrm_employees;
    const destination = r.destination_city
      ? `${r.destination_country} · ${r.destination_city}`
      : r.destination_country;
    return {
      신청ID: r.id,
      직원명: emp?.name_ko ?? '-',
      부서: emp?.hrm_departments?.name ?? '-',
      구분: TRIP_TYPE_LABEL_KO[r.trip_type] ?? r.trip_type,
      목적지: destination,
      시작일: r.start_date,
      종료일: r.end_date,
      교통수단: TRIP_TRANSPORT_LABEL_KO[r.transportation] ?? r.transportation,
      목적: r.purpose,
      상태: TRIP_STATUS_LABEL_KO[r.status] ?? r.status,
      신청일: r.created_at?.slice(0, 10) ?? '',
      승인일: r.approved_at?.slice(0, 10) ?? '',
      완료일: r.completed_at?.slice(0, 10) ?? '',
    };
  });

  void supabase
    .from('hrm_audit_logs')
    .insert({
      actor_id: user.employeeId,
      action: 'export.trips_csv',
      target_table: 'hrm_business_trips',
      metadata: { rows: rows.length, scope: user.role },
    })
    .then(() => undefined, () => undefined);

  const csv = toCsv(rows, TRIP_ALLOWED_COLUMNS as unknown as string[]);
  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="trips-${today}.csv"`,
    },
  });
}
