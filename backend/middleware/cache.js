/**
 * Simple in-memory cache middleware for API responses
 * Provides significant performance improvements for frequently accessed, slowly changing data
 */

const cache = new Map();
const cacheTimestamps = new Map();

// Store active TTLs for cleanup
const activeTTLs = new Set();

/**
 * Register a TTL value for cleanup consideration
 * @param {number} ttl - Time to live in seconds
 */
function registerTTL(ttl) {
  activeTTLs.add(ttl);
}

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 60 seconds)
 * @param {function} keyGenerator - Custom function to generate cache key (optional)
 * @returns {function} Express middleware function
 */
export function cacheMiddleware(ttl = 60, keyGenerator = null) {
  registerTTL(ttl);
  
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.originalUrl || req.url}`;

    // Check if cached response exists and is still valid
    const cachedResponse = cache.get(cacheKey);
    const timestamp = cacheTimestamps.get(cacheKey);

    if (cachedResponse && timestamp) {
      const age = (Date.now() - timestamp) / 1000; // Convert to seconds
      
      if (age < ttl) {
        // Cache hit - return cached response
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', Math.floor(age).toString());
        return res.json(cachedResponse);
      } else {
        // Cache expired - remove from cache
        cache.delete(cacheKey);
        cacheTimestamps.delete(cacheKey);
      }
    }

    // Cache miss - intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data);
        cacheTimestamps.set(cacheKey, Date.now());
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific key or pattern
 * @param {string|RegExp} pattern - Cache key or pattern to clear
 */
export function clearCache(pattern) {
  if (typeof pattern === 'string') {
    cache.delete(pattern);
    cacheTimestamps.delete(pattern);
  } else if (pattern instanceof RegExp) {
    // Clear all keys matching the pattern
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        cacheTimestamps.delete(key);
      }
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  cache.clear();
  cacheTimestamps.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Periodic cleanup of expired entries (runs every 5 minutes)
// Uses the maximum TTL from registered values to determine cleanup threshold
setInterval(() => {
  const now = Date.now();
  // Use the maximum registered TTL, or default to 5 minutes
  const maxTTL = activeTTLs.size > 0 ? Math.max(...activeTTLs) : 300;
  const maxAge = maxTTL * 1000; // Convert to milliseconds
  
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > maxAge) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}, 5 * 60 * 1000);
