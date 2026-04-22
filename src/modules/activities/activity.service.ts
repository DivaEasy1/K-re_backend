import prisma from '../../config/database';
import { generateSlug } from '../../utils/slugify';
import { CreateActivityInput, UpdateActivityInput } from './activity.schema';

export class ActivityService {
  async createActivity(data: CreateActivityInput) {
    const slug = generateSlug(data.title);

    // Check if slug already exists
    const existing = await prisma.activity.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('Une activité avec ce titre existe déjà');
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        slug,
      },
    });

    return activity;
  }

  async getActivities(filters?: { category?: string; isActive?: boolean }) {
    const where: any = {
      isActive: filters?.isActive !== undefined ? filters.isActive : true,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return activities;
  }

  async getActivityById(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new Error('Activité non trouvée');
    }

    return activity;
  }

  async getActivityBySlug(slug: string) {
    const activity = await prisma.activity.findUnique({
      where: { slug },
    });

    if (!activity || !activity.isActive) {
      throw new Error('Activité non trouvée');
    }

    return activity;
  }

  async updateActivity(id: string, data: UpdateActivityInput) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new Error('Activité non trouvée');
    }

    let updateData: any = { ...data };

    if (data.title && data.title !== activity.title) {
      updateData.slug = generateSlug(data.title);

      const existing = await prisma.activity.findUnique({
        where: { slug: updateData.slug },
      });

      if (existing && existing.id !== id) {
        throw new Error('Une activité avec ce titre existe déjà');
      }
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async deleteActivity(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new Error('Activité non trouvée');
    }

    // Soft delete
    await prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Activité supprimée' };
  }
}

export default new ActivityService();
