import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, refresh } from './auth.controller';
import { validateMiddleware } from '../../middleware/validate.middleware';
import { loginSchema } from './auth.schema';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getCSRFToken, validateCSRFToken } from '../../middleware/csrf.middleware';

const csrfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Trop de demandes de jetons CSRF. Reessayez plus tard.',
  standardHeaders: false,
  legacyHeaders: false,
});

const router = express.Router();

router.post('/login', validateMiddleware(loginSchema), login);
router.post('/refresh', validateCSRFToken, refresh);
router.post('/logout', validateCSRFToken, logout);
router.get('/me', authMiddleware, me);
router.get('/csrf-token', csrfLimiter, getCSRFToken);

export default router;
