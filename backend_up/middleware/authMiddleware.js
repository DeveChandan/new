const jwt = require('jsonwebtoken');
const { User } = require('../models/User.js');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length >= 2) {
      const candidate = parts[1].trim();
      if (candidate && candidate !== 'null' && candidate !== 'undefined' && candidate !== '[object Object]') {
        token = candidate;
      }
    }
  }

  if (!token && req.cookies && req.cookies.access_token) {
    const candidate = req.cookies.access_token;
    if (candidate && candidate !== 'null' && candidate !== 'undefined') {
      token = candidate;
    }
  }

  // Security: JWT must only come from Authorization header or HttpOnly cookie
  // (NOT from query string — that would expose tokens in logs/history)

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Security: verify account is active and not suspended
      if (req.user.isActive === false || req.user.accountStatus === 'suspended' || req.user.accountStatus === 'deactivated') {
        return res.status(403).json({ message: 'Account is suspended or inactive. Please contact support.' });
      }

      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'unauthorized'} is not authorized to access this route` });
    }
    return next();
  };
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length >= 2) {
      const candidate = parts[1].trim();
      if (candidate && candidate !== 'null' && candidate !== 'undefined' && candidate !== '[object Object]') {
        token = candidate;
      }
    }
  }

  if (!token && req.cookies && req.cookies.access_token) {
    const candidate = req.cookies.access_token;
    if (candidate && candidate !== 'null' && candidate !== 'undefined') {
      token = candidate;
    }
  }

  // Security: JWT must only come from Authorization header or HttpOnly cookie

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user && (req.user.isActive === false || req.user.accountStatus === 'suspended' || req.user.accountStatus === 'deactivated')) {
        req.user = null;
      }
    } catch (error) {
      console.error("Optional Auth Warning:", error.message);
      req.user = null;
    }
  }
  return next();
};

module.exports = { protect, authorize, optionalProtect };

