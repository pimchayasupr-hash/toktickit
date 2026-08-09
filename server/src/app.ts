import express, { Application } from 'express';
import cors from 'cors';

// This Express app is intentionally minimal for Lab 1 Issue 1 (project foundation).
// No routes/endpoints are implemented here yet -- those are added in later Issues
// (e.g. GET /api/health in Issue 2, GET /api/categories in Issue 4).

const app: Application = express();

app.use(cors());
app.use(express.json());

export default app;
