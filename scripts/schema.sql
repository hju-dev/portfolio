-- Run once, manually, via the Neon SQL editor on the new dedicated Neon project.
-- Replace the two password placeholders before running, then store the resulting
-- connection strings as described in content/site-content.md's sibling files
-- (.env.example): kb_ingest -> NEON_INGEST_DATABASE_URL (local only),
-- kb_api -> NEON_DATABASE_URL (Vercel Preview env).

create extension if not exists vector;

create table kb_chunks (
  id            text primary key,        -- slug, e.g. 'project-raeng' (matches ## heading in content/site-content.md)
  section_type  text not null,           -- 'about' | 'skills' | 'project' | 'client-work' | 'contact'
  title         text not null,
  content       text not null,           -- raw chunk text sent to Gemini for grounding
  content_hash  text not null,           -- sha256(content) hex, lets ingest skip re-embedding unchanged chunks
  embedding     vector(768) not null,    -- must match the chosen Gemini embedding model's output dimension exactly
  updated_at    timestamptz not null default now()
);

alter table kb_chunks enable row level security;

-- Read-only role used by the deployed API (POST /api/chat).
create role kb_api login password 'REPLACE_ME_kb_api';
create policy kb_public_read on kb_chunks for select using (true);
grant select on kb_chunks to kb_api;
-- Deliberately no insert/update/delete policy for kb_api -- RLS denies those by
-- default even though this content isn't sensitive. Defense in depth: a leaked
-- kb_api credential can read but never mutate the knowledge base.

-- Full-CRUD role used only by scripts/ingest.js, run from a developer machine.
-- Its connection string must never be added to Vercel env vars.
create role kb_ingest login password 'REPLACE_ME_kb_ingest';
grant select, insert, update, delete on kb_chunks to kb_ingest;
-- RLS default-denies even with the GRANT above unless a policy also allows it.
create policy kb_ingest_write on kb_chunks for all to kb_ingest using (true) with check (true);

grant usage on schema public to kb_api, kb_ingest;
