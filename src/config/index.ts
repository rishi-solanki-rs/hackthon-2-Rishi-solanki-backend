import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

function parseOrigins(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sidekit',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiEnabled: process.env.GEMINI_ENABLED !== 'false',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  geminiTimeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '12000', 10),
  geminiDailyCap: parseInt(process.env.GEMINI_DAILY_CAP || '500', 10),
  // Comma-separated list of allowed browser origins, e.g. "https://sidekit.vercel.app,http://localhost:5173"
  clientOrigins: parseOrigins(process.env.CLIENT_URL),
};
