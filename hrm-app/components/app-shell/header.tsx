'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { ROLE_LABEL } from '@/lib/auth/permissions';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { UserRole } from '@/types/hrm';
import { toast } from 'sonner';

export function Header({
  name,
  email,
  role,
  onToggleMobileNav,
}: {
  name: string;
  email: string;
  role: UserRole;
  onToggleMobileNav?: () => void;
}) {
  const router = useRouter();
  const initial = name.slice(0, 1);

  async function onLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('로그아웃 실패', { description: error.message });
      return;
    }
    router.refresh();
    router.push('/login');
  }

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 md:px-6 gap-3">
      {onToggleMobileNav && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileNav} aria-label="메뉴 열기">
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
          HR
        </div>
        <span className="font-semibold">HRM</span>
      </Link>

      <div className="flex-1" />

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">{initial}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium leading-tight">{name}</div>
              <div className="text-xs text-muted-foreground leading-tight">{ROLE_LABEL[role]}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">내 정보</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit">정보 수정</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
