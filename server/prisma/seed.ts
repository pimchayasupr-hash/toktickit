import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Order matches Section 10.2 of the Lab 1 spec (GET /api/categories response).
const CATEGORY_NAMES = ['Account and Access', 'Hardware', 'Software', 'Network'] as const;

async function main() {
  for (const name of CATEGORY_NAMES) {
    // upsert on the unique `name` field makes this seed safe to re-run:
    // existing categories are left untouched, missing ones are created,
    // and no duplicates are ever inserted.
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  console.log(`Seeded ${categories.length} categories:`, categories.map((c) => c.name));
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
