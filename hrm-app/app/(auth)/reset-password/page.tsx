import Link from 'next/link';
import { ResetPasswordForm } from './reset-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
        <CardDescription>
          가입된 이메일을 입력하시면 재설정 링크를 보내드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResetPasswordForm />
        <div className="text-sm text-center text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
