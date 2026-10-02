import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

const SEEDED_TICKET_NUMBERS = [
  'TKT-2026-001234',
  'TKT-2026-001233',
  'TKT-2026-001232',
  'TKT-2026-001231',
  'TKT-2026-001230',
  'TKT-2026-001229',
  'TKT-2026-001228',
  'TKT-2026-001227',
  'TKT-2026-001226',
  'TKT-2026-001225',
  'TKT-2026-001224',
  'TKT-2026-001223',
  'TKT-2026-001222',
  'TKT-2026-001221',
  'TKT-2026-001220',
  'TKT-2026-001219',
  'TKT-2026-001218',
  'TKT-2026-001217',
];

const SEEDED_USER_EMAILS = [
  'jennifer.anderson@example.com',
  'michael.brown@example.com',
  'sarah.jenkins@example.com',
  'david.kim@example.com',
  'alex.turner@example.com',
  'michael.staff@toktickit.com',
  'sarah.staff@toktickit.com',
  'david.staff@toktickit.com',
  'kevin.inactive@toktickit.com',
  'admin@toktickit.com',
];

describe('Lab 3 - Seed Idempotency Test Suite (A6)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('running seedDatabase() twice causes zero duplicate records and zero errors', async () => {
    // 1. Run seed first time
    await expect(seedDatabase()).resolves.not.toThrow();

    const seededUserCount1 = await prisma.user.count({
      where: { email: { in: SEEDED_USER_EMAILS } },
    });
    const seededTicketCount1 = await prisma.ticket.count({
      where: { ticketNumber: { in: SEEDED_TICKET_NUMBERS } },
    });

    // 2. Run seed second time
    await expect(seedDatabase()).resolves.not.toThrow();

    const seededUserCount2 = await prisma.user.count({
      where: { email: { in: SEEDED_USER_EMAILS } },
    });
    const seededTicketCount2 = await prisma.ticket.count({
      where: { ticketNumber: { in: SEEDED_TICKET_NUMBERS } },
    });

    // Assert counts are identical and equal canonical seed counts
    expect(seededUserCount1).toBe(10);
    expect(seededUserCount2).toBe(seededUserCount1);
    expect(seededTicketCount1).toBe(18);
    expect(seededTicketCount2).toBe(18);
    expect(seededTicketCount2).toBe(seededTicketCount1);
  });
});
