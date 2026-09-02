import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { requireRequester, RequesterRequest } from './middleware/requesterMiddleware';
import { generateTicketNumber } from './utils/ticketUtils';

const app: Application = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'TokTickIT API',
  });
});

// 2. Active Development Requesters (Feature 1)
app.get('/api/requesters', async (_req: Request, res: Response) => {
  try {
    const requesters = await prisma.requester.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ requesters });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch development requesters.',
      },
    });
  }
});

// 3. Active Categories (Issue 2)
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch categories.',
      },
    });
  }
});

// 4. Active Related Systems (Issue 2)
app.get('/api/related-systems', async (_req: Request, res: Response) => {
  try {
    const relatedSystems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json({ relatedSystems });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch related systems.',
      },
    });
  }
});

// 5. Create Ticket (Issue 3)
app.post('/api/tickets', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const { clientSubmissionId, categoryId, relatedSystemId, summary, requestedPriority, description } = req.body;

    // Idempotency check
    if (clientSubmissionId && typeof clientSubmissionId === 'string' && clientSubmissionId.trim() !== '') {
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          requesterId,
          clientSubmissionId: clientSubmissionId.trim(),
        },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          attachments: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (existingTicket) {
        res.status(200).json({ ticket: existingTicket });
        return;
      }
    }

    // Validation
    const fields: Record<string, string> = {};
    const parsedCategoryId = parseInt(categoryId, 10);
    const parsedRelatedSystemId = parseInt(relatedSystemId, 10);

    if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      fields.categoryId = 'Category is required.';
    } else {
      const catExists = await prisma.category.findFirst({ where: { id: parsedCategoryId, isActive: true } });
      if (!catExists) fields.categoryId = 'Selected category does not exist.';
    }

    if (isNaN(parsedRelatedSystemId) || parsedRelatedSystemId <= 0) {
      fields.relatedSystemId = 'Related System is required.';
    } else {
      const sysExists = await prisma.relatedSystem.findFirst({ where: { id: parsedRelatedSystemId, isActive: true } });
      if (!sysExists) fields.relatedSystemId = 'Selected related system does not exist.';
    }

    const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';
    if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      fields.summary = 'Ticket Summary must contain between 5 and 150 characters.';
    }

    const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!requestedPriority || !ALLOWED_PRIORITIES.includes(requestedPriority)) {
      fields.requestedPriority = 'Requested Priority must be LOW, MEDIUM, HIGH, or URGENT.';
    }

    const trimmedDescription = typeof description === 'string' ? description.trim() : '';
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      fields.description = 'Description must contain between 10 and 2000 characters.';
    }

    if (Object.keys(fields).length > 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some ticket information is invalid.',
          fields,
        },
      });
      return;
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        clientSubmissionId: clientSubmissionId && typeof clientSubmissionId === 'string' ? clientSubmissionId.trim() : null,
        requesterId,
        categoryId: parsedCategoryId,
        relatedSystemId: parsedRelatedSystemId,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority,
        currentStatus: 'NEW',
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
    });

    res.status(201).json({ ticket });
    return;
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create ticket.',
      },
    });
    return;
  }
});

export default app;

