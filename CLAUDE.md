# CLAUDE.md — hju.dev Portfolio

Auto-loaded by Claude Code on every session. Read this before touching anything.

---

## What this repo is

Personal portfolio site for Henry James Underwood (hju.dev).  
Frontend is still static — pure HTML, CSS, and vanilla JS, no framework, no build step.  
There's also a small serverless backend (`api/`) for a RAG chat widget, which needs Vercel to run — see "Hosting" below, and "How to deploy" for keeping its knowledge in sync.

**Hosting: Vercel only, no custom domain yet.**
- `hju.dev` is **not a registered domain** (confirmed via DNS lookup — NXDOMAIN, doesn't resolve to anything). Don't assume it's live; it isn't.
- GitHub Pages is **not currently serving the site** either — the GitHub Pages URL 404s, likely because the repo moved from `undie7/hju.dev` to `hju-dev/portfolio`, which can reset Pages settings. It has not been re-enabled.
- The actual live site is the **Vercel** deployment at **`https://hju-dev.vercel.app`** — this serves the static files *and* runs `/api/chat`. This is the real production URL right now; all canonical/OG/sitemap URLs in the codebase point here.
- Production Vercel env vars (`GEMINI_API_KEY`, `NEON_DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are confirmed set, scoped to "Production and Preview" in the Vercel dashboard. `/api/chat` was smoke-tested live on `https://hju-dev.vercel.app` and works end-to-end, including retrieving the FAQ content added in September.
- If/when Henry buys a custom domain, the remaining setup is: add the domain in Vercel's project settings → add the DNS record Vercel provides at the registrar → update every `https://hju-dev.vercel.app` reference (meta tags, sitemap.xml, robots.txt, CLAUDE.md) to the new domain.

---

## Repo structure

```
/
├── index.html           # Home — hero, "explore" quicklinks only (not the whole site)
├── about.html           # About / skills / certifications / dev log
├── projects.html        # Personal projects — Raeng, Global Mode
├── client-work.html     # Client work — Memory Matters, Big T's Bakery, Grass Roots Sports
├── contact.html         # Contact + FAQ + response-time promise
├── accessibility.html   # Accessibility statement
├── privacy.html         # Privacy note
├── terms.html           # Terms of use
├── 404.html             # Custom not-found page (noindexed)
├── style.css            # All styles for the pages above
├── script.js            # Typing animation, scroll observer, year auto-update
├── widget.js             # Chat widget frontend (vanilla JS, same conventions as script.js)
├── music-widget.js       # Background music widget (localStorage mute/pause state)
├── neural-bg.js          # Canvas node/connection animation behind the home hero
├── favicon.svg, favicon-32x32.png, apple-touch-icon.png   # Site favicon
├── og-image.png, og-main-src.svg   # Social share image (+ editable source)
├── headshot.webp         # Real photo used on about.html
├── robots.txt, sitemap.xml   # Point at the live Vercel URL until a custom domain exists
├── global-mode/          # Global Mode landing page (separate mini-site, own design system)
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   ├── favicon.svg, favicon-32x32.png, apple-touch-icon.png   # Its own favicon, navy/amber
│   └── og-image.png, og-gm-src.svg   # Its own share image
├── api/                  # Vercel serverless functions (backend for the chat widget only)
│   ├── chat.js            # POST /api/chat
│   └── _lib/               # shared helpers, not routable
├── content/site-content.md   # RAG grounding content, manually maintained (not auto-derived from the HTML)
├── scripts/
│   ├── schema.sql          # Neon/pgvector DDL, run manually via SQL editor
│   └── ingest.js            # embeds content/site-content.md into Neon — run after editing that file
├── package.json           # deps for api/ and scripts/ only — the static frontend still has no build step
├── vercel.json
├── .env.example
└── CLAUDE.md            # This file
```

**The static frontend still has no build step.** Edit any `.html`/`style.css`/`script.js`/`widget.js` file directly. `package.json` exists only for the `api/`/`scripts/` backend code, not the frontend.

---

## How to deploy

```bash
git add .
git commit -m "your message"
git push origin main
```

Pushing to `main` triggers a Vercel redeploy automatically, no CI/pipeline config needed — static files + `api/` to `https://hju-dev.vercel.app`, usually live within ~60 seconds. (GitHub Pages is configured in the repo's history but isn't currently serving anything — see "Hosting" above.)

If you changed `content/site-content.md`, deploying doesn't update the chat widget's knowledge — you must separately run `npm run ingest` (needs local `.env` with `GEMINI_API_KEY` + `NEON_INGEST_DATABASE_URL`).

---

## Design system

All design tokens are CSS custom properties in `style.css`:

```css
--green:        #00ff88   /* primary accent — used everywhere */
--green-dim:    #00cc6a   /* hover state for green */
--green-glow:   rgba(0, 255, 136, 0.15)
--bg:           #0a0e0a   /* page background */
--bg2:          #0f140f   /* card background */
--bg3:          #141a14   /* nested elements */
--border:       rgba(0, 255, 136, 0.15)
--border-hover: rgba(0, 255, 136, 0.4)
--text:         #c8d8c8
--text-dim:     #6a8a6a
--mono:         'JetBrains Mono', monospace
--sans:         'Inter', sans-serif
```

**Do not hardcode hex values.** Use the variables above. The only exceptions are
project-specific brand cards (Raeng, Global Mode, Memory Matters, Grass Roots, Big T's)
which intentionally use their own brand palettes.

---

## Page structure & section numbering

The site is multi-page now, not one long scroll. Each page numbers its own `// 0N — label` section tags starting from 01, independently of other pages:

```
index.html          → 01 hero (no tag) · // where to next (quicklinks, untagged)
about.html           → 01 about · 02 skills · 03 certifications · 04 building in public
projects.html        → 01 projects
client-work.html     → 01 client work
contact.html         → 01 contact · 02 faq
accessibility.html   → 01 accessibility
privacy.html         → 01 privacy
terms.html           → 01 terms
```

If you add a section to a page, renumber only that page's tags. Nav links (5 items: home / about / projects / client work / contact) must stay in sync — `terms`/`privacy`/`accessibility` are intentionally footer-only, not in the main nav.

---

## Project cards — two types

### `project-featured` (large flagship cards)
Used for: Raeng, Global Mode  
Has: logo lockup top-right, brand-colored background, feature pills, CTA button  
Requires: `position: relative` (already set in CSS)  
Logo lockup class: `.card-logo-lockup` (absolute positioned top-right)  
Padding rule: `.project-featured .project-badge, .project-title, .project-subtitle { padding-right: 9rem }`

### `project-card` (smaller grid cards)
Used for: all client work cards  
Has: logo lockup top-right (image), brand border/background, tags, ghost button  
Requires: `position: relative` (set in CSS)  
Logo lockup class: `.card-logo-lockup-sm` (absolute positioned top-right)  
Padding rule: `.grs-card .project-badge` etc. `{ padding-right: 7rem }`

---

## Brand palettes per card

| Card | Background | Accent | Class |
|---|---|---|---|
| Raeng | `#0f0f0f` | `#00ff88` | `.project-raeng` |
| Global Mode | `#0a0e1a → #0f1628` | `#f0a500` amber + `#0ecfc0` teal | `.project-gm` |
| Memory Matters | `#04111f → #071d35` | `#4ab4e6` sky blue | `.mm-card` |
| Grass Roots Sports | `#050e05 → #0a1a0a` | `#a3e635` lime | `.grs-card` |
| Big T's Bakery | `#1a0a08 → #221210` | `#e8826a` coral | `.bts-card` |

Client logos are loaded from live URLs — do not copy them into this repo:
- Grass Roots: `https://grassrootssports.org/logo.jpg`
- Big T's: `https://bigtsbakery.com/images/logo.png`

---

## Fonts loaded

```html
JetBrains Mono (400, 700)   — monospace, used for all code/UI text
Inter (300, 400, 500)       — sans-serif, used for body text
Bebas Neue                  — display font, used only in Global Mode card lockup
```

All loaded via Google Fonts in `<head>`.

---

## Script.js — what it does

1. **Year** — auto-updates footer copyright year
2. **Scroll observer** — adds `.visible` to `.fade-in` elements when they enter viewport
3. **Typing animation** — cycles through terminal commands in the hero section

To add a new phrase to the typing animation, edit the `phrases` array in `script.js`.

---

## What Henry is working toward

Henry is a self-taught developer transitioning into AI integration. His background:
- **Delivered client work:** Memory Matters (Wix Studio, 2+ years), Grass Roots Sports (Next.js, awaiting launch), Big T's Bakery (Next.js/TypeScript/Neon/Clerk full-stack rebuild, live)
- **Personal projects:** Raeng (React/Vite PWA, Neon, Clerk, Vercel), Global Mode (landing page only, app in planning)
- **Currently learning:** CS50 Python → Anthropic/OpenAI APIs → LangChain → RAG
- **Target stack:** Python, AI APIs, full-stack JS/TS

The portfolio narrative: web dev track record first, AI integration as the next layer.  
Do not add aspirational skills or projects that don't exist yet.

---

## Things to keep in mind

- **No build step for the frontend** — any change to HTML/CSS/JS is immediately what ships once deployed
- **No frontend framework** — don't suggest React, Vite, etc. for `index.html`/`style.css`/`script.js`/`widget.js`
- **Multi-page, not single-file** — the site is 9 separate HTML pages (see repo structure above) sharing one `style.css`. Don't assume `index.html` holds all the content.
- **`api/` only works on Vercel** — it doesn't run on GitHub Pages (currently not even serving the site — see "Hosting" above), and doesn't run when previewing HTML files directly from disk either.
- **`content/site-content.md` is the RAG source of truth, not the HTML pages** — they're not auto-synced. If you edit visitor-facing copy anywhere (skills, project descriptions, FAQ, etc.), also update the matching section in `content/site-content.md` and re-run `npm run ingest`, or the chat widget will answer from stale facts.
- **Backend secrets live in a local, gitignored `.env`** (see `.env.example` for the shape) and in Vercel's Preview/Production env vars — never in the repo.
- **Mobile nav** — the nav has 5 links (home / about / projects / client work / contact); footer carries terms/privacy/accessibility separately. Check mobile before adding more to either.
- **Re-read before editing** — always read the current file state before making changes; do not work from memory

---

*Last updated: September 2026*
