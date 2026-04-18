import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.utils';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * verifyToken — verifies the JWT access token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

/**
 * requireRole — role-based authorization middleware factory.
 * Usage: requireRole('ADMIN', 'STAFF')
 * Alias: authorize (for backwards compat)
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

// Alias for backwards compatibility with existing routes
export const authorize = requireRole;
