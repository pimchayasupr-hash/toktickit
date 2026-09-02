import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  const sequence = (count + 1).toString().padStart(6, '0');
  let ticketNumber = `TKT-${year}-${sequence}`;

  // Ensure uniqueness in case of race conditions
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (!existing) {
      return ticketNumber;
    }
    attempts++;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    ticketNumber = `TKT-${year}-${randomSuffix}`;
  }

  return ticketNumber;
}
