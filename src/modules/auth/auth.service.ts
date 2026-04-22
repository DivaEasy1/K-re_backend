import prisma from '../../config/database';
import { comparePassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  verifyAndDeleteRefreshToken,
  deleteAllRefreshTokens,
} from '../../utils/jwt';

const INACTIVITY_TIMEOUT_MS =
  parseInt(process.env.INACTIVITY_TIMEOUT_DAYS || '3') *
  24 *
  60 *
  60 *
  1000;

const ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    // 🔒 Check lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Compte verrouillé. Essayez plus tard.');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          ...(user.loginAttempts + 1 >= 5 && {
            lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
          }),
        },
      });

      throw new Error('Email ou mot de passe incorrect');
    }

    // Success login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await deleteAllRefreshTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new Error('Refresh token invalide');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    const tokenRecord = await verifyAndDeleteRefreshToken(
      user.id,
      refreshToken
    );

    if (!tokenRecord) {
      throw new Error('Refresh token expiré ou invalide');
    }

    // FIX TYPE SCRIPT (important)
    const lastActivityAt = user.lastActivityAt;

    if (!lastActivityAt) {
      throw new Error('Session invalide (activité manquante)');
    }

    const now = Date.now();
    const lastActivityTime = lastActivityAt.getTime();

    // Inactivity check
    if (now - lastActivityTime > INACTIVITY_TIMEOUT_MS) {
      throw new Error(
        "Votre session a expiré après 3 jours d'inactivité"
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await storeRefreshToken(user.id, newRefreshToken);

    // Sliding update (5 min)
    if (now - lastActivityTime > ACTIVITY_UPDATE_INTERVAL_MS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user;
  }
}

export default new AuthService();
