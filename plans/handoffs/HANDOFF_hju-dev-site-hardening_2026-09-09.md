# hju.dev — site hardening, streaming chat, and infrastructure audit session

**Date:** 2026-09-09
**Status:** COMPLETED (all shipped work verified live; several items explicitly deferred pending Henry's decisions — see Open Questions)
**Bead(s):** none
**Epic:** none
**Chain:** `standalone-b08b9aaa` seq `1`
**Parent:** none — first in chain
**Prior chain:** none — first in chain

---

## Reference Documents

- `CLAUDE.md` (repo root) — project conventions, hosting reality, deploy process. Refreshed three times this session and now accurate. Its own first line says "Read this before touching anything" — follow that literally.
- `content/site-content.md` — RAG grounding content for the chat widget. NOT auto-synced with the HTML pages. Edit both, or the chat widget answers from stale facts. Re-run `npm run ingest` after any edit here.
- `.env.example` — shape of required local secrets (does not contain real values).

## The Goal

Henry James Underwood's personal portfolio site (`hju.dev` — domain not yet registered, live at `https://hju-dev.vercel.app`) needed a broad hardening pass: SEO/branding infrastructure, accessibility/legal compliance, security posture, and performance. The user repeatedly supplied generic, templated checklists (security, SEO, deployment-readiness, performance — several formatted with "Role:/Instructions:/Context:" headers suggesting they were copy-pasted from somewhere else) covering concerns that often assumed a different kind of application than hju.dev actually is — a static multi-page site plus exactly one serverless API endpoint, no user accounts, no payments, no file uploads, no admin panel. The recurring job across the whole session was the same: verify each item against the real live site and real code (never assume), implement genuine gaps, and clearly explain — rather than silently skip or force-fit — why the rest didn't apply. A secondary, equally important thread was keeping the site's own documentation (`CLAUDE.md`) and the chat widget's knowledge base (`content/site-content.md`) in sync with reality as things changed, since both had drifted stale multiple times during the engagement (this repo has been worked on across many prior sessions too, per its git history).

## Where We Are

### Site & hosting
- 8 main-site HTML pages: `index.html`, `about.html`, `projects.html`, `client-work.html`, `contact.html`, `accessibility.html`, `privacy.html`, `terms.html`
- Plus `404.html` (custom, terminal-themed, noindexed)
- Plus a separate mini-site at `global-mode/` (own design system: navy/amber/teal, vs. the main site's green-on-black terminal aesthetic)
- `hju.dev` is **not a registered domain** — confirmed via `nslookup hju.dev 8.8.8.8` → `NXDOMAIN`. Do not assume it resolves to anything.
- GitHub Pages is **not serving the site** — its URL 404s, most likely because the GitHub repo moved from `undie7/hju.dev` to `hju-dev/portfolio` mid-project, which can silently reset Pages settings.
- The real live site is the **Vercel** deployment: `https://hju-dev.vercel.app` (Vercel project slug `hju-dev1` due to a username collision; GitHub repo is `hju-dev/portfolio`).
- Vercel's configured Node.js runtime version: **24.x** (checked directly in Project Settings → Build and Deployment, not assumed).
- All 4 required Production env vars confirmed set in the Vercel dashboard, scoped "Production and Preview": `GEMINI_API_KEY`, `NEON_DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

### Backend / chat widget
- `api/chat.js` is the **only** API route in the entire project — confirmed via directory listing, no hidden admin/debug routes exist.
- Its success response is now **streamed plain text** (was buffered JSON before this session) — see Code Analysis for the exact contract.
- Database: Neon Postgres, one table `kb_chunks` (id, section_type, title, content, content_hash, `vector(768)` embedding, updated_at).
- Row-level security is **enabled** on `kb_chunks`, with a least-privilege role split: `kb_api` (SELECT only, used by the deployed API — no write policy exists even though it has a login role, so RLS default-denies writes) vs. `kb_ingest` (full CRUD, local-machine-only, explicitly documented in `schema.sql` as "must never be added to Vercel env vars").
- Rate limiting: Upstash Redis, per-IP sliding window (`PER_IP_LIMIT = 15` requests / `PER_IP_WINDOW = '60 m'`) plus a global daily cap (`GLOBAL_DAILY_LIMIT = 250` requests/day). Fails **closed** (denies) if Upstash itself is unreachable — a deliberate cost-protection choice, not a bug.
- Rate-limit rejections are now **logged** (`console.warn`, added this session) — previously only Upstash-unreachable failures were logged, meaning actual abuse patterns were invisible before this fix. IP is deliberately NOT included in these log lines, to stay consistent with `privacy.html`'s existing claim that IPs aren't retained.
- Prompt-injection defense (`api/_lib/prompt.js`) was already well-built before this session touched it: the visitor's message is passed as a separate Gemini `user`-role turn, never string-concatenated into the system instruction (the real defense, not keyword filtering), plus explicit instructions telling the model to treat the message as untrusted even if it claims special authority, and never to echo the system prompt or raw context verbatim.

### Dependencies
- `@neondatabase/serverless`: 0.10.4 → **1.1.0** (major version bump, was a full major behind)
- `@upstash/redis`: 1.38.2 → **1.38.4** (patch)
- `dotenv` (dev-only): still 16.6.1, latest is 17.4.2 — **not bumped**, flagged as low priority
- `npm audit`: **0 vulnerabilities**, both before and after the bump
- Installing the new Neon major version removed **13 transitive packages** — smaller dependency tree in 1.x

### SEO / branding infrastructure (all added this session)
- `favicon.svg` + `favicon-32x32.png` + `apple-touch-icon.png` for the main site (hand-drawn green `//` mark on a dark rounded square, matching the nav logo)
- A **separate** favicon set for `global-mode/` (navy background, white globe ring, amber pin dot — matches that mini-site's own palette, not the main site's green)
- `og-image.png` (1200×630) for the main site, generated from a hand-authored SVG (`og-main-src.svg`) rendered through `sharp`
- A **separate** `og-image.png` for `global-mode/` (from `og-gm-src.svg`), navy/amber/teal to match
- Meta descriptions added to all 8 main pages (previously only `global-mode/index.html` had one)
- Canonical + Open Graph + Twitter Card tags added to all 9 pages (8 main + global-mode)
- `sitemap.xml` — lists all 9 URLs with priorities (home 1.0, main nav pages 0.7–0.8, global-mode 0.6, legal pages 0.2)
- `robots.txt` — allows everything except `/api/`, points at the sitemap
- `llms.txt` — new convention for AI crawlers; explicitly instructs readers not to overstate Henry's AI experience (he's "transitioning into" AI work, not an established AI engineer), matching `CLAUDE.md`'s existing "no aspirational skills" rule

### Legal / compliance
- `accessibility.html`, `privacy.html`, `terms.html` — all new this session, all linked from every page's footer (`Terms · Privacy · Accessibility`)
- `privacy.html` was later corrected to disclose the music widget's `localStorage` mute-state usage (a real omission caught during the security review — the page said "no cookies" but hadn't mentioned this non-cookie storage)

