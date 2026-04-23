import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(2, 'Minimum 2 caracteres').max(100, 'Maximum 100 caracteres'),
  description: z.string().min(10, 'Minimum 10 caracteres').max(1000, 'Maximum 1000 caracteres'),
  duration: z.string().min(1, 'Duree requise'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  price: z.number().min(0.01, 'Prix invalide'),
  priceLabel: z.string().min(1, 'Libelle de prix requis'),
  icon: z.string().min(1, 'Icone requise'),
  category: z.string().min(1, 'Categorie requise'),
  maxParticipants: z.number().min(1).max(50).default(10),
  image: z.string().url().optional().or(z.literal('')),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;