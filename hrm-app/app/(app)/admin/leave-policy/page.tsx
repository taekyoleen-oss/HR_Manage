import { requireAdmin } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeavePolicyForm } from './leave-policy-form';

export const dynamic = 'force-dynamic';

export default async function AdminLeavePolicyPage() {
  await requireAdmin();
  const supabase = await createServerClient();

  const { data: policies } = await supabase
    .from('hrm_leave_policies')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: types } = await supabase
    .from('hrm_leave_types')
    .select('*')
    .order('sort_order', { ascending: true });

  const policy = policies?.[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">휴가 정책</h1>
        <p className="text-sm text-muted-foreground">연차 산정 기준과 휴가 유형을 관리합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>연차 산정 기준</CardTitle>
          <CardDescription>회계연도 또는 입사일 기준으로 토글합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {policy ? (
            <LeavePolicyForm
              policy={{
                id: policy.id,
                basis: policy.basis,
                fiscalYearStartMonth: policy.fiscal_year_start_month,
                fiscalYearStartDay: policy.fiscal_year_start_day,
                maxCarryoverDays: Number(policy.max_carryover_days ?? 0),
                promotionFirstWarnMonths: policy.promotion_first_warn_months ?? 6,
                promotionSecondWarnMonths: policy.promotion_second_warn_months ?? 2,
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">활성 정책이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>휴가 유형</CardTitle>
          <CardDescription>활성 {types?.filter((t) => t.is_active).length ?? 0}개 / 전체 {types?.length ?? 0}개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">코드</th>
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">유급</th>
                  <th className="px-3 py-2 font-medium">연차 차감</th>
                  <th className="px-3 py-2 font-medium">활성</th>
                </tr>
              </thead>
              <tbody>
                {(types ?? []).map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2">{t.is_paid ? '○' : '—'}</td>
                    <td className="px-3 py-2">{t.deducts_from_annual ? '○' : '—'}</td>
                    <td className="px-3 py-2">{t.is_active ? '활성' : '비활성'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