### Content
- Real headshot added to `about.html`: cropped/compressed from a 2.3MB source PNG down to `headshot.webp` at 16KB, displayed with a name/role byline
- 5-question FAQ added to `contact.html`, grounded entirely in facts already published elsewhere on the site (no invented claims)
- "I reply within 2–3 business days" response-time promise added to `contact.html`
- A qualitative outcome line added to the Memory Matters card on `client-work.html` — explicitly **not** a fabricated metric, per direct user instruction
- Internal cross-links added: About → Client Work, About → Projects, Projects ↔ Client Work → Contact
- Big T's Bakery card rewritten (was describing the old hand-coded GitHub Pages site; now describes the real Next.js/TypeScript/Neon/Clerk/Vercel/Resend/Vercel Blob rebuild) — this same staleness existed in BOTH `client-work.html` AND `content/site-content.md` (the RAG source); both were fixed
- Client Work page reordered from a 2-column grid to a single column, in the order Memory Matters → Big T's Bakery → Grass Roots Sports, per explicit user request

### Verified-safe (checked live, not assumed)
- SQL injection: only tagged-template queries used anywhere (`grep 'sql('` across the whole codebase returns zero hits for the unsafe plain-function-call pattern)
- XSS: zero `innerHTML`/`insertAdjacentHTML` calls anywhere in the codebase; chat messages rendered via `.textContent` only
- CORS: zero `Access-Control-*` response headers sent, even when a cross-origin `Origin` header is explicitly sent — same-origin-only by default (the safest possible posture, achieved by simply never adding CORS handling code)
- Request size limits: a 10MB POST body to `/api/chat` returns `413 Payload Too Large` (Vercel platform default)
- Directory listing: `/api/`, `/scripts/`, `/content/`, `/.git/`, `/.env` all return clean `404`, no listing or file contents exposed
- Default/admin routes: `/admin` → 404, `/wp-admin` → 403 (Vercel's own bot-protection layer, not app code)
- HSTS: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present on every response (Vercel default, not something added this session)
- Secrets: `.env` is gitignored and untracked (only `.env.example`, no real values, is tracked); grepped every shipped `.html`/`.js` file for API-key-shaped strings, found none client-side

### Cleanup done
- Removed 2 unused raw headshot PNGs (2.3MB + 732KB, untracked, unreferenced by any HTML) from the local filesystem — no git history impact since they were never committed
- Two feature branches (`feature/streaming-chat`, `chore/bump-neon-driver`) were created, tested, and merged to `main` — **not yet deleted from GitHub**, minor cleanup opportunity

### Known transient state
- This session's own extensive `curl` testing against `https://hju-dev.vercel.app/api/chat` (streaming verification + 39-item security review testing + dependency-bump verification — well over 100 requests total from one sandbox IP) has repeatedly tripped the site's own rate limiter. This is the rate limiter working correctly, not a bug — flagging so a future session isn't confused if a `429` shows up again soon after this handoff.

## What We Tried (Chronological)

### 0. Prior-session context (not this session's work, but load-bearing for understanding the repo's state)

Git history shows this repo was already the product of multiple prior sessions before this one started: `47731e2 Merge feature/multi-page-site: split site into 5 pages, add hero animation`, `126a68b Merge feature/philosophical-fallback: philosophical fallback for unknown questions`, `8f56de0 Merge feature/music-widget: background music widget`, plus earlier UI polish (`d82e903 Fix low-contrast text on home page quicklink cards`, `c295b4e Stretch neural background animation to full page width`). The RAG chat widget, the multi-page split, the music widget, and the neural-canvas hero animation all predate this session — this session found and hardened an already-substantial site, it didn't build it from scratch. This matters context-wise: the "philosophical fallback" feature (the chat widget asks a philosophical question when it doesn't know an answer, per `api/_lib/prompt.js`'s system instruction) is deliberate prior design, not something to "fix."

### 1. Repo reconciliation (early)
- **Situation found**: local working tree had files sitting in a stray `portfolio/` subfolder and a duplicate `global-mode-landing-page/` folder that didn't match GitHub, which was 90 commits ahead of the local checkout
- **Action**: discarded stale local edits (`git checkout -- .`), pulled `origin/main` fresh; a duplicate `global-mode/` folder was moved aside (not deleted) rather than overwritten, since its content genuinely differed from origin's version
- **Result**: local checkout now matches the real repo state exactly

### 2. Raeng card color fix (early)
- **Situation found**: `.project-raeng`/`.raeng-*` CSS classes used `#c8f135` (yellow-green) throughout, while the card's own inline SVG logo already used `#00ff88` (the real Raeng brand green)
- **Action**: swapped every instance including `rgba(200, 241, 53, ...)` variants to `#00ff88`/`rgba(0, 255, 136, ...)`
- **Result**: verified via computed-style JS check in the browser — every element resolved to `rgb(0, 255, 136)`

### 3. First UI "poor practices" audit (early-mid)
- **Checklist covered** (31 items): harsh gradients, Lucide icons, pure white bg, rainbow coloring, drop shadows, 3-feature-cards-in-a-row, emojis, liquid glass, em dashes, Inter/Geist/Space Grotesk fonts, colored left stripe, fake testimonials, bento grids, terminal window trope, "It's not X it's Y" copy, checkmark bullets, 3 pricing tiers, no product demos, soft corners, purple/black scheme, no skeleton loaders, radial orbs, dot grids, sparkle icons, animated arrows, no TOS/privacy/accessibility, hover-everything, neon colors, pastel colors
- **Result**: overwhelming pass rate. Real findings: prose em dashes (not the `// 01 — label` motif, which is an intentional design language), Inter as a low-priority secondary font (JetBrains Mono is the real type voice), no TOS/privacy/accessibility pages (real gap), dead `.roadmap` CSS block (~130 unused lines)
- **Notably NOT flagged despite matching the letter of the checklist**: `#00ff88` neon green (genuine brand identity, shared literally with the Raeng app) and the hero's terminal-window component (earned, since Henry is an actual developer and the content inside is real, not filler)

### 4. Fixing findings from #3 (mid)
- Replaced sentence-level em dashes with periods/commas/colons in `index.html` and `global-mode/index.html`, keeping the `// 01 — label` motif and badge/tag labels untouched (design language, not an AI-writing tell)
- Removed the dead `.roadmap`/`.roadmap-phase`/`.phase-*`/`.status-active`/`.status-queued`/`.cert-badge` CSS block from `style.css`, first confirming via grep that zero HTML files referenced these classes

### 5. Accessibility + privacy pages (mid)
- User explicitly asked for an accessibility statement; a privacy note was my own audit recommendation, which the user approved
- `privacy.html` written to be factually precise about the chat widget's real data flow (IP briefly used for rate-limiting via Upstash then discarded, messages not stored, Gemini API used for generation) — not generic boilerplate

### 6. Second audit pass + fixes (mid)
- Re-ran the same 31-item checklist post-fix to confirm the changes landed; found `terms.html` still missing, and Global Mode's `.feature-card:hover` stacking 3 simultaneous effects (border-color change + `translateY(-4px)` lift + accent-line reveal) as heavier-handed than the main site's restraint
- User said "fix all problems you found" → added `terms.html` (site content/IP, chat-widget AI-accuracy disclaimer, outbound links disclaimer, no-warranty clause), dropped the `translateY` lift from Global Mode's hover (kept border-color + accent-line reveal, 2 effects instead of 3)

### 7. Big T's Bakery card correction (mid)
- User supplied `bigtsbakeryfeaturesummary.md` (from their Downloads folder) describing the **actual current** Big T's Bakery: a full Next.js/TypeScript rebuild with Neon Postgres, Clerk auth, an admin dashboard, Vercel Blob payment-slip uploads, Resend email notifications
- The live site's `client-work.html` card was still describing the **old** hand-coded static version (PromptPay QR, GitHub Pages, Squarespace DNS)
- Rewrote badge/subtitle/description/tags to match reality; reordered the Client Work grid from 2-column to single-column, order: Memory Matters → Big T's Bakery → Grass Roots Sports (explicit user request)

### 8. Declined a file-upload/payment/XSS security review (mid)
- User asked for a security review covering file-upload validation, Stripe webhook signature verification, and XSS sanitization
- Determined via direct inspection that hju.dev has **no file upload feature and no payment integration of any kind** — declined to fabricate relevance rather than pad the response
- XSS was confirmed already handled correctly (`.textContent` only, zero `innerHTML` anywhere)
- Suggested the user's Big T's Bakery order backend (mentioned in prior-session memory, has real file uploads) as a better target for that specific review — not pursued further this session

### 9. 34-item "deployment readiness" checklist (mid)
- Categories: SEO/metadata, UX/accessibility, content/structure, security/compliance, technical/performance
- Many items were templated for a local-service business (opening hours, tap-to-call phone number, before/after gallery, guarantee statement, clear payment methods) — clearly explained as not applicable to a dev portfolio rather than forced in
- Real gaps found: no favicon anywhere, no meta descriptions (except `global-mode/`), zero Open Graph/Twitter tags, no `sitemap.xml`/`robots.txt`, no custom `404.html`
- User said "you can do it" → built all of the above (see Evidence & Data for the image-generation pipeline used)

### 10. Content completion pass (mid)
- Real headshot: identified 2 candidate images already in the repo (a 2.3MB original and a 732KB "compressed" version, neither actually optimized for the web); cropped a square face-centered region via `sharp` and re-exported as a 360×360 WebP at 15.6KB
- Added FAQ (5 questions) + response-time promise to `contact.html`
- Added a qualitative case-study outcome line to the Memory Matters card — user was asked directly whether to invent a stat, keep it qualitative, or skip it; chose qualitative
- While grounding FAQ answers in real facts, discovered `content/site-content.md`'s Big T's Bakery chunk had the **same** staleness problem fixed in step #7 for the HTML — fixed both, re-ran `npm run ingest`

### 11. Domain-URL correction cascade (mid-late)
- During step #9's work, discovered `https://hju.dev` doesn't resolve at all — this invalidated every canonical/OG/sitemap URL just added
- User chose "point them at the live Vercel URL" over "leave them as aspirational hju.dev URLs"
- Fixed via `sed 's#https://hju\.dev#https://hju-dev.vercel.app#g'` across 11 files (9 pages + `sitemap.xml` + `robots.txt`), verified zero remaining `https://hju.dev` references afterward via grep
- This in turn revealed `CLAUDE.md` itself was propagating the same wrong assumptions (single-page site, GitHub Pages hosting, 7 nav links, a global `01–07` section-numbering scheme from a pre-multi-page era) — did a full structural refresh: repo file tree, hosting section, per-page section numbering, nav link count (corrected to 5)

### 12. Vercel dashboard verification (late)
- User asked to walk through the DNS cutover; opened the Vercel dashboard in the Browser pane (**user logged in manually** — credentials were never touched by the assistant)
- Navigated to `hju-dev1/portfolio/settings/environment-variables`: discovered all 4 required Production env vars were **already correctly set**, scoped "Production and Preview" — contradicting `CLAUDE.md`'s prior (wrong) assumption that only Preview was configured
- Smoke-tested `/api/chat` live with 2 real questions ("What technologies did you use for Raeng?", "How fast do you respond to inquiries?") — both answered correctly, citing the right RAG sources including the newly-added `faq` chunk
- User then revealed there's no custom domain registered yet — the DNS-cutover topic closed there, but the env-var verification stood and was documented in `CLAUDE.md`

### 13. More checklists; error-styling + llms.txt (late)
- An SEO-strategy request and a second deployment-readiness variant arrived; user explicitly dismissed the GSC-timing and Analytics-stance sub-questions mid-flow ("do not proceed, wait for next instruction") — **still unresolved**
- The deployment-readiness re-run did a real crawler simulation: `curl` with a Googlebot user-agent against `about.html`, confirmed real prose content is present in the raw HTML (zero "empty container" risk, since the site has no client-side rendering framework to begin with)
- Found the chat widget's error states (rate-limit, server error, network failure) were visually **identical** to a normal AI answer — a real UX gap
- Found `llms.txt` missing — flagged as a good thematic fit given the site's "web dev → AI integration" narrative and its own working AI feature
- User said "do both" → added `.chat-bubble-error` (amber border/text + `⚠` icon via `::before`) wired into all 3 error paths in `widget.js`, and wrote `llms.txt`

### 14. Performance audit (late)
- Checklist suggested: JSON compression, DB write batching, network latency audit, frontend optimistic-UI, SSR/Webpack for rebuild times
- Measured real `/api/chat` latency via `curl -w "%{time_total}"`: **2.2–2.9 seconds** across 3 requests
- Checked response headers: no `Content-Encoding` present even when explicitly requested — confirmed correct (508-byte payload is below the size where gzip/brotli helps, would add overhead for zero benefit)
- Checked `scripts/ingest.js`: does unbatched row-by-row upserts, but only ever runs manually/locally on ~9 rows a few times a month — zero connection to user-facing latency, not worth batching
- Confirmed optimistic UI already existed (`widget.js` appends the user message + "Thinking…" bubble synchronously, before the network request is even sent)
- Declined SSR/Webpack explicitly: the site has no build step and no client-side rendering framework **by design** (confirmed via the crawler-simulation test from step #13) — there is nothing to server-render or rebuild faster
- Proposed streaming the Gemini response as the one real, honest lever, since the 2-3s latency is dominated by two sequential Gemini round-trips (embed + generate) that can't be parallelized (each needs the prior step's output) or reordered (rate-limit-before-Gemini-spend is an intentional cost-protection gate, per an existing code comment in `ratelimit.js`)

### 15. Streaming chat implementation (late) — the most involved piece of work this session
- Built `generateAnswerStream()` in `api/_lib/gemini.js` using Gemini's `:streamGenerateContent?alt=sse` endpoint; switched `api/chat.js`'s success path to `res.writeHead`/`res.write`/`res.end`; updated `widget.js` with `streamAnswerIntoBubble()`
- **Tested on a feature branch (`feature/streaming-chat`) before touching `main`**, since this changes the live API's response contract
- **First version failed**: pushed to the preview deployment, got the fallback error text back with zero real content, 3 times in a row
- **Root-caused via direct experimentation**, not guessing: wrote a local Node script using the real `GEMINI_API_KEY` from `.env` to fetch Gemini's raw SSE bytes directly and inspect them — found events are separated by `\r\n\r\n`, not the bare `\n\n` the parser assumed
- **Fixed**: `buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')` before the `\n\n` split
- **Re-verified in 3 independent ways** before merging: (a) a direct local `for await` test against the real Gemini API, got 2 correct chunks assembling to a coherent sentence; (b) 3/3 clean requests against the actual Vercel preview deployment; (c) client-side — fed the **actual loaded** `streamAnswerIntoBubble()` function (not a reimplementation) a synthetic delayed `ReadableStream` in the browser via `javascript_tool`, confirmed the DOM updated progressively (`"Hello"` → `"Hello, this"` → `"Hello, this is a"` → ... → final assembled text)
- Removed a temporary in-response debug wrapper (`[TEMP DEBUG: ...]`) used during root-causing, confirmed its removal via grep before merging
- Squash-merged to `main` as commit `384a2c9`
- **Honest correction issued to the user**: initially pitched streaming as making the answer "appear in well under a second" — real measurement showed TTFB is still ~2.0s (the rate-limit/embed/vector-search pipeline plus Gemini's own prompt-processing time all happen before generation starts), with only the last ~0.7s actually streaming. Reported this transparently rather than let the earlier framing stand uncorrected.

### 16. 39-item mega security checklist (late)
- Covered: secrets, RLS, front-end permission checks, rate limiting, SQL string concatenation, server-side validation, raw-HTML rendering, plaintext passwords, tokens in localStorage, unauthenticated admin panels, CORS-star, email verification, predictable IDs/IDOR, saving whole request bodies, unverified webhooks, stack traces, stale dependencies, password strength/breach checks, unvalidated file uploads, HSTS, CSRF, session reset on password change, expiring reset links, user enumeration, upload type whitelisting, payment webhook verification, server-side pricing, prompt injection, AI usage caps, request size limits, password-reset rate limiting, sanitize-before-store, CORS lockdown, directory listing, default admin routes, account lockout, security event logging, secure cookie flags, DB permission restriction
- ~20 of these items require user accounts, payments, or file uploads that don't exist on hju.dev — grouped into one clearly-reasoned cluster rather than 20 individual "N/A" rows
- Verified for real (not assumed): RLS (confirmed via reading `schema.sql`, better than expected — the least-privilege role split), tagged-template-only SQL, CORS lockdown, request-size limiting, directory-listing prevention, HSTS presence, prompt-injection defenses
- **One real gap found and fixed**: rate-limit rejections weren't logged (see "Backend / chat widget" above)

### 17. Dependency bump (late)
- User said "Yes" to bumping `@neondatabase/serverless`, the one flagged gap from step #16
- Downloaded the target version's changelog directly (`npm pack @neondatabase/serverless@1.1.0` + extracted `CHANGELOG.md`) before touching anything, rather than upgrading blind
- Found the only 1.0.0 breaking change: dropping support for calling `sql()` as a plain function instead of a tagged template — confirmed via `grep 'sql('` that this codebase never does that anywhere
- Confirmed the new v19 Node minimum is satisfied (Vercel's configured runtime is 24.x, checked directly in the dashboard)
- Tested against the **real** Neon database with the new driver before merging: a plain query, the exact `searchChunks()` call `chat.js` makes in production, and `ingest.js`'s exact pre-upsert existence-check pattern — all three worked correctly
- Tested end-to-end on a preview deployment (`chore/bump-neon-driver` branch) before merging
- Fast-forward merged to `main` as commit `a293c9e`

### 18. Wrap-up (final)
- Full site health check: every page/asset on `https://hju-dev.vercel.app` returns 200
- User asked "anything to do?" → offered the one remaining loose end (2 unused headshot files) rather than manufacturing new work; user said "Remove them" → deleted (untracked, no git impact)
- User asked to "update the markdown file and then let me download it" → clarified this meant `CLAUDE.md`; found it stale re: the new streaming `/api/chat` contract (a load-bearing fact missing since step #15) and missing `llms.txt` from its file tree; also flagged `generateAnswer()` (the old non-streaming Gemini function) as now-dead code since nothing calls it anymore; updated and delivered via `SendUserFile`

## Key Decisions

- **Never fabricate content to satisfy a checklist.** Repeated across nearly every checklist this session. Rejected alternative: padding responses with speculative fixes for features hju.dev doesn't have (file uploads, payments, user accounts, blog posts written from nothing).
- **Case-study outcome line stays qualitative, no invented metrics.** User was offered "I'll give you a real stat" / "keep it qualitative" / "leave as-is" as explicit options and chose qualitative.
- **Response-time promise: "within 2-3 business days."** User chose the more conservative option over "within 24 hours" / "within 24-48 hours."
- **Backend changes go through a preview-branch test before touching `main`.** Established after the streaming implementation's SSE bug was only catchable this way (local syntax checks passed; the bug only manifested against Gemini's real streaming API). Repeated for the dependency bump. Rejected alternative: pushing straight to `main` on the strength of local testing alone.
- **URLs point at `https://hju-dev.vercel.app`, not `https://hju.dev`, until a custom domain exists.** User chose functional correctness over leaving aspirational URLs that don't resolve.
- **No cookie-consent banner.** Correctly absent — the only client-side storage is a non-cookie `localStorage` key for music-mute state, not tracking. A banner would send a false "we use cookies" signal. Documented precisely rather than either ignored or over-corrected with an unnecessary banner.
- **GSC and Google Analytics: deferred, not decided.** User dismissed both clarifying questions rather than picking an option — treat as genuinely open, not silently resolved by the conversation moving on.
- **`generateAnswer()` (dead code) left in place, flagged not deleted.** Removing it wasn't explicitly requested; documented clearly in `CLAUDE.md` as "unused, not a bug" so a future session doesn't waste time wondering if it's load-bearing.
- **Feature branches not deleted post-merge.** `feature/streaming-chat` and `chore/bump-neon-driver` still exist on GitHub. Deletion wasn't requested, and branch deletion is a mildly destructive action worth explicit confirmation rather than doing it opportunistically.
- **Two-step verification pattern for anything touching the database or the external Gemini API**: read the real code/schema first, then test against the real service (Neon, Gemini) with real credentials, before trusting a fix. Used for both the streaming bug and the dependency bump. Rejected alternative: trusting `node --check` (syntax-only) as sufficient for backend changes.

## Evidence & Data

### Commit log (this session, newest first)

| Commit | Summary |
|---|---|
| `79ee30a` | Document the streaming `/api/chat` response contract in CLAUDE.md |
| `a293c9e` | Bump `@neondatabase/serverless` 0.10.4→1.1.0, `@upstash/redis` to 1.38.4 |
| `384a2c9` | Stream chat answers from Gemini instead of buffering the full response |
| `1373508` | Log rate-limit hits for abuse visibility |
| `d9ee3a2` | Add distinct error styling to chat widget; add `llms.txt` |
| `7b83bb8` | Confirm Production env vars are set; verify chat widget works end-to-end |
| `e506044` | Refresh CLAUDE.md — it was describing a site that no longer exists |
| `17f749e` | Point canonical/OG/sitemap URLs at the live Vercel deployment, not hju.dev |
| `bf33277` | Add real headshot, FAQ + response time, case-study outcome line, internal links |
| `322248f` | Add favicon, meta descriptions, OG/Twitter tags, sitemap, robots.txt, custom 404 |
| `8fc92e4` | Add Terms of Use page; trim stacked hover effect on Global Mode feature cards |
| `2f02cb7` | Update Big T's Bakery card to reflect full-stack rebuild; reorder client cards |
| `13fe98b` | Add accessibility statement and privacy note; fix prose em dashes; remove dead CSS |

### Checklist-style audits conducted this session

| # | Topic | Item count | Outcome |
|---|---|---:|---|
| 1 | UI "poor practices" (harsh gradients, fonts, etc.) | 31 | Mostly pass; em dashes + no legal pages + dead CSS were real |
| 2 | Same checklist, re-run post-fix | 31 | Confirmed fixes; found terms.html gap + Global Mode hover |
| 3 | File upload / payment webhook / XSS security | 3 | All N/A (features don't exist), XSS confirmed safe |
| 4 | SEO strategy (GSC/Analytics/keywords/meta) | 4 | GSC + Analytics explicitly paused by user, unresolved |
| 5 | Deployment readiness | 34 | Favicon/meta/OG/sitemap/robots/404 were real gaps, all fixed |
| 6 | Deployment readiness, second variant | ~20 | Chat error styling + llms.txt were the real gaps |
| 7 | Performance optimization | 5 | Only streaming was real; compression/batching/SSR declined w/ reasoning |
| 8 | Security/compliance mega-checklist | 39 | ~20 N/A (no accounts/payments/uploads); rate-limit logging was the 1 real gap |

### `/api/chat` latency measurements (via `curl -w "%{time_total}s"`, pre-streaming)

| Request | Total time |
|---|---|
| 1 | 2.947987s |
| 2 | 2.230285s |
| 3 | 2.186832s |

### Post-streaming TTFB vs. total (same endpoint, streaming version)

| Metric | Value |
|---|---|
| Time-to-first-byte | ~2.023s |
| Total | ~2.713s |
| Actual streaming window | ~0.69s (total − TTFB) |

### Dependency versions (before → after this session)

| Package | Before | After | Type | Notes |
|---|---|---|---|---|
| `@neondatabase/serverless` | 0.10.4 | 1.1.0 | major | Only breaking change (sql() as plain fn) confirmed unused here |
| `@upstash/redis` | 1.38.2 | 1.38.4 | patch | Already inside prior `^1.34.0` range |
| `@upstash/ratelimit` | 2.0.8 | 2.0.8 | — | Unchanged |
| `dotenv` (dev) | 16.6.1 | 16.6.1 | — | Not bumped; latest is 17.4.2, low priority |

`npm audit`: 0 vulnerabilities before and after. `npm install` after the Neon bump removed 13 transitive packages.

### Live verification checks run against `https://hju-dev.vercel.app` (all passed)

| Check | Result |
|---|---|
| All 8 main pages + 404.html + global-mode/ | HTTP 200 |
| sitemap.xml, robots.txt, llms.txt, favicon.svg, og-image.png | HTTP 200 |
| Canonical tag matches own URL on every page | Confirmed, no duplication |
| sitemap.xml URLs all reachable, 1:1 with real pages | Confirmed |
| github.com/hju-dev | 200 |
| raeng-impetus.vercel.app | 200 |
| mymemorymatters.org | 200 |
| grassrootssports.org | 308 → 200 (redirect, healthy) |
| bigtsbakery.com | 307 → 200 (redirect, healthy) |
| 10MB POST body to /api/chat | 413 Payload Too Large |
| /api/, /scripts/, /content/, /.git/, /.env, /admin | 404 |
| /wp-admin | 403 (Vercel bot-protection, not app code) |
| Access-Control-* headers with cross-origin Origin sent | None returned (locked down) |
| Strict-Transport-Security header | Present on every response |

### Neon driver upgrade — real query tests run before merging (all passed)

```
Plain query: sql`select id, title from kb_chunks order by id limit 3`
  → returned 3 real rows (about, client-bts-bakery, client-grass-roots)
searchChunks() with a fake 768-dim embedding, k=2
  → returned 2 rows, first id: "project-raeng"
ingest.js's pre-upsert pattern: sql`select content_hash from kb_chunks where id = ${'about'}`
  → returned real content_hash, prefix "a03b23c7"
```

### Streaming bug — before/after SSE parsing

```
BEFORE (broken): buffer.indexOf('\n\n')  — never matched
  Gemini's actual wire format: "data: {...}\r\n\r\ndata: {...}\r\n\r\n..."
  Result: entire stream buffered forever, generator threw "no text returned"

AFTER (fixed): buffer += decoder.decode(value, {stream:true}).replace(/\r\n/g, '\n')
  Then buffer.indexOf('\n\n') matches correctly on every event boundary
  Result: chunks yielded progressively as Gemini generates them
```

### Rate-limiter configuration (`api/_lib/ratelimit.js`)

```js
const PER_IP_LIMIT = 15;          // requests
const PER_IP_WINDOW = '60 m';
const GLOBAL_DAILY_LIMIT = 250;   // requests/day
```
Fails closed (denies) if Upstash itself is unreachable — cost protection over uptime, per an existing code comment referencing "the PRD's free-tier concern."

### Exact FAQ content added to contact.html (and content/site-content.md's `## faq` chunk)

Real content, expensive to reconstruct from scratch if lost — captured verbatim:

1. **"how fast do you respond?"** → "Within 2–3 business days, usually faster. If a project is time-sensitive, say so in your first message."
2. **"do you work with clients outside Thailand?"** → "Yes — all of my client work so far has been fully remote (South Carolina, USA; Pattaya, Thailand). I work async-first and I'm happy to overlap for calls when it's useful."
3. **"do you build with a specific stack, or match the client's?"** → "Both — I default to Next.js, TypeScript, and Postgres for new builds, but I'll match an existing platform when that's the right call. Memory Matters runs on Wix Studio because that's what the client was already on, and it was the right fit for who maintains it day-to-day."
4. **"what's your process for a new project?"** → "A short call or email exchange to scope what you actually need, a plain-language proposal (what I'll build, in what order, roughly when), then regular check-ins while I build rather than a single big reveal at the end."
5. **"do you maintain sites after launch, or just build and hand off?"** → "Both, depending on what you need. Memory Matters is a real example — I've been the sole developer maintaining and expanding that site for 2+ years after the initial rebuild."

All 5 answers are grounded in facts already published elsewhere on the site (About page, Client Work page) — none were invented for the FAQ.

### Exact meta descriptions added (all 8 main pages)

| Page | Meta description |
|---|---|
| index.html | "Henry James Underwood — self-taught web developer based in Thailand, transitioning into AI integration. Real client work, real projects, built in public." |
| about.html | "About Henry James Underwood: three years of freelance web development, now moving into AI integration with Python, LangChain, and RAG pipelines." |
| projects.html | "Raeng, a live workout-tracking PWA, and Global Mode, a Thailand-first road trip app. Personal projects built and shipped by Henry James Underwood." |
| client-work.html | "Delivered client work from Henry James Underwood: Memory Matters, Grass Roots Sports, and Big T's Bakery — real, live, production sites." |
| contact.html | "Get in touch with Henry James Underwood for freelance web development and AI integration work. Based in Thailand, available remote." |
| accessibility.html | "hju.dev's accessibility statement — what's implemented, known limitations, and how to report an accessibility issue." |
| privacy.html | "hju.dev's privacy note — no analytics, no tracking, and exactly what happens when you use the AI chat widget." |
| terms.html | "Terms of use for hju.dev — site content, the AI chat widget's accuracy disclaimer, outbound links, and no-warranty terms." |

`og:title`/`twitter:title` reuse each page's `<title>` text; `og:description`/`twitter:description` reuse the meta description above; `og:image`/`twitter:image` point at `https://hju-dev.vercel.app/og-image.png` (or `global-mode/og-image.png` for that mini-site).

### Legal page structure (all follow the same `.about-text` pattern, `// 0N — label` section tag)

- **`accessibility.html`**: `// what's already in place` (semantic HTML, `aria-label`s on icon-only controls, `aria-expanded` on chat toggle, WCAG-AA-targeted contrast, `prefers-reduced-motion` respected in the hero canvas animation, full keyboard navigability), `// known limitations` (no full WCAG 2.1 AA manual audit completed yet, decorative elements rely partly on color/motion but not as the sole information channel), `// feedback` (direct email contact for reporting issues, treated as priority bugs)
- **`privacy.html`**: `// browsing the site` (no analytics/tracking/cookies, one `localStorage` key for music-mute state — added mid-session after the security review caught this omission), `// the chat widget` (Gemini API used server-side, IP briefly checked against Upstash rate limit then discarded, messages not stored), `// contact & email` (mailto link, no server-side storage), `// questions` (direct email)
- **`terms.html`**: `// site content` (code/design/writing belongs to Henry, client logos belong to their owners, referencing is fine but not wholesale copying), `// the chat widget` (AI-generated, can be wrong, not a substitute for verifying anything important), `// links to other sites` (Henry isn't responsible for linked client/project sites once you leave hju.dev), `// no warranty`, `// changes`, `// contact`

### Verification methodology used repeatedly this session (reusable pattern for future backend changes)

1. **Read the real code first** — never assume behavior from memory; every claim in this session's audits was backed by an actual `Read`/`Grep` of the current file, not recollection.
2. **Test against the real external service with real credentials** when a change touches Neon or Gemini — both the streaming SSE-format bug and the Neon-driver-upgrade compatibility check were caught/confirmed this way, not via mocks.
3. **Use a Vercel preview branch as a safety net for anything touching `/api/*`** — push to a feature branch, wait for the preview deployment (`https://portfolio-git-{branch-name}-hju-dev1.vercel.app`, branch slashes become dashes), verify live, only then merge to `main`.
4. **When a live curl test is ambiguous or blocked** (e.g., rate-limited from prior testing), fall back to a **synthetic in-browser test of the actual loaded function** rather than reasoning abstractly — e.g., `streamAnswerIntoBubble()` was verified by constructing a fake `ReadableStream`-backed `Response` in the live page's own JS context via `javascript_tool` and calling the real function with it, not by re-implementing the logic elsewhere to "test" a copy.
5. **When debugging a silent failure with no visible error**, temporarily surface the real error message directly in the observable output (the `[TEMP DEBUG: ...]` wrapper written into the streamed response body) rather than fighting a dashboard's log-viewer UI — faster path to ground truth, then revert before shipping.

### Brand palette reference (unchanged this session, included for completeness since it governs every card's styling)

| Card | Background | Accent | CSS class |
|---|---|---|---|
| Raeng | `#0f0f0f` | `#00ff88` (fixed this session — was `#c8f135`, see What We Tried #2) | `.project-raeng` |
| Global Mode | `#0a0e1a → #0f1628` | `#f0a500` amber + `#0ecfc0` teal | `.project-gm` |
| Memory Matters | `#04111f → #071d35` | `#4ab4e6` sky blue | `.mm-card` |
| Grass Roots Sports | `#050e05 → #0a1a0a` | `#a3e635` lime | `.grs-card` |
| Big T's Bakery | `#1a0a08 → #221210` | `#e8826a` coral | `.bts-card` |

Core site tokens (`style.css` `:root`): `--green: #00ff88`, `--bg: #0a0e0a`, `--mono: 'JetBrains Mono'`, `--sans: 'Inter'`.

## Code Analysis

- **`api/chat.js`** — single exported handler, `module.exports = async function handler(req, res)`. Flow: 405 if not POST → `validateMessage()` (400 on fail) → `checkRateLimit()` (429/503 on fail) → try block: `getClient()` → `embedQuery()` → `searchChunks()` → `buildSystemInstruction()` → `res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8', 'X-Chat-Sources': JSON.stringify(sources), 'Cache-Control': 'no-store'})` → inner try/catch around `for await (const textChunk of generateAnswerStream(...)) { res.write(textChunk) }` (on inner failure, writes a plain-text fallback message into the already-open stream, since headers are already committed and a clean JSON error is no longer possible) → `res.end()`. Outer catch (only reachable if the *pre-generation* steps fail) still returns clean JSON `{error, message}` via `res.status(500).json(...)`.
- **`api/_lib/gemini.js`** — 3 exports: `embedQuery(apiKey, text)` (unchanged, `gemini-embedding-001`, 768 dims, `taskType: 'RETRIEVAL_QUERY'`), `generateAnswer(apiKey, systemInstruction, userMessage)` (the old buffered version — **now dead code, zero callers**, confirmed via `grep 'generateAnswer\b'` returning only its own definition/export), `generateAnswerStream(apiKey, systemInstruction, userMessage)` — async generator, calls `:streamGenerateContent?alt=sse`, model `gemini-3.5-flash-lite`, `temperature: 0.2, maxOutputTokens: 400`. Parses SSE by buffering decoded chunks, **normalizing `\r\n` → `\n` before splitting on `\n\n`**, extracting `data:` lines, `JSON.parse`-ing each, yielding `candidates[0].content.parts[].text` when non-empty (skips a malformed chunk via try/catch rather than killing the whole stream). Throws if the stream ends having yielded zero text.
- **`api/_lib/ratelimit.js`** — `checkRateLimit(req, url, token)`, module-level `redis`/`ipLimiter` singletons lazily created in `init()`. `clientIp(req)` reads `x-forwarded-for`, first entry, falls back to `'unknown'`. New this session: `console.warn('Rate limit exceeded: per-IP cap hit')` (no IP) on the sliding-window rejection path, `console.warn('Rate limit exceeded: global daily cap hit', { count })` on the daily-cap rejection path.
- **`api/_lib/prompt.js`** — `buildSystemInstruction(chunks)`. Concatenates retrieved chunks into a `--- CONTEXT START/END ---` block. Injection defense is architectural (role separation via Gemini's `systemInstruction` field vs. the `user` turn), not keyword-based, plus explicit meta-instructions in the prompt itself about treating the visitor's message as untrusted.
- **`api/_lib/validate.js`** — `validateMessage(body)`, `MAX_LENGTH = 500`. Strips control/non-printable characters via regex, collapses whitespace, trims, rejects empty or over-length input with specific error codes (`invalid_input`, `input_too_long`).
- **`api/_lib/db.js`** — `getClient(databaseUrl)` wraps `neon()` from the driver; `searchChunks(sql, embedding, k=3)` runs a single tagged-template query ordering by `embedding <=> ${vectorLiteral}::vector` (cosine-distance-style nearest-neighbor via pgvector).
- **`widget.js`** — `sendMessage(message)`: appends user message + "Thinking…" pending bubble synchronously (optimistic UI, pre-dates this session), then `fetch('/api/chat', ...)`. If `res.ok`: `await streamAnswerIntoBubble(res, pending)`. Else: `res.json().catch(() => ({}))`, sets error text, adds `chat-bubble-error` class. New this session: `streamAnswerIntoBubble(res, bubble)` reads `res.body.getReader()`, decodes with `TextDecoder`, accumulates into `bubble.textContent` per chunk (progressive render, auto-scrolls the chat log), falls back to `await res.text()` if `res.body`/`getReader` is unavailable (older browsers), sets an error message + `chat-bubble-error` class if the stream ends having produced zero text.
- **`scripts/schema.sql`** — `kb_chunks` table DDL. `enable row level security`; `kb_api` role has `create policy kb_public_read on kb_chunks for select using (true)` plus `grant select` — deliberately no insert/update/delete policy, so even a leaked `kb_api` credential can only read. `kb_ingest` role has a separate `for all` policy (full CRUD), documented as local-machine-only, never in Vercel env vars.
- **`style.css` additions this session**: `.about-photo` / `.about-headshot` / `.about-photo-name` / `.about-photo-role` (headshot byline), `.response-time`, `.faq-list` / `.faq-item` / `.faq-q` / `.faq-a`, `.case-outcome`, `.section-cta`, `.chat-bubble-error` (+ `::before { content: '⚠ ' }`), `.footer-links` (+ `a`), `.about-text strong` / `code` / `a`. Removed: `.roadmap` / `.roadmap-phase` / `.phase-*` / `.status-active` / `.status-queued` / `.cert-badge` (~130 lines of dead code).

## Files Changed

### Source code (frontend)
- `index.html` — meta tags, footer legal links, one prose em-dash fix
- `about.html` — meta tags, footer legal links, headshot byline, internal links to client-work/projects
- `projects.html` — meta tags, footer legal links, closing cross-link to client-work/contact
- `client-work.html` — meta tags, footer legal links, Big T's Bakery card rewrite, single-column reorder, Memory Matters outcome line, closing cross-link
- `contact.html` — meta tags, footer legal links, response-time promise, 5-question FAQ section
- `accessibility.html` — new file
- `privacy.html` — new file, later amended with the localStorage disclosure
- `terms.html` — new file
- `404.html` — new file
- `global-mode/index.html` — meta tags, favicon links, one prose em-dash fix, Global Mode-specific OG image
- `style.css` — see Code Analysis for the full additions/removals list
- `widget.js` — streaming response handling (`streamAnswerIntoBubble`), error-state styling hooks
- `music-widget.js`, `neural-bg.js`, `script.js` — read/verified, not modified this session

### Backend
- `api/chat.js` — streaming success path, `X-Chat-Sources` header, inner/outer error handling split
- `api/_lib/gemini.js` — new `generateAnswerStream()`, SSE parsing with the CRLF fix
- `api/_lib/ratelimit.js` — rejection logging (IP deliberately excluded)
- `api/_lib/prompt.js`, `api/_lib/db.js`, `api/_lib/env.js`, `api/_lib/validate.js` — read and verified, not modified

### Config & infra
- `package.json` / `package-lock.json` — dependency version bumps
- `robots.txt`, `sitemap.xml`, `llms.txt` — new
- `favicon.svg`, `favicon-32x32.png`, `apple-touch-icon.png`, `og-image.png`, `og-main-src.svg` (root) — new
- `global-mode/favicon.svg`, `global-mode/favicon-32x32.png`, `global-mode/apple-touch-icon.png`, `global-mode/og-image.png`, `global-mode/og-gm-src.svg` — new
- `headshot.webp` — new (16KB, cropped/compressed from a since-deleted 2.3MB source)
- `.claude/launch.json` — new, local static-file-server config used for preview during verification

### Content
- `content/site-content.md` — added `## faq` chunk, added outcome line to `## client-memory-matters`, rewrote `## client-bts-bakery` (was stale, matching the HTML fix in step #7), added a personal-projects mention to `## about`, added response-time to `## contact`. `npm run ingest` re-run after each edit (confirmed via `Parsed N chunk(s)` / `X embedded, Y unchanged/skipped` output each time).

### Docs
- `CLAUDE.md` — refreshed 3 separate times this session (hosting reality + multi-page structure, then the streaming contract note)
- `plans/handoffs/HANDOFF_hju-dev-site-hardening_2026-09-09.md` — this file, new

## User Feedback & Preferences

- "Let's fix all problems you found" (said after two separate audit rounds) — clear preference for immediate action over further discussion once an audit is delivered.
- "Keep it qualitative, no fabricated metrics" — explicit rejection of inventing a stat for the Memory Matters case-study outcome line, even when offered as a real option.
- "Within 2-3 business days" — chose the more conservative response-time commitment over faster-sounding options.
- "Point them at the live Vercel URL" — chose functional correctness over leaving aspirational `hju.dev` URLs that don't resolve.
- "I don't have a custom domain yet, so let's skip this" — direct, unambiguous scope-narrowing the moment DNS cutover came up.
- "do not proceed, wait for next instruction" (on both the GSC-timing and Analytics-stance questions, dismissed via the same mechanism) — explicit deferral, not an implicit decision; do not assume either question was answered by the conversation moving on.
- "Yes, implement all changes to improve the app" (after the performance audit) — meant "do the one real thing you proposed (streaming)," since compression/batching/SSR had already been declined with reasoning in the same turn. Not a blanket "do everything on the original checklist regardless."
- "Remove them" — decisive, no hesitation, when asked directly about the unused headshot files.
- "anything to do?" and "What's next?" (asked multiple times across the session) — the right response each time was an honest status check, not manufactured busywork; offering the one genuine loose end (headshot cleanup) rather than padding was well-received.
- Consistently comfortable with N/A verdicts on checklist items **as long as the reasoning is shown** — never pushed back on "this doesn't apply because X," validating explain-rather-than-force-fit as the right approach for this user.
- Several prompts arrived pre-formatted with "Role:/Context:/Instructions:/Examples:" style headers (SEO consultant, security consultant, performance specialist personas) — likely copy-pasted from an external source rather than the user's own words. Worth noting for tone calibration in future sessions; not something requiring any different handling, since treating them as ordinary user requests and grounding every response in the real codebase worked correctly throughout.

## Where We're Going

1. **If/when Henry registers a custom domain**: add it in Vercel's project settings → get the DNS record Vercel provides → add it at the registrar → update every `https://hju-dev.vercel.app` reference back to the new domain across all 9 pages' meta tags, `sitemap.xml`, `robots.txt`, `llms.txt`, and `CLAUDE.md`'s Hosting section. Production env vars are already confirmed set, so that part is done — only the domain-pointing step remains.
2. **Resolve the GSC/Analytics decision.** Explicitly paused mid-session, not decided. Recommendation on record: wait for the custom domain before Search Console (avoids re-verifying a throwaway URL that will change); Analytics is a 3-way open choice (status quo no-analytics / privacy-respecting alternative like Vercel Analytics or Plausible / full GA4 + a cookie-consent banner).
3. **Blog posts** (5 recommended, for SEO/long-tail content) — a real, repeatedly-flagged opportunity that needs Henry's actual writing/expertise. Not started, not something to draft speculatively.
4. **Optional, low-priority cleanup**: delete the two now-fully-merged feature branches from GitHub; consider removing the dead `generateAnswer()` function; bump `dotenv` (dev-only, low risk); resolve/investigate the three untracked files that were never discussed (`example-road-lines.gif`, `global-mode-landing-page.zip`, `portfolio_ai_assistant_prd.md`).
5. **If `/api/chat` or `widget.js` is touched again**: read the `CLAUDE.md` streaming-contract note first (added this session, "Things to keep in mind" section) — the success path is plain-text streaming with sources in an `X-Chat-Sources` header, not JSON. Error paths (400/429/500/503) are unchanged JSON. The two files are a matched pair now, not independently editable.

## Verification Commands Reference

Quick copy-paste block for re-confirming the state documented in this handoff, without re-deriving it:

```bash
# Confirm no stale https://hju.dev references crept back in
grep -rn "https://hju\.dev" "C:\Users\h\Desktop\CODING\Web Dev\hju.dev" --include="*.html" --include="*.xml" --include="*.txt"
# Expect: zero output

# Confirm generateAnswer() is still dead code (or check if something started using it)
grep -n "generateAnswer\b" "C:\Users\h\Desktop\CODING\Web Dev\hju.dev\api\_lib\gemini.js" "C:\Users\h\Desktop\CODING\Web Dev\hju.dev\api\chat.js"
# Expect: only the definition + export line in gemini.js, no calls in chat.js

# Confirm content/site-content.md and the live HTML haven't drifted apart again
diff <(grep -A2 "Big T's Bakery" "C:\Users\h\Desktop\CODING\Web Dev\hju.dev\client-work.html") \
     <(grep -A2 "client-bts-bakery" "C:\Users\h\Desktop\CODING\Web Dev\hju.dev\content\site-content.md")
# Not a literal diff (different formats) -- eyeball for the same stack/facts
```

## Risks & Blockers

- **Production rate limit may still show `429`s** from this session's own heavy testing (Preview and Production share the same Upstash instance and the same sandbox egress IP). Self-resolving within the hour; not a code issue — don't "fix" it if seen, just wait, or verify via a preview branch / synthetic browser-side testing instead (as done in step #15 of What We Tried).
- **`hju.dev` has zero DNS records.** Any future work that assumes it's live (sitemap indexing, testing social-share previews against the "real" domain, etc.) needs to target `https://hju-dev.vercel.app` instead until Henry registers the domain.
- **Two merged branches left un-deleted** (`feature/streaming-chat`, `chore/bump-neon-driver`) — zero functional risk (both fully merged, one squash + one fast-forward, no divergence from `main`), just GitHub clutter.

## Open Questions

- Google Search Console: submit now against the temporary Vercel URL, or wait for a custom domain? **Unresolved — user paused this question explicitly, did not answer.**
- Analytics: keep the no-analytics stance / add a privacy-respecting alternative (Vercel Analytics, Plausible) / add full Google Analytics + cookie-consent banner? **Unresolved — user paused this question explicitly, did not answer.**
- What are `example-road-lines.gif`, `global-mode-landing-page.zip`, and `portfolio_ai_assistant_prd.md` for? Sitting untracked in the repo root the entire session, never discussed. Not urgent, but unexplained — could be leftover scratch files or could be meaningful; don't delete without asking.

## Quick Start for Next Session

```bash
# Read CLAUDE.md in full first — it's short, authoritative, and was refreshed
# three times this session specifically so a new session wouldn't have to
# re-derive any of this from scratch
cat "C:\Users\h\Desktop\CODING\Web Dev\hju.dev\CLAUDE.md"

# Confirm current live state — don't assume, verify
curl -s -o /dev/null -w "%{http_code}\n" https://hju-dev.vercel.app/
curl -s -X POST https://hju-dev.vercel.app/api/chat -H "Content-Type: application/json" -d '{"message":"test"}'
# ^ if this returns rate_limited JSON, that's expected residue from this
#   session's own testing volume, not a bug — see Risks & Blockers

# Key files to read first if continuing backend work — read together,
# they're a matched streaming contract now, not independent
# api/chat.js, api/_lib/gemini.js, widget.js

# api/_lib/ratelimit.js — rate limiting + the new rejection logging

# content/site-content.md vs. the HTML pages — check these stay in sync
# if editing any visitor-facing copy (skills, project descriptions, FAQ)

# Verify current git state
cd "C:\Users\h\Desktop\CODING\Web Dev\hju.dev" && git log --oneline -5 && git status -s

# Next action
# Ask Henry directly: (1) has he registered a domain yet, (2) GSC/Analytics
# decision, (3) any interest in the 5-blog-post SEO opportunity. All three
# are genuinely blocked on his input, not on more investigation from this
# session — don't re-litigate them from scratch, just ask and act.
```
