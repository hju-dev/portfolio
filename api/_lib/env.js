// ================================
// ENV
// Reads required env vars once, fails loudly at import time if any are
// missing rather than surfacing a confusing failure mid-request.
// ================================

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const env = {
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  NEON_DATABASE_URL: required('NEON_DATABASE_URL'),
  UPSTASH_REDIS_REST_URL: required('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: required('UPSTASH_REDIS_REST_TOKEN'),
};

module.exports = { env };
