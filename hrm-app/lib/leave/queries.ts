import { createServerClient } from '@/lib/supabase/server';

// 휴가 관련 Server Component 데이터 페칭 헬퍼. RLS가 알아서 권한 차단.

export async function getMyLeaveBalance(employeeId: string, year: number) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_leave_balances_view')
    .select('granted_days, adjusted_days, used_days, pending_days, remaining_days, year, expires_at')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .maybeSingle();
  return data;
}

export async function getActiveLeaveTypes() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_leave_types')
    .select('id, code, name, is_paid, deducts_from_annual, max_days_per_request, sort_order, color_hint, requires_attachment')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function getMyLeaveRequests(employeeId: string, limit = 50) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_leave_requests')
    .select('id, start_date, end_date, start_period, end_period, total_days, status, reason, created_at, approved_at, rejection_reason, cancellation_reason, leave_type_id, hrm_leave_types(name, code)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getApprovalsQueue(approverId: string) {
  const supabase = await createServerClient();
  // approver_id == 본인이거나, manager_id가 본인인 부하 직원 신청.
  // RLS가 manager/admin 권한을 한 번 더 검증.
  const { data } = await supabase
    .from('hrm_leave_requests')
    .select('id, employee_id, start_date, end_date, start_period, end_period, total_days, reason, status, created_at, hrm_employees!hrm_leave_requests_employee_id_fkey(name_ko, email), hrm_leave_types(name, code)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export type LeaveRequestRow = Awaited<ReturnType<typeof getMyLeaveRequests>>[number];
export type ApprovalRow = Awaited<ReturnType<typeof getApprovalsQueue>>[number];
export type LeaveType = Awaited<ReturnType<typeof getActiveLeaveTypes>>[number];
