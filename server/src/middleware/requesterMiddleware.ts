import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Requester } from '@prisma/client';

const prisma = new PrismaClient();

export interface RequesterRequest extends Request {
  requester?: Requester;
}

export const requireRequester = async (
  req: RequesterRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requesterIdRaw =
    req.headers['x-development-requester-id'] ||
    req.query['requesterId'] ||
    req.query['x-development-requester-id'];

  if (!requesterIdRaw) {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUESTER_CONTEXT',
        message: 'A valid Development Requester must be selected.',
      },
    });
    return;
  }

  const requesterId = parseInt(Array.isArray(requesterIdRaw) ? requesterIdRaw[0] : String(requesterIdRaw), 10);

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
    const requester = await prisma.requester.findFirst({
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
