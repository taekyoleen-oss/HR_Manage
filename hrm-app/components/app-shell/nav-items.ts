import {
  LayoutDashboard,
  User,
  CalendarDays,
  Inbox,
  Users,
  Building2,
  Settings,
  BarChart3,
  UserCog,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/hrm';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  group: 'main' | 'admin';
};

export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '내 정보', href: '/profile', icon: User, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '휴가 관리', href: '/leave', icon: CalendarDays, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '결재함', href: '/approvals', icon: Inbox, roles: ['manager', 'admin'], group: 'main' },
  { label: '우리 팀', href: '/team', icon: Users, roles: ['manager', 'admin'], group: 'main' },
  { label: '직원 관리', href: '/admin/employees', icon: UserCog, roles: ['admin'], group: 'admin' },
  { label: '조직 관리', href: '/admin/organization', icon: Building2, roles: ['admin'], group: 'admin' },
  { label: '휴가 정책', href: '/admin/leave-policy', icon: ClipboardList, roles: ['admin'], group: 'admin' },
  { label: '휴가 현황', href: '/admin/leave-overview', icon: BarChart3, roles: ['admin'], group: 'admin' },
  { label: '시스템 설정', href: '/admin/settings', icon: Settings, roles: ['admin'], group: 'admin' },
];

export const MOBILE_BOTTOM_TABS: { label: string; href: string; icon: LucideIcon; roles: UserRole[] }[] = [
  { label: '홈', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { label: '휴가', href: '/leave', icon: CalendarDays, roles: ['employee', 'manager', 'admin'] },
  { label: '결재', href: '/approvals', icon: Inbox, roles: ['manager', 'admin'] },
  { label: '내정보', href: '/profile', icon: User, roles: ['employee', 'manager', 'admin'] },
];
