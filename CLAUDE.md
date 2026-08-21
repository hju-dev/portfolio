# CLAUDE.md — hju.dev Portfolio

Auto-loaded by Claude Code on every session. Read this before touching anything.

---

## What this repo is

Personal portfolio site for Henry James Underwood (hju.dev).  
Frontend is still static — pure HTML, CSS, and vanilla JS, no framework, no build step.  
There's now also a small serverless backend (`api/`) for a RAG chat widget, which needs Vercel to run — see "Backend / chat widget" below.

**Hosting is currently split (transitional state, as of the RAG chat widget merge):**
- The live `hju.dev` domain still points at **GitHub Pages**, serving the static files only. `/api/*` does not work there — GitHub Pages can't run serverless functions.
- The same repo is also deployed to **Vercel** (`hju-dev/portfolio` project), which serves the static files *and* runs `/api/chat`. Preview deployments work now; Production Vercel env vars + the DNS cutover from GitHub Pages to Vercel are still pending as explicit, separate steps.
- Until DNS is cut over, treat GitHub Pages as the source of truth for what's actually live at hju.dev, and the Vercel deployment as where the chat widget is actually testable.

---

## Repo structure

```
/
├── index.html          # Single-page portfolio — the entire site
├── style.css           # All styles
├── script.js           # Typing animation, scroll observer, year auto-update
├── widget.js            # Chat widget frontend (vanilla JS, same conventions as script.js)
├── global-mode/        # Global Mode landing page (separate mini-site)
│   ├── index.html
│   ├── styles.css
│   └── main.js
├── api/                 # Vercel serverless functions (backend for the chat widget only)
│   ├── chat.js           # POST /api/chat
│   └── _lib/              # shared helpers, not routable
├── content/site-content.md   # RAG grounding content, manually maintained (not auto-derived from index.html)
├── scripts/
│   ├── schema.sql         # Neon/pgvector DDL, run manually via SQL editor
│   └── ingest.js           # embeds content/site-content.md into Neon — run after editing that file
├── package.json          # deps for api/ and scripts/ only — the static frontend still has no build step
├── vercel.json
├── .env.example
└── CLAUDE.md           # This file
```

**The static frontend still has no build step.** Edit `index.html`/`style.css`/`script.js`/`widget.js` directly. `package.json` exists only for the `api/`/`scripts/` backend code, not the frontend.

---

## How to deploy

```bash
git add .
git commit -m "your message"
git push origin main
```

Pushing to `main` triggers **both** deploys automatically, no CI/pipeline config needed:
- GitHub Pages redeploys the static files within ~60 seconds (this is what's actually live at hju.dev right now).
- Vercel redeploys the same repo (static files + `api/`) to its own `*.vercel.app` URL. This is where `/api/chat` actually works. It only becomes what's live at hju.dev after the DNS cutover (not done yet).

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

```
// 01 — about
// 02 — skills
// 03 — projects      (personal projects: Raeng flagship, Global Mode)
// 04 — client work   (Memory Matters flagship, Grass Roots Sports, Big T's Bakery)
// 05 — certifications
// 06 — dev log
// 07 — contact
```

If you add a section, renumber everything that follows. Nav links must stay in sync.

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
- **Delivered client work:** Memory Matters (Wix Studio, 2+ years), Grass Roots Sports (Next.js, awaiting launch), Big T's Bakery (hand-coded, live)
- **Personal projects:** Raeng (React/Vite PWA, Neon, Clerk, Vercel), Global Mode (landing page only, app in planning)
- **Currently learning:** CS50 Python → Anthropic/OpenAI APIs → LangChain → RAG
- **Target stack:** Python, AI APIs, full-stack JS/TS

The portfolio narrative: web dev track record first, AI integration as the next layer.  
Do not add aspirational skills or projects that don't exist yet.

---

## Things to keep in mind

- **No build step for the frontend** — any change to HTML/CSS/JS is immediately what ships once deployed
- **No frontend framework** — don't suggest React, Vite, etc. for `index.html`/`style.css`/`script.js`/`widget.js`
- **Single file** — `index.html` is the whole visible site; keep it that way unless Henry explicitly asks to split it
- **`api/` only works on Vercel, not GitHub Pages** — GitHub Pages serves it as inert static files, doesn't execute it. Don't assume `/api/chat` is reachable from the live hju.dev domain until the DNS cutover happens.
- **`content/site-content.md` is the RAG source of truth, not `index.html`** — they're not auto-synced. If you edit visitor-facing copy in `index.html` (skills, project descriptions, etc.), also update the matching section in `content/site-content.md` and re-run `npm run ingest`, or the chat widget will answer from stale facts.
- **Backend secrets live in a local, gitignored `.env`** (see `.env.example` for the shape) and in Vercel's Preview/Production env vars — never in the repo.
- **Mobile nav** — the nav has 7 links and wraps on narrow screens; don't add more without checking mobile
- **Re-read before editing** — always read the current file state before making changes; do not work from memory

---

*Last updated: August 2026*
