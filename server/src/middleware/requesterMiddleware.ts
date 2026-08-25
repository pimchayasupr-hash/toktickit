import { Request, Response, NextFunction } from 'express';
import { PrismaClient, RequesterUser } from '@prisma/client';

const prisma = new PrismaClient();

export interface RequesterRequest extends Request {
  requester?: RequesterUser;
}

export const requireRequester = async (
  req: RequesterRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requesterIdHeader = req.headers['x-development-requester-id'];

  if (!requesterIdHeader) {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUESTER_CONTEXT',
        message: 'A valid Development Requester must be selected.',
      },
    });
    return;
  }

  const requesterId = parseInt(Array.isArray(requesterIdHeader) ? requesterIdHeader[0] : requesterIdHeader, 10);

  if (isNaN(requesterId) || requesterId <= 0) {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUESTER_CONTEXT',
        message: 'A valid Development Requester must be selected.',
      },
    });
    return;
  }

  try {
    const requester = await prisma.requesterUser.findFirst({
      where: {
        id: requesterId,
        isActive: true,
      },
    });

    if (!requester) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUESTER_CONTEXT',
          message: 'A valid Development Requester must be selected.',
        },
      });
      return;
    }

    req.requester = requester;
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The request could not be completed. Please try again.',
      },
    });
  }
};
