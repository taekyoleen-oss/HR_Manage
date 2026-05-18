import { NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { organizationUpdateSchema } from '@/lib/validations/employee';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  let body: unknown;
  try { body = await req.json(); } catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = organizationUpdateSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  if (v.managerId === v.employeeId) {
    return fail('SELF_MANAGER', '자기 자신을 상급자로 지정할 수 없습니다', 422);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('hrm_employees')
    .update({
      department_id: v.departmentId,
      manager_id: v.managerId,
    })
    .eq('id', v.employeeId);
  if (error) return failFromPg(error.message);

  return ok({ employeeId: v.employeeId });
}
