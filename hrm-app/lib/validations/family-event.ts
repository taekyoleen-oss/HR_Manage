import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const familyRelationSchema = z.enum([
  'self', 'spouse', 'child', 'parent', 'parent_in_law',
  'sibling', 'grandparent', 'grandchild',
]);

export const familyEventKindSchema = z.enum([
  'wedding', 'funeral', 'birth', 'maternity', 'sixtieth', 'other',
]);

export const familyEventUsageLimitSchema = z.enum([
  'once_lifetime', 'once_per_year', 'once_per_target', 'unlimited',
]);

export const familyEventPolicyUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/, '영문 소문자·숫자·_만 사용'),
  name: z.string().trim().min(1).max(100),
  relation: familyRelationSchema,
  eventKind: familyEventKindSchema,
  grantedDays: z.number().min(0).max(180),
  requiredAttachmentNote: z.string().trim().max(200).optional().nullable(),
  usageLimit: familyEventUsageLimitSchema.default('unlimited'),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});
export type FamilyEventPolicyUpsertInput = z.infer<typeof familyEventPolicyUpsertSchema>;

export const familyEventLeaveRequestSchema = z
  .object({
    policyId: z.string().uuid('경조사 기준을 선택하세요'),
    startDate: isoDate,
    endDate: isoDate,
    totalDays: z.number().positive().max(180),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.startDate > v.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '시작일은 종료일 이전이어야 합니다',
        path: ['endDate'],
      });
    }
  });
export type FamilyEventLeaveRequestInput = z.infer<typeof familyEventLeaveRequestSchema>;
