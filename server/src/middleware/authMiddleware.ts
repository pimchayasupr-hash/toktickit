import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
export const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-lab3-secret-key-2026';

// Server-side Token Revocation Blacklist for Logout Invalidation
const tokenBlacklist = new Set<string>();

export const revokeToken = (token: string): void => {
  if (token) {
    tokenBlacklist.add(token);
  }
};

export const isTokenRevoked = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const customHeader = req.headers['x-auth-token'] as string;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (customHeader) {
      token = customHeader;
    }

    // STRICT BR-03 ENFORCEMENT: No client-supplied header bypass permitted.
    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is missing. Please log in.',
        },
      });
      return;
    }

    // Server-side Token Revocation / Blacklist Check
    if (tokenBlacklist.has(token)) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked upon logout. Please log in again.',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account is inactive or no longer exists.',
        },
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session token.',
      },
    });
    return;
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role ${req.user.role} is not authorized for this operation.`,
        },
      });
      return;
    }

    next();
  };
};

export const requirePasswordChangeCheck = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.mustChangePassword) {
    res.status(403).json({
      error: {
        code: 'MUST_CHANGE_PASSWORD',
        message: 'You must change your initial password before accessing the application.',
      },
    });
    return;
  }
  next();
};
