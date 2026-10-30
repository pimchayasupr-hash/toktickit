import { Router, Response } from 'express';
import { PrismaClient, Role, ActionStatus } from '@prisma/client';
import { AuthRequest, authenticateUser, requirePasswordChangeCheck } from '../middleware/authMiddleware';
import { sanitizeHtml } from '../utils/validators';

const router = Router();
const prisma = new PrismaClient();

const parseId = (idParam: any): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(raw, 10);
};

const VALID_ACTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_ACTION_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const validateAssignee = async (
  assigneeId: any
): Promise<{ error?: { code: string; message: string }; user?: any }> => {
  if (assigneeId === null || assigneeId === undefined || assigneeId === '') {
    return {};
  }
  const idNum = typeof assigneeId === 'number' ? assigneeId : parseId(assigneeId);
  if (isNaN(idNum)) {
    return { error: { code: 'VALIDATION_ERROR', message: 'assigneeId must be a valid number.' } };
  }
  const user = await prisma.user.findUnique({ where: { id: idNum } });
  if (!user) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Assignee not found.' } };
  }
  if (!user.isActive || (user.role !== Role.STAFF && user.role !== Role.ADMIN)) {
    return {
      error: {
        code: 'INACTIVE_ASSIGNEE',
        message: 'Assignee must be an active IT Staff or Administrator.',
      },
    };
  }
  return { user };
};

// 1. GET /api/tickets/:ticketId/actions-taken (or /actions)
router.get(
  ['/tickets/:ticketId/actions-taken', '/tickets/:ticketId/actions'],
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseId(req.params.ticketId);
      if (isNaN(ticketId)) {
        res.status(400).json({ error: { code: 'INVALID_ID', message: 'Ticket ID must be a valid number.' } });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, requesterId: true },
      });

      if (!ticket) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      // Requester authorization check (BR-08)
      if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.id) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      const actions = await prisma.actionTaken.findMany({
        where: { ticketId },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { actionDateTime: 'asc' },
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      });

      res.status(200).json({ actionsTaken: actions });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Actions Taken.' } });
      return;
    }
  }
);

