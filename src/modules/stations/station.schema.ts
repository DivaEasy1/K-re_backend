import { z } from 'zod';

const EquipmentEnum = z.enum(['kayak_solo', 'kayak_tandem', 'paddle']);

export const CreateStationSchema = z.object({
  name: z.string().min(2, 'Le nom est requis').max(100),
  location: z.string().min(2, 'La localisation est requise'),
  lat: z.number().min(-90).max(90, 'Latitude invalide'),
  lng: z.number().min(-180).max(180, 'Longitude invalide'),
  description: z.string().min(10, 'Description trop courte'),
  richContent: z.string().max(5000, 'Le contenu riche ne peut pas dépasser 5000 caractères').optional().nullable(),
  equipment: z.array(EquipmentEnum).optional().nullable(),
  status: z.enum(['OPEN', 'COMING_SOON', 'CLOSED', 'MAINTENANCE']).default('COMING_SOON'),
  openYear: z.number().min(2020).max(2050).optional(),
  image: z.string().url().optional().nullable(),
});

export const UpdateStationSchema = CreateStationSchema.partial();

export type CreateStationInput = z.infer<typeof CreateStationSchema>;
export type UpdateStationInput = z.infer<typeof UpdateStationSchema>;
