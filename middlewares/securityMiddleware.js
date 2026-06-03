/**
 * Security Middleware for Sweet Pink Bakery
 * Includes:
 * 1. NoSQL Injection Prevention
 * 2. XSS Clean Filter
 * 3. CSRF Origin Guard
 * 4. In-Memory Rate Limiter
 */

// 1. Prevent NoSQL Injection by sanitizing keys starting with $ or containing .
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

exports.preventNoSqlInjection = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

// 2. Prevent XSS by escaping HTML special characters in string inputs
const escapeHtmlString = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sanitizeXssObject = (obj) => {
  if (typeof obj === 'string') {
    return escapeHtmlString(obj);
  }
  if (obj instanceof Object) {
    for (const key in obj) {
      obj[key] = sanitizeXssObject(obj[key]);
    }
  }
  return obj;
};

exports.preventXss = (req, res, next) => {
  if (req.body) req.body = sanitizeXssObject(req.body);
  if (req.query) req.query = sanitizeXssObject(req.query);
  if (req.params) req.params = sanitizeXssObject(req.params);
  next();
};

// 3. Lightweight CSRF Origin Guard
exports.csrfGuard = (req, res, next) => {
  // Only protect state-changing requests
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // Verify Origin or Referer matches our host (including localhost in dev)
  const isMatch = (urlStr) => {
    if (!urlStr) return false;
    try {
      const parsedUrl = new URL(urlStr);
      return parsedUrl.host === host || parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
    } catch (e) {
      return false;
    }
  };

  if ((origin && !isMatch(origin)) || (!origin && referer && !isMatch(referer))) {
    return res.status(403).json({
      success: false,
      message: 'Yêu cầu bị chặn do vi phạm chính sách bảo mật CSRF',
    });
  }

  next();
};

// 4. In-Memory IP Rate Limiter (Max 150 requests per minute per IP)
const ipRequestMap = new Map();
const LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 150;

// Cleanup memory every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.resetTime > LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

exports.rateLimiter = (req, res, next) => {
  // Bypass rate limiting in test mode
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();

  if (!ipRequestMap.has(ip)) {
    ipRequestMap.set(ip, {
      count: 1,
      resetTime: now + LIMIT_WINDOW_MS,
    });
    return next();
  }

  const ipData = ipRequestMap.get(ip);
  if (now > ipData.resetTime) {
    ipData.count = 1;
    ipData.resetTime = now + LIMIT_WINDOW_MS;
    return next();
  }

  ipData.count++;
  if (ipData.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Số lượng yêu cầu quá tải. Vui lòng thử lại sau ít phút.',
    });
  }

  next();
};
