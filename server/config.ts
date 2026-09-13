import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  mongoUri: string;
  geminiApiKey: string;
  mossApiKey: string;
  mossEndpoint: string;
  dbUsername?: string;
  jwtSecret: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  mossApiKey: process.env.MOSS_API_KEY || '',
  mossEndpoint: process.env.MOSS_ENDPOINT || 'http://localhost:5000/api/moss/local',
  dbUsername: process.env.DB_USERNAME || 'admin',
  jwtSecret: process.env.JWT_SECRET || 'rescuegrid-jwt-secret-key-3f98a2e1d054bc-2026',
};

export function updateConfig(newConfig: Partial<ServerConfig>) {
  Object.assign(config, newConfig);
  if (newConfig.geminiApiKey !== undefined) process.env.GEMINI_API_KEY = newConfig.geminiApiKey;
  if (newConfig.mongoUri !== undefined) process.env.MONGODB_URI = newConfig.mongoUri;
  if (newConfig.dbUsername !== undefined) process.env.DB_USERNAME = newConfig.dbUsername;
  if (newConfig.mossApiKey !== undefined) process.env.MOSS_API_KEY = newConfig.mossApiKey;
  if (newConfig.mossEndpoint !== undefined) process.env.MOSS_ENDPOINT = newConfig.mossEndpoint;
  if (newConfig.jwtSecret !== undefined) process.env.JWT_SECRET = newConfig.jwtSecret;
}
