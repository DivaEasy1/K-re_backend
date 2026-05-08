import express from 'express';
import * as stationController from './station.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads/stations');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d\'image invalide'));
    }
  }
});

// Public routes
router.get('/', stationController.getStations);
router.get('/id/:id', stationController.getStationById);
router.get('/:slug', stationController.getStationBySlug);

// Admin routes
router.post('/', authMiddleware, stationController.createStation);
router.put('/:id', authMiddleware, stationController.updateStation);
router.delete('/:id', authMiddleware, stationController.deleteStation);

// Image routes
router.post('/images/upload-batch', authMiddleware, upload.array('images', 10), stationController.uploadStationImages);
router.post('/image/upload', authMiddleware, upload.single('image'), stationController.uploadStationImage);
router.delete('/image/:imageId', authMiddleware, stationController.removeGalleryImage);
router.patch('/image/:imageId/position', authMiddleware, stationController.updateGalleryPosition);
router.patch('/image/:imageId/alt', authMiddleware, stationController.updateGalleryAlt);

export default router;
