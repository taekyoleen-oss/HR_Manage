import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth/guards';
import { fail, failFromPg, failZod, ok } from '@/lib/api/response';

const schema = z.object({
  employeeId: z.string().uuid(),
  changeType: z.enum(['hire', 'promotion', 'demotion', 'transfer', 'role_change', 'resignation', 'other']),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fromDepartmentId: z.string().uuid().optional().nullable(),
  toDepartmentId: z.string().uuid().optional().nullable(),
  fromPosition: z.string().trim().max(100).optional().nullable(),
  toPosition: z.string().trim().max(100).optional().nullable(),
  fromRole: z.enum(['employee', 'manager', 'admin']).optional().nullable(),
  toRole: z.enum(['employee', 'manager', 'admin']).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
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
  const { data, error } = await supabase.from('hrm_position_history').insert({
    employee_id: v.employeeId,
    change_type: v.changeType,
    effective_date: v.effectiveDate,
    from_department_id: v.fromDepartmentId ?? null,
    to_department_id: v.toDepartmentId ?? null,
    from_position: v.fromPosition ?? null,
    to_position: v.toPosition ?? null,
    from_role: v.fromRole ?? null,
    to_role: v.toRole ?? null,
    notes: v.notes ?? null,
    performed_by: user.employeeId,
  }).select('id').maybeSingle();
  if (error) return failFromPg(error.message);
  return ok({ id: data?.id });
}
