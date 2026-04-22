import prisma from '../../config/database';
import { comparePassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
} from '../../utils/jwt';
// import { LoginInput } from './auth.schema';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    // Check lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Compte verrouillé. Essayez plus tard.');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Increment attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          ...(user.loginAttempts + 1 >= 5 && {
            lockedUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 min
          }),
        },
      });
      throw new Error('Email ou mot de passe incorrect');
    }

    // Reset on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

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
