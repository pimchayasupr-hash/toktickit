import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning test data from database...');
  await prisma.$transaction([
    prisma.actionTaken.deleteMany(),
    prisma.ticketStatusHistory.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.publicComment.deleteMany(),
    prisma.internalNote.deleteMany(),
    prisma.ticket.deleteMany(),
  ]);
  console.log('All ticket and child records cleared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

