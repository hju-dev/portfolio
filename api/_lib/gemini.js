// ================================
// GEMINI
// Thin fetch wrappers around the Gemini embedding + generate REST endpoints.
// Server-side only -- the API key never reaches the client.
// ================================

const EMBEDDING_MODEL = 'gemini-embedding-001'; // must match scripts/ingest.js
const EMBEDDING_DIMS = 768; // must match scripts/ingest.js and the vector(N) column width
const CHAT_MODEL = 'gemini-3.5-flash-lite'; // low-cost/high-quota tier, generous free-tier RPD

async function embedQuery(apiKey, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: EMBEDDING_DIMS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini embedContent failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.embedding.values;
}


async function generateAnswer(apiKey, systemInstruction, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini generateContent failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('');
  if (!text) throw new Error('Gemini generateContent returned no text');
  return text.trim();
}

module.exports = { embedQuery, generateAnswer };
