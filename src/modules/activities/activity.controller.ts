import { Request, Response } from 'express';
import activityService from './activity.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import logger from '../../config/logger';

function parseBooleanQuery(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const parsed = parseBooleanQuery(entry);

      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

export const createActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activity = await activityService.createActivity(req.body);
    logger.info(`Activity created: ${activity.id}`);
    sendSuccess(res, activity, 201);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const uploadActivityImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'Aucune image recue', 400);
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/activities/${req.file.filename}`;
    sendSuccess(res, { image: imageUrl }, 201);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message || 'Echec du televersement', 400);
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { category, all, includeInactive, activeOnly } = req.query;
    const allQuery = parseBooleanQuery(all);
    const includeInactiveQuery = parseBooleanQuery(includeInactive);
    const activeOnlyQuery = parseBooleanQuery(activeOnly);

    let shouldIncludeInactive = true;

    if (activeOnlyQuery === true) {
      shouldIncludeInactive = false;
    }

    if (allQuery !== null) {
      shouldIncludeInactive = allQuery;
    }

    if (includeInactiveQuery !== null) {
      shouldIncludeInactive = includeInactiveQuery;
    }

    logger.info(
      `[activities] request query all=${all} includeInactive=${includeInactive} activeOnly=${activeOnly} category=${category} resolvedIncludeInactive=${shouldIncludeInactive}`
    );

    const activities = await activityService.getActivities({
      category: category as string,
      includeInactive: shouldIncludeInactive,
    });

    logger.info(`[activities] response count=${activities.length}`);
    logger.info(
      `[activities] response payload=${JSON.stringify(
        activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          isActive: activity.isActive,
          image: activity.image,
        }))
      )}`
    );

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('X-Activities-Count', String(activities.length));
    res.set('X-Activities-Include-Inactive', String(shouldIncludeInactive));
    sendSuccess(res, activities);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message);
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await activityService.getActivityById(id);
    sendSuccess(res, activity);
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

export const getActivityBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const activity = await activityService.getActivityBySlug(slug);
    sendSuccess(res, activity);
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

export const updateActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await activityService.updateActivity(id, req.body);
    logger.info(`Activity updated: ${id}`);
    sendSuccess(res, activity);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 400);
  }
};

export const deleteActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await activityService.deleteActivity(id);
    logger.info(`Activity deleted: ${id}`);
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 404);
  }
};