# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page marketing site for AVYSTRA Consulting (Next.js 16 App Router, TypeScript, Tailwind CSS 4). The one substantial feature is the **OGI (Organizational Growth Index) assessment** — a 16-question diagnostic that scores a submission, persists it to PostgreSQL, emails both the user and the owner, and appends it to a downloadable Excel file. The `README.md` is unusually complete (env vars, scoring bands, design tokens, deploy checklist) — read it for anything not covered here.

## Commands

Package manager is **Bun** (`bun.lock`), though npm works. `postinstall` runs `prisma generate`.

```bash
bun run dev          # dev server on :3000, tees output to dev.log
bun run build        # next build + copies static/public into .next/standalone (custom, non-default)
bun run start        # runs the standalone server via bun
bun run lint         # eslint .
bun run db:push      # push schema to DB (no migration files)
bun run db:migrate   # create + apply a dev migration
bun run db:reset     # DESTRUCTIVE — wipes the DB
```

There is **no test suite** — do not assume `bun test` exists.

## Architecture notes (non-obvious)

- **`src/app/page.tsx` is the entire site.** Every section is a component under `src/components/avystra/`. Only Header/Hero/ScrollProgress/LoadingScreen load eagerly; everything below the fold is `React.lazy()` + `Suspense`. The whole page is a `"use client"` component.

- **Loading-screen gate.** A `pageReady` boolean (from `PageReadyProvider` in `src/lib/pageReady.tsx`) is the single source of truth that flips the `.page-ready` class on `<html>`. All GSAP reveal observers and hero CSS animations are gated on it so nothing animates behind the loading screen. When adding animated sections, hook into this, don't fire on mount.

- **Two animation systems, deliberately split:** GSAP + ScrollTrigger (registered once in `src/lib/gsap.ts`, driven by `useGsapReveal`/`useGsapCards`) for scroll-linked reveals; Motion/Framer (`motion/react`) for component-level transitions. Lenis smooth scroll is desktop-only. Shared easing constants live in `src/lib/motion.ts`. `prefers-reduced-motion` is respected throughout — preserve that.

- **OGI scoring lives in `src/lib/ogi-data.ts`** (questions + 0–4 answers, 4 pillars, scaled to 0–100, band thresholds). Change scoring/questions there, not in components.

- **API routes** (`src/app/api/ogi/*`): `save` persists silently (rate limit 10/hr/IP); `submit` persists + sends both emails + regenerates the Excel export (5/hr/IP); `export` streams the xlsx (10/hr/IP). Rate limiting is **in-memory** (`src/lib/rate-limit.ts`) — it does not survive serverless cold starts or scale across instances. Input is validated with Zod, which also strips CR/LF from string fields (email-header-injection guard).

- **`db` (`src/lib/db.ts`) and the SMTP transport (`src/lib/email.ts`) are cached singletons** on `globalThis` to survive hot reload / serverless reuse. `email.ts` does lazy verification + retry with exponential backoff; email templates (HTML + plain-text, anti-spam headers) are in `src/lib/ogi-email-templates.ts`. Never construct new Prisma/Nodemailer clients ad hoc.

- **Excel export** (`src/lib/excel-export.ts`) writes to `public/` and is served at `/ogi-submissions.xlsx` via a rewrite in `next.config.ts` → `/api/ogi/export`.

- **Health check:** `GET /api/ogi/health` reports config instantly; add `?verify=true` for a live SMTP connection test.

## Database

Prisma + PostgreSQL (Supabase). `DATABASE_URL` must be the **pooled** connection (port 6543, `pgbouncer=true`); `DIRECT_URL` is the **direct** connection (port 5432) used only for migrations. There is a single model, `OgiSubmission`, with `answersJson` stored as a serialized string.

## Gotchas

- `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `reactStrictMode: false` — the build will **not** catch type errors, so type-check mentally / rely on the editor. Run `bun run lint` before finishing.
- `.zscripts/` and `Caddyfile` are for the Z.ai sandbox environment (Chinese-commented orchestration scripts, Caddy gateway on :81). `.zscripts/build.sh` hardcodes `/home/z/my-project` and is not the local build path — use `bun run build`. `mini-services/` is an empty extension point.
- Email + DB require the 8 env vars from README's Environment Variables section; without them `submit`/`save` will fail.
