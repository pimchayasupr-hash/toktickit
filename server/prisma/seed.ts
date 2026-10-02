import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Local Development Only Credentials
// (Do NOT use in production environments)
const DEV_DEFAULT_PASSWORD = 'Password123!';

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

  // Remove test artifact tickets from dev data
  await prisma.ticket.deleteMany({
    where: {
      summary: { in: ['Issue 5 test ticket for attachments', 'Regression Test Ticket'] },
    },
  });

  const defaultPasswordHash = await bcrypt.hash(DEV_DEFAULT_PASSWORD, 10);

  // Seed Users (Upsert)
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

  // Seed Categories (Upsert)
  const categoryMap = new Map<string, number>();
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    categoryMap.set(name, cat.id);
  }

  // Seed Related Systems (Upsert)
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
  const req4Id = userMap.get('david.kim@example.com')!;

  const staff1Id = userMap.get('michael.staff@toktickit.com')!;
  const staff2Id = userMap.get('sarah.staff@toktickit.com')!;
  const staff3Id = userMap.get('david.staff@toktickit.com')!;

  const catHardware = categoryMap.get('Hardware')!;
  const catNetwork = categoryMap.get('Network')!;
  const catSoftware = categoryMap.get('Software')!;
  const catAccount = categoryMap.get('Account and Access')!;

  const sysLaptop = systemMap.get('Corporate Laptop')!;
  const sysVpn = systemMap.get('VPN')!;
  const sysEmail = systemMap.get('Email')!;
  const sysWifi = systemMap.get('Campus Wi-Fi')!;
  const sysPrinter = systemMap.get('Printer')!;

  // Canonical Seed Tickets across statuses, priorities, assigned/unassigned
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
    {
      ticketNumber: 'TXT-2026-001235',
      requesterId: req4Id,
      ownerId: staff3Id,
      categoryId: catNetwork,
      relatedSystemId: sysWifi,
      summary: 'Campus Wi-Fi drops intermittently in Building C',
      description: 'Wi-Fi connection drops every 15-20 minutes when working on the 3rd floor.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'WAITING_FOR_REQUESTER',
    },
    {
      ticketNumber: 'TXT-2026-001236',
      requesterId: req1Id,
      ownerId: staff1Id,
      categoryId: catHardware,
      relatedSystemId: sysPrinter,
      summary: 'Department printer jam on 4th floor',
      description: 'Paper jam in tray 2 of the network printer. Error code E-04.',
      requestedPriority: 'URGENT',
      itPriority: 'URGENT',
      currentStatus: 'RESOLVED',
    },
    {
      ticketNumber: 'TXT-2026-001237',
      requesterId: req2Id,
      ownerId: staff2Id,
      categoryId: catAccount,
      relatedSystemId: sysEmail,
      summary: 'Request for secondary email alias setup',
      description: 'Please set up an alias for project coordination: dev-leads@toktickit.com.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'CLOSED',
    },
    {
      ticketNumber: 'TXT-2026-001238',
      requesterId: req3Id,
      ownerId: null,
      categoryId: catSoftware,
      relatedSystemId: sysLaptop,
      summary: 'Software license expired after OS reinstall',
      description: 'Development tool IDE license is reporting expired following OS image reflash.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'REOPENED',
    },
    {
      ticketNumber: 'TXT-2026-001239',
      requesterId: req4Id,
      ownerId: null,
      categoryId: catAccount,
      relatedSystemId: sysVpn,
      summary: 'Duplicate request for temporary access',
      description: 'Accidental duplicate submission; already requested under previous ticket.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'CANCELLED',
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
        requestedPriority: t.requestedPriority,
        categoryId: t.categoryId,
        relatedSystemId: t.relatedSystemId,
      },
      create: t,
    });

    // Seed Sample Public Comments & Internal Notes for first ticket (idempotent)
    if (t.ticketNumber === 'TXT-2026-001234') {
      await prisma.publicComment.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.internalNote.deleteMany({ where: { ticketId: ticket.id } });

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
      });
    }
  }

  console.log(`Seeding completed successfully: ${USERS.length} users, ${CATEGORIES.length} categories, ${RELATED_SYSTEMS.length} related systems, ${sampleTickets.length} tickets.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
