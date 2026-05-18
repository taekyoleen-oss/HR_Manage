import { requireUser } from '@/lib/auth/guards';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Header } from '@/components/app-shell/header';
import { MobileBottomNav } from '@/components/app-shell/mobile-bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar role={user.role} name={user.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header name={user.name} email={user.email} role={user.role} />
        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
