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

// Same request as generateAnswer, but reads Gemini's SSE stream and yields
// text as it's generated instead of waiting for the full response. Lets the
// chat widget show the answer appearing progressively rather than staring
// at "Thinking..." for the full 2-3s round trip.
async function* generateAnswerStream(apiKey, systemInstruction, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
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
    throw new Error(`Gemini streamGenerateContent failed (${res.status}): ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let gotAnyText = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line; each event's "data:" line
    // holds one JSON chunk of the response.
    let sepIndex;
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const dataLine = rawEvent.split('\n').find((l) => l.startsWith('data:'));
      if (!dataLine) continue;
      const jsonStr = dataLine.slice(5).trim();
      if (!jsonStr) continue;

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        continue; // skip a malformed chunk rather than kill the whole stream
      }

      const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('');
      if (text) {
        gotAnyText = true;
        yield text;
      }
    }
  }

  if (!gotAnyText) throw new Error('Gemini streamGenerateContent returned no text');
}

module.exports = { embedQuery, generateAnswer, generateAnswerStream };
