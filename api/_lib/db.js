// ================================
// DB
// Neon HTTP driver (not a pooled TCP connection) -- avoids exhausting
// free-tier max_connections under concurrent serverless invocations.
// Uses the read-only kb_api role.
// ================================

const { neon } = require('@neondatabase/serverless');

function getClient(databaseUrl) {
  return neon(databaseUrl);
}

async function searchChunks(sql, embedding, k = 3) {
  const vectorLiteral = `[${embedding.join(',')}]`;
  return sql`
    select id, title, content
    from kb_chunks
    order by embedding <=> ${vectorLiteral}::vector
    limit ${k}
  `;
}

module.exports = { getClient, searchChunks };
