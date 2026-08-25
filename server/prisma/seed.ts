import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUESTERS = [
  { name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com' },
  { name: 'Michael Brown', email: 'michael.brown@example.com' },
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com' },
  { name: 'David Kim', email: 'david.kim@example.com' },
] as const;

const CATEGORIES = [
  'Account and Access',
  'Hardware',
  'Software',
  'Network',
] as const;

const RELATED_SYSTEMS = [
  'Email',
  'Campus Wi-Fi',
  'VPN',
  'LEB2 App',
  'Grade Submission App',
  'Printer',
  'Corporate Laptop',
] as const;

async function main() {
  // Seed Development Requesters
  for (const requester of REQUESTERS) {
    await prisma.requesterUser.upsert({
      where: { email: requester.email },
      update: { name: requester.name, isActive: true },
      create: { name: requester.name, email: requester.email, isActive: true },
    });
  }

  // Seed Categories
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // Seed Related Systems
  for (const name of RELATED_SYSTEMS) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  const requesters = await prisma.requesterUser.findMany({ orderBy: { id: 'asc' } });
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  const relatedSystems = await prisma.relatedSystem.findMany({ orderBy: { id: 'asc' } });

  console.log(`Seeded ${requesters.length} requesters`);
  console.log(`Seeded ${categories.length} categories`);
  console.log(`Seeded ${relatedSystems.length} related systems`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

