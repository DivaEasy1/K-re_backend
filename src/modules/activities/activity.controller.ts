import { Request, Response } from 'express';
import activityService from './activity.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import logger from '../../config/logger';

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

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { category, all } = req.query;
    const isActive = all === 'true' ? undefined : true;

    const activities = await activityService.getActivities({
      category: category as string,
      isActive,
    });

    res.set('Cache-Control', 'max-age=3600'); // Cache for 1 hour
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
