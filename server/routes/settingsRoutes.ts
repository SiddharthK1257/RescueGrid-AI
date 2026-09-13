import { Router, Request, Response } from 'express';
import { config, updateConfig } from '../config.js';
import { dbStatus, connectToDatabase } from '../db/connection.js';
import { geminiService } from '../agents/geminiService.js';
import { mossClient } from '../moss/mossClient.js';

export const settingsRouter = Router();

// GET current settings status
settingsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    db: {
      connected: dbStatus.connected,
      type: dbStatus.type,
      uriSanitized: dbStatus.uriSanitized,
      lastChecked: dbStatus.lastChecked,
      error: dbStatus.error
    },
    gemini: {
      configured: geminiService.hasApiKey(),
      maskedKey: config.geminiApiKey
        ? `${config.geminiApiKey.substring(0, 6)}...${config.geminiApiKey.substring(config.geminiApiKey.length - 4)}`
        : 'Not Set (Using Domain Emergency Heuristic Engine)',
      model: 'gemini-2.5-flash'
    },
    moss: {
      externalConfigured: mossClient.isExternalConfigured(),
      endpoint: config.mossEndpoint,
      maskedKey: config.mossApiKey
        ? `${config.mossApiKey.substring(0, 6)}...`
        : 'Local Shared Context Engine Active'
    },
    port: config.port
  });
});

// POST update settings at runtime
settingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { geminiApiKey, mongoUri, mossApiKey, mossEndpoint, dbUsername } = req.body;

    const updates: any = {};
    if (geminiApiKey !== undefined) updates.geminiApiKey = geminiApiKey.trim();
    if (mongoUri !== undefined) updates.mongoUri = mongoUri.trim();
    if (mossApiKey !== undefined) updates.mossApiKey = mossApiKey.trim();
    if (mossEndpoint !== undefined) updates.mossEndpoint = mossEndpoint.trim();
    if (dbUsername !== undefined) updates.dbUsername = dbUsername.trim();

    updateConfig(updates);

    // If mongoUri or dbUsername changed, re-attempt DB connection
    if (mongoUri || dbUsername) {
      await connectToDatabase();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      dbStatus: {
        connected: dbStatus.connected,
        type: dbStatus.type,
        uriSanitized: dbStatus.uriSanitized
      },
      geminiConfigured: geminiService.hasApiKey(),
      mossExternal: mossClient.isExternalConfigured()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
