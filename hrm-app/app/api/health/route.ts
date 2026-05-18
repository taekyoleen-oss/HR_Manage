import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/hrm';

export const dynamic = 'force-dynamic';

// 셋업 검증용 헬스체크.
// - anon 호출: RLS 활성화 + 비인증 시 count=0 (정책 동작 증거)
// - ?admin=1: service_role 우회로 실제 시드된 데이터 확인
type TableName = keyof Database['public']['Tables'];

const TARGETS: TableName[] = [
  'hrm_departments',
  'hrm_leave_types',
  'hrm_leave_policies',
  'hrm_employees',
  'hrm_leave_requests',
  'hrm_leave_balances',
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const useAdmin = url.searchParams.get('admin') === '1';

  try {
    const counts: Record<string, number> = {};
    const errors: string[] = [];

    if (useAdmin) {
      const admin = getAdminClient();
      for (const table of TARGETS) {
        const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true });
        counts[table] = count ?? 0;
        if (error) errors.push(`${table}: ${error.message}`);
      }
    } else {
      const supabase = await createServerClient();
      for (const table of TARGETS) {
        const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
        counts[table] = count ?? 0;
        if (error) errors.push(`${table}: ${error.message}`);
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      mode: useAdmin ? 'admin (service_role)' : 'anon (RLS 적용)',
      counts,
      errors,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
