import { getAdminClient } from '@/lib/supabase/admin';

// 관리자 대시보드용 전사 운영 지표.
// RLS를 우회해 정확한 총 건수를 카운트하기 위해 service_role 사용.
export async function getAdminOperationalMetrics() {
  let admin;
  try { admin = getAdminClient(); } catch {
    return null;
  }

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const [
    leavePending,
    tripPending,
    remotePending,
    tripsInProgress,
    newHiresThisMonth,
    assetsAssigned,
    assetsAvailable,
    activeEmployees,
  ] = await Promise.all([
    admin.from('hrm_leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('hrm_business_trips').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('hrm_remote_work_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('hrm_business_trips')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'in_progress'])
      .lte('start_date', isoToday)
      .gte('end_date', isoToday),
    admin.from('hrm_employees')
      .select('id', { count: 'exact', head: true })
      .gte('hire_date', monthStart)
      .lt('hire_date', monthEnd)
      .eq('employment_status', 'active'),
    admin.from('hrm_assets').select('id', { count: 'exact', head: true }).eq('status', 'assigned'),
    admin.from('hrm_assets').select('id', { count: 'exact', head: true }).eq('status', 'available'),
    admin.from('hrm_employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'active'),
  ]);

  return {
    pending: {
      leave: leavePending.count ?? 0,
      trip: tripPending.count ?? 0,
      remote: remotePending.count ?? 0,
      total: (leavePending.count ?? 0) + (tripPending.count ?? 0) + (remotePending.count ?? 0),
    },
    tripsInProgress: tripsInProgress.count ?? 0,
    newHiresThisMonth: newHiresThisMonth.count ?? 0,
    activeEmployees: activeEmployees.count ?? 0,
    assets: {
      assigned: assetsAssigned.count ?? 0,
      available: assetsAvailable.count ?? 0,
    },
  };
}

export type AdminOperationalMetrics = NonNullable<Awaited<ReturnType<typeof getAdminOperationalMetrics>>>;
