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

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sidekit-server',
    geminiEnabled: config.geminiEnabled && Boolean(config.geminiApiKey),
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Sidekit backend listening at http://localhost:${config.port}`);
  });

  initMongoDB()
    .then(async (connected) => {
      if (connected) {
        await db.syncFromMongo();
      }
    })
    .catch((e: any) => {
      console.warn('Initial Mongo sync warning:', e.message);
    });
}

export default app;
