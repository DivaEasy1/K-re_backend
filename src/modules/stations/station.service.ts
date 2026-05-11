import { Prisma } from '@prisma/client';

import prisma from '../../config/database';
import { generateSlug } from '../../utils/slugify';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import type { CreateStationInput, UpdateStationInput } from './station.schema';

function normalizePathname(value: string) {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');
}

function normalizeAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    url.pathname = normalizePathname(url.pathname);
    return url.toString();
  } catch {
    return normalizePathname(trimmed);
  }
}

function normalizeEquipmentValue(
  value: CreateStationInput['equipment'] | UpdateStationInput['equipment']
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
}

function normalizeStationRecord<
  T extends {
    image?: string | null;
    richContent?: string | null;
    gallery?: Array<{ url: string }>;
  }
>(station: T): T {
  return {
    ...station,
    image: normalizeAssetUrl(station.image) ?? null,
    richContent: sanitizeHtml(station.richContent),
    gallery: Array.isArray(station.gallery)
      ? station.gallery.map((image) => ({
          ...image,
          url: normalizeAssetUrl(image.url) ?? image.url
        }))
      : station.gallery
  } as T;
}

class StationService {
  async createStation(data: CreateStationInput) {
    const slug = generateSlug(data.name);

    const existingSlug = await prisma.station.findUnique({
      where: { slug }
    });

    if (existingSlug) {
      throw new Error('Une station avec ce nom existe déjà');
    }

    const createData: Prisma.StationCreateInput = {
      name: data.name,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      description: data.description,
      status: data.status,
      openYear: data.openYear,
      slug,
      richContent: sanitizeHtml(data.richContent),
      image: normalizeAssetUrl(data.image) ?? null,
      equipment: normalizeEquipmentValue(data.equipment)
    };

    const createdStation = await prisma.station.create({
      data: createData,
      include: { gallery: { orderBy: { position: 'asc' } } }
    });

    return normalizeStationRecord(createdStation);
  }

  async updateStation(id: string, data: UpdateStationInput) {
    const updateData: Prisma.StationUpdateInput = {};

    if (data.name) {
      const newSlug = generateSlug(data.name);
      const existing = await prisma.station.findUnique({
        where: { slug: newSlug }
      });

      if (existing && existing.id !== id) {
        throw new Error('Une station avec ce nom existe déjà');
      }

      updateData.name = data.name;
      updateData.slug = newSlug;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'location')) {
      updateData.location = data.location;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'lat')) {
      updateData.lat = data.lat;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'lng')) {
      updateData.lng = data.lng;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'description')) {
      updateData.description = data.description;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      updateData.status = data.status;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'openYear')) {
      updateData.openYear = data.openYear;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'richContent')) {
      updateData.richContent = sanitizeHtml(data.richContent);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'image')) {
      updateData.image = normalizeAssetUrl(data.image) ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'equipment')) {
      updateData.equipment = normalizeEquipmentValue(data.equipment);
    }

    const updatedStation = await prisma.station.update({
      where: { id },
      data: updateData,
      include: { gallery: { orderBy: { position: 'asc' } } }
    });

    return normalizeStationRecord(updatedStation);
  }

  async getStations() {
    const stations = await prisma.station.findMany({
      include: {
        gallery: { orderBy: { position: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return stations.map((station) => normalizeStationRecord(station));
  }

  async getStationBySlug(slug: string) {
    const station = await prisma.station.findUnique({
      where: { slug },
      include: {
        gallery: { orderBy: { position: 'asc' } }
      }
    });

    return station ? normalizeStationRecord(station) : null;
  }

  async getStationById(id: string) {
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        gallery: { orderBy: { position: 'asc' } }
      }
    });

    return station ? normalizeStationRecord(station) : null;
  }

  async deleteStation(id: string) {
    return prisma.station.delete({
      where: { id }
    });
  }

  async addGalleryImage(stationId: string, url: string, alt: string) {
    const position = await prisma.stationImage.count({
      where: { stationId }
    });

    return prisma.stationImage.create({
      data: {
        stationId,
        url: normalizeAssetUrl(url) ?? url,
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
            url: normalizeAssetUrl(img.url) ?? img.url,
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
