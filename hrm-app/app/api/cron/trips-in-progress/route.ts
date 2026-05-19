import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { fail, ok } from '@/lib/api/response';

// 매일 06:00 KST 실행 (UTC 21:00 전일).
// approved 상태의 출장 중 시작일이 도래(start_date <= today AND end_date >= today)한 행을
// in_progress로 자동 전이한다. 종료일이 지난 행은 그대로 두어 직원이 복귀 보고를 작성하게 한다.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return fail('FORBIDDEN', 'Cron 인증 실패', 403);

  let admin;
  try { admin = getAdminClient(); } catch {
    return fail('NO_SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY 미설정', 500);
  }

  const { data, error } = await admin.rpc('promote_trips_in_progress');
  if (error) {
    return fail('RPC_ERROR', error.message, 500);
  }

  return ok({ promoted: Number(data ?? 0) });
}

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerAuth = req.headers.get('authorization');
  if (headerAuth === `Bearer ${secret}`) return true;
  const vercelHeader = req.headers.get('x-vercel-cron');
  return vercelHeader === '1' && headerAuth?.endsWith(secret) === true;
}
