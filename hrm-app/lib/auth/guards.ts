import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/hrm';

export type AppUser = {
  authUserId: string;
  email: string;
  employeeId: string;
  name: string;
  role: UserRole;
  managerId: string | null;
  departmentId: string | null;
  employmentStatus: string;
};

// 현재 세션에서 employees join한 사용자 컨텍스트를 반환. 없으면 null.
export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: emp } = await supabase
    .from('hrm_employees')
    .select('id, email, name_ko, role, manager_id, department_id, employment_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!emp) return null;

  return {
    authUserId: user.id,
    email: emp.email,
    employeeId: emp.id,
    name: emp.name_ko,
    role: emp.role,
    managerId: emp.manager_id,
    departmentId: emp.department_id,
    employmentStatus: emp.employment_status,
  };
}

export async function requireUser(): Promise<AppUser> {
  const u = await getAppUser();
  if (!u) redirect('/login');
  if (u.employmentStatus === 'resigned') redirect('/login?reason=resigned');
  return u;
}

export async function requireRole(roles: UserRole[]): Promise<AppUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect('/dashboard?denied=1');
  return u;
}

export async function requireAdmin(): Promise<AppUser> {
  return requireRole(['admin']);
}

export async function requireManagerOrAdmin(): Promise<AppUser> {
  return requireRole(['manager', 'admin']);
}
