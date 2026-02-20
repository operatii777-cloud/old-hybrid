import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/init-db.js';
import { initDatabase as initNovaDatabase } from './src/loaders/database.js';
import { runMigrations } from './database/migrate.js';
import { setupRoutes } from './routes/index.js';
import { setupSyncService } from './services/sync-service.js';
import { setupBackupService } from './services/backup-service.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { httpLogger } from './middleware/logger.js';
import { performanceMonitor, setupPerformanceEndpoints } from './middleware/performance.js';
import { setupKdsSocket } from './socket/kds.js';
import { config } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const env = process.env.NODE_ENV || 'local';
dotenv.config({ path: `.env.${env}` });
dotenv.config({ path: '.env.local' }); // fallback

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
const PORT = config.port;
const isLocal = process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development';

// Attach io to app so routes can access it via req.app.get('io')
app.set('io', io);

// Real-time KDS
setupKdsSocket(io);

// HTTP request logging (Morgan via Winston)
app.use(httpLogger);

// Performance monitoring (early in the middleware stack)
app.use(performanceMonitor);

// Performance: Enable compression for all responses
app.use(compression({
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware - Optimized for performance and security
app.use(helmet({
  // Configure CSP properly for SPA instead of disabling it
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Vite dev mode and inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  // Enable DNS prefetching for better performance
  dnsPrefetchControl: { allow: true },
  // Enable XSS protection
  xssFilter: true,
  // Enable frame guard
  frameguard: { action: 'deny' },
  // Enable HSTS with long max-age for better security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Enable IE no-open for downloads
  ieNoOpen: true,
  // Disable client-side caching of MIME type
  noSniff: true,
}));

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit for performance
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with optimized caching strategy
const projectRoot = path.resolve(__dirname, '..');
const frontendBuild = path.resolve(projectRoot, config.frontendBuild);

// Cache static assets with content hashes for 1 year
app.use(express.static(frontendBuild, {
  maxAge: '1y', // Cache static assets for 1 year
  immutable: true, // Assets with hash never change
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Don't cache HTML files - they should always be fresh
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  },
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: env,
    timestamp: new Date().toISOString(),
    database: 'sqlite',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Performance monitoring endpoints
setupPerformanceEndpoints(app);

// API Routes
setupRoutes(app);

// Centralized error handler (must be after routes)
app.use(errorHandler);

// SPA fallback (React Router) — path must be absolute; no cache pentru index ca să se încarce mereu build-ul curent
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const indexPath = path.join(frontendBuild, 'index.html');
  res.sendFile(path.resolve(indexPath));
});

// Initialize
async function initialize() {
  try {
    logger.info(`Starting Restaurant App in ${env} mode...`);

    // Initialize Legacy Database (Schema)
    await initDatabase();

    // Initialize NOVA v10.0 Kernel (Audit, WAL, Advanced Schema)
    await initNovaDatabase();

    // Run database migrations
    await runMigrations();

    logger.info('✅ NOVA v10.0 System Architecture Initialized');
    logger.info('Database initialized');

    // Setup services
    if (config.cloudEnabled) {
      setupSyncService();
      logger.info('Cloud sync enabled');
    }

    setupBackupService();
    logger.info('Backup service started');

    // Start server (use httpServer so Socket.IO is attached)
    httpServer.listen(PORT, () => {
      logger.info(`✅ Restaurant App running on http://localhost:${PORT}`);
      if (isLocal) {
        logger.info(`🍽️  POS Mode - Local Database`);
        logger.info(`📊 Admin: http://localhost:${PORT}/admin`);
      } else {
        logger.info(`☁️  Cloud Mode - Backup & Sync`);
      }
    });
  } catch (error) {
    logger.error('Initialization failed:', error);
    process.exit(1);
  }
}

initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});
