import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères'),
  description: z.string().min(10, 'Minimum 10 caractères').max(1000, 'Maximum 1000 caractères'),
  duration: z.string().min(1, 'Durée requise'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  price: z.number().min(0.01, 'Prix invalide'),
  priceLabel: z.string().min(1, 'Étiquette de prix requise'),
  icon: z.string().min(1, 'Icône requise'),
  category: z.string().min(1, 'Catégorie requise'),
  maxParticipants: z.number().min(1).max(50).default(10),
});

export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
