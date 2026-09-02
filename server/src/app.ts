import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { requireRequester, RequesterRequest } from './middleware/requesterMiddleware';
import { upload } from './middleware/uploadMiddleware';
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

// 2. Active Development Requesters
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

// 3. Active Categories
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

// 4. Active Related Systems
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

// Protected Endpoints Below (Require X-Development-Requester-Id)

// 5. Create Ticket
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
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create ticket.',
      },
    });
  }
});

// 6. Get My Tickets (Filter, Search, Sort, Pagination)
app.get('/api/tickets', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const { search, categoryId, relatedSystemId, requestedPriority, currentStatus, sortBy, sortOrder, page, limit } = req.query;

    const where: any = { requesterId };

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      const cId = parseInt(categoryId as string, 10);
      if (!isNaN(cId) && cId > 0) where.categoryId = cId;
    }

    if (relatedSystemId) {
      const sId = parseInt(relatedSystemId as string, 10);
      if (!isNaN(sId) && sId > 0) where.relatedSystemId = sId;
    }

    if (requestedPriority && typeof requestedPriority === 'string') {
      where.requestedPriority = requestedPriority;
    }

    if (currentStatus && typeof currentStatus === 'string') {
      where.currentStatus = currentStatus;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const validLimits = [10, 20, 50];
    const finalLimit = validLimits.includes(limitNum) ? limitNum : 10;
    const skip = (pageNum - 1) * finalLimit;

    // Sorting
    const validSortFields = ['ticketNumber', 'createdAt', 'updatedAt', 'summary'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'updatedAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy = [
      { [sortField]: sortDirection },
      { id: 'desc' }, // Secondary deterministic sort
    ];

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: finalLimit,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          attachments: { select: { id: true, originalFilename: true, isRemoved: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / finalLimit) || 1;

    res.status(200).json({
      tickets,
      pagination: {
        page: pageNum,
        limit: finalLimit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tickets.',
      },
    });
  }
});

// 7. Get Ticket Detail
app.get('/api/tickets/:id', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      res.status(404).json({
        error: {
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found.',
        },
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        requesterId, // Ownership protection!
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      res.status(404).json({
        error: {
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found.',
        },
      });
      return;
    }

    res.status(200).json({ ticket });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch ticket detail.',
      },
    });
  }
});

// 8. Upload Attachment
app.post('/api/tickets/:id/attachments', requireRequester, (req: RequesterRequest, res: Response): void => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      if (err.message === 'INVALID_ATTACHMENT_TYPE') {
        res.status(400).json({
          error: {
            code: 'INVALID_ATTACHMENT_TYPE',
            message: 'Only JPG, PNG, WEBP, and PDF files are permitted.',
          },
        });
        return;
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum permitted limit of 5 MB.',
          },
        });
        return;
      }
      res.status(400).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Attachment upload failed.',
        },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'MISSING_FILE',
          message: 'No file was provided for upload.',
        },
      });
      return;
    }

    try {
      const requesterId = req.requester!.id;
      const ticketId = parseInt(req.params.id, 10);

      // Ownership check
      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, requesterId },
      });

      if (!ticket) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: {
            code: 'TICKET_NOT_FOUND',
            message: 'Ticket not found.',
          },
        });
        return;
      }

      // Check active attachment limit (max 5)
      const activeCount = await prisma.attachment.count({
        where: { ticketId, isRemoved: false },
      });

      if (activeCount >= 5) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(400).json({
          error: {
            code: 'ATTACHMENT_LIMIT_EXCEEDED',
            message: 'A ticket can have a maximum of 5 active attachments.',
          },
        });
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
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save attachment.',
        },
      });
    }
  });
});

// 9. Download Attachment
app.get('/api/attachments/:id/download', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const attachmentId = parseInt(req.params.id, 10);

    if (isNaN(attachmentId) || attachmentId <= 0) {
      res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found.',
        },
      });
      return;
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
      res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found.',
        },
      });
      return;
    }

    if (attachment.isRemoved) {
      res.status(400).json({
        error: {
          code: 'ATTACHMENT_REMOVED',
          message: 'This attachment has been removed and cannot be downloaded.',
        },
      });
      return;
    }

    if (!fs.existsSync(attachment.storagePath)) {
      res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND_ON_STORAGE',
          message: 'File could not be located on storage server.',
        },
      });
      return;
    }

    res.download(attachment.storagePath, attachment.originalFilename);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to download attachment.',
      },
    });
  }
});

// 10. Soft-Remove Attachment
app.post('/api/attachments/:id/remove', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const attachmentId = parseInt(req.params.id, 10);
    const { removalReason } = req.body;

    if (isNaN(attachmentId) || attachmentId <= 0) {
      res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found.',
        },
      });
      return;
    }

    const trimmedReason = typeof removalReason === 'string' ? removalReason.trim() : '';
    if (trimmedReason.length < 3 || trimmedReason.length > 200) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Removal reason must contain between 3 and 200 characters.',
          fields: {
            removalReason: 'Removal reason must contain between 3 and 200 characters.',
          },
        },
      });
      return;
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
      res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found.',
        },
      });
      return;
    }

    if (attachment.isRemoved) {
      res.status(400).json({
        error: {
          code: 'ALREADY_REMOVED',
          message: 'This attachment has already been removed.',
        },
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
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove attachment.',
      },
    });
    return;
  }
});

// 6. My Tickets List & Filtering (Issue 4)
app.get('/api/tickets', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const { status, categoryId, relatedSystemId, priority, search, sort, page = '1', pageSize = '10' } = req.query;

    const where: any = {
      requesterId,
    };

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

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'createdAt_desc') orderBy = { createdAt: 'desc' };
    else if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'updatedAt_asc') orderBy = { updatedAt: 'asc' };
    else if (sort === 'priority_desc') orderBy = { requestedPriority: 'desc' };
    else if (sort === 'priority_asc') orderBy = { requestedPriority: 'asc' };

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
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tickets.',
      },
    });
    return;
  }
});

import { upload } from './middleware/uploadMiddleware';
import path from 'path';
import fs from 'fs';

// 7. Ticket Detail View (Issue 5)
app.get('/api/tickets/:id', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const ticketId = parseInt(req.params.id, 10);

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
        attachments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    // Ownership check
    if (ticket.requesterId !== requesterId) {
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

// 8. Upload Attachment (Issue 5)
app.post('/api/tickets/:id/attachments', requireRequester, (req: RequesterRequest, res: Response): void => {
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

      const requesterId = req.requester!.id;
      const ticketId = parseInt(req.params.id, 10);

      const ticket = await prisma.ticket.findFirst({ where: { id: ticketId } });
      if (!ticket || ticket.requesterId !== requesterId) {
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

// 9. Download Attachment (Issue 5)
app.get('/api/attachments/:id/download', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const attachmentId = parseInt(req.params.id, 10);

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
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

// 10. Soft Remove Attachment (Issue 5)
app.post('/api/attachments/:id/remove', requireRequester, async (req: RequesterRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.requester!.id;
    const attachmentId = parseInt(req.params.id, 10);
    const { removalReason } = req.body;

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
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
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Removal reason must be between 3 and 200 characters.',
        },
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

