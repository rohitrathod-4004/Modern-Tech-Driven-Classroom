import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/aicip',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_access',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecret_refresh',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
