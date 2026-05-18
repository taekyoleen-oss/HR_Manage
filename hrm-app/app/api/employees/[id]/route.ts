import { NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { employeeUpdateSchema } from '@/lib/validations/employee';
import type { Database } from '@/types/hrm';

type EmployeeUpdate = Database['public']['Tables']['hrm_employees']['Update'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);

  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('hrm_employees')
    .select('*, hrm_departments(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) return failFromPg(error.message);
  if (!data) return fail('NOT_FOUND', '직원을 찾을 수 없습니다', 404);
  return ok({ employee: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = employeeUpdateSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const patch: EmployeeUpdate = {};
  if (v.nameKo !== undefined) patch.name_ko = v.nameKo;
  if (v.nameEn !== undefined) patch.name_en = v.nameEn || null;
  if (v.employeeNo !== undefined) patch.employee_no = v.employeeNo || null;
  if (v.role !== undefined) patch.role = v.role;
  if (v.employmentType !== undefined) patch.employment_type = v.employmentType;
  if (v.employmentStatus !== undefined) patch.employment_status = v.employmentStatus;
  if (v.departmentId !== undefined) patch.department_id = v.departmentId;
  if (v.managerId !== undefined) patch.manager_id = v.managerId;
  if (v.jobTitle !== undefined) patch.job_title = v.jobTitle || null;
  if (v.position !== undefined) patch.position = v.position || null;
  if (v.hireDate !== undefined) patch.hire_date = v.hireDate;
  if (v.resignationDate !== undefined) patch.resignation_date = v.resignationDate;
  if (v.phone !== undefined) patch.phone = v.phone || null;

  const supabase = await createServerClient();
  const { error } = await supabase.from('hrm_employees').update(patch).eq('id', id);
  if (error) return failFromPg(error.message);

  // 퇴사 처리 → 부하 직원 manager_id NULL + Auth 비활성화 (best-effort)
  if (v.employmentStatus === 'resigned') {
    try {
      const admin = getAdminClient();
      await admin.from('hrm_employees').update({ manager_id: null }).eq('manager_id', id);
      await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' }).catch(() => undefined);
    } catch {
      // service_role 없으면 skip - 데이터는 이미 변경됨
    }
  }

  return ok({ employeeId: id });
}
