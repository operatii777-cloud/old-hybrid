import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user has required role(s)
 * Usage: app.get('/admin', requireRole(['MANAGER', 'ADMIN']), handler)
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    // Get user from request (assumes auth middleware sets req.user)
    const user = req.user || req.body.ospatar || req.headers['x-user-role'];
    
    if (!user) {
      logger.warn('Access denied: No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = typeof user === 'string' ? user : user.rol;
    
    if (!userRole) {
      logger.warn(`Access denied: User ${user.id || 'unknown'} has no role`);
      return res.status(403).json({ error: 'No role assigned' });
    }
    
    // Check if user role is allowed
    const hasAccess = allowedRoles.includes(userRole) || userRole === 'ADMIN';
    
    if (!hasAccess) {
      logger.warn(`Access denied: User role ${userRole} not in ${allowedRoles.join(', ')}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Middleware to check if user has specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user || req.body.ospatar;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user permissions from role
    const userPermissions = getUserPermissions(user.rol);
    
    // Check if user has permission (or has wildcard *)
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      logger.warn(`Permission denied: User ${user.id} lacks ${permission}`);
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

/**
 * Get permissions for a role
 */
function getUserPermissions(role) {
  const rolePermissions = {
    'ADMIN': ['*'],
    'MANAGER': ['admin', 'reports', 'inventory', 'users', 'pos', 'tables', 'orders', 'payments'],
    'CASIER': ['pos', 'payments', 'reports_view', 'tables', 'orders'],
    'OSPATAR': ['pos', 'tables', 'orders']
  };
  
  return rolePermissions[role] || [];
}

/**
 * Simple auth middleware to extract user from session/header
 */
export function authMiddleware(req, res, next) {
  // In a real app, this would validate JWT token or session
  // For now, we'll accept user info from headers
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (userId && userRole) {
    req.user = { id: userId, rol: userRole };
  }
  
  next();
}
