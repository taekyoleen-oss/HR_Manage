import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { businessTripApproveSchema } from '@/lib/validations/business-trip';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role === 'employee') return fail('FORBIDDEN', '결재 권한이 없습니다', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = businessTripApproveSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('approve_business_trip', {
    req_id: parsed.data.requestId,
  });
  if (error) return failFromPg(error.message);

  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: t } = await admin
        .from('hrm_business_trips')
        .select('employee_id, destination_country, destination_city, start_date, end_date')
        .eq('id', parsed.data.requestId)
        .maybeSingle();
      if (t) {
        const destination = t.destination_city
          ? `${t.destination_country} · ${t.destination_city}`
          : t.destination_country;
        await notify({
          kind: 'trip_approved',
          recipientEmployeeId: t.employee_id,
          senderEmployeeId: user.employeeId,
          relatedResourceType: 'business_trip',
          relatedResourceId: parsed.data.requestId,
          vars: {
            destination,
            period: `${t.start_date}~${t.end_date}`,
            tripId: parsed.data.requestId,
          },
        });
      }
    } catch { /* ignore */ }
  })();

  return ok({ requestId: parsed.data.requestId });
}
