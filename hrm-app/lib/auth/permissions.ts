import type { UserRole } from '@/types/hrm';

// 페이지 경로별 허용 역할. middleware/layout 가드와 동기화.
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ['employee', 'manager', 'admin'],
  '/profile': ['employee', 'manager', 'admin'],
  '/profile/edit': ['employee', 'manager', 'admin'],
  '/leave': ['employee', 'manager', 'admin'],
  '/leave/request': ['employee', 'manager', 'admin'],
  '/leave/history': ['employee', 'manager', 'admin'],
  '/approvals': ['manager', 'admin'],
  '/team': ['manager', 'admin'],
  '/admin/employees': ['admin'],
  '/admin/employees/new': ['admin'],
  '/admin/organization': ['admin'],
  '/admin/leave-policy': ['admin'],
  '/admin/leave-overview': ['admin'],
  '/admin/settings': ['admin'],
};

export function isPathAllowed(path: string, role: UserRole): boolean {
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (path === route || path.startsWith(`${route}/`)) {
      return roles.includes(role);
    }
  }
  return true;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  employee: '일반 직원',
  manager: '상급자',
  admin: 'HR 관리자',
};
