import { requireUser } from '@/lib/auth/guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RemoteWorkForm } from './remote-work-form';

export const dynamic = 'force-dynamic';

export default async function NewRemoteWorkPage() {
  await requireUser();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">재택근무 신청</h1>
        <p className="text-sm text-muted-foreground">사유와 일정을 입력하고 결재를 요청하세요.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>신청 내용</CardTitle>
          <CardDescription>승인 후 해당 기간에 재택근무가 가능합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <RemoteWorkForm />
        </CardContent>
      </Card>
    </div>
  );
}
