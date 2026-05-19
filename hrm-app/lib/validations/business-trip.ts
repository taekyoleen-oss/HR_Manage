import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const tripTypeSchema = z.enum(['domestic', 'overseas']);
export const tripTransportSchema = z.enum([
  'flight', 'train', 'bus', 'car_company', 'car_personal', 'ship', 'other',
]);

export const businessTripRequestSchema = z
  .object({
    tripType: tripTypeSchema,
    purpose: z.string().trim().min(1, '출장 목적을 입력하세요').max(300),
    destinationCountry: z.string().trim().min(1, '국가를 입력하세요').max(100),
    destinationCity: z.string().trim().max(100).optional().nullable(),
    startDate: isoDate,
    endDate: isoDate,
    transportation: tripTransportSchema.default('other'),
    accommodation: z.string().trim().max(200).optional().nullable(),
    accompanyingEmployeeIds: z.array(z.string().uuid()).max(20).default([]),
    notes: z.string().trim().max(1000).optional().nullable(),
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

export type BusinessTripRequestInput = z.infer<typeof businessTripRequestSchema>;

export const businessTripApproveSchema = z.object({
  requestId: z.string().uuid(),
});

export const businessTripRejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(1, '반려 사유를 입력하세요').max(500),
});

export const businessTripCancelSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const businessTripCompleteSchema = z.object({
  requestId: z.string().uuid(),
  report: z.string().trim().min(10, '복귀 보고서는 최소 10자 이상이어야 합니다').max(5000),
});
