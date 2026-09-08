// ================================
// POST /api/chat
// The only public endpoint. Flow: validate -> rate-limit -> embed query ->
// vector search -> build grounded prompt -> stream the generated answer.
// Cheap checks run before expensive ones so a rejected request never
// touches Gemini quota. On success the response body is plain text,
// streamed as Gemini generates it (not JSON) -- source chunk ids are sent
// via the X-Chat-Sources header instead, since headers are the only thing
// available before the streamed body starts. Error responses (400/429/
// 500/503) are unchanged: still small buffered JSON.
// ================================

const { env } = require('./_lib/env');
const { validateMessage } = require('./_lib/validate');
const { checkRateLimit } = require('./_lib/ratelimit');
const { embedQuery, generateAnswerStream } = require('./_lib/gemini');
const { getClient, searchChunks } = require('./_lib/db');
const { buildSystemInstruction } = require('./_lib/prompt');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const validation = validateMessage(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.code, message: validation.message });
    return;
  }

  const rateLimit = await checkRateLimit(req, env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  if (!rateLimit.allowed) {
    if (rateLimit.unavailable) {
      res.status(503).json({ error: 'temporarily_unavailable' });
      return;
    }
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    res.status(429).json({
      error: 'rate_limited',
      message: "You've hit the question limit — try again later, or reach out via email/GitHub.",
      retryAfter: rateLimit.retryAfter,
    });
    return;
  }

  try {
    const sql = getClient(env.NEON_DATABASE_URL);
    const embedding = await embedQuery(env.GEMINI_API_KEY, validation.message);
    const chunks = await searchChunks(sql, embedding, 3);
    const systemInstruction = buildSystemInstruction(chunks);

    // Headers are committed here, before generation starts -- everything
    // after this point streams to the client as it's generated, so a
    // failure here can no longer send a clean JSON error response (see
    // the inner catch below for the fallback).
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Chat-Sources': JSON.stringify(chunks.map((c) => c.id)),
      'Cache-Control': 'no-store',
    });

    try {
      for await (const textChunk of generateAnswerStream(env.GEMINI_API_KEY, systemInstruction, validation.message)) {
        res.write(textChunk);
      }
    } catch (streamErr) {
      console.error('chat stream failed mid-response:', streamErr.message);
      res.write('\n\n[TEMP DEBUG: ' + streamErr.message + ']');
    }

    res.end();
  } catch (err) {
    console.error('chat handler failed:', err.message);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong. Try again in a moment.' });
  }
};
