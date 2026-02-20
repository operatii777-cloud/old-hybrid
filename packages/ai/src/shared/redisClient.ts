import { createClient } from 'redis';

if (!process.env.REDIS_URL) throw new Error('REDIS_URL lipsește din .env');

export const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (err) => console.error('[Redis AI]', err));
redis.connect().catch(console.error);