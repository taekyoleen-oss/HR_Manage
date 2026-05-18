// 시드로 직접 INSERT한 auth.users는 confirmation_token 등 컬럼이 NULL이라
// GoTrue가 "Database error querying schema" 500을 던진다.
// admin API의 updateUserById로 비밀번호를 다시 세팅하면 GoTrue가 row를 정리해
// 정상화된다. .env.local의 SUPABASE_SERVICE_ROLE_KEY로 실행.
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

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (error) {
  console.error('listUsers failed:', error);
  process.exit(1);
}

let count = 0;
for (const u of data.users) {
  if (!u.email?.endsWith('@hrm.demo')) continue;
  const { error: upErr } = await supabase.auth.admin.updateUserById(u.id, {
    password: 'Demo!2026',
    email_confirm: true,
  });
  if (upErr) {
    console.error(`  ✗ ${u.email}:`, upErr.message);
  } else {
    count++;
    console.log(`  ✓ ${u.email}`);
  }
}
console.log(`\nFixed ${count} demo users.`);
