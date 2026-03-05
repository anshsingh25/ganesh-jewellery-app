/**
 * JWT auth middleware - validates token and attaches req.user
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ganesh-jewellers-secret-change-in-production';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function ownerOnly(req, res, next) {
  if (req.user?.type === 'owner' || req.user?.role === 'owner' || req.user?.role === 'staff') {
    return next();
  }
  return res.status(403).json({ error: 'Owner access required' });
}

module.exports = { authMiddleware, ownerOnly };
