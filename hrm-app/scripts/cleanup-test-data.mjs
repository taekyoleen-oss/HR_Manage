// 일회성: Playwright 시뮬레이션으로 생성된 테스트 데이터 정리.
// 대상:
//   - test@example.com이 만든 모든 출장
//   - test@example.com이 만든 모든 경조사 휴가 신청 (family_event_policy_id IS NOT NULL)
//   - test@example.com이 만든 모든 재택근무 신청
//   - "[필독] 2026 하반기 워크샵 안내" 공지
//
// SAFETY: test@example.com 계정 자체는 보존. 신청 데이터만 삭제.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'test@example.com';

// 1) test 사용자 id 찾기
const { data: emp } = await supabase
  .from('hrm_employees')
  .select('id, name_ko')
  .eq('email', TEST_EMAIL)
  .maybeSingle();

if (!emp) {
  console.error(`사용자 ${TEST_EMAIL} 미존재`);
  process.exit(1);
}
console.log(`대상 사용자: ${emp.name_ko} (${emp.id})\n`);

// 2) 출장 삭제 (events는 ON DELETE CASCADE)
const { data: trips, error: tripErr } = await supabase
  .from('hrm_business_trips')
  .delete()
  .eq('employee_id', emp.id)
  .select('id, purpose, status');
if (tripErr) console.error('trips:', tripErr.message);
console.log(`삭제된 출장 ${trips?.length ?? 0}건:`);
for (const t of trips ?? []) console.log(`  - [${t.status}] ${t.purpose}`);

// 3) 재택근무 삭제
const { data: remotes, error: rErr } = await supabase
  .from('hrm_remote_work_requests')
  .delete()
  .eq('employee_id', emp.id)
  .select('id, reason, status');
if (rErr) console.error('remote:', rErr.message);
console.log(`\n삭제된 재택근무 ${remotes?.length ?? 0}건:`);
for (const r of remotes ?? []) console.log(`  - [${r.status}] ${r.reason}`);

// 4) 경조사 휴가 삭제 (family_event_policy_id IS NOT NULL인 신청)
//    leave_transactions, leave_balances에 영향 없음 (deducts_from_annual=false)
const { data: famLeaves, error: fErr } = await supabase
  .from('hrm_leave_requests')
  .delete()
  .eq('employee_id', emp.id)
  .not('family_event_policy_id', 'is', null)
  .select('id, start_date, end_date, total_days, status');
if (fErr) console.error('family leave:', fErr.message);
console.log(`\n삭제된 경조사 휴가 ${famLeaves?.length ?? 0}건:`);
for (const l of famLeaves ?? []) console.log(`  - [${l.status}] ${l.start_date}~${l.end_date} (${l.total_days}일)`);

// 5) 테스트용 공지 삭제 (제목으로 매칭)
const { data: anns, error: aErr } = await supabase
  .from('hrm_announcements')
  .delete()
  .ilike('title', '%2026 하반기 워크샵%')
  .select('id, title');
if (aErr) console.error('announcement:', aErr.message);
console.log(`\n삭제된 공지 ${anns?.length ?? 0}건:`);
for (const a of anns ?? []) console.log(`  - ${a.title}`);

// 6) 관련 알림 정리 (best effort)
const { data: notifs } = await supabase
  .from('hrm_notifications')
  .delete()
  .eq('sender_employee_id', emp.id)
  .select('id');
console.log(`\n정리된 알림 ${notifs?.length ?? 0}건`);

console.log('\n✓ 정리 완료. test@example.com 계정 자체는 보존됨.');
