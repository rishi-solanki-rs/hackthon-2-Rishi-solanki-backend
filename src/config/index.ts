import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sidekit',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiEnabled: process.env.GEMINI_ENABLED !== 'false',
  geminiDailyCap: parseInt(process.env.GEMINI_DAILY_CAP || '500', 10),
};

