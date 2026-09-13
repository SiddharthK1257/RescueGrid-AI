import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { connectToDatabase } from './db/connection.js';
import { setSocketIO, orchestrator } from './agents/agentOrchestrator.js';
import { incidentRouter } from './routes/incidents.js';
import { mossRouter } from './routes/mossRoutes.js';
import { agentRouter } from './routes/agentRoutes.js';
import { settingsRouter } from './routes/settingsRoutes.js';
import { SCENARIOS } from './agents/scenarios.js';
import { repository } from './db/repository.js';
import { mossClient } from './moss/mossClient.js';
import { authRouter, seedDemoUsers } from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json());

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_incident', (incidentId: string) => {
    socket.join(incidentId);
    console.log(`[Socket.IO] Client ${socket.id} joined incident room: ${incidentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/moss', mossRouter);
app.use('/api/agents', agentRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'RescueGrid AI Emergency Coordination System',
    timestamp: new Date().toISOString()
  });
});

// Static assets from client/dist if built (Express 5 compatible wildcard)
const distPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Initialize Flagship Scenario (Highway Multi-Vehicle Accident) on startup
async function bootstrap() {
  console.log('===========================================================');
  console.log('  RESCUEGRID AI - COLLABORATIVE MULTI-AGENT EMERGENCY SYSTEM');
  console.log('===========================================================');

  await connectToDatabase();
  await seedDemoUsers();

  const incidents = await repository.getIncidents();
  if (incidents.length === 0) {
    console.log('[Bootstrap] Initializing Flagship Demo Scenario: Highway Multi-Vehicle Collision (RG-2026-0001)...');
    const flagship = SCENARIOS[0];

    await repository.saveIncident(flagship.incident);

    // Initial MOSS Context item
    await mossClient.syncContextItem({
      incidentId: flagship.incident.incidentId,
      source: 'HUMAN',
      type: 'INITIAL_REPORT',
      content: flagship.incident.description,
      summary: `Initial 911 Report: ${flagship.incident.title}`,
      metadata: {
        tags: ['flagship', 'highway', 'trauma', 'critical'],
        importance: 10,
        confidence: 1.0
      }
    });

    // Run the initial collaborative agent pipeline
    console.log('[Bootstrap] Executing initial multi-agent collaborative pipeline...');
    await orchestrator.runIncidentPipeline(flagship.incident.incidentId, false);
    console.log('[Bootstrap] Flagship Demo RG-2026-0001 ready with MOSS Shared Context and Response Plan v1!');
  } else {
    console.log(`[Bootstrap] Database contains ${incidents.length} active incident(s).`);
  }

  server.listen(config.port, () => {
    console.log(`[Server] RescueGrid AI Backend running on http://localhost:${config.port}`);
    console.log(`[Server] Socket.IO real-time stream active`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal startup error:', err);
});
