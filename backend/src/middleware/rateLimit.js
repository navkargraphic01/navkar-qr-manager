const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Redirect limiter (generous - QR scans should work freely)
const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 60,                  // 60 scans per minute per IP
  skip: () => false,
  message: 'Too many scans, please slow down.'
});

module.exports = { apiLimiter, authLimiter, redirectLimiter };
