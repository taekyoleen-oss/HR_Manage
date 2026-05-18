import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const leavePeriodSchema = z.enum(['full_day', 'am_half', 'pm_half', 'hourly']);

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().uuid('휴가 유형을 선택하세요'),
    startDate: isoDate,
    endDate: isoDate,
    startPeriod: leavePeriodSchema.default('full_day'),
    endPeriod: leavePeriodSchema.default('full_day'),
    totalDays: z.number().positive('휴가 일수는 0보다 커야 합니다').max(60, '한 번에 60일을 초과할 수 없습니다'),
    reason: z.string().trim().max(500, '사유는 500자 이하여야 합니다').optional(),
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

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveApproveSchema = z.object({
  requestId: z.string().uuid(),
});
export type LeaveApproveInput = z.infer<typeof leaveApproveSchema>;

export const leaveRejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(1, '반려 사유를 입력하세요').max(500),
});
export type LeaveRejectInput = z.infer<typeof leaveRejectSchema>;

export const leaveCancelSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});
export type LeaveCancelInput = z.infer<typeof leaveCancelSchema>;
