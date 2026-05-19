import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAppUser } from '@/lib/auth/guards';
import { businessTripCancelSchema } from '@/lib/validations/business-trip';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = businessTripCancelSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('cancel_business_trip', {
    req_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? '',
  });
  if (error) return failFromPg(error.message);

  void (async () => {
    try {
      const admin = getAdminClient();
      const { data: t } = await admin
        .from('hrm_business_trips')
        .select('approver_id, destination_country, destination_city, start_date, end_date')
        .eq('id', parsed.data.requestId)
        .maybeSingle();
      if (t?.approver_id) {
        const destination = t.destination_city
          ? `${t.destination_country} · ${t.destination_city}`
          : t.destination_country;
        await notify({
          kind: 'trip_cancelled',
          recipientEmployeeId: t.approver_id,
          senderEmployeeId: user.employeeId,
          relatedResourceType: 'business_trip',
          relatedResourceId: parsed.data.requestId,
          vars: {
            employeeName: user.name,
            destination,
            period: `${t.start_date}~${t.end_date}`,
          },
        });
      }
    } catch { /* ignore */ }
  })();

  return ok({ requestId: parsed.data.requestId });
}
