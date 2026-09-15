<!--
  Grounding content for the RAG chat widget.
  One "##" heading = one chunk. The heading text is the chunk's stable id (slug) —
  do not rename an existing heading unless you mean to replace that chunk.
  Review and edit this file before running `npm run ingest`.
-->

## about

Henry Underwood is a web developer and AI integration specialist with three years of delivered client work spanning custom-coded sites, full-stack web apps, and a long-running Wix Studio rebuild for a US nonprofit. He builds things that work - bilingual e-commerce, Postgres-backed registration systems, PWAs that live on your home screen - and maintains them long after launch.

He's currently moving into AI integration: Python, LangChain, the Anthropic and OpenAI APIs, and RAG pipelines. The web dev foundation is solid. The AI layer is next.

Native English speaker based in Thailand. Solo operator. Available for remote contracts. No degree required, just results.

He also builds personal projects (Raeng, Global Mode) to learn in public and keep shipping between client contracts.

## skills

Languages: HTML (solid), CSS (solid), JavaScript (solid), Python (learning).

AI & ML: Neural Networks (learning), RAG (queued), LangGraph (queued), Hugging Face (queued), Anthropic API (queued).

Tools & Platforms: Git & GitHub (solid), Wix Studio (solid), Next.js (solid), Vercel + Neon (solid), APIs/REST (queued).

Next up: FastAPI, AWS, System Design, Vector Databases (all queued).

## project-raeng

Raeng (แรง · IMPETUS) is a full-stack mobile workout tracker PWA built for a structured 5-day lifting split (Upper / Lower / Pull / Push / Legs), built to live on an iPhone home screen with no browser chrome. It has background-safe rest timers and a workout stopwatch, wave-set logging with live weight calculations, Epley 1RM estimates, and a post-workout debrief with PR detection and estimated calories. Workouts can be scheduled and synced to iOS Calendar, exercises edited inline, sets skipped or completed in one tap, and the app unlocked quickly with a PIN layered over real Neon Auth sign-in (username or email). Backed by Neon (Postgres) with a custom sign-in rate limiter, full data export, and account management.

Features: 5-day split tracker, background-safe rest timer, wave set logging, Epley 1RM estimator, workout plan system, weekly schedule with iOS Calendar sync, post-workout debrief with PR detection, inline exercise editor, skip/complete tracking, PIN quick-unlock, username login, benchmark/AMRAP workouts, Neon (Postgres) database, Neon Auth, iOS PWA install.

Stack: React, Vite, PWA, Neon (Postgres), Neon Auth, Vercel, JavaScript. Live at raeng-impetus.vercel.app.

## project-global-mode

Global Mode is a mobile-first travel app for road trippers, Thailand-first. Google Maps gets you from A to B — Global Mode gets you everywhere worth going in between. Built for road trippers who want scenic routes, vibe filters, honest local data, and a co-driver experience, not just an ETA.

Features: vibe factor filters, scenic road routing, spoiler blocker toggle, road quality ratings, co-driver mode, SOS button, fuel stop planner, community data.

Status: Phase 1 — in progress. Stack: React, JavaScript, mobile-first.

## client-memory-matters

Memory Matters is a nonprofit brain health organization based in Hilton Head Island, SC (mymemorymatters.org). Henry completely rebuilt and relaunched the site for this nationally recognized dementia care and brain health nonprofit serving the South Carolina Lowcountry, taking over a disorganized existing site and delivering a polished, professional rebuild. He then stayed on as the sole developer maintaining and expanding it for over two years.

The site handles a wide range of real-world nonprofit needs: multi-program listings, event calendars, newsletter signup, donation flows, caregiver support resources, a member portal, and multiple location pages. Built on Wix Studio with custom Velo/JavaScript for dynamic behavior beyond what the visual editor supports.

Tags: Wix Studio, Velo/JavaScript, multi-program site, donation flows, event calendar, member portal, 2+ years maintained.

Outcome: still the developer maintaining the site today, over two years after the original rebuild shipped — the client has never needed to look for anyone else.

## client-grass-roots

