import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateUser, requireRole, requirePasswordChangeCheck, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const parseId = (idParam: any): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(raw, 10);
};

// Apply auth, password change check, and role checks to all staff routes
router.use(authenticateUser);
router.use(requirePasswordChangeCheck);
router.use(requireRole(Role.STAFF, Role.ADMIN));

// 1. GET /api/staff/tickets (IT Staff Ticket Queue)
router.get('/tickets', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, categoryId, relatedSystemId, priority, ownerId, search, sort, page = '1', pageSize = '10' } = req.query;

    // Validate page
    if (page !== undefined && page !== null && page !== '') {
      const parsedPage = Number(page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Page must be an integer >= 1.' } });
        return;
      }
    }

    // Validate pageSize
    if (pageSize !== undefined && pageSize !== null && pageSize !== '') {
      const parsedPageSize = Number(pageSize);
      if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'PageSize must be an integer between 1 and 100.' } });
        return;
      }
    }

    // Validate sort
    const VALID_SORTS = ['createdAt_desc', 'createdAt_asc', 'updatedAt_desc', 'updatedAt_asc', 'priority_desc', 'priority_asc'];
    if (sort && typeof sort === 'string' && sort.trim() !== '') {
      if (!VALID_SORTS.includes(sort.trim())) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid sort parameter.' } });
        return;
      }
    }

    const andConditions: any[] = [];

    const VALID_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];
    if (status && typeof status === 'string' && status.trim() !== '') {
      if (!VALID_STATUSES.includes(status.trim())) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status filter value.' } });
        return;
      }
      andConditions.push({ currentStatus: status.trim() });
    }

    if (categoryId) {
      const parsedCat = parseInt(categoryId as string, 10);
      if (!isNaN(parsedCat)) andConditions.push({ categoryId: parsedCat });
    }

    if (relatedSystemId) {
      const parsedSys = parseInt(relatedSystemId as string, 10);
      if (!isNaN(parsedSys)) andConditions.push({ relatedSystemId: parsedSys });
    }

    if (priority && typeof priority === 'string' && priority.trim() !== '') {
      andConditions.push({
        OR: [
          { itPriority: priority.trim() },
          { requestedPriority: priority.trim() },
        ],
      });
    }

    if (ownerId && typeof ownerId === 'string') {
      if (ownerId.trim() === 'unassigned') {
        andConditions.push({ ownerId: null });
      } else {
        const parsedOwner = parseInt(ownerId.trim(), 10);
        if (!isNaN(parsedOwner)) andConditions.push({ ownerId: parsedOwner });
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      andConditions.push({
        OR: [
          { ticketNumber: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'createdAt_desc') orderBy = { createdAt: 'desc' };
    else if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'updatedAt_asc') orderBy = { updatedAt: 'asc' };
    else if (sort === 'priority_desc') orderBy = { itPriority: 'desc' };
    else if (sort === 'priority_asc') orderBy = { itPriority: 'asc' };

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
          owner: { select: { id: true, name: true, email: true } },
          attachments: { where: { isRemoved: false } },
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
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch staff queue.' },
    });
    return;
  }
});

// 2. GET /api/staff/tickets/:id (Staff Ticket Detail)
router.get('/tickets/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Ticket ID must be a number.' } });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
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
        internalNotes: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
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

// 3. PATCH /api/staff/tickets/:id/claim (Claim ticket)
router.patch('/tickets/:id/claim', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const userId = req.user!.id;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ ticket: updatedTicket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to claim ticket.' } });
    return;
  }
});

// 4. PATCH /api/staff/tickets/:id/assign (Reassign ticket)
router.patch('/tickets/:id/assign', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const { ownerId } = req.body;

    const parsedOwnerId = ownerId === null ? null : parseInt(ownerId, 10);

    if (parsedOwnerId !== null) {
      const targetUser = await prisma.user.findFirst({
        where: { id: parsedOwnerId, isActive: true, role: { in: [Role.STAFF, Role.ADMIN] } },
      });

      if (!targetUser) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Target owner must be an active IT Staff or Administrator.' },
        });
        return;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: parsedOwnerId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ ticket: updatedTicket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to assign ticket.' } });
    return;
  }
});

// 5. PATCH /api/staff/tickets/:id/priority (Set IT Priority)
router.patch('/tickets/:id/priority', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const { itPriority } = req.body;

    const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!itPriority || !ALLOWED_PRIORITIES.includes(itPriority)) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'IT Priority must be LOW, MEDIUM, HIGH, or URGENT.' },
      });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority },
    });

    res.status(200).json({ ticket: updatedTicket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update priority.' } });
    return;
  }
});

// 6. PATCH /api/staff/tickets/:id/status (Update Status per transition matrix BR-10)
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED', 'OPEN'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  CANCELLED: [],
};

router.patch('/tickets/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = parseId(req.params.id);
    const { status } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
      return;
    }

    const currentStatus = ticket.currentStatus;
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];

    if (!status || !allowedNext.includes(status)) {
      res.status(400).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition status from ${currentStatus} to ${status}.`,
          allowedTransitions: allowedNext,
        },
      });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { currentStatus: status },
    });

    res.status(200).json({ ticket: updatedTicket });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update status.' } });
    return;
  }
});

// 5. GET /api/staff/assignees (List active STAFF and ADMIN users for assignment/reassignment)
router.get('/assignees', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.STAFF, Role.ADMIN] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      assignees,
      users: assignees,
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch assignees.',
      },
    });
    return;
  }
});

export default router;
