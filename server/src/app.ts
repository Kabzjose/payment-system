import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

const app = express();

// Security headers
app.use(helmet());

// CORS - allow requests from your frontend
app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));

// Rate limiting - 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Parse JSON bodies — but NOT for /webhooks (Stripe needs the raw body)
app.use((req, res, next) => {
  if (req.path.startsWith('/webhooks')) return next();
  express.json()(req, res, next);
});

// Raw body for webhooks (Stripe signature verification requires this)
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;