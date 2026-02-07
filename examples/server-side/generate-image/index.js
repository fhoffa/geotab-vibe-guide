// Secured Image Generation Cloud Function
// Walkthrough: https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/annotated-examples/GENERATE_IMAGE_ANNOTATED.md
// Security guide: https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/SECURE_ADDIN_BACKEND.md

const functions = require('@google-cloud/functions-framework');

// ============================================
// Configuration
// ============================================
const ALLOWED_DATABASES = (process.env.ALLOWED_DATABASES || '').split(',').map(db => db.trim().toLowerCase()).filter(Boolean);
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
const MAX_REQUESTS_PER_HOUR = parseInt(process.env.MAX_REQUESTS_PER_HOUR, 10) || 20;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================
// In-Memory Caches
// ============================================
// Session verification cache: key = `${database}:${username}:${sessionId}`, value = { verifiedAt: timestamp }
const sessionCache = new Map();

// Rate limiting cache: key = `${database}:${username}`, value = { requests: [], windowStart: timestamp }
const rateLimitCache = new Map();

// ============================================
// Server Validation
// ============================================
function isValidGeotabServer(server) {
  // Prevent SSRF: only allow actual Geotab servers.
  // server.includes('geotab.com') is NOT safe — it matches 'geotab.com.evil.com'.
  return server === 'my.geotab.com' || server.endsWith('.geotab.com');
}

// ============================================
// Session Verification
// ============================================
async function verifyGeotabSession(database, username, sessionId, server) {
  const apiUrl = `https://${server}/apiv1`;

  // Make a simple API call to verify the session is valid
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'GetSystemTimeUtc',
      params: {
        credentials: {
          database: database,
          userName: username,
          sessionId: sessionId
        }
      }
    })
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();

  // If there's an error in the response, session is invalid
  if (data.error) {
    return false;
  }

  // If we got a result, the session is valid
  return data.result !== undefined;
}

function getCacheKey(database, username, sessionId) {
  return `${database}:${username}:${sessionId}`;
}

function getRateLimitKey(database, username) {
  return `${database}:${username}`;
}

async function isSessionValid(database, username, sessionId, server) {
  const cacheKey = getCacheKey(database, username, sessionId);
  const cached = sessionCache.get(cacheKey);

  // Check if we have a valid cached verification
  if (cached && (Date.now() - cached.verifiedAt) < SESSION_CACHE_TTL_MS) {
    return true;
  }

  // Verify with Geotab API
  const isValid = await verifyGeotabSession(database, username, sessionId, server);

  if (isValid) {
    // Cache the successful verification
    sessionCache.set(cacheKey, { verifiedAt: Date.now() });

    // Clean up old cache entries periodically (every 100 entries)
    if (sessionCache.size > 100) {
      cleanupCache(sessionCache, SESSION_CACHE_TTL_MS);
    }
  }

  return isValid;
}

// ============================================
// Rate Limiting
// ============================================
function checkRateLimit(database, username) {
  const key = getRateLimitKey(database, username);
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);

  let record = rateLimitCache.get(key);

  if (!record) {
    record = { requests: [] };
    rateLimitCache.set(key, record);
  }

  // Filter out requests older than 1 hour
  record.requests = record.requests.filter(timestamp => timestamp > oneHourAgo);

  // Check if limit exceeded
  if (record.requests.length >= MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.requests[0] + 60 * 60 * 1000 - now) / 1000 / 60) // minutes until reset
    };
  }

  // Add this request
  record.requests.push(now);

  // Clean up old rate limit entries periodically
  if (rateLimitCache.size > 1000) {
    cleanupRateLimitCache();
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_HOUR - record.requests.length
  };
}

// ============================================
// Cache Cleanup
// ============================================
function cleanupCache(cache, ttl) {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.verifiedAt > ttl) {
      cache.delete(key);
    }
  }
}

function cleanupRateLimitCache() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, record] of rateLimitCache.entries()) {
    // Remove entries with no recent requests
    if (record.requests.every(timestamp => timestamp <= oneHourAgo)) {
      rateLimitCache.delete(key);
    }
  }
}

// ============================================
// Main Handler
// ============================================
functions.http('generateImage', async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  const {
    prompt,
    geotab_database,
    geotab_username,
    geotab_session_id,
    geotab_server
  } = req.body;

  // ============================================
  // Authentication & Authorization
  // ============================================

  // Fail closed: if ALLOWED_DATABASES is not configured, reject all requests.
  if (ALLOWED_DATABASES.length === 0) {
    console.error('ALLOWED_DATABASES not configured — rejecting request');
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Service not configured. Set ALLOWED_DATABASES environment variable.'
      }
    });
  }

  // Require Geotab credentials
  if (!geotab_database || !geotab_username || !geotab_session_id) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Authentication required. Please access this service through MyGeotab.'
      }
    });
  }

  // Check database allowlist
  const normalizedDatabase = geotab_database.toLowerCase();
  if (!ALLOWED_DATABASES.includes(normalizedDatabase)) {
    console.log(`Access denied: database "${geotab_database}" not in allowlist`);
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied. Your database is not authorized for this service.'
      }
    });
  }

  // Validate and verify session with Geotab API
  const server = geotab_server || 'my.geotab.com';
  if (!isValidGeotabServer(server)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid server.'
      }
    });
  }

  try {
    const sessionValid = await isSessionValid(geotab_database, geotab_username, geotab_session_id, server);
    if (!sessionValid) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Invalid or expired session. Please log in to MyGeotab again.'
        }
      });
    }
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to verify session. Please try again.'
      }
    });
  }

  // Check user allowlist (username is verified by Geotab — can't be spoofed)
  if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(geotab_username.toLowerCase())) {
    console.log(`Access denied: user "${geotab_username}" not in allowlist`);
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied. Your account is not authorized for this service.'
      }
    });
  }

  // Check rate limit
  const rateCheck = checkRateLimit(geotab_database, geotab_username);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: {
        code: 429,
        message: `Rate limit exceeded. You can make ${MAX_REQUESTS_PER_HOUR} requests per hour. Try again in ${rateCheck.resetIn} minutes.`
      }
    });
  }

  // Add rate limit headers
  res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_HOUR.toString());
  res.set('X-RateLimit-Remaining', rateCheck.remaining.toString());

  // ============================================
  // Image Generation
  // ============================================
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Service configuration error.'
      }
    });
  }

  if (!prompt) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Prompt is required.'
      }
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: { code: 500, message: error.message } });
  }
});
