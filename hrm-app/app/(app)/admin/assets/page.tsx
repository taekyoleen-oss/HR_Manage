import { requireAdmin } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { AssetManager } from './asset-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAssetsPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const [{ data: assets }, { data: employees }] = await Promise.all([
    supabase
      .from('hrm_assets')
      .select('id, asset_no, category, name, serial_no, purchased_at, purchase_price, status, current_assignee_id, current_assigned_at, notes, hrm_employees!hrm_assets_current_assignee_id_fkey(name_ko)')
      .order('asset_no'),
    supabase.from('hrm_employees').select('id, name_ko, employee_no').eq('employment_status', 'active').order('name_ko'),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">자산 관리</h1>
          <p className="text-sm text-muted-foreground">노트북·모니터·기타 장비 자산을 등록하고 직원에게 배정/반납 처리합니다.</p>
        </div>
        <a href="/api/exports/assets-csv">
          <Button variant="outline" className="h-11 md:h-9"><Download className="h-4 w-4" /> CSV 다운로드</Button>
        </a>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>자산 ({assets?.length ?? 0}건)</CardTitle>
          <CardDescription>배정 중인 자산은 반납 처리 후 다른 직원에게 배정 가능합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <AssetManager
            initialAssets={assets ?? []}
            employees={(employees ?? []).map((e) => ({ id: e.id, name: e.name_ko, employeeNo: e.employee_no ?? '' }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
