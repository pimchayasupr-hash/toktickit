import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
  // Requesters (Active >= 4, Inactive >= 1)
  {
    name: 'Jennifer Anderson',
    email: 'jennifer.anderson@example.com',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'Michael Requester',
    email: 'michael.brown@example.com',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'Alex Inactive',
    email: 'alex.turner@example.com',
    role: Role.REQUESTER,
    isActive: false,
    mustChangePassword: true,
  },

  // IT Staff (Active >= 3, Inactive >= 1)
  {
    name: 'Michael Brown (IT Support)',
    email: 'michael.staff@toktickit.com',
    role: Role.STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'Sarah Johnson (IT Admin)',
    email: 'sarah.staff@toktickit.com',
    role: Role.STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'David Lee (Network Tech)',
    email: 'david.staff@toktickit.com',
    role: Role.STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: 'Kevin Inactive Staff',
    email: 'kevin.inactive@toktickit.com',
    role: Role.STAFF,
    isActive: false,
    mustChangePassword: true,
  },

  // Administrator (Active >= 1)
  {
    name: 'John Smith (Admin)',
    email: 'admin@toktickit.com',
    role: Role.ADMIN,
    isActive: true,
    mustChangePassword: false,
  },
];

const CATEGORIES = [
  'Account and Access',
  'Hardware',
  'Software',
  'Network',
];

const RELATED_SYSTEMS = [
  'Email',
  'Campus Wi-Fi',
  'VPN',
  'LEB2 App',
  'Grade Submission App',
  'Printer',
  'Corporate Laptop',
];

async function main() {
  console.log('Seeding database for Lab 3...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // Seed Users
  const userMap = new Map<string, number>();
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
    });
    userMap.set(u.email, user.id);
  }

  // Seed Categories
  const categoryMap = new Map<string, number>();
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    categoryMap.set(name, cat.id);
  }

  // Seed Related Systems
  const systemMap = new Map<string, number>();
  for (const name of RELATED_SYSTEMS) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    systemMap.set(name, sys.id);
  }

  const req1Id = userMap.get('jennifer.anderson@example.com')!;
  const req2Id = userMap.get('michael.brown@example.com')!;
  const req3Id = userMap.get('sarah.jenkins@example.com')!;
  const staff1Id = userMap.get('michael.staff@toktickit.com')!;
  const staff2Id = userMap.get('sarah.staff@toktickit.com')!;

  const catHardware = categoryMap.get('Hardware')!;
  const catNetwork = categoryMap.get('Network')!;
  const catSoftware = categoryMap.get('Software')!;
  const sysLaptop = systemMap.get('Corporate Laptop')!;
  const sysVpn = systemMap.get('VPN')!;
  const sysEmail = systemMap.get('Email')!;

  // Seed Sample Tickets
  const sampleTickets = [
    {
      ticketNumber: 'TXT-2026-001234',
      requesterId: req1Id,
      ownerId: staff1Id,
      categoryId: catHardware,
      relatedSystemId: sysLaptop,
      summary: 'Laptop battery drains quickly',
      description: 'My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week\'s update.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'IN_PROGRESS',
    },
    {
      ticketNumber: 'TXT-2026-001233',
      requesterId: req2Id,
      ownerId: staff2Id,
      categoryId: catNetwork,
      relatedSystemId: sysVpn,
      summary: 'Cannot connect to VPN',
      description: 'Getting authentication error when attempting to connect to corporate VPN from home network.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'OPEN',
    },
    {
      ticketNumber: 'TXT-2026-001232',
      requesterId: req3Id,
      ownerId: null,
      categoryId: catSoftware,
      relatedSystemId: sysEmail,
      summary: 'Email not syncing on mobile device',
      description: 'Incoming emails are delayed by several hours on mobile client. Webmail works fine.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'NEW',
    },
  ];

  for (const t of sampleTickets) {
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        currentStatus: t.currentStatus,
        ownerId: t.ownerId,
        itPriority: t.itPriority,
      },
      create: t,
    });

    // Seed Sample Public Comments & Internal Notes for first ticket
    if (t.ticketNumber === 'TXT-2026-001234') {
      await prisma.publicComment.createMany({
        data: [
          {
            ticketId: ticket.id,
            authorId: req1Id,
            content: 'Just adding that this issue occurs even when I close all applications.',
            createdAt: new Date(Date.now() - 3600000 * 24),
          },
          {
            ticketId: ticket.id,
            authorId: staff1Id,
            content: 'We are investigating the battery performance issue on your device. We will update you shortly.',
            createdAt: new Date(Date.now() - 3600000 * 12),
          },
        ],
        skipDuplicates: true,
      });

      await prisma.internalNote.createMany({
        data: [
          {
            ticketId: ticket.id,
            authorId: staff1Id,
            content: 'Diagnostics run: Battery health capacity at 64%. Replacement recommended.',
            createdAt: new Date(Date.now() - 3600000 * 10),
          },
        ],
        skipDuplicates: true,
      });
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
