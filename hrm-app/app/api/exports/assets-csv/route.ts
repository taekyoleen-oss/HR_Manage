import { getAppUser } from '@/lib/auth/guards';
import { createServerClient } from '@/lib/supabase/server';
import { fail } from '@/lib/api/response';
import { ASSET_ALLOWED_COLUMNS, ASSET_STATUS_LABEL_KO, toCsv } from '@/lib/export/csv';

// 자산 CSV. 관리자 전용.
export async function GET() {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용입니다', 403);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('hrm_assets')
    .select(`
      id, asset_no, category, name, serial_no, status, purchased_at, purchase_price,
      hrm_employees!hrm_assets_current_assignee_id_fkey(name_ko)
    `)
    .order('asset_no')
    .limit(5000);

  if (error) return fail('DB_ERROR', error.message, 500);

  const rows = (data ?? []).map((r) => {
    const emp = (r as { hrm_employees?: { name_ko?: string } }).hrm_employees;
    return {
      자산번호: r.asset_no,
      분류: r.category,
      모델명: r.name,
      시리얼: r.serial_no ?? '',
      상태: ASSET_STATUS_LABEL_KO[r.status] ?? r.status,
      현재사용자: emp?.name_ko ?? '',
      구입일: r.purchased_at ?? '',
      구입가: r.purchase_price != null ? String(r.purchase_price) : '',
    };
  });

  void supabase
    .from('hrm_audit_logs')
    .insert({
      actor_id: user.employeeId,
      action: 'export.assets_csv',
      target_table: 'hrm_assets',
      metadata: { rows: rows.length },
    })
    .then(() => undefined, () => undefined);

  const csv = toCsv(rows, ASSET_ALLOWED_COLUMNS as unknown as string[]);
  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="assets-${today}.csv"`,
    },
  });
}
