import { NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';
import { employeeCreateSchema } from '@/lib/validations/employee';
import { notify } from '@/lib/notify';

export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('hrm_employees')
    .select('id, name_ko, email, role, employment_status, department_id, manager_id, hire_date, job_title, position')
    .order('name_ko', { ascending: true });
  if (error) return failFromPg(error.message);
  return ok({ employees: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 권한이 필요합니다', 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400);
  }

  const parsed = employeeCreateSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  // 1) Auth 사용자 초대 (service_role)
  let admin;
  try {
    admin = getAdminClient();
  } catch {
    return fail('NO_SERVICE_ROLE', '서비스 키가 없어 직원을 생성할 수 없습니다', 500);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(v.email, {
    redirectTo: `${appUrl}/reset-password`,
  });
  if (inviteError || !invited?.user) {
    return fail('INVITE_FAILED', inviteError?.message ?? '초대에 실패했습니다', 500);
  }

  // 2) hrm_employees row insert (service_role로 우회)
  const { error: insertError } = await admin.from('hrm_employees').insert({
    id: invited.user.id,
    email: v.email,
    name_ko: v.nameKo,
    name_en: v.nameEn || null,
    employee_no: v.employeeNo || null,
    role: v.role,
    employment_type: v.employmentType,
    department_id: v.departmentId ?? null,
    manager_id: v.managerId ?? null,
    job_title: v.jobTitle || null,
    position: v.position || null,
    hire_date: v.hireDate,
    phone: v.phone || null,
  });

  if (insertError) {
    // 실패 시 Auth 사용자 정리 시도 (best-effort)
    await admin.auth.admin.deleteUser(invited.user.id).catch(() => undefined);
    return failFromPg(insertError.message);
  }

  // 직원 초대는 이메일 채널만 사용 (인앱은 계정 미생성 상태라 불가)
  // Supabase Auth가 invite 이메일을 이미 보냈으므로 여기서는 hrm_notifications에 기록만.
  // Resend가 설정되어 있다면 보조 알림도 발송.
  void notify({
    kind: 'employee_invitation',
    recipientEmployeeId: invited.user.id,
    senderEmployeeId: user.employeeId,
    relatedResourceType: 'employee',
    relatedResourceId: invited.user.id,
    vars: {
      employeeName: v.nameKo,
      inviteLink: `${appUrl}/reset-password`,
    },
  }).catch(() => undefined);

  return ok({ employeeId: invited.user.id });
}
