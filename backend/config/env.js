/**
 * Environment configuration validation.
 * Validates required environment variables on startup and exports a typed config object.
 */

const REQUIRED_VARS = [
  'JWT_SECRET',
];

/**
 * Validate that all required environment variables are set.
 * Throws an error (with a descriptive list) if any are missing,
 * so the process fails fast rather than running with a broken config.
 */
export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env.local and fill in the missing values.'
    );
  }
}

/** Typed, centralised access to environment values. */
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  sqlitePath: process.env.SQLITE_PATH || process.env.DATABASE_URL || './data/restaurant.db',
  logLevel: process.env.LOG_LEVEL || 'info',

  // AI providers
  aiProvider: process.env.AI_PROVIDER || 'auto',
  groqApiKey: process.env.GROQ_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Cloud sync
  cloudEnabled: process.env.CLOUD_ENABLED === 'true',

  // Frontend build
  frontendBuild: process.env.FRONTEND_BUILD || 'dist',
};
