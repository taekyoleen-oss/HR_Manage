import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary text-primary-foreground text-2xl font-bold">
            HR
          </div>
          <h1 className="text-4xl font-bold tracking-tight">사내 인사관리 시스템</h1>
          <p className="text-muted-foreground">
            인사 정보·연차/휴가·조직도·결재를 한 곳에서 관리하세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
          >
            대시보드로 이동
          </Link>
        </div>

        <div className="pt-8 text-xs text-muted-foreground">
          <p>v1.1 · Next.js 15 · Supabase · TweakCN</p>
        </div>
      </div>
    </main>
  );
}
