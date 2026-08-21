// ================================
// INGEST
// Reads content/site-content.md, embeds each ## section with Gemini,
// and upserts it into the kb_chunks table in Neon (pgvector).
//
// Usage: npm run ingest
// Requires (local .env, never committed):
//   GEMINI_API_KEY
//   NEON_INGEST_DATABASE_URL   (the kb_ingest role — full CRUD, local-only)
// ================================

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const CONTENT_PATH = path.join(__dirname, '..', 'content', 'site-content.md');
const EMBEDDING_MODEL = 'gemini-embedding-001'; // confirmed current at ai.google.dev; text-embedding-004 is retired
const EMBEDDING_DIMS = 768; // Matryoshka-truncated via outputDimensionality -- must match vector(N) in schema.sql

const SECTION_TYPE_BY_PREFIX = [
  ['about', 'about'],
  ['skills', 'skills'],
  ['project-', 'project'],
  ['client-', 'client-work'],
  ['contact', 'contact'],
];

const TITLE_OVERRIDES = {
  about: 'About',
  skills: 'Skills',
  'project-raeng': 'Raeng (IMPETUS)',
  'project-global-mode': 'Global Mode',
  'client-memory-matters': 'Memory Matters',
  'client-grass-roots': 'Grass Roots Sports',
  'client-bts-bakery': "Big T's Bakery",
  contact: 'Contact',
};


function sectionTypeForSlug(slug) {
  const match = SECTION_TYPE_BY_PREFIX.find(([prefix]) => slug.startsWith(prefix));
  return match ? match[1] : 'other';
}


function titleForSlug(slug) {
  return TITLE_OVERRIDES[slug] || slug;
}


function parseChunks(markdown) {
  // Split on "## slug" headings; ignore anything before the first heading (comments/notes).
  const chunks = [];
  const lines = markdown.split('\n');
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(\S+)\s*$/);
    if (headingMatch) {
      if (current) chunks.push(current);
      current = { slug: headingMatch[1], lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) chunks.push(current);

  return chunks.map(({ slug, lines: bodyLines }) => {
    const content = bodyLines.join('\n').trim();
    return {
      id: slug,
      sectionType: sectionTypeForSlug(slug),
      title: titleForSlug(slug),
      content,
      contentHash: crypto.createHash('sha256').update(content).digest('hex'),
    };
  });
}


async function embed(apiKey, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: EMBEDDING_DIMS,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embedContent failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.embedding.values;
}


async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const dbUrl = process.env.NEON_INGEST_DATABASE_URL;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in local .env');
  if (!dbUrl) throw new Error('Missing NEON_INGEST_DATABASE_URL in local .env');

  const sql = neon(dbUrl);
  const markdown = await fs.readFile(CONTENT_PATH, 'utf8');
  const chunks = parseChunks(markdown);

  if (chunks.length === 0) {
    throw new Error(`No "## slug" sections found in ${CONTENT_PATH}`);
  }

  console.log(`Parsed ${chunks.length} chunk(s) from site-content.md`);

  let embedded = 0;
  let skipped = 0;

  for (const chunk of chunks) {
    const [existing] = await sql`
      select content_hash from kb_chunks where id = ${chunk.id}
    `;

    if (existing && existing.content_hash === chunk.contentHash) {
      skipped++;
      continue;
    }

    const vector = await embed(apiKey, chunk.content);
    const vectorLiteral = `[${vector.join(',')}]`;

    await sql`
      insert into kb_chunks (id, section_type, title, content, content_hash, embedding, updated_at)
      values (${chunk.id}, ${chunk.sectionType}, ${chunk.title}, ${chunk.content}, ${chunk.contentHash}, ${vectorLiteral}::vector, now())
      on conflict (id) do update set
        section_type = excluded.section_type,
        title = excluded.title,
        content = excluded.content,
        content_hash = excluded.content_hash,
        embedding = excluded.embedding,
        updated_at = now()
    `;
    embedded++;
    console.log(`  embedded: ${chunk.id}`);
  }

  const currentIds = chunks.map((c) => c.id);
  const deleted = await sql`
    delete from kb_chunks where id != all(${currentIds}) returning id
  `;
  if (deleted.length > 0) {
    console.log(`  removed orphaned chunk(s): ${deleted.map((r) => r.id).join(', ')}`);
  }

  console.log(`Done. ${embedded} embedded, ${skipped} unchanged/skipped, ${deleted.length} removed.`);
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
