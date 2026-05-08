import { Request, Response } from 'express';
import stationService from './station.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import logger from '../../config/logger';
import { CreateStationSchema, UpdateStationSchema } from './station.schema';

export const createStation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = CreateStationSchema.parse(req.body);
    const station = await stationService.createStation(validatedData);
    logger.info(`Station created: ${station.id}`);
    sendSuccess(res, station, 201);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const getStations = async (req: Request, res: Response) => {
  try {
    const stations = await stationService.getStations(true);
    res.set('Cache-Control', 'max-age=3600');
    sendSuccess(res, stations);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 500);
  }
};

export const getStationBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const station = await stationService.getStationBySlug(slug);

    if (!station) {
      return sendError(res, 'Station non trouvée', 404);
    }

    res.set('Cache-Control', 'max-age=3600');
    sendSuccess(res, station);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 500);
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = await stationService.getStationById(id);

    if (!station) {
      return sendError(res, 'Station non trouvée', 404);
    }

    sendSuccess(res, station);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 500);
  }
};

export const updateStation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateStationSchema.parse(req.body);
    const station = await stationService.updateStation(id, validatedData);
    logger.info(`Station updated: ${id}`);
    sendSuccess(res, station);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const deleteStation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await stationService.deleteStation(id);
    logger.info(`Station deleted: ${id}`);
    sendSuccess(res, { message: 'Station supprimée' });
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 500);
  }
};

export const uploadStationImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'Aucune image reçue', 400);
    }

    const { stationId } = req.body;
    if (!stationId) {
      return sendError(res, 'Station ID manquant', 400);
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/stations/${req.file.filename}`;
    const image = await stationService.addGalleryImage(stationId, imageUrl, req.file.originalname);
    
    sendSuccess(res, image, 201);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const removeGalleryImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    await stationService.removeGalleryImage(imageId);
    logger.info(`Gallery image removed: ${imageId}`);
    sendSuccess(res, { message: 'Image supprimée' });
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 500);
  }
};

export const updateGalleryPosition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const { position } = req.body;

    if (typeof position !== 'number') {
      return sendError(res, 'Position invalide', 400);
    }

    const image = await stationService.updateGalleryPosition(imageId, position);
    sendSuccess(res, image);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const updateGalleryAlt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const { alt } = req.body;

    if (typeof alt !== 'string') {
      return sendError(res, 'Alt text invalide', 400);
    }

    const image = await stationService.updateGalleryAlt(imageId, alt);
    sendSuccess(res, image);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const uploadStationImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return sendError(res, 'Aucune image reçue', 400);
    }

    const { stationId } = req.body;
    if (!stationId) {
      return sendError(res, 'Station ID manquant', 400);
    }

    const images = (req.files as Express.Multer.File[]).map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/stations/${file.filename}`,
      alt: file.originalname.split('.')[0] // Use filename without extension as alt text
    }));

    const uploadedImages = await stationService.addGalleryImages(stationId, images);
    logger.info(`${uploadedImages.length} images uploaded for station: ${stationId}`);
    
    sendSuccess(res, uploadedImages, 201);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};
