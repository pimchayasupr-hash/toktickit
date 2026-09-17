import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Role } from '@prisma/client';
import authRouter from './routes/auth';
import staffRouter from './routes/staff';
import commentsNotesRouter from './routes/comments-notes';
import adminUsersRouter from './routes/admin-users';
import { authenticateUser, AuthRequest } from './middleware/authMiddleware';
import { generateTicketNumber } from './utils/ticketUtils';
import { upload } from './middleware/uploadMiddleware';
import path from 'path';
import fs from 'fs';

const app: Application = express();
const prisma = new PrismaClient();

const parseId = (idParam: any): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(raw, 10);
};

app.use(cors());
app.use(express.json());

// 1. Health Check (Public)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'TokTickIT API',
  });
});

// 2. Reference Data Endpoints (Public / Dev fallback)
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories.' } });
  }
});

app.get('/api/related-systems', async (_req: Request, res: Response) => {
  try {
    const relatedSystems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ relatedSystems });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch related systems.' } });
  }
});

// Active requesters list
app.get('/api/requesters', async (_req: Request, res: Response) => {
  try {
    const requesters = await prisma.user.findMany({
      where: { isActive: true, role: Role.REQUESTER },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ requesters });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch requesters.' } });
  }
});

// 3. Authentication Router
app.use('/api/auth', authRouter);

// 4. Staff Operations Router
app.use('/api/staff', staffRouter);

// 5. Comments & Notes Router
app.use('/api', commentsNotesRouter);

// 6. Admin User Management Router
app.use('/api/admin', adminUsersRouter);

// 7. Requester Ticket Operations (Authenticated)

// Create Ticket
app.post('/api/tickets', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!.id;
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

    const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
    if (!requestedPriority || !ALLOWED_PRIORITIES.includes(requestedPriority)) {
      fields.requestedPriority = 'Requested Priority must be LOW, MEDIUM, or HIGH.';
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

    let ticket;
    let attempts = 0;
    while (attempts < 5) {
      try {
        const ticketNumber = await generateTicketNumber();
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            clientSubmissionId: clientSubmissionId && typeof clientSubmissionId === 'string' ? clientSubmissionId.trim() : null,
            requesterId,
            categoryId: parsedCategoryId,
            relatedSystemId: parsedRelatedSystemId,
            summary: trimmedSummary,
            description: trimmedDescription,
            requestedPriority,
            itPriority: requestedPriority,
            currentStatus: 'NEW',
          },
          include: {
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true, email: true } },
            attachments: true,
          },
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002' && Array.isArray(err?.meta?.target) && err.meta.target.includes('ticketNumber')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    res.status(201).json({ ticket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create ticket.' } });
    return;
  }
});

// List My Tickets
app.get('/api/tickets', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!.id;
    const { status, categoryId, relatedSystemId, priority, search, sort, page = '1', pageSize = '10' } = req.query;

    const where: any = { requesterId };

    if (status && typeof status === 'string' && status.trim() !== '') {
      where.currentStatus = status.trim();
    }

    if (categoryId) {
      const parsedCat = parseInt(categoryId as string, 10);
      if (!isNaN(parsedCat)) where.categoryId = parsedCat;
    }

    if (relatedSystemId) {
      const parsedSys = parseInt(relatedSystemId as string, 10);
      if (!isNaN(parsedSys)) where.relatedSystemId = parsedSys;
    }

    if (priority && typeof priority === 'string' && priority.trim() !== '') {
      where.requestedPriority = priority.trim();
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      where.OR = [
        { ticketNumber: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'createdAt_desc') orderBy = { createdAt: 'desc' };
    else if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'updatedAt_asc') orderBy = { updatedAt: 'asc' };

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      tickets,
      pagination: {
        total,
        page: pageNum,
        pageSize: limitNum,
        totalPages,
      },
    });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tickets.' } });
    return;
  }
});

// Ticket Detail View
app.get('/api/tickets/:id', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const ticketId = parseId(req.params.id);

    if (isNaN(ticketId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Ticket ID must be a number.' } });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: 'asc' } },
        publicComments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    // Ownership check for Requester
    if (user.role === Role.REQUESTER && ticket.requesterId !== user.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    res.status(200).json({ ticket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ticket detail.' } });
    return;
  }
});

// Attachments handling
app.post('/api/tickets/:id/attachments', authenticateUser, (req: AuthRequest, res: Response): void => {
  upload.single('file')(req, res, async (err: any) => {
    try {
      if (err) {
        const message = err.message || 'File upload failed.';
        const code = message.includes('LIMIT_FILE_SIZE') ? 'FILE_TOO_LARGE' : 'INVALID_FILE';
        res.status(400).json({ error: { code, message } });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: { code: 'MISSING_FILE', message: 'Please select a file to upload.' } });
        return;
      }

      const user = req.user!;
      const ticketId = parseId(req.params.id);

      const ticket = await prisma.ticket.findFirst({ where: { id: ticketId } });
      if (!ticket || (user.role === Role.REQUESTER && ticket.requesterId !== user.id)) {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      const activeAttachmentsCount = await prisma.attachment.count({
        where: { ticketId, isRemoved: false },
      });

      if (activeAttachmentsCount >= 5) {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(400).json({ error: { code: 'ATTACHMENT_LIMIT_EXCEEDED', message: 'Maximum 5 active attachments allowed per ticket.' } });
        return;
      }

      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          storagePath: req.file.path,
          isRemoved: false,
        },
      });

      res.status(201).json({ attachment });
      return;
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upload attachment.' } });
      return;
    }
  });
});

app.get('/api/attachments/:id/download', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const attachmentId = parseId(req.params.id);

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || (user.role === Role.REQUESTER && attachment.ticket.requesterId !== user.id)) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found.' } });
      return;
    }

    if (attachment.isRemoved) {
      res.status(410).json({ error: { code: 'FILE_REMOVED', message: 'This attachment has been removed and cannot be downloaded.' } });
      return;
    }

    if (!fs.existsSync(attachment.storagePath)) {
      res.status(404).json({ error: { code: 'FILE_NOT_FOUND_ON_DISK', message: 'File not found on server storage.' } });
      return;
    }

    res.download(attachment.storagePath, attachment.originalFilename);
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to download attachment.' } });
    return;
  }
});

app.post('/api/attachments/:id/remove', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const attachmentId = parseId(req.params.id);
    const { removalReason } = req.body;

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || (user.role === Role.REQUESTER && attachment.ticket.requesterId !== user.id)) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found.' } });
      return;
    }

    if (attachment.isRemoved) {
      res.status(400).json({ error: { code: 'ALREADY_REMOVED', message: 'Attachment is already removed.' } });
      return;
    }

    const trimmedReason = typeof removalReason === 'string' ? removalReason.trim() : '';
    if (trimmedReason.length < 3 || trimmedReason.length > 200) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Removal reason must be between 3 and 200 characters.' },
      });
      return;
    }

    const updatedAttachment = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: trimmedReason,
      },
    });

    res.status(200).json({ attachment: updatedAttachment });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove attachment.' } });
    return;
  }
});

export default app;
