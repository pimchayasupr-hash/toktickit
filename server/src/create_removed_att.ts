import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Find the first available ticket in the system
  const ticket = await prisma.ticket.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!ticket) {
    console.error('No ticket found in the database. Please create a ticket or seed the database first.');
    process.exit(1);
  }

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storedFilename = `removed-demo-${Date.now()}.pdf`;
  const storagePath = path.join(uploadsDir, storedFilename);

  // Write a mock placeholder PDF file to disk
  fs.writeFileSync(storagePath, '%PDF-1.4 Mock removed attachment content');

  const attachment = await prisma.attachment.create({
    data: {
      ticketId: ticket.id,
      originalFilename: 'removed_sensitive_document.pdf',
      storedFilename,
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storagePath,
      isRemoved: true,
      removedAt: new Date(),
      removalReason: 'Removed by user for security reasons',
    },
  });

  console.log(`✅ Successfully created soft-removed attachment (ID #${attachment.id}) for Ticket #${ticket.ticketNumber}`);
  console.log(`Details:`);
  console.log(` - Original Filename: ${attachment.originalFilename}`);
  console.log(` - isRemoved: ${attachment.isRemoved}`);
  console.log(` - removedAt: ${attachment.removedAt}`);
  console.log(` - removalReason: ${attachment.removalReason}`);
}

main()
  .catch((e) => {
    console.error('Error creating removed attachment:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
