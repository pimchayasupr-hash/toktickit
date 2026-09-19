import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest, JWT_SECRET, revokeToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// 1. POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';

    if (!trimmedEmail || !rawPassword) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.',
          fields: {
            ...(!trimmedEmail ? { email: 'Email is required.' } : {}),
            ...(!rawPassword ? { password: 'Password is required.' } : {}),
          },
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive,
      },
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to authenticate user.',
      },
    });
    return;
  }
});

// 2. POST /api/auth/logout (Revokes session token immediately)
router.post('/logout', authenticateUser, (req: AuthRequest, res: Response): void => {
  if (req.token) {
    revokeToken(req.token);
  }
  res.status(200).json({
    message: 'Logged out successfully.',
  });
});

// 3. GET /api/auth/me
router.get('/me', authenticateUser, (req: AuthRequest, res: Response): void => {
  res.status(200).json({
    user: req.user,
  });
});

// 4. POST /api/auth/change-password
router.post('/change-password', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!newPassword || typeof newPassword !== 'string' || !passwordRegex.test(newPassword)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
          fields: {
            newPassword: 'Password does not meet complexity requirements.',
          },
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    // Check current password if provided
    if (currentPassword && typeof currentPassword === 'string') {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password is incorrect.',
            fields: { currentPassword: 'Current password is incorrect.' },
          },
        });
        return;
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    res.status(200).json({
      message: 'Password changed successfully.',
      mustChangePassword: false,
      user: updatedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to change password.',
      },
    });
    return;
  }
});

export default router;
