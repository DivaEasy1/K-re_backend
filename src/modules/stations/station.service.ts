import prisma from '../../config/database';
import { generateSlug } from '../../utils/slugify';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import type { CreateStationInput, UpdateStationInput } from './station.schema';

class StationService {
  async createStation(data: CreateStationInput) {
    const slug = generateSlug(data.name);

    const existingSlug = await prisma.station.findUnique({
      where: { slug }
    });

    if (existingSlug) {
      throw new Error('Une station avec ce nom existe déjà');
    }

    const sanitizedData = {
      ...data,
      richContent: data.richContent ? sanitizeHtml(data.richContent) : null
    };

    return prisma.station.create({
      data: {
        ...sanitizedData,
        slug,
      },
      include: { gallery: { orderBy: { position: 'asc' } } }
    });
  }

  async updateStation(id: string, data: UpdateStationInput) {
    let updateData: any = { ...data };

    if (data.name) {
      const newSlug = generateSlug(data.name);
      const existing = await prisma.station.findUnique({
        where: { slug: newSlug }
      });

      if (existing && existing.id !== id) {
        throw new Error('Une station avec ce nom existe déjà');
      }

      updateData.slug = newSlug;
    }

    if (data.richContent) {
      updateData.richContent = sanitizeHtml(data.richContent);
    }

    return prisma.station.update({
      where: { id },
      data: updateData,
      include: { gallery: { orderBy: { position: 'asc' } } }
    });
  }

  async getStations(isActive = true) {
    return prisma.station.findMany({
      where: { isActive },
      include: {
        gallery: { orderBy: { position: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStationBySlug(slug: string) {
    return prisma.station.findUnique({
      where: { slug },
      include: {
        gallery: { orderBy: { position: 'asc' } }
      }
    });
  }

  async getStationById(id: string) {
    return prisma.station.findUnique({
      where: { id },
      include: {
        gallery: { orderBy: { position: 'asc' } }
      }
    });
  }

  async deleteStation(id: string) {
    return prisma.station.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async addGalleryImage(stationId: string, url: string, alt: string) {
    const position = await prisma.stationImage.count({
      where: { stationId }
    });

    return prisma.stationImage.create({
      data: {
        stationId,
        url,
        alt,
        position
      }
    });
  }

  async removeGalleryImage(imageId: string) {
    return prisma.stationImage.delete({
      where: { id: imageId }
    });
  }

  async updateGalleryPosition(imageId: string, position: number) {
    return prisma.stationImage.update({
      where: { id: imageId },
      data: { position }
    });
  }

  async updateGalleryAlt(imageId: string, alt: string) {
    return prisma.stationImage.update({
      where: { id: imageId },
      data: { alt }
    });
  }

  async addGalleryImages(stationId: string, images: Array<{ url: string; alt: string }>) {
    const existingPosition = await prisma.stationImage.findMany({
      where: { stationId },
      select: { position: true },
      orderBy: { position: 'desc' },
      take: 1
    });

    const startPosition = existingPosition[0]?.position ?? -1;

    const createdImages = await Promise.all(
      images.map((img, index) =>
        prisma.stationImage.create({
          data: {
            stationId,
            url: img.url,
            alt: img.alt,
            position: startPosition + index + 1
          }
        })
      )
    );

    return createdImages;
  }
}

export default new StationService();
