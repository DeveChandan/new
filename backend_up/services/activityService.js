const ActivityLog = require('../models/ActivityLog');

/**
 * Extract platform (web, mobile, api) from request headers
 */
const detectPlatform = (req) => {
  if (!req) return 'web';
  const customPlatform = req.headers?.['x-platform'];
  if (customPlatform && ['web', 'mobile', 'api'].includes(customPlatform.toLowerCase())) {
    return customPlatform.toLowerCase();
  }

  const userAgent = req.headers?.['user-agent'] || '';
  if (/mobile|android|iphone|ipad|expo|okhttp/i.test(userAgent)) {
    return 'mobile';
  }
  return 'web';
};

/**
 * Log user activity asynchronously (fire-and-forget)
 */
const logActivity = ({
  user = null,
  userName = null,
  userMobile = null,
  role = 'guest',
  action,
  category = 'system',
  description,
  metadata = {},
  req = null,
}) => {
  // Fire and forget in next tick
  setImmediate(async () => {
    try {
      if (!action || !description) return;

      const ip = req ? (req.ip || req.connection?.remoteAddress || '').replace('::ffff:', '') : null;
      const userAgent = req ? req.headers?.['user-agent'] : null;
      const platform = req ? detectPlatform(req) : 'web';

      // If user object was passed instead of ID
      let userId = user;
      let name = userName;
      let mobile = userMobile;

      if (user && typeof user === 'object' && user._id) {
        userId = user._id;
        name = name || user.name;
        mobile = mobile || user.mobile;
        role = role === 'guest' ? (user.role || role) : role;
      }

      await ActivityLog.create({
        user: userId,
        userName: name,
        userMobile: mobile,
        role,
        action,
        category,
        description,
        metadata,
        ip,
        userAgent,
        platform,
      });
    } catch (err) {
      console.error('⚠️ [ActivityService] Failed to log activity:', err.message);
    }
  });
};

module.exports = {
  logActivity,
  detectPlatform,
};
