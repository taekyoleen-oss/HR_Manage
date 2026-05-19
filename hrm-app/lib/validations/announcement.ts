import { z } from 'zod';

export const announcementCategorySchema = z.enum([
  'general', 'policy', 'event', 'system', 'hr', 'urgent',
]);

export const announcementUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, '제목을 입력하세요').max(200),
  body: z.string().trim().min(1, '본문을 입력하세요').max(20000),
  category: announcementCategorySchema.default('general'),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
});
export type AnnouncementUpsertInput = z.infer<typeof announcementUpsertSchema>;
