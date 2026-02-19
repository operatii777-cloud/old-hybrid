import { logger } from '../utils/logger.js';

/**
 * Centralized Express error handler.
 * Must be registered AFTER all routes with:  app.use(errorHandler)
 * Normalizes all thrown errors to { ok: false, error: string } shape.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  logger.error(`[${req.method}] ${req.originalUrl} → ${status}: ${message}`, err);
  res.status(status).json({ ok: false, error: message });
}
