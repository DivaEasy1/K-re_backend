import express, { Request, Response, NextFunction } from 'express';
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

const corsOptions = {
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:3001'],
  credentials: true,
};

// Global rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, réessayez plus tard',
});

// ============= MIDDLEWARE =============
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '10kb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Cookie parser
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg) } })); // Logger
app.use(xss()); // XSS protection
app.use(hpp()); // Parameter pollution protection
app.use(generalLimiter); // Rate limiting

// ============= ROUTES =============
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);

// ============= 404 =============
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
  });
});

// ============= ERROR HANDLER =============
app.use(errorMiddleware);

// ============= START SERVER =============
app.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info(`📊 Frontend CORS: ${process.env.FRONTEND_URL}`);
  logger.info(`📊 Admin CORS: ${process.env.ADMIN_URL}`);
});

export default app;
