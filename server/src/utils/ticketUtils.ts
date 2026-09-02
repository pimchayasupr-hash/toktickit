import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let candidate = (await prisma.ticket.count()) + 1;

  while (candidate < 999999) {
    const sequence = candidate.toString().padStart(6, '0');
    const ticketNumber = `TKT-${year}-${sequence}`;
    const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (!existing) {
      return ticketNumber;
    }
    candidate++;
  }

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${year}-${randomSuffix}`;
}
