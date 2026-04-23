import prisma from '../../config/database';
import { generateSlug } from '../../utils/slugify';
import { CreateActivityInput, UpdateActivityInput } from './activity.schema';

export class ActivityService {
  async createActivity(data: CreateActivityInput) {
    const slug = generateSlug(data.title);

    const existing = await prisma.activity.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('Une activite avec ce titre existe deja');
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        slug,
      },
    });

    return activity;
  }

  async getActivities(filters?: { category?: string; includeInactive?: boolean }) {
    const where: any = filters?.includeInactive ? {} : { isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    console.log('[activities] where clause:', JSON.stringify(where));

    const [dbTotalCount, dbActiveCount, dbInactiveCount, activities] = await Promise.all([
      prisma.activity.count(),
      prisma.activity.count({ where: { isActive: true } }),
      prisma.activity.count({ where: { isActive: false } }),
      prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    console.log(
      `[activities] db counts total=${dbTotalCount} active=${dbActiveCount} inactive=${dbInactiveCount}`
    );
    console.log(`[activities] query result count=${activities.length}`);
    activities.forEach((activity) =>
      console.log(
        `  - ${activity.id}: ${activity.title} (isActive: ${activity.isActive}, image: ${activity.image ?? 'null'})`
      )
    );

    return activities;
  }

  async getActivityById(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new Error('Activite non trouvee');
    }

    return activity;
  }

  async getActivityBySlug(slug: string) {
    const activity = await prisma.activity.findUnique({
      where: { slug },
    });

    if (!activity || !activity.isActive) {
      throw new Error('Activite non trouvee');
    }

    return activity;
  }

  async updateActivity(id: string, data: UpdateActivityInput) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new Error('Activite non trouvee');
    }

    const updateData: any = { ...data };

    if (data.title && data.title !== activity.title) {
      updateData.slug = generateSlug(data.title);

      const existing = await prisma.activity.findUnique({
        where: { slug: updateData.slug },
      });

      if (existing && existing.id !== id) {
        throw new Error('Une activite avec ce titre existe deja');
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
      throw new Error('Activite non trouvee');
    }

    await prisma.activity.delete({
      where: { id },
    });

    return { message: 'Activite supprimee', id };
  }
}

export default new ActivityService();