import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  id: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  provider: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  startDate: isoDate,
  endDate: isoDate.optional().nullable(),
  hours: z.number().min(0).max(9999).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  certificateUrl: z.string().url().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user || user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const row = {
    employee_id: v.employeeId,
    title: v.title,
    provider: v.provider ?? null,
    category: v.category ?? null,
    start_date: v.startDate,
    end_date: v.endDate ?? null,
    hours: v.hours ?? null,
    cost: v.cost ?? null,
    certificate_url: v.certificateUrl ?? null,
    notes: v.notes ?? null,
  };
  const { data, error } = v.id
    ? await supabase.from('hrm_training_records').update(row).eq('id', v.id).select('id').maybeSingle()
    : await supabase.from('hrm_training_records').insert(row).select('id').maybeSingle();
  if (error) return failFromPg(error.message);
  return ok({ id: data?.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getAppUser();
  if (!user || user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용', 403);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return fail('BAD_REQUEST', 'id 필요', 400);
  const supabase = await createServerClient();
  const { error } = await supabase.from('hrm_training_records').delete().eq('id', id);
  if (error) return failFromPg(error.message);
  return ok({ id });
}
