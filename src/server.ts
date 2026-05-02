import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import xss from 'xss-clean';
import hpp from 'hpp';
import dotenv from 'dotenv';

import logger from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { sendSuccess } from './utils/response';

import authRoutes from './modules/auth/auth.routes';
import activityRoutes from './modules/activities/activity.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BODY_LIMIT = process.env.BODY_LIMIT || '8mb';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean) as string[];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requetes, reessayez plus tard',
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg) } }));
app.use(xss());
app.use(hpp());
app.use(generalLimiter);

app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvee',
  });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Frontend CORS: ${process.env.FRONTEND_URL}`);
  logger.info(`Admin CORS: ${process.env.ADMIN_URL}`);
});

export default app;