/**
 * HTTP request logger middleware using Morgan.
 * Writes access logs to stdout in development (dev format)
 * and combined format in production.
 */

import morgan from 'morgan';
import { logger } from '../utils/logger.js';

// Create a write stream that pipes Morgan output through Winston
const stream = {
  write: (message) => logger.info(message.trimEnd()),
};

const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const httpLogger = morgan(format, { stream });
