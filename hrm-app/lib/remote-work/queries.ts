import { createServerClient } from '@/lib/supabase/server';

const BASE = `id, employee_id, start_date, end_date, total_days, reason,
  work_location, contact_method, status, approver_id, approved_at,
  rejection_reason, cancelled_at, created_at`;

export async function getMyRemoteWork(employeeId: string, limit = 50) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_remote_work_requests')
    .select(BASE)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPendingRemoteWorkApprovals() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_remote_work_requests')
    .select(`${BASE}, hrm_employees!hrm_remote_work_requests_employee_id_fkey(name_ko, email)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data ?? [];
}
