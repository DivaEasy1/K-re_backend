import express from 'express';
import {
  createActivity,
  getActivities,
  getActivityById,
  getActivityBySlug,
  updateActivity,
  deleteActivity,
} from './activity.controller';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';
import { validateMiddleware } from '../../middleware/validate.middleware';
import { createActivitySchema, updateActivitySchema } from './activity.schema';

const router = express.Router();

// Public routes
router.get('/', getActivities);
router.get('/slug/:slug', getActivityBySlug);
router.get('/:id', getActivityById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, validateMiddleware(createActivitySchema), createActivity);
router.put('/:id', authMiddleware, adminMiddleware, validateMiddleware(updateActivitySchema), updateActivity);
router.delete('/:id', authMiddleware, adminMiddleware, deleteActivity);

export default router;
