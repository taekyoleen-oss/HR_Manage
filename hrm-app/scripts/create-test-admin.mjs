// 일회성: test@example.com / password / 관리자 계정 생성
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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = 'test@example.com';
const PASSWORD = 'password';

// 기존 동일 이메일 확인
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error('listUsers failed:', listErr);
  process.exit(1);
}
let userId = list.users.find((u) => u.email === EMAIL)?.id;

if (userId) {
  console.log(`기존 사용자 발견 (${userId}) — 비밀번호 재설정`);
  const { error: upErr } = await supabase.auth.admin.updateUserById(userId, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (upErr) {
    console.error('updateUserById failed:', upErr);
    process.exit(1);
  }
} else {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr) {
    console.error('createUser failed:', createErr);
    process.exit(1);
  }
  userId = created.user.id;
  console.log(`Auth 사용자 생성: ${userId}`);
}

// 인사팀 부서 (seed-demo-users.sql 기준)
const DEPT_HR = '10000000-0000-0000-0000-000000000004';

// 부서 존재 확인 (없으면 admin은 department NULL 허용 여부 확인 필요)
const { data: deptRow } = await supabase
  .from('hrm_departments')
  .select('id')
  .eq('id', DEPT_HR)
  .maybeSingle();

const departmentId = deptRow?.id ?? null;

// employee_no 충돌 회피: A002부터 비어있는 번호 찾기
let employeeNo = null;
for (let n = 2; n < 100; n++) {
  const candidate = `A${String(n).padStart(3, '0')}`;
  const { data: dup } = await supabase
    .from('hrm_employees')
    .select('id')
    .eq('employee_no', candidate)
    .maybeSingle();
  if (!dup) {
    employeeNo = candidate;
    break;
  }
}
if (!employeeNo) {
  console.error('빈 employee_no 슬롯을 찾지 못함');
  process.exit(1);
}

const { error: empErr } = await supabase
  .from('hrm_employees')
  .upsert(
    {
      id: userId,
      employee_no: employeeNo,
      email: EMAIL,
      name_ko: '테스트 관리자',
      role: 'admin',
      manager_id: null,
      department_id: departmentId,
      position: '관리자',
      employment_type: 'regular',
      employment_status: 'active',
      hire_date: new Date().toISOString().slice(0, 10),
    },
    { onConflict: 'id' }
  );

if (empErr) {
  console.error('hrm_employees upsert failed:', empErr);
  process.exit(1);
}

console.log(`\n✓ ${EMAIL} (admin, ${employeeNo}) 생성 완료`);