// 2. POST /api/tickets/:ticketId/actions-taken (or /actions)
router.post(
  ['/tickets/:ticketId/actions-taken', '/tickets/:ticketId/actions'],
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Role authorization: Only STAFF and ADMIN
      if (req.user!.role !== Role.STAFF && req.user!.role !== Role.ADMIN) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only IT Staff and Administrators may record Actions Taken.' } });
        return;
      }

      const ticketId = parseId(req.params.ticketId);
      if (isNaN(ticketId)) {
        res.status(400).json({ error: { code: 'INVALID_ID', message: 'Ticket ID must be a valid number.' } });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      // BR-11: Terminal state check
      if (ticket.currentStatus === 'CLOSED' || ticket.currentStatus === 'CANCELLED') {
        res.status(400).json({
          error: {
            code: 'TERMINAL_STATE_LOCKED',
            message: `Cannot record Action Taken on ticket in terminal status ${ticket.currentStatus}.`,
          },
        });
        return;
      }

      const {
        actionDateTime,
        description,
        result,
        status,
        assigneeId,
        followUpRequired,
        followUpNote,
        attachmentNotes,
      } = req.body;

      // BR-04: actionDateTime validation
      if (!actionDateTime || typeof actionDateTime !== 'string') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'actionDateTime is required and must be a valid ISO-8601 timestamp string.',
          },
        });
        return;
      }

      const parsedActionDate = new Date(actionDateTime);
      if (isNaN(parsedActionDate.getTime())) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'actionDateTime is not a valid date.',
          },
        });
        return;
      }

      const nowWithTolerance = new Date(Date.now() + 5 * 60 * 1000);
      if (parsedActionDate > nowWithTolerance) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'actionDateTime cannot be more than 5 minutes in the future.',
          },
        });
        return;
      }

      if (parsedActionDate < new Date(ticket.createdAt)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'actionDateTime cannot precede Ticket createdAt timestamp.',
          },
        });
        return;
      }

      // BR-05: description validation
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'description is required and must not be empty.',
          },
        });
        return;
      }

      if (description.trim().length > 2000) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'description cannot exceed 2000 characters.',
          },
        });
        return;
      }

      // Status validation & Lifecycle rules
      let targetStatus: ActionStatus = ActionStatus.PENDING;
      if (status !== undefined) {
        if (!VALID_ACTION_STATUSES.includes(status)) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid Action status ${status}.`,
            },
          });
          return;
        }
        targetStatus = status as ActionStatus;
      }

      // Result validation: required ONLY when completing the action
      let validatedResult: string | null = null;
      if (targetStatus === ActionStatus.COMPLETED) {
        if (!result || typeof result !== 'string' || result.trim().length === 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'result is required when completing an Action Taken.',
            },
          });
          return;
        }
      }

      if (result !== undefined && result !== null && typeof result === 'string') {
        const trimmed = result.trim();
        if (trimmed.length > 1000) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'result cannot exceed 1000 characters.',
            },
          });
          return;
        }
        if (trimmed.length > 0) {
          validatedResult = sanitizeHtml(trimmed);
        }
      }

      // Assignee validation: operational relation check (must be active staff or admin)
      let validatedAssigneeId: number | null = null;
      if (assigneeId !== undefined && assigneeId !== null && assigneeId !== '') {
        const { error: assigneeErr, user: validAssignee } = await validateAssignee(assigneeId);
        if (assigneeErr) {
          res.status(400).json({ error: assigneeErr });
          return;
        }
        validatedAssigneeId = validAssignee.id;
      }

      // BR-06: followUpRequired & followUpNote validation
      const isFollowUp = Boolean(followUpRequired);
      let validatedFollowUpNote: string | null = null;

      if (isFollowUp) {
        if (!followUpNote || typeof followUpNote !== 'string' || followUpNote.trim().length === 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'followUpNote is mandatory when followUpRequired is true.',
            },
          });
          return;
        }
        if (followUpNote.trim().length > 1000) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'followUpNote cannot exceed 1000 characters.',
            },
          });
          return;
        }
        validatedFollowUpNote = sanitizeHtml(followUpNote.trim());
      }

      // BR-07: attachmentNotes validation
      let validatedAttachmentNotes: string | null = null;
      if (attachmentNotes && typeof attachmentNotes === 'string') {
        if (attachmentNotes.trim().length > 1000) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'attachmentNotes cannot exceed 1000 characters.',
            },
          });
          return;
        }
        validatedAttachmentNotes = sanitizeHtml(attachmentNotes.trim());
      }

      // BR-02 & BR-03: performedById strictly bound to session user
      const action = await prisma.actionTaken.create({
        data: {
          ticketId,
          actionDateTime: parsedActionDate,
          description: sanitizeHtml(description.trim()),
          result: validatedResult,
          status: targetStatus,
          assigneeId: validatedAssigneeId,
          performedById: req.user!.id,
          followUpRequired: isFollowUp,
          followUpNote: validatedFollowUpNote,
          attachmentNotes: validatedAttachmentNotes,
          createdById: req.user!.id,
          version: 1,
        },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(201).json({ actionTaken: action });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create Action Taken.' } });
      return;
    }
  }
);

// 3. GET /api/tickets/:ticketId/actions-taken/:actionId
router.get(
  '/tickets/:ticketId/actions-taken/:actionId',
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseId(req.params.ticketId);
      const actionId = parseId(req.params.actionId);

      if (isNaN(ticketId) || isNaN(actionId)) {
        res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID parameters.' } });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, requesterId: true },
      });

      if (!ticket) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.id) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
        return;
      }

      const action = await prisma.actionTaken.findFirst({
        where: { id: actionId, ticketId },
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      if (!action) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action Taken not found.' } });
        return;
      }

      res.status(200).json({ actionTaken: action });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Action Taken.' } });
      return;
    }
  }
);

// 4. PATCH /api/tickets/:ticketId/actions-taken/:actionId (and aliases)
router.patch(
  ['/tickets/:ticketId/actions-taken/:actionId', '/tickets/:ticketId/actions/:actionId', '/actions/:actionId'],
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (req.user!.role !== Role.STAFF && req.user!.role !== Role.ADMIN) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only IT Staff and Administrators may edit Actions Taken.' } });
        return;
      }

      const ticketId = req.params.ticketId ? parseId(req.params.ticketId) : undefined;
      const actionId = parseId(req.params.actionId);

      if ((req.params.ticketId && isNaN(ticketId!)) || isNaN(actionId)) {
        res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID parameters.' } });
        return;
      }

      const whereClause: any = { id: actionId };
      if (ticketId !== undefined) {
        whereClause.ticketId = ticketId;
      }

      const action = await prisma.actionTaken.findFirst({
        where: whereClause,
      });

      if (!action) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action Taken not found on this ticket.' } });
        return;
      }

      // BR-14: Concurrency control check (version is strictly required)
      const { version } = req.body;
      if (version === undefined || typeof version !== 'number') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'version is required for optimistic concurrency control.',
          },
        });
        return;
      }

      // Terminal immutability: completed or cancelled actions are terminal
      if (action.status === ActionStatus.COMPLETED || action.status === ActionStatus.CANCELLED) {
        res.status(400).json({
          error: {
            code: 'TERMINAL_ACTION_LOCKED',
            message: `Action Taken in terminal status ${action.status} is immutable and cannot be updated.`,
          },
        });
        return;
      }

      // Lifecycle / status transition validation
      let nextStatus: ActionStatus = action.status;
      if (req.body.status !== undefined) {
        if (!VALID_ACTION_STATUSES.includes(req.body.status)) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid Action status ${req.body.status}.`,
            },
          });
          return;
        }

        const requestedStatus = req.body.status as ActionStatus;
        const permitted = VALID_ACTION_TRANSITIONS[action.status] || [];
        if (requestedStatus !== action.status && !permitted.includes(requestedStatus)) {
          res.status(400).json({
            error: {
              code: 'INVALID_TRANSITION',
              message: `Cannot transition Action Taken from ${action.status} to ${requestedStatus}.`,
              allowedTransitions: permitted,
            },
          });
          return;
        }
        nextStatus = requestedStatus;
      }

      const updateData: any = {
        updatedById: req.user!.id,
      };

      if (req.body.status !== undefined) {
        updateData.status = nextStatus;
      }

      // Result validation: required ONLY when completing the action
      if (nextStatus === ActionStatus.COMPLETED) {
        const candidateResult = req.body.result !== undefined ? req.body.result : action.result;
        if (!candidateResult || typeof candidateResult !== 'string' || candidateResult.trim().length === 0) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'result is required when completing an Action Taken.',
            },
          });
          return;
        }
      }

      if (req.body.result !== undefined) {
        if (req.body.result === null || req.body.result === '') {
          if (nextStatus === ActionStatus.COMPLETED) {
            res.status(400).json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'result is required when completing an Action Taken.',
              },
            });
            return;
          }
          updateData.result = null;
        } else {
          const resStr = String(req.body.result).trim();
          if (resStr.length > 1000) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'result cannot exceed 1000 chars.' } });
            return;
          }
          updateData.result = sanitizeHtml(resStr);
        }
      }

      // Assignee assignment / reassignment validation
      if (req.body.assigneeId !== undefined) {
        if (req.body.assigneeId === null || req.body.assigneeId === '') {
          updateData.assigneeId = null;
        } else {
          const { error: assigneeErr, user: validAssignee } = await validateAssignee(req.body.assigneeId);
          if (assigneeErr) {
            res.status(400).json({ error: assigneeErr });
            return;
          }
          updateData.assigneeId = validAssignee.id;
        }
      }

      if (req.body.actionDateTime !== undefined) {
        const parsed = new Date(req.body.actionDateTime);
        if (isNaN(parsed.getTime())) {
          res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid actionDateTime.' } });
          return;
        }
        updateData.actionDateTime = parsed;
      }

      if (req.body.description !== undefined) {
        const desc = String(req.body.description).trim();
        if (desc.length === 0 || desc.length > 2000) {
          res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'description must be 1-2000 chars.' } });
          return;
        }
        updateData.description = sanitizeHtml(desc);
      }

      if (req.body.followUpRequired !== undefined) {
        const followUp = Boolean(req.body.followUpRequired);
        updateData.followUpRequired = followUp;
        if (followUp) {
          const note = req.body.followUpNote ? String(req.body.followUpNote).trim() : '';
          if (note.length === 0 || note.length > 1000) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'followUpNote required when followUpRequired is true.' } });
            return;
          }
          updateData.followUpNote = sanitizeHtml(note);
        } else {
          updateData.followUpNote = null;
        }
      }

      if (req.body.attachmentNotes !== undefined) {
        const notes = req.body.attachmentNotes ? String(req.body.attachmentNotes).trim() : null;
        if (notes && notes.length > 1000) {
          res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'attachmentNotes cannot exceed 1000 chars.' } });
          return;
        }
        updateData.attachmentNotes = notes ? sanitizeHtml(notes) : null;
      }

      // Atomic optimistic lock write in database predicate via transaction
      const txResult = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.actionTaken.updateMany({
          where: {
            id: actionId,
            ...(ticketId !== undefined ? { ticketId } : {}),
            version: version, // Atomic optimistic lock predicate!
          },
          data: {
            ...updateData,
            version: version + 1,
          },
        });

        if (updateResult.count === 0) {
          const current = await tx.actionTaken.findFirst({
            where: { id: actionId, ...(ticketId !== undefined ? { ticketId } : {}) },
            include: {
              performedBy: { select: { id: true, name: true, email: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          });
          return { conflict: true, notFound: !current, entity: current };
        }

        const updated = await tx.actionTaken.findUnique({
          where: { id: actionId },
          include: {
            performedBy: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        });

        return { conflict: false, notFound: false, entity: updated };
      });

      if (txResult.notFound) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action Taken not found.' } });
        return;
      }

      if (txResult.conflict) {
        res.status(409).json({
          error: {
            code: 'CONCURRENCY_CONFLICT',
            message: 'This Action Taken has been modified by another user. Please reload the latest data.',
            currentEntity: txResult.entity,
          },
        });
        return;
      }

      res.status(200).json({ actionTaken: txResult.entity });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update Action Taken.' } });
      return;
    }
  }
);

// 5. DELETE /api/tickets/:ticketId/actions-taken/:actionId -> 405 (BR-10 append-only)
router.delete(
  ['/tickets/:ticketId/actions-taken/:actionId', '/tickets/:ticketId/actions/:actionId', '/actions/:actionId'],
  authenticateUser,
  (_req: AuthRequest, res: Response): void => {
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Actions Taken records are append-only for audit preservation and cannot be deleted.',
      },
    });
  }
);

export default router;
