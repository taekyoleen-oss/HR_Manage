import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppUser } from '@/lib/auth/guards';
import { LoginForm } from './login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const user = await getAppUser();
  if (user && user.employmentStatus !== 'resigned') {
    redirect('/dashboard');
  }
  const { reason } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력해주세요. 데모 계정은 README 참고.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reason === 'resigned' && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            퇴사 처리된 계정입니다. 관리자에게 문의하세요.
          </div>
        )}
        <LoginForm />
        <div className="text-sm text-center text-muted-foreground">
          <Link href="/reset-password" className="text-primary hover:underline">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
