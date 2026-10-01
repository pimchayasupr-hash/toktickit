import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

describe('Lab 3 - Seed Idempotency Test Suite (A6)', () => {
  const prisma = new PrismaClient();

  it('running seedDatabase() twice causes zero duplicate records and zero errors', async () => {
    // 1. Run seed first time
    await expect(seedDatabase()).resolves.not.toThrow();

    const userCount1 = await prisma.user.count();
    const categoryCount1 = await prisma.category.count();
    const systemCount1 = await prisma.relatedSystem.count();
    const seedTicketCount1 = await prisma.ticket.count({
      where: { ticketNumber: { startsWith: 'TKT-2026-0012' } },
    });

    // 2. Run seed second time
    await expect(seedDatabase()).resolves.not.toThrow();

    const userCount2 = await prisma.user.count();
    const categoryCount2 = await prisma.category.count();
    const systemCount2 = await prisma.relatedSystem.count();
    const seedTicketCount2 = await prisma.ticket.count({
      where: { ticketNumber: { startsWith: 'TKT-2026-0012' } },
    });

    // Assert counts are identical and no duplicates created
    expect(userCount2).toBe(userCount1);
    expect(categoryCount2).toBe(categoryCount1);
    expect(systemCount2).toBe(systemCount1);
    expect(seedTicketCount2).toBe(18);
    expect(seedTicketCount2).toBe(seedTicketCount1);
  });
});
