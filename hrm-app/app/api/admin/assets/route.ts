import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

const assetSchema = z.object({
  id: z.string().uuid().optional(),
  assetNo: z.string().trim().min(1).max(64),
  category: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  serialNo: z.string().trim().max(100).optional().nullable(),
  purchasedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  status: z.enum(['available', 'assigned', 'in_repair', 'retired']).default('available'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user || user.role !== 'admin') return fail('FORBIDDEN', '관리자 전용', 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return fail('BAD_JSON', '요청 본문이 JSON이 아닙니다', 400); }

  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) return failZod(parsed.error);
  const v = parsed.data;

  const supabase = await createServerClient();
  const row = {
    asset_no: v.assetNo,
    category: v.category,
    name: v.name,
    serial_no: v.serialNo ?? null,
    purchased_at: v.purchasedAt ?? null,
    purchase_price: v.purchasePrice ?? null,
    status: v.status,
    notes: v.notes ?? null,
  };
  const { data, error } = v.id
    ? await supabase.from('hrm_assets').update(row).eq('id', v.id).select('id').maybeSingle()
    : await supabase.from('hrm_assets').insert(row).select('id').maybeSingle();
  if (error) return failFromPg(error.message);
  return ok({ id: data?.id });
}
