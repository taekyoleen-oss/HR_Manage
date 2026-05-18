import { NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { employeeSelfUpdateSchema } from '@/lib/validations/employee';
import type { Database } from '@/types/hrm';

type EmployeeUpdate = Database['public']['Tables']['hrm_employees']['Update'];

// 본인이 수정 가능한 필드만 처리 - 권한·부서·직책·재직상태 등은 admin API.
export async function PATCH(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  let body: unknown;
  try { body = await req.json(); } catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = employeeSelfUpdateSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const patch: EmployeeUpdate = {};
  if (v.phone !== undefined) patch.phone = v.phone || null;
  if (v.address !== undefined) patch.address = v.address || null;
  if (v.emergencyContactName !== undefined) patch.emergency_contact_name = v.emergencyContactName || null;
  if (v.emergencyContactPhone !== undefined) patch.emergency_contact_phone = v.emergencyContactPhone || null;
  if (v.emergencyContactRelation !== undefined) patch.emergency_contact_relation = v.emergencyContactRelation || null;
  if (v.smsOptIn !== undefined) patch.sms_opt_in = v.smsOptIn;

  const supabase = await createServerClient();
  const { error } = await supabase.from('hrm_employees').update(patch).eq('id', user.employeeId);
  if (error) return failFromPg(error.message);

  return ok({ employeeId: user.employeeId });
}
