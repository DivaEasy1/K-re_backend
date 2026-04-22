import express from 'express';
import { login, logout, me, refresh } from './auth.controller';
import { validateMiddleware } from '../../middleware/validate.middleware';
import { loginSchema } from './auth.schema';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/login', validateMiddleware(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;
