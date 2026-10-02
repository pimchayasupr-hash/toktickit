import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables from server/.env are loaded before any application modules are evaluated
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();
