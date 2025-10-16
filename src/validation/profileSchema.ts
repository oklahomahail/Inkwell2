import { z } from 'zod';

const profileSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultProject: z.string().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export const profileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ownerId: z.string().optional(),
  displayName: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  color: z.string().optional(),
  avatar: z.string().optional(),
  description: z.string().optional(),
  settings: profileSettingsSchema.optional(),
  archivedAt: z.string().optional(),
  deleted: z.boolean().optional(),
  deletedAt: z.string().optional(),
});

export const tourStepSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.any().optional(),
  anchor: z.string().optional(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
export type TourStepSchema = z.infer<typeof tourStepSchema>;

export function validateProfile(data: unknown): ProfileSchema {
  return profileSchema.parse(data);
}

export function validateTourStep(data: unknown): TourStepSchema {
  return tourStepSchema.parse(data);
}
