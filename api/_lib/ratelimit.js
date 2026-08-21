// ================================
// RATELIMIT
// Per-IP sliding window + a global daily cap (the real backstop against
// distributed abuse). Fails CLOSED: if Upstash is unreachable, deny the
// request rather than let it through unmetered -- cost protection over
// uptime, per the PRD's free-tier concern.
// ================================

const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

const PER_IP_LIMIT = 15; // requests
const PER_IP_WINDOW = '60 m';
const GLOBAL_DAILY_LIMIT = 250; // requests/day -- revisit once real Gemini free-tier RPD is known

let redis;
let ipLimiter;

function init(url, token) {
  if (!redis) {
    redis = new Redis({ url, token });
    ipLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, PER_IP_WINDOW),
      prefix: 'ratelimit:ip',
    });
  }
  return { redis, ipLimiter };
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return 'unknown';
  return forwarded.split(',')[0].trim();
}

async function checkRateLimit(req, url, token) {
  try {
    const { redis: redisClient, ipLimiter: limiter } = init(url, token);
    const ip = clientIp(req);

    const ipResult = await limiter.limit(ip);
    if (!ipResult.success) {
      return { allowed: false, retryAfter: Math.ceil((ipResult.reset - Date.now()) / 1000) };
    }

    const dayKey = `ratelimit:global:${new Date().toISOString().slice(0, 10)}`;
    const count = await redisClient.incr(dayKey);
    if (count === 1) await redisClient.expire(dayKey, 60 * 60 * 24);
    if (count > GLOBAL_DAILY_LIMIT) {
      return { allowed: false, retryAfter: 60 * 60 };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Rate limiter unreachable, failing closed:', err.message);
    return { allowed: false, unavailable: true };
  }
}

module.exports = { checkRateLimit };
