import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { businessTripRequestSchema } from '@/lib/validations/business-trip';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = businessTripRequestSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const { data: newId, error } = await supabase.rpc('submit_business_trip', {
    p_trip_type: v.tripType,
    p_purpose: v.purpose,
    p_destination_country: v.destinationCountry,
    p_destination_city: v.destinationCity ?? '',
    p_start_date: v.startDate,
    p_end_date: v.endDate,
    p_transportation: v.transportation,
    p_accommodation: v.accommodation ?? '',
    p_accompanying: v.accompanyingEmployeeIds,
    p_notes: v.notes ?? '',
  });

  if (error) return failFromPg(error.message);
  if (!newId) return fail('NO_ID', '신청 생성에 실패했습니다', 500);

  // 결재자에게 알림
  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: trip } = await admin
        .from('hrm_business_trips')
        .select('approver_id')
        .eq('id', newId as string)
        .maybeSingle();
      if (trip?.approver_id) {
        const destination = v.destinationCity
          ? `${v.destinationCountry} · ${v.destinationCity}`
          : v.destinationCountry;
        await notify({
          kind: 'trip_submitted',
          recipientEmployeeId: trip.approver_id,
          senderEmployeeId: user.employeeId,
          relatedResourceType: 'business_trip',
          relatedResourceId: newId as string,
          vars: {
            employeeName: user.name,
            destination,
            period: `${v.startDate}~${v.endDate}`,
            tripId: newId as string,
          },
        });
      }
    } catch {
      // ignore
    }
  })();

  return ok({ tripId: newId });
}

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'in_progress', 'completed']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  let q = supabase
    .from('hrm_business_trips')
    .select('*')
    .eq('employee_id', user.employeeId)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);
  if (parsed.data.status) q = q.eq('status', parsed.data.status);

  const { data, error } = await q;
  if (error) return failFromPg(error.message);
  return ok({ trips: data ?? [] });
}
