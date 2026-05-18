'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-items';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/hrm';

export function Sidebar({ role, name }: { role: UserRole; name: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const main = items.filter((i) => i.group === 'main');
  const admin = items.filter((i) => i.group === 'admin');

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-background hidden md:flex md:flex-col">
      <div className="h-14 px-4 flex items-center border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            HR
          </div>
          <span className="font-semibold">HRM</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        <SidebarGroup label="메뉴" items={main} pathname={pathname} />
        {admin.length > 0 && (
          <SidebarGroup label="관리자" items={admin} pathname={pathname} />
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="text-xs text-muted-foreground">로그인</div>
        <div className="text-sm font-medium truncate">{name}</div>
      </div>
    </aside>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof NAV_ITEMS;
  pathname: string;
}) {
  return (
    <div>
      <div className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href as never}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
