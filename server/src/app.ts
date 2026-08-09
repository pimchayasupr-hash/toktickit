import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Issue 2: API health check.
// GET /api/categories (Issue 4) is added later.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'TokTickIT API',
  });
});

export default app;
