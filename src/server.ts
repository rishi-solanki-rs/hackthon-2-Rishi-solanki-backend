import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initMongoDB, isMongoConnected } from './db/mongo';
import { db } from './store/dataStore';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { planRouter } from './routes/plan.routes';
import { listingRouter } from './routes/listing.routes';
import { requestRouter } from './routes/request.routes';
import { shopRouter } from './routes/shop.routes';
import { notificationRouter } from './routes/notification.routes';
import { impactRouter } from './routes/impact.routes';
import { adminRouter } from './routes/admin.routes';
import { demandRouter } from './routes/demand.routes';

const app = express();

const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173', ...config.clientOrigins]);

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, health checks) send no Origin header
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    allowedHeaders: ['Content-Type', 'x-demo-user-id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })
);
app.use(express.json({ limit: '100kb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sidekit-server',
    geminiEnabled: config.geminiEnabled && Boolean(config.geminiApiKey),
    geminiModel: config.geminiModel,
    mongoConnected: isMongoConnected(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/plans', planRouter);
app.use('/api/listings', listingRouter);
app.use('/api/requests', requestRouter);
app.use('/api/shops', shopRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/impact', impactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/demand', demandRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ message: `No API route for ${req.method} ${req.originalUrl}` });
});

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err?.status === 'number' ? err.status : 500;
  if (status >= 500) console.error('Unhandled API error:', err?.message || err);
  res.status(status).json({ message: status >= 500 ? 'Internal server error' : err.message });
});

async function start(): Promise<void> {
  try {
    if (await initMongoDB()) {
      await db.syncFromMongo();
    }
  } catch (e: any) {
    console.warn('Initial Mongo sync warning:', e.message);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Sidekit backend listening on 0.0.0.0:${config.port}`);
    console.log(`CORS origins: ${Array.from(allowedOrigins).join(', ')}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
