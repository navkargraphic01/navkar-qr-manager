// ============================================================
// NAVKAR QR MANAGER - Express Server
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');

const authRoutes = require('./src/routes/auth');
const qrcodesRoutes = require('./src/routes/qrcodes');
const analyticsRoutes = require('./src/routes/analytics');
const templatesRoutes = require('./src/routes/templates');
const categoriesRoutes = require('./src/routes/categories');
const bulkRoutes = require('./src/routes/bulk');
const settingsRoutes = require('./src/routes/settings');
const redirectRoutes = require('./src/routes/redirect');
const { apiLimiter } = require('./src/middleware/rateLimit');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Global Supabase Client (Service Role)
// ============================================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Make supabase available globally
app.set('supabase', supabase);

// ============================================================
// Middleware
// ============================================================
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(compression());

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// ============================================================
// Public Routes (no auth needed)
// ============================================================

// QR Redirect - CRITICAL: must be fast, no auth needed
app.use('/p', redirectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'navkar-qr-manager'
  });
});

// ============================================================
// API Routes (authenticated)
// ============================================================
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/qrcodes', qrcodesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/settings', settingsRoutes);

// ============================================================
// Error Handling
// ============================================================
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.details });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  logger.info(`✅ Navkar QR Manager Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
