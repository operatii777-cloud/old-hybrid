/**
 * Performance monitoring middleware
 * Tracks response times and provides performance metrics
 */

import { logger } from '../utils/logger.js';

// Store performance metrics
const metrics = {
  requests: 0,
  totalResponseTime: 0,
  slowRequests: [],
  errorCount: 0,
  statusCodes: {},
  endpointStats: {},
};

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const MAX_SLOW_REQUESTS_STORED = 100;

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req, res, next) {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Track response
  const originalSend = res.send;
  const originalJson = res.json;

  const trackResponse = () => {
    const responseTime = Date.now() - startTime;
    
    // Update global metrics
    metrics.requests++;
    metrics.totalResponseTime += responseTime;
    
    // Track status codes
    const statusCode = res.statusCode;
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    
    if (statusCode >= 400) {
      metrics.errorCount++;
    }

    // Track endpoint-specific stats
    if (!metrics.endpointStats[endpoint]) {
      metrics.endpointStats[endpoint] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
      };
    }
    
    const endpointStat = metrics.endpointStats[endpoint];
    endpointStat.count++;
    endpointStat.totalTime += responseTime;
    endpointStat.minTime = Math.min(endpointStat.minTime, responseTime);
    endpointStat.maxTime = Math.max(endpointStat.maxTime, responseTime);
    if (statusCode >= 400) {
      endpointStat.errors++;
    }

    // Track slow requests
    if (responseTime > SLOW_REQUEST_THRESHOLD) {
      const slowRequest = {
        endpoint,
        method: req.method,
        path: req.path,
        responseTime,
        statusCode,
        timestamp: new Date().toISOString(),
      };
      
      metrics.slowRequests.unshift(slowRequest);
      if (metrics.slowRequests.length > MAX_SLOW_REQUESTS_STORED) {
        metrics.slowRequests.pop();
      }
      
      logger.warn(`Slow request: ${endpoint} took ${responseTime}ms`);
    }

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Request-Id', req.id || 'unknown');
  };

  // Override send and json to track when response is sent
  res.send = function(data) {
    trackResponse();
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    trackResponse();
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  const avgResponseTime = metrics.requests > 0 
    ? metrics.totalResponseTime / metrics.requests 
    : 0;

  const endpointStatsWithAvg = Object.entries(metrics.endpointStats).map(([endpoint, stats]) => ({
    endpoint,
    count: stats.count,
    avgTime: stats.totalTime / stats.count,
    minTime: stats.minTime === Infinity ? 0 : stats.minTime,
    maxTime: stats.maxTime,
    errors: stats.errors,
    errorRate: (stats.errors / stats.count * 100).toFixed(2) + '%',
  }));

  // Sort by count descending
  endpointStatsWithAvg.sort((a, b) => b.count - a.count);

  return {
    totalRequests: metrics.requests,
    averageResponseTime: Math.round(avgResponseTime),
    errorCount: metrics.errorCount,
    errorRate: ((metrics.errorCount / metrics.requests) * 100).toFixed(2) + '%',
    statusCodes: metrics.statusCodes,
    slowRequests: metrics.slowRequests.slice(0, 10), // Return top 10 slow requests
    topEndpoints: endpointStatsWithAvg.slice(0, 20), // Return top 20 endpoints
  };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
  metrics.requests = 0;
  metrics.totalResponseTime = 0;
  metrics.slowRequests = [];
  metrics.errorCount = 0;
  metrics.statusCodes = {};
  metrics.endpointStats = {};
}

/**
 * Endpoint to expose performance metrics
 */
export function setupPerformanceEndpoints(app) {
  app.get('/api/performance/stats', (req, res) => {
    res.json({
      ok: true,
      stats: getPerformanceStats(),
    });
  });

  app.post('/api/performance/reset', (req, res) => {
    resetPerformanceMetrics();
    res.json({
      ok: true,
      message: 'Performance metrics reset successfully',
    });
  });
}