Grass Roots Sports is a full-stack web app built for a sports nonprofit in Pattaya, Thailand, running youth, teen, and adult basketball programs. Built (awaiting launch), it features bilingual EN/TH routing, a multi-step registration form with PromptPay QR payment, email confirmations via Resend, a Sanity CMS for content management, Clerk authentication protecting an admin dashboard, and a Neon (Postgres) database for registrations and contact messages.

Tags: Next.js, TypeScript, Tailwind CSS, Sanity CMS, Neon (Postgres), Clerk, bilingual EN/TH.

## client-bts-bakery

Big T's Bakery is a full-stack bilingual (EN/TH) bakery e-commerce site Henry built for a young entrepreneur in Thailand. It has a dynamic menu loaded from a Postgres database, a live cart with custom icing colour surcharges, a weekend-only date picker, and a payment slip upload flow using Vercel Blob. Orders hit an admin dashboard (Clerk-protected) with inline status management, full order detail views, and a menu CMS for adding new products. Notification emails fire via Resend on every order. Delivered and live, deployed on Vercel.

Tags: Next.js, TypeScript, Tailwind CSS, Neon (Postgres), Vercel, Clerk, Resend, Vercel Blob, bilingual EN/TH.

## client-jaad

JÄAD (จ๊าด) is a cafe-by-day, cocktail-bar-and-live-DJ-lounge-by-dusk venue in Ayutthaya, Thailand, reopening under new ownership at an existing address (same owners as the prior "Red Cup" bar/restaurant). Henry built a full-stack bilingual (EN/TH) site and CMS: Next.js 16 (App Router) with Payload CMS 3.x embedded directly in the app, a Neon (Postgres) database, and Vercel Blob for media, deployed on Vercel with git-based auto-deploy.

Six public routes (Home, Menu, Events, About, Gallery, Visit) are all content-editable through Payload's admin panel, not hardcoded. The defining feature is a Day/Dusk toggle — not a dark-mode preference but a real content switch that swaps hero photography, copy, and atmosphere between cafe hours and cocktail-bar/live-DJ hours, paired with a matching EN/TH language toggle using Payload's native field-level localization; both are built as a shared, custom animated sliding switch. The CMS is real: MenuItems, Events, and GalleryPhotos collections, SiteSettings/PhotoPlacements/PageCopy globals, and native Payload admin auth with real per-person logins. The admin panel itself is custom-branded to the client's visual identity, with a deliberate split between decorative display type and a plain, readable typeface for every field an admin actually uses. Content edits reach the live site within about a minute via ISR, with no redeploy required. Reservations route through a LINE deep link (the local standard for Thai businesses) instead of a generic contact form. SEO includes sitemap.xml and robots.txt via Next's file-based generators, JSON-LD Restaurant schema generated live from the CMS's own SiteSettings data, and a real Google Maps embed. Henry also ran a full accessibility audit and fixed WCAG AA contrast failures, missing heading hierarchy, and undersized touch/text targets.

Tags: Next.js, TypeScript, Payload CMS, Neon (Postgres), Vercel, Vercel Blob, bilingual EN/TH, Day/Dusk theming.

Outcome: what shipped as the client's real production site started as a speculative, fully-working live prototype built to win the pitch — not a mockup or slide deck, an actual working site. Once the client committed, it was migrated in place to the full CMS/database/production stack: real data, real admin logins, real reservations.

Live at jaad.vercel.app.

## contact

Henry is open to freelance and remote work: AI chatbots, workflow automation, AI-powered tools, and web development. To get in touch, email henryjunderwood@gmail.com or find him on GitHub at github.com/hju-dev. He typically replies within 2–3 business days.

## faq

Response time: within 2–3 business days, usually faster.

Works with clients outside Thailand: yes, all client work so far has been fully remote (South Carolina, USA; Pattaya, Thailand). Works async-first, happy to overlap for calls when useful.

Tech stack: defaults to Next.js, TypeScript, and Postgres for new builds, but matches an existing platform when that's the right call — Memory Matters runs on Wix Studio because that's what the client was already on and what's right for who maintains it day-to-day.

Process for a new project: a short call or email exchange to scope what's needed, a plain-language proposal (what gets built, in what order, roughly when), then regular check-ins while building rather than one big reveal at the end.

Post-launch maintenance: yes, depending on the project. Memory Matters is a real example — Henry has been the sole developer maintaining and expanding that site for 2+ years after the initial rebuild.
