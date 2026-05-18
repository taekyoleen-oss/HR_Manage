'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOBILE_BOTTOM_TABS } from './nav-items';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/hrm';

export function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const tabs = MOBILE_BOTTOM_TABS.filter((t) => t.roles.includes(role));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border"
      aria-label="모바일 하단 내비게이션"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href as never}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors min-h-[56px]',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
