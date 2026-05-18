import { requireAdmin } from '@/lib/auth/guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">시스템 설정</h1>
        <p className="text-sm text-muted-foreground">회사 정보, 이메일 발신 설정</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>이메일 (Resend)</CardTitle>
          <CardDescription>발신 도메인은 환경변수 RESEND_FROM_EMAIL로 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">RESEND_API_KEY</span>
            <span className="font-mono text-xs">{process.env.RESEND_API_KEY ? '설정됨' : '미설정 — 이메일은 hrm_email_logs에만 기록'}</span>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">RESEND_FROM_EMAIL</span>
            <span className="font-mono text-xs">{process.env.RESEND_FROM_EMAIL ?? '-'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">NEXT_PUBLIC_APP_URL</span>
            <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_APP_URL ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cron Job</CardTitle>
          <CardDescription>Vercel Cron으로 매일 실행되는 작업</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between border-b border-border py-2">
            <span>/api/cron/annual-leave-grant</span>
            <span className="text-muted-foreground">매일 01:00 — 신규 부여</span>
          </div>
          <div className="flex justify-between py-2">
            <span>/api/cron/leave-expiration</span>
            <span className="text-muted-foreground">매일 02:00 — 소멸 처리</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
