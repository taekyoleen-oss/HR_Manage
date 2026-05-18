import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { fail, ok } from '@/lib/api/response';

// 매일 02:00 실행. expires_at 도과한 balance 행의 잔여 일수를 0으로 만들고
// adjusted_days를 음수로 기록하여 소멸 처리한다.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return fail('FORBIDDEN', 'Cron 인증 실패', 403);

  let admin;
  try { admin = getAdminClient(); } catch {
    return fail('NO_SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY 미설정', 500);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  // 만료 도래 + 잔여가 남은 row만
  const { data: expired } = await admin
    .from('hrm_leave_balances')
    .select('id, employee_id, year, granted_days, adjusted_days, used_days, pending_days, expires_at')
    .lte('expires_at', todayIso);

  let expiredCount = 0;
  for (const row of expired ?? []) {
    const remaining = Number(row.granted_days) + Number(row.adjusted_days) - Number(row.used_days) - Number(row.pending_days);
    if (remaining <= 0) continue;

    await admin
      .from('hrm_leave_balances')
      .update({
        adjusted_days: Number(row.adjusted_days) - remaining,
        expires_at: null,
      })
      .eq('id', row.id);

    await admin.from('hrm_leave_transactions').insert({
      employee_id: row.employee_id,
      transaction_type: 'expire',
      days: remaining,
      reason: `[Cron] ${row.year} 연차 소멸`,
    });

    expiredCount++;
  }

  return ok({ checked: expired?.length ?? 0, expiredCount });
}

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerAuth = req.headers.get('authorization');
  if (headerAuth === `Bearer ${secret}`) return true;
  const vercelHeader = req.headers.get('x-vercel-cron');
  return vercelHeader === '1' && headerAuth?.endsWith(secret) === true;
}
