import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/hrm';

// ⚠️ service_role 클라이언트 — RLS 우회. 절대 클라이언트 번들 import 금지.
//    Cron, 시스템 작업, 셋업 검증 등 제한된 서버 경로에서만 사용.

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminClient() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    adminClient = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
