import express from 'express';
import {
  createActivity,
  getActivities,
  getActivityById,
  getActivityBySlug,
  updateActivity,
  deleteActivity,
  uploadActivityImage,
} from './activity.controller';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';
import { validateMiddleware } from '../../middleware/validate.middleware';
import { createActivitySchema, updateActivitySchema } from './activity.schema';
import { activityImageUpload } from '../../middleware/upload.middleware';
import { validateCSRFToken } from '../../middleware/csrf.middleware';

const router = express.Router();

// Public routes
router.get('/', getActivities);
router.get('/slug/:slug', getActivityBySlug);
router.get('/:id', getActivityById);

// Admin routes
router.post('/upload', authMiddleware, adminMiddleware, validateCSRFToken, activityImageUpload.single('image'), uploadActivityImage);
router.post('/', authMiddleware, adminMiddleware, validateCSRFToken, validateMiddleware(createActivitySchema), createActivity);
router.put('/:id', authMiddleware, adminMiddleware, validateCSRFToken, validateMiddleware(updateActivitySchema), updateActivity);
router.delete('/:id', authMiddleware, adminMiddleware, validateCSRFToken, deleteActivity);

export default router;
