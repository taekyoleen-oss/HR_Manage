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
  Plane,
  Home,
  Megaphone,
  GraduationCap,
  Laptop,
  HeartHandshake,
  ArrowUpDown,
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
  { label: '출장 관리', href: '/trips', icon: Plane, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '재택근무', href: '/remote-work', icon: Home, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '공지사항', href: '/announcements', icon: Megaphone, roles: ['employee', 'manager', 'admin'], group: 'main' },
  { label: '결재함', href: '/approvals', icon: Inbox, roles: ['manager', 'admin'], group: 'main' },
  { label: '우리 팀', href: '/team', icon: Users, roles: ['manager', 'admin'], group: 'main' },
  { label: '직원 관리', href: '/admin/employees', icon: UserCog, roles: ['admin'], group: 'admin' },
  { label: '조직 관리', href: '/admin/organization', icon: Building2, roles: ['admin'], group: 'admin' },
  { label: '휴가 정책', href: '/admin/leave-policy', icon: ClipboardList, roles: ['admin'], group: 'admin' },
  { label: '경조사 정책', href: '/admin/family-event-policy', icon: HeartHandshake, roles: ['admin'], group: 'admin' },
  { label: '휴가 현황', href: '/admin/leave-overview', icon: BarChart3, roles: ['admin'], group: 'admin' },
  { label: '출장 현황', href: '/admin/trips', icon: Plane, roles: ['admin'], group: 'admin' },
  { label: '공지 관리', href: '/admin/announcements', icon: Megaphone, roles: ['admin'], group: 'admin' },
  { label: '교육·연수', href: '/admin/training', icon: GraduationCap, roles: ['admin'], group: 'admin' },
  { label: '자산 관리', href: '/admin/assets', icon: Laptop, roles: ['admin'], group: 'admin' },
  { label: '인사이동 이력', href: '/admin/position-history', icon: ArrowUpDown, roles: ['admin'], group: 'admin' },
  { label: '시스템 설정', href: '/admin/settings', icon: Settings, roles: ['admin'], group: 'admin' },
];

export const MOBILE_BOTTOM_TABS: { label: string; href: string; icon: LucideIcon; roles: UserRole[] }[] = [
  { label: '홈', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { label: '휴가', href: '/leave', icon: CalendarDays, roles: ['employee', 'manager', 'admin'] },
  { label: '출장', href: '/trips', icon: Plane, roles: ['employee', 'manager', 'admin'] },
  { label: '결재', href: '/approvals', icon: Inbox, roles: ['manager', 'admin'] },
  { label: '내정보', href: '/profile', icon: User, roles: ['employee', 'manager', 'admin'] },
];
