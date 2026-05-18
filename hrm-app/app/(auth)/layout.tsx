import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="h-14 flex items-center px-6 border-b border-border bg-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            HR
          </div>
          <span className="font-semibold">HRM</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="h-12 flex items-center justify-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HRM · 사내 인사관리 시스템
      </footer>
    </div>
  );
}
