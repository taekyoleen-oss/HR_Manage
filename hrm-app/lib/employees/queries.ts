import { createServerClient } from '@/lib/supabase/server';

// 직원/조직 관련 Server Component 쿼리 헬퍼.

export async function getEmployeeById(id: string) {
  const supabase = await createServerClient();
  const { data: emp } = await supabase
    .from('hrm_employees')
    .select('*, hrm_departments(id, name, code)')
    .eq('id', id)
    .maybeSingle();
  if (!emp) return null;

  // 상급자 정보는 별도 조회 (FK alias join이 일부 supabase-js 버전과 호환 이슈)
  let manager: { id: string; name_ko: string; email: string } | null = null;
  if (emp.manager_id) {
    const { data: m } = await supabase
      .from('hrm_employees')
      .select('id, name_ko, email')
      .eq('id', emp.manager_id)
      .maybeSingle();
    if (m) manager = m;
  }
  return { ...emp, manager };
}

export async function listEmployees(opts?: { includeResigned?: boolean }) {
  const supabase = await createServerClient();
  let q = supabase
    .from('hrm_employees')
    .select('id, name_ko, email, role, position, job_title, employment_status, hire_date, department_id, manager_id, phone, hrm_departments(name)')
    .order('name_ko', { ascending: true });
  if (!opts?.includeResigned) q = q.neq('employment_status', 'resigned');
  const { data } = await q;
  return data ?? [];
}

export async function getDirectReports(managerId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_employees')
    .select('id, name_ko, email, role, position, job_title, employment_status, hire_date, department_id, profile_image_url, hrm_departments(name)')
    .eq('manager_id', managerId)
    .neq('employment_status', 'resigned')
    .order('name_ko', { ascending: true });
  return data ?? [];
}

export async function listDepartments() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_departments')
    .select('id, name, code, parent_id, sort_order, is_active')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function getMyApprovalsCount(approverId: string): Promise<number> {
  const supabase = await createServerClient();
  const { count } = await supabase
    .from('hrm_leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('approver_id', approverId)
    .eq('status', 'pending');
  return count ?? 0;
}

export async function getTeamLeaveThisMonth(managerId: string) {
  const supabase = await createServerClient();
  const today = new Date();
  const first = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const last = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  const { data: reports } = await supabase
    .from('hrm_employees')
    .select('id')
    .eq('manager_id', managerId);
  const ids = (reports ?? []).map((r) => r.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from('hrm_leave_requests')
    .select('id, employee_id, start_date, end_date, total_days, status, hrm_employees!hrm_leave_requests_employee_id_fkey(name_ko), hrm_leave_types(name)')
    .in('employee_id', ids)
    .in('status', ['approved', 'pending'])
    .gte('start_date', first)
    .lte('end_date', last)
    .order('start_date', { ascending: true });
  return data ?? [];
}
