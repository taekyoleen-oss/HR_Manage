import { requireAdmin } from '@/lib/auth/guards';
import { getAllFamilyEventPolicies } from '@/lib/family-events/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyManager } from './policy-manager';

export const dynamic = 'force-dynamic';

export default async function FamilyEventPolicyPage() {
  await requireAdmin();
  const policies = await getAllFamilyEventPolicies();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">경조사 기준 관리</h1>
        <p className="text-sm text-muted-foreground">
          관계×사유 조합별 부여 일수와 첨부 안내, 사용 한도를 관리합니다. 초과 일수가 필요한 경우 직원이 별도 휴가로 분리 신청합니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>정책 목록 ({policies.length}건)</CardTitle>
          <CardDescription>비활성 정책은 신청 폼에 표시되지 않습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <PolicyManager initialPolicies={policies} />
        </CardContent>
      </Card>
    </div>
  );
}
