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
    name: 'Michael Brown',
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
    name: 'Alex Turner (Inactive)',
    email: 'alex.turner@example.com',
    role: Role.REQUESTER,
    isActive: false,
    mustChangePassword: true,
  },

  // IT Staff (Active >= 3, Inactive >= 1)
  {
    name: 'Michael Henderson (IT Support)',
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
    name: 'Kevin Patel (Inactive Staff)',
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

export async function seedDatabase() {
  console.log('Seeding database for Lab 3...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users (Upsert for Idempotency)
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

  // 2. Seed Categories (Upsert for Idempotency)
  const categoryMap = new Map<string, number>();
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    categoryMap.set(name, cat.id);
  }

  // 3. Seed Related Systems (Upsert for Idempotency)
  const systemMap = new Map<string, number>();
  for (const name of RELATED_SYSTEMS) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    systemMap.set(name, sys.id);
  }

  const reqJennifer = userMap.get('jennifer.anderson@example.com')!;
  const reqMichael = userMap.get('michael.brown@example.com')!;
  const reqSarah = userMap.get('sarah.jenkins@example.com')!;
  const reqDavid = userMap.get('david.kim@example.com')!;

  const staffMichael = userMap.get('michael.staff@toktickit.com')!;
  const staffSarah = userMap.get('sarah.staff@toktickit.com')!;
  const staffDavid = userMap.get('david.staff@toktickit.com')!;

  const catHardware = categoryMap.get('Hardware')!;
  const catNetwork = categoryMap.get('Network')!;
  const catSoftware = categoryMap.get('Software')!;
  const catAccount = categoryMap.get('Account and Access')!;

  const sysLaptop = systemMap.get('Corporate Laptop')!;
  const sysVpn = systemMap.get('VPN')!;
  const sysEmail = systemMap.get('Email')!;
  const sysWifi = systemMap.get('Campus Wi-Fi')!;
  const sysLEB2 = systemMap.get('LEB2 App')!;
  const sysGrade = systemMap.get('Grade Submission App')!;
  const sysPrinter = systemMap.get('Printer')!;

  // 4. Clean up legacy ticket numbers if present
  await prisma.ticket.deleteMany({
    where: {
      ticketNumber: { startsWith: 'TXT-2026-' },
    },
  });

  // 5. Seed 18 Realistic Dev Tickets (Idempotent upsert by ticketNumber)
  const sampleTickets = [
    {
      ticketNumber: 'TKT-2026-001234',
      requesterId: reqJennifer,
      ownerId: staffMichael,
      categoryId: catHardware,
      relatedSystemId: sysLaptop,
      summary: 'Laptop battery drains quickly',
      description: 'My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week\'s update.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'IN_PROGRESS',
    },
    {
      ticketNumber: 'TKT-2026-001233',
      requesterId: reqMichael,
      ownerId: staffSarah,
      categoryId: catNetwork,
      relatedSystemId: sysVpn,
      summary: 'Cannot connect to VPN from home network',
      description: 'Getting authentication handshake timeout when attempting to connect to corporate VPN from home network.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'OPEN',
    },
    {
      ticketNumber: 'TKT-2026-001232',
      requesterId: reqSarah,
      ownerId: null,
      categoryId: catSoftware,
      relatedSystemId: sysEmail,
      summary: 'Email not syncing on mobile device',
      description: 'Incoming emails are delayed by several hours on mobile client. Webmail works normally.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'NEW',
    },
    {
      ticketNumber: 'TKT-2026-001231',
      requesterId: reqDavid,
      ownerId: staffDavid,
      categoryId: catNetwork,
      relatedSystemId: sysWifi,
      summary: 'Wi-Fi signal drops in Engineering Building 3',
      description: 'Frequent Wi-Fi disconnections occur on the 3rd floor corridor of Building 3 during class transition periods.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'IN_PROGRESS',
    },
    {
      ticketNumber: 'TKT-2026-001230',
      requesterId: reqJennifer,
      ownerId: staffMichael,
      categoryId: catAccount,
      relatedSystemId: sysLEB2,
      summary: 'Unable to access course materials on LEB2',
      description: 'Enrolled students reported permission denied errors when downloading week 4 lecture slides and lab guidelines.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'WAITING_FOR_REQUESTER',
    },
    {
      ticketNumber: 'TKT-2026-001229',
      requesterId: reqMichael,
      ownerId: null,
      categoryId: catHardware,
      relatedSystemId: sysPrinter,
      summary: 'Department printer paper jam on 4th floor',
      description: 'Paper tray 2 repeatedly jams during duplex printing. Maintenance light is blinking yellow.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'NEW',
    },
    {
      ticketNumber: 'TKT-2026-001228',
      requesterId: reqSarah,
      ownerId: staffSarah,
      categoryId: catSoftware,
      relatedSystemId: sysGrade,
      summary: 'Error 500 when uploading final semester grades',
      description: 'Submitting CSV grade roster fails with internal server error code 500. Deadline is approaching.',
      requestedPriority: 'URGENT',
      itPriority: 'URGENT',
      currentStatus: 'OPEN',
    },
    {
      ticketNumber: 'TKT-2026-001227',
      requesterId: reqDavid,
      ownerId: staffMichael,
      categoryId: catAccount,
      relatedSystemId: sysEmail,
      summary: 'Request password reset for secondary research mailbox',
      description: 'Laboratory shared research inbox credentials need renewal following annual security audit.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'RESOLVED',
    },
    {
      ticketNumber: 'TKT-2026-001226',
      requesterId: reqJennifer,
      ownerId: staffDavid,
      categoryId: catNetwork,
      relatedSystemId: sysWifi,
      summary: 'Slow connection speed in Library study pods',
      description: 'Speed test reports below 2 Mbps inside individual quiet study pods on the second floor.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'CLOSED',
    },
    {
      ticketNumber: 'TKT-2026-001225',
      requesterId: reqMichael,
      ownerId: null,
      categoryId: catSoftware,
      relatedSystemId: sysLEB2,
      summary: 'Assignment submission button disabled before deadline',
      description: 'The assignment submission portal appears locked 30 minutes ahead of scheduled 23:59 deadline.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'NEW',
    },
    {
      ticketNumber: 'TKT-2026-001224',
      requesterId: reqSarah,
      ownerId: staffMichael,
      categoryId: catHardware,
      relatedSystemId: sysLaptop,
      summary: 'Keyboard keys sticking on issued ThinkPad',
      description: 'Spacebar and enter keys require excessive pressure to register input on faculty laptop.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'WAITING_FOR_REQUESTER',
    },
    {
      ticketNumber: 'TKT-2026-001223',
      requesterId: reqDavid,
      ownerId: staffSarah,
      categoryId: catAccount,
      relatedSystemId: sysVpn,
      summary: 'VPN client license certificate expired',
      description: 'Client software displays SSL certificate validity error when authenticating outside campus boundary.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'RESOLVED',
    },
    {
      ticketNumber: 'TKT-2026-001222',
      requesterId: reqJennifer,
      ownerId: staffDavid,
      categoryId: catNetwork,
      relatedSystemId: sysWifi,
      summary: 'Roaming disconnects when moving between floors',
      description: 'Active VoIP calls drop immediately upon taking stairs between floors 2 and 3 in Classroom Building.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'REOPENED',
    },
    {
      ticketNumber: 'TKT-2026-001221',
      requesterId: reqMichael,
      ownerId: staffMichael,
      categoryId: catHardware,
      relatedSystemId: sysPrinter,
      summary: 'Color toner empty on Engineering Lab printer',
      description: 'Cyan and magenta toner levels show critical depletion preventing color diagram printing.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'IN_PROGRESS',
    },
    {
      ticketNumber: 'TKT-2026-001220',
      requesterId: reqSarah,
      ownerId: null,
      categoryId: catAccount,
      relatedSystemId: sysGrade,
      summary: 'Duplicate account permissions for teaching assistant',
      description: 'Assistant profile shows two overlapping TA roles for the same section resulting in dashboard conflict.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'CANCELLED',
    },
    {
      ticketNumber: 'TKT-2026-001219',
      requesterId: reqDavid,
      ownerId: staffSarah,
      categoryId: catSoftware,
      relatedSystemId: sysLaptop,
      summary: 'Anti-virus software update failed with code 0x8007',
      description: 'Endpoint security agent encounters signature database corruption during definitions download.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'CLOSED',
    },
    {
      ticketNumber: 'TKT-2026-001218',
      requesterId: reqJennifer,
      ownerId: null,
      categoryId: catSoftware,
      relatedSystemId: sysLEB2,
      summary: 'Student group roster not reflecting registration changes',
      description: 'Three newly added students from late enrollment period do not appear in team project grouping.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'NEW',
    },
    {
      ticketNumber: 'TKT-2026-001217',
      requesterId: reqMichael,
      ownerId: staffDavid,
      categoryId: catNetwork,
      relatedSystemId: sysVpn,
      summary: 'Multi-factor authentication prompt times out on VPN login',
      description: 'Push notification does not arrive on authenticator app within the 30-second window.',
      requestedPriority: 'URGENT',
      itPriority: 'URGENT',
      currentStatus: 'IN_PROGRESS',
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

    // 6. Seed Idempotent Public Comments & Internal Notes for TKT-2026-001234
    if (t.ticketNumber === 'TKT-2026-001234') {
      const seedComments = [
        {
          ticketId: ticket.id,
          authorId: reqJennifer,
          content: 'Just adding that this issue occurs even when I close all background applications.',
          createdAt: new Date(Date.now() - 3600000 * 24),
        },
        {
          ticketId: ticket.id,
          authorId: staffMichael,
          content: 'We are investigating the battery performance telemetry on your device. We will update you shortly.',
          createdAt: new Date(Date.now() - 3600000 * 12),
        },
      ];

      for (const c of seedComments) {
        const existing = await prisma.publicComment.findFirst({
          where: { ticketId: c.ticketId, content: c.content },
        });
        if (!existing) {
          await prisma.publicComment.create({ data: c });
        }
      }

      const seedNotes = [
        {
          ticketId: ticket.id,
          authorId: staffMichael,
          content: 'Diagnostics run: Battery health capacity at 64%. Battery replacement approved under warranty.',
          createdAt: new Date(Date.now() - 3600000 * 10),
        },
      ];

      for (const n of seedNotes) {
        const existing = await prisma.internalNote.findFirst({
          where: { ticketId: n.ticketId, content: n.content },
        });
        if (!existing) {
          await prisma.internalNote.create({ data: n });
        }
      }
    }
  }

  console.log('Seeding completed successfully with 18 realistic tickets.');
}

if (!process.env.VITEST) {
  seedDatabase()
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
