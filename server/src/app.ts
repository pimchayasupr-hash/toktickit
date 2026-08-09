import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app: Application = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Issue 2: API health check.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'TokTickIT API',
  });
});

// Issue 4: Display the IT request category list.
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch categories',
    });
  }
});

export default app;
