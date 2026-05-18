import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { fail, ok } from '@/lib/api/response';
import { calculateAnnualLeave } from '@/lib/leave/calculator';

// 매일 01:00 실행. 회계연도 시작일 또는 입사 기념일에 해당하는 직원에게
// 연간 연차를 부여한다. (vercel cron + CRON_SECRET 인증)
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return fail('FORBIDDEN', 'Cron 인증 실패', 403);

  let admin;
  try { admin = getAdminClient(); } catch {
    return fail('NO_SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY 미설정', 500);
  }

  const today = new Date();
  const year = today.getFullYear();

  // 정책
  const { data: policies } = await admin
    .from('hrm_leave_policies')
    .select('*')
    .eq('is_active', true)
    .limit(1);
  const policy = policies?.[0];
  if (!policy) return ok({ skipped: true, reason: '정책 없음' });

  // 부여 대상 후보 직원
  let candidates;
  if (policy.basis === 'fiscal_year') {
    // 회계연도 시작일(today === policy 시작 월·일)에 해당하면 전 직원 대상
    if (today.getMonth() + 1 !== policy.fiscal_year_start_month || today.getDate() !== policy.fiscal_year_start_day) {
      return ok({ skipped: true, reason: 'today != fiscal year start' });
    }
    const { data } = await admin
      .from('hrm_employees')
      .select('id, hire_date, employment_status')
      .neq('employment_status', 'resigned');
    candidates = data ?? [];
  } else {
    // 입사일 기준 — 오늘 입사 기념일에 해당하는 직원만
    const md = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const { data } = await admin
      .from('hrm_employees')
      .select('id, hire_date, employment_status')
      .neq('employment_status', 'resigned');
    candidates = (data ?? []).filter((e) => (e.hire_date ?? '').slice(5) === md);
  }

  let grantedCount = 0;
  for (const emp of candidates) {
    const result = calculateAnnualLeave({
      hireDate: new Date(emp.hire_date),
      asOf: today,
      basis: policy.basis,
      fiscalYearStartMonth: policy.fiscal_year_start_month,
      fiscalYearStartDay: policy.fiscal_year_start_day,
    });

    // 기존 부여가 이미 있으면 skip
    const { data: existing } = await admin
      .from('hrm_leave_balances')
      .select('id, granted_days')
      .eq('employee_id', emp.id)
      .eq('year', year)
      .maybeSingle();

    if (existing && Number(existing.granted_days) >= result.totalGrantedDays) continue;

    await admin
      .from('hrm_leave_balances')
      .upsert(
        {
          employee_id: emp.id,
          year,
          granted_days: result.totalGrantedDays,
        },
        { onConflict: 'employee_id,year' },
      );

    await admin.from('hrm_leave_transactions').insert({
      employee_id: emp.id,
      transaction_type: 'grant',
      days: result.totalGrantedDays,
      reason: `[Cron] ${year} 연차 부여 — ${result.basisLabel}`,
    });

    grantedCount++;
  }

  return ok({ year, grantedCount, total: candidates.length });
}

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerAuth = req.headers.get('authorization');
  if (headerAuth === `Bearer ${secret}`) return true;
  // Vercel cron이 보내는 header
  const vercelHeader = req.headers.get('x-vercel-cron');
  return vercelHeader === '1' && headerAuth?.endsWith(secret) === true;
}
