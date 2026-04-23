import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsRoot = path.join(process.cwd(), 'uploads', 'activities');

fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    cb(null, `${Date.now()}-${safeBaseName || 'activity'}${extension}`);
  },
});

export const activityImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Veuillez televerser une image valide.'));
      return;
    }

    cb(null, true);
  },
});
