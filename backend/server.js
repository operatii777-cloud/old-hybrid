import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const env = process.env.NODE_ENV || 'local';
dotenv.config({ path: `.env.${env}` });

const app = express();
const PORT = process.env.PORT || 3000;
const isLocal = process.env.NODE_ENV === 'local';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (frontend build) — path from project root (parent of backend), not backend/
const projectRoot = path.resolve(__dirname, '..');
const frontendBuild = path.resolve(projectRoot, process.env.FRONTEND_BUILD || 'frontend/dist');
app.use(express.static(frontendBuild));

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
