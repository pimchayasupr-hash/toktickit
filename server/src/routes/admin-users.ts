import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateUser, requireRole, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const parseId = (idParam: any): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(raw, 10);
};

// Enforce authentication & ADMIN role ONLY
router.use(authenticateUser);
router.use(requireRole(Role.ADMIN));

// 1. GET /api/admin/users (List users with search & role filter)
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;

    const where: any = {};

    if (role && typeof role === 'string' && role.trim() !== '') {
      where.role = role.trim() as Role;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ users });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user list.' } });
    return;
  }
});

// 2. POST /api/admin/users (Create new user)
router.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, isActive = true, initialPassword } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof initialPassword === 'string' ? initialPassword : '';

    if (!trimmedName || !trimmedEmail || !rawPassword || !role) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields (Name, Email, Role, Initial Password) are required.',
        },
      });
      return;
    }

    if (rawPassword.length < 8) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Initial password must be at least 8 characters long.' },
      });
      return;
    }

    const ALLOWED_ROLES = [Role.REQUESTER, Role.STAFF, Role.ADMIN];
    if (!ALLOWED_ROLES.includes(role)) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Role must be REQUESTER, STAFF, or ADMIN.' },
      });
      return;
    }

    // BR-14: Duplicate email check
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'A user with this email address already exists.' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        passwordHash,
        role: role as Role,
        isActive: Boolean(isActive),
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create user.' } });
    return;
  }
});

// 3. PATCH /api/admin/users/:id (Edit user basic info, role, active status)
router.patch('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = parseId(req.params.id);
    const loggedInAdminId = req.user!.id;
    const { name, email, role, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!existingUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    // BR-15: Self-deactivation prevention
    if (targetUserId === loggedInAdminId && isActive === false) {
      res.status(400).json({
        error: { code: 'SELF_DEACTIVATION_FORBIDDEN', message: 'You cannot deactivate your own Administrator account.' },
      });
      return;
    }

    // BR-16: Last active admin protection
    if (existingUser.role === Role.ADMIN && existingUser.isActive && (isActive === false || (role && role !== Role.ADMIN))) {
      const activeAdminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (activeAdminCount <= 1) {
        res.status(400).json({
          error: { code: 'LAST_ADMIN_PROTECTION', message: 'Cannot deactivate or change role of the last active Administrator account.' },
        });
        return;
      }
    }

    const dataToUpdate: any = {};

    if (typeof name === 'string' && name.trim() !== '') {
      dataToUpdate.name = name.trim();
    }

    if (typeof email === 'string' && email.trim() !== '') {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== existingUser.email) {
        const duplicateCheck = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (duplicateCheck) {
          res.status(409).json({ error: { code: 'CONFLICT', message: 'Email address is already in use.' } });
          return;
        }
        dataToUpdate.email = trimmedEmail;
      }
    }

    if (role && [Role.REQUESTER, Role.STAFF, Role.ADMIN].includes(role)) {
      dataToUpdate.role = role;
    }

    if (typeof isActive === 'boolean') {
      dataToUpdate.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ user: updatedUser });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update user.' } });
    return;
  }
});

// 4. POST /api/admin/users/:id/reset-password (Set new initial password)
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = parseId(req.params.id);
    const { initialPassword } = req.body;

    if (!initialPassword || typeof initialPassword !== 'string' || initialPassword.length < 8) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Initial password must be at least 8 characters long.' },
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!existingUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mustChangePassword: true,
      },
    });

    res.status(200).json({
      message: 'New initial password set successfully.',
      user: updatedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password.' } });
    return;
  }
});

export default router;
