import express from 'express';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const env = process.env.NODE_ENV || 'local';
dotenv.config({ path: `.env.${env}` });

const app = express();
const PORT = process.env.PORT || 3000;
const isLocal = process.env.NODE_ENV === 'local';

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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit for performance
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with aggressive caching for better performance
const projectRoot = path.resolve(__dirname, '..');
const frontendBuild = path.resolve(projectRoot, process.env.FRONTEND_BUILD || 'frontend/dist');
app.use(express.static(frontendBuild, {
  maxAge: '1y', // Cache static assets for 1 year
  immutable: true, // Assets with hash never change
  etag: true,
  lastModified: true,
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: env,
    timestamp: new Date().toISOString()
  });
});

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
    if (process.env.CLOUD_ENABLED === 'true') {
      setupSyncService();
      logger.info('Cloud sync enabled');
    }

    setupBackupService();
    logger.info('Backup service started');

    // Start server
    app.listen(PORT, () => {
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
