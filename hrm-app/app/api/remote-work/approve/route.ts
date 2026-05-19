import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { remoteWorkApproveSchema } from '@/lib/validations/remote-work';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return fail('UNAUTHENTICATED', '로그인이 필요합니다', 401);
  if (user.role === 'employee') return fail('FORBIDDEN', '결재 권한이 없습니다', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = remoteWorkApproveSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('approve_remote_work', { req_id: parsed.data.requestId });
  if (error) return failFromPg(error.message);
  return ok({ requestId: parsed.data.requestId });
}
