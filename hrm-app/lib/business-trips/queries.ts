import { createServerClient } from '@/lib/supabase/server';

const TRIP_BASE = `
  id, employee_id, trip_type, purpose, destination_country, destination_city,
  start_date, end_date, transportation, accommodation,
  accompanying_employee_ids, notes, status,
  approver_id, approved_at, rejection_reason,
  cancelled_at, cancellation_reason,
  completion_report, completed_at,
  created_at, updated_at
`;

export async function getMyBusinessTrips(employeeId: string, limit = 50) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_business_trips')
    .select(TRIP_BASE)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getBusinessTrip(id: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_business_trips')
    .select(`${TRIP_BASE}, hrm_employees!hrm_business_trips_employee_id_fkey(name_ko, email)`)
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function getBusinessTripEvents(tripId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_business_trip_events')
    .select('id, event_type, performed_by, notes, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function getPendingBusinessTripApprovals() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_business_trips')
    .select(`${TRIP_BASE}, hrm_employees!hrm_business_trips_employee_id_fkey(name_ko, email)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function getAllBusinessTripsForAdmin(opts?: {
  status?: string;
  year?: number;
  limit?: number;
}) {
  const supabase = await createServerClient();
  let q = supabase
    .from('hrm_business_trips')
    .select(`${TRIP_BASE}, hrm_employees!hrm_business_trips_employee_id_fkey(name_ko, email, employee_no)`)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.status) q = q.eq('status', opts.status as never);
  if (opts?.year) {
    const start = `${opts.year}-01-01`;
    const end = `${opts.year}-12-31`;
    q = q.gte('start_date', start).lte('start_date', end);
  }
  const { data } = await q;
  return data ?? [];
}

export type BusinessTripListRow = Awaited<ReturnType<typeof getMyBusinessTrips>>[number];
export type BusinessTripWithEmployee = Awaited<ReturnType<typeof getBusinessTrip>>;
