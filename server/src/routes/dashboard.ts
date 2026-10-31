import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest, authenticateUser, requirePasswordChangeCheck } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const ACTIVE_OPEN_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'];
const RECENTLY_RESOLVED_WINDOW_DAYS = 30;

// 1. GET /api/dashboard/requester
router.get(
  '/requester',
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const thirtyDaysAgo = new Date(Date.now() - RECENTLY_RESOLVED_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const [
        openTicketsCount,
        waitingForRequesterCount,
        recentlyResolvedCount,
        closedTicketsCount,
        attentionTickets,
        recentTickets,
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            requesterId: userId,
            currentStatus: { in: ACTIVE_OPEN_STATUSES },
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId: userId,
            currentStatus: 'WAITING_FOR_REQUESTER',
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId: userId,
            currentStatus: 'RESOLVED',
            updatedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId: userId,
            currentStatus: 'CLOSED',
          },
        }),
        prisma.ticket.findMany({
          where: {
            requesterId: userId,
            currentStatus: 'WAITING_FOR_REQUESTER',
          },
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
        prisma.ticket.findMany({
          where: { requesterId: userId },
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            requestedPriority: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

      res.status(200).json({
        metrics: {
          openTicketsCount,
          waitingForRequesterCount,
          recentlyResolvedCount,
          closedTicketsCount,
        },
        attentionTickets,
        recentTickets,
      });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch requester dashboard metrics.' } });
      return;
    }
  }
);

// 2. GET /api/dashboard/staff
router.get(
  '/staff',
  authenticateUser,
  requirePasswordChangeCheck,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Role check: Only STAFF and ADMIN
      if (req.user!.role !== Role.STAFF && req.user!.role !== Role.ADMIN) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only IT Staff and Administrators may view staff dashboard.' } });
        return;
      }

      const userId = req.user!.id;
      const activeOpenFilter = { in: ACTIVE_OPEN_STATUSES };

      const [
        unassignedCount,
        myAssignedCount,
        openTotalCount,
        urgentCount,
        statusCounts,
        priorityCounts,
        rawMyRecentActions,
        rawUrgentTickets,
      ] = await Promise.all([
        prisma.ticket.count({
          where: { ownerId: null, currentStatus: activeOpenFilter },
        }),
        prisma.ticket.count({
          where: { ownerId: userId, currentStatus: activeOpenFilter },
        }),
        prisma.ticket.count({
          where: { currentStatus: activeOpenFilter },
        }),
        prisma.ticket.count({
          where: { itPriority: 'URGENT', currentStatus: activeOpenFilter },
        }),
        prisma.ticket.groupBy({
          by: ['currentStatus'],
          _count: { id: true },
        }),
        prisma.ticket.groupBy({
          by: ['itPriority'],
          where: { itPriority: { not: null }, currentStatus: activeOpenFilter },
          _count: { id: true },
        }),
        prisma.actionTaken.findMany({
          where: { performedById: userId },
          orderBy: [{ actionDateTime: 'desc' }, { createdAt: 'desc' }],
          take: 5,
          include: {
            ticket: { select: { ticketNumber: true } },
          },
        }),
        prisma.ticket.findMany({
          where: { itPriority: 'URGENT', currentStatus: activeOpenFilter },
          orderBy: { createdAt: 'asc' },
          take: 5,
          include: {
            owner: { select: { name: true } },
          },
        }),
      ]);

      const allStatuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];
      const byStatus: Record<string, number> = {};
      allStatuses.forEach((s) => {
        byStatus[s] = 0;
      });
      statusCounts.forEach((sc) => {
        byStatus[sc.currentStatus] = sc._count.id;
      });

      const allPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const byPriority: Record<string, number> = {};
      allPriorities.forEach((p) => {
        byPriority[p] = 0;
      });
      priorityCounts.forEach((pc) => {
        if (pc.itPriority) {
          byPriority[pc.itPriority] = pc._count.id;
        }
      });

      const myRecentActions = rawMyRecentActions.map((a) => ({
        id: a.id,
        ticketId: a.ticketId,
        ticketNumber: a.ticket.ticketNumber,
        actionDateTime: a.actionDateTime,
        description: a.description,
        result: a.result,
        followUpRequired: a.followUpRequired,
      }));

      const urgentTickets = rawUrgentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        currentStatus: t.currentStatus,
        itPriority: t.itPriority,
        ownerName: t.owner ? t.owner.name : 'Unassigned',
        createdAt: t.createdAt,
      }));

      let adminMetrics = null;
      if (req.user!.role === Role.ADMIN) {
        const [totalUsers, activeUsers, deactivatedUsers, usersByRole] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.user.count({ where: { isActive: false } }),
          prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
          }),
        ]);

        const roleCounts: Record<string, number> = {
          REQUESTER: 0,
          STAFF: 0,
          ADMIN: 0,
        };
        usersByRole.forEach((r) => {
          roleCounts[r.role] = r._count.id;
        });

        adminMetrics = {
          totalUsers,
          activeUsers,
          deactivatedUsers,
          byRole: roleCounts,
        };
      }

      res.status(200).json({
        metrics: {
          unassignedCount,
          myAssignedCount,
          openTotalCount,
          urgentCount,
          byStatus,
          byPriority,
        },
        myRecentActions,
        urgentTickets,
        adminMetrics,
      });
      return;
    } catch (error) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch staff dashboard metrics.' } });
      return;
    }
  }
);

export default router;
