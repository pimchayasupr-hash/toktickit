import dotenv from 'dotenv';
import app from './app';
import { getJwtSecret } from './middleware/authMiddleware';

dotenv.config();

// Production guard: ensure secrets are configured before accepting traffic
getJwtSecret();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TokTickIT API listening on port ${PORT}`);
});
