import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const parseId = (idParam: any): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(raw, 10);
};

router.use(authenticateUser);

// --- Public Comments ---

// 1. GET /api/tickets/:id/comments
router.get('/tickets/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const user = req.user!;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    // Ownership check for Requester
    if (user.role === Role.REQUESTER && ticket.requesterId !== user.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ comments });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch comments.' } });
    return;
  }
});

// 2. POST /api/tickets/:id/comments
router.post('/tickets/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const user = req.user!;
    const { content } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    if (user.role === Role.REQUESTER && ticket.requesterId !== user.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (trimmedContent.length < 1 || trimmedContent.length > 2000) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Comment content must be between 1 and 2000 characters.' },
      });
      return;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: user.id,
        content: trimmedContent,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    res.status(201).json({ comment });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to post comment.' } });
    return;
  }
});


// --- Internal Notes (RESTRICTED TO IT STAFF & ADMIN ONLY) ---

// 3. GET /api/tickets/:id/notes
router.get('/tickets/:id/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const user = req.user!;

    if (user.role === Role.REQUESTER) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Requesters are not permitted to view internal notes.' },
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ notes });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch internal notes.' } });
    return;
  }
});

// 4. POST /api/tickets/:id/notes
router.post('/tickets/:id/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const user = req.user!;
    const { content } = req.body;

    if (user.role === Role.REQUESTER) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Requesters are not permitted to create internal notes.' },
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (trimmedContent.length < 1 || trimmedContent.length > 2000) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Note content must be between 1 and 2000 characters.' },
      });
      return;
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: user.id,
        content: trimmedContent,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    res.status(201).json({ note });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to post internal note.' } });
    return;
  }
});

export default router;
