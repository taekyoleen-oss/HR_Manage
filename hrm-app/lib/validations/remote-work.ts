import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const remoteWorkRequestSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    totalDays: z.number().int().positive().max(60),
    reason: z.string().trim().min(1, '재택근무 사유를 입력하세요').max(500),
    workLocation: z.string().trim().max(100).optional().nullable(),
    contactMethod: z.string().trim().max(200).optional().nullable(),
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
export type RemoteWorkRequestInput = z.infer<typeof remoteWorkRequestSchema>;

export const remoteWorkApproveSchema = z.object({ requestId: z.string().uuid() });
export const remoteWorkRejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});
export const remoteWorkCancelSchema = z.object({ requestId: z.string().uuid() });
