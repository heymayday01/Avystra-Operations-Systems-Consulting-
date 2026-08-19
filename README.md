# AVYSTRA — Operations & Systems Consulting Website

A premium, production-ready marketing website for AVYSTRA Consulting Private Limited, built with Next.js 16, TypeScript, and Tailwind CSS 4. Features a full organizational assessment (OGI) flow with automated email delivery, database persistence, and Excel export.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui design tokens |
| **Animations** | GSAP + ScrollTrigger, Motion (Framer Motion) |
| **Smooth Scroll** | Lenis (desktop), native (mobile/touch) |
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
| **Email** | Gmail SMTP via Nodemailer (pooled transport) |
| **Excel Export** | ExcelJS |
| **Admin Auth** | Argon2id (hash-wasm) + signed-cookie sessions (Web Crypto) |
| **Icons** | Lucide React |
| **Fonts** | Plus Jakarta Sans (display), Inter (body), Playfair Display (serif), JetBrains Mono (mono) |

---

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun)
- A PostgreSQL database (Supabase free tier recommended)
- A Gmail account with 2-Step Verification enabled (for App Password)

### Installation

```bash
# Clone
git clone https://github.com/heymayday01/Avystra-Operations-Systems-Consulting-.git
cd Avystra-Operations-Systems-Consulting-

# Install dependencies
npm install        # or: bun install

# Create .env file (see Environment Variables below)
cp .env.example .env
# Edit .env with your values

# Create database tables
npx prisma db push

# Start dev server
npm run dev        # or: bun run dev
```

Visit `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# ── Database (Supabase PostgreSQL) ──────────────────────────────────────────
# Pooled connection (for app queries — handles serverless concurrency)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (for Prisma migrations)
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:5432/postgres

# ── Email (Gmail SMTP) ──────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password    # NOT your regular Gmail password
SMTP_FROM=AVYSTRA Consulting Pvt Ltd <your-email@gmail.com>
AVYSTRA_NOTIFY_EMAIL=your-email@gmail.com   # where OGI submission notifications are sent

# ── Google Sheets mirror (optional) ─────────────────────────────────────────
# Leave SHEETS_WEBHOOK_URL blank to disable. See scripts/google-apps-script.gs
# for the Apps Script to deploy — SHEETS_SECRET must match SHARED_SECRET there.
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/xxx/exec
SHEETS_SECRET=your-shared-secret

# ── Admin panel ──────────────────────────────────────────────────────────────
# See "Admin Panel" below for how to generate these.
ADMIN_EMAIL=admin@avystra.co.in
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

### Getting the Gmail App Password

1. Enable **2-Step Verification** at [myaccount.google.com](https://myaccount.google.com)
2. Go to **[App Passwords](https://myaccount.google.com/apppasswords)**
3. Create a new password for "Mail"
4. Copy the 16-character code (no spaces needed in `.env`)

### Getting the Supabase Connection String

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **pooled** URL (port 6543) for `DATABASE_URL`
4. Copy the **direct** URL (port 5432) for `DIRECT_URL`
5. Replace `[YOUR-PASSWORD]` with your database password

---

## Project Structure

```
├── prisma/
│   └── schema.prisma              # Database schema (PostgreSQL)
├── public/                        # Static assets (logos, founder images)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ogi/
│   │   │       ├── export/        # GET — download Excel of all submissions
│   │   │       ├── health/        # GET — email config status + SMTP verify
│   │   │       ├── save/          # POST — auto-save submission (no emails)
│   │   │       └── submit/        # POST — save + send emails + export Excel
│   │   ├── globals.css            # Design system tokens + global styles
│   │   ├── layout.tsx             # Root layout (metadata, fonts, SEO)
│   │   └── page.tsx               # Single-page app (all sections)
│   ├── components/
│   │   └── avystra/
│   │       ├── AvystraLogo.tsx
│   │       ├── CountUp.tsx        # Animated number counter
│   │       ├── CumulativePenalty.tsx
│   │       ├── DoodleWidgets.tsx  # Squiggle + sparkle SVG decorations
│   │       ├── FAQSection.tsx
│   │       ├── Flowchart.tsx      # Four-step performance system
│   │       ├── Footer.tsx
│   │       ├── FounderFrictionSimulator.tsx
│   │       ├── FourPillars.tsx
│   │       ├── Header.tsx         # Sticky nav with scroll-spy
│   │       ├── Hero.tsx
│   │       ├── LoadingScreen.tsx  # GSAP loading animation
│   │       ├── OGIDiagnostic.tsx  # OGI assessment flow (6 screens)
│   │       ├── OGIResults.tsx     # OGI results screen (memoized)
│   │       ├── ProgramsSection.tsx
│   │       ├── ScrollProgress.tsx # Top progress bar
│   │       ├── StatsFounder.tsx
│   │       └── TestimonialsSection.tsx
│   ├── hooks/
│   │   └── useSmoothScroll.ts     # Lenis + ScrollTrigger orchestration
│   └── lib/
│       ├── db.ts                  # Prisma client singleton
│       ├── email.ts               # SMTP transport + verify + retry
│       ├── excel-export.ts        # ExcelJS export to /public
│       ├── gsap.ts                # GSAP + ScrollTrigger registration
│       ├── motion.ts              # Shared easing constants
│       ├── ogi-data.ts            # OGI questions + scoring logic
│       ├── ogi-email-templates.ts # HTML + plain-text email templates
│       ├── pageReady.tsx          # Loading-screen sync context
│       ├── rate-limit.ts          # In-memory rate limiter
│       ├── scroll.ts              # smoothScrollTo utility
│       ├── useGsapCards.ts        # Staggered card reveal hook
│       └── useGsapReveal.ts       # Scroll-triggered reveal hook
├── .zscripts/                     # Z.ai sandbox service scripts
├── Caddyfile                      # Z.ai gateway config
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Features

### OGI (Organizational Growth Index) Assessment

A 16-question self-assessment across 4 dimensions:
- **Leadership & Direction** (4 questions)
- **Manager Effectiveness** (4 questions)
- **Team Accountability** (4 questions)
- **Execution Systems** (4 questions)

**Flow:** Intro → Info Capture → Questions (with halfway nudge) → Loading → Results → Email Submission

**Scoring:** Each answer is 0-4 (Never to Always). Overall score = average of 4 pillar averages, scaled to 0-100.

**Score bands:**
| Score | Band | Color |
|-------|------|-------|
| 82-100 | High Growth Ready | Green |
| 66-81 | Growth Ready | Blue |
| 45-65 | Execution Gap | Amber |
| 0-44 | Immediate Attention | Red |

### Email Service

- **User email:** personalized result with score, insights, next steps, WhatsApp CTA
- **Owner email:** full submission data with all 16 answers in a table
- **Anti-spam:** preheader text, List-Unsubscribe header, multipart/alternative, proper Message-ID
- **Robust:** pooled transport, lazy verification, retry with exponential backoff
- **Health check:** `GET /api/ogi/health?verify=true` for live SMTP diagnostics

### Animation System

- **GSAP ScrollTrigger** for scroll-linked reveals (headings, cards, sections)
- **Motion (Framer Motion)** for component-level animations (accordion, loading screen)
- **CSS keyframes** for ambient effects (drifting orbs, marquee, pulse)
- **Lenis** for premium smooth scrolling (desktop only, native on mobile)
- **`prefers-reduced-motion`** respected everywhere — all animations disabled for accessibility

### Performance

- **Lazy loading:** all below-the-fold components are `React.lazy()` with Suspense fallbacks
- **Code splitting:** GSAP, Lenis, and heavy components load on-demand
- **GPU-composited animations:** transform/opacity only, no layout thrash
- **Pooled DB connections:** Prisma + Supabase pooler for serverless
- **Pooled SMTP connections:** Nodemailer with `pool: true` for email throughput

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ogi/health` | Email config status (instant, no network call) |
| `GET` | `/api/ogi/health?verify=true` | Live SMTP connection test |
| `POST` | `/api/ogi/save` | Auto-save submission (no emails sent) |
| `POST` | `/api/ogi/submit` | Save + send both emails + export Excel |
| `GET` | `/api/ogi/export` | Download all submissions as Excel file |
| `GET` | `/ogi-submissions.xlsx` | Same as export (rewritten in next.config.ts) |
| `POST` | `/api/admin/login` | Admin sign-in (sets a signed session cookie) |
| `POST` | `/api/admin/logout` | Clears the admin session cookie |
| `GET` | `/api/admin/submissions` | List/search/filter/sort submissions (admin only) |
| `GET` | `/api/admin/submissions/[id]` | Full submission detail (admin only) |
| `PATCH` | `/api/admin/submissions/[id]` | Update `status`/`adminNotes` (admin only) |

### Rate Limiting

- `/api/ogi/save`: 10 requests/hour per IP
- `/api/ogi/submit`: 5 requests/hour per IP
- `/api/ogi/export`: 10 requests/hour per IP
- `/api/admin/login`: locked out for 15 minutes after 8 failed attempts per IP (DB-backed — see [Admin Panel](#admin-panel))

---

## Database Schema

```prisma
model OgiSubmission {
  id          String   @id @default(cuid())
  name        String
  role        String
  contact     String
  email       String?
  score       Int
  band        String
  answersJson String
  status      String   @default("new") // new | reviewed | contacted | archived
  adminNotes  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AdminLoginAttempt {
  id          String    @id @default(cuid())
  ip          String    @unique
  attempts    Int       @default(0)
  lockedUntil DateTime?
  updatedAt   DateTime  @updatedAt
}
```

---

## Admin Panel

A protected `/admin` area for AVYSTRA staff to browse, search, filter, sort, and triage OGI submissions — update a submission's status (`new` / `reviewed` / `contacted` / `archived`) and leave internal notes.

### Setup

1. **Generate a password hash** (Argon2id — never store a plaintext password):
   ```bash
   node scripts/hash-admin-password.mjs 'your-new-password'
   ```
   This prints an `ADMIN_PASSWORD_HASH=...` line, pre-escaped for `.env` (every `$` is escaped as `\$` — Next's env loader otherwise treats unescaped `$word` sequences as variable expansion and will silently corrupt the hash). Paste it as-is.

2. **Generate a session secret** (used to sign session cookies — rotating it logs out every active session):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Set in `.env` (and in Vercel's env vars for production):
   ```env
   ADMIN_EMAIL=admin@avystra.co.in
   ADMIN_PASSWORD_HASH=\$argon2id\$v=19\$...          # from step 1, escaped
   ADMIN_SESSION_SECRET=<base64 string from step 2>
   ```

4. Apply the schema changes (adds `status`/`adminNotes`/`updatedAt` to `OgiSubmission` and the new `AdminLoginAttempt` table):
   ```bash
   npx prisma db push
   ```

5. Sign in at `/admin/login`.

To change the password later, repeat step 1 with the new password and update `ADMIN_PASSWORD_HASH`.

### How authentication works

- **Credentials**: a single admin account, defined entirely by `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env vars — no database user table. Passwords are verified with Argon2id (`hash-wasm`, WASM-based — no native binary, so it runs identically on Vercel serverless and locally).
- **Sessions**: a stateless, HMAC-SHA256-signed cookie (`avystra_admin_session`, `HttpOnly`, `Secure` in production, `SameSite=Lax`, 8-hour expiry) — no session table. Signing uses Web Crypto (`crypto.subtle`), so the same verification code runs in both the Edge proxy/middleware and Node API routes.
- **Route protection** is layered: `src/proxy.ts` (Next's middleware, gates `/admin/**` and `/api/admin/**`) → the protected layout re-checks server-side → every `/api/admin/*` route independently re-verifies the session. A gap in any one layer doesn't expose admin data.
- **Brute-force protection**: failed login attempts are tracked per IP in the `AdminLoginAttempt` table (DB-backed, not in-memory — this app runs on Vercel serverless, where in-memory state doesn't survive cold starts or scale across instances). 8 failed attempts locks that IP out for 15 minutes.
- **CSRF**: state-changing admin requests (login, logout, status/notes updates) verify the `Origin` header matches the request's own origin, in addition to `SameSite=Lax`.
- Login failures always return a generic `"Invalid credentials."` — the response never reveals whether the email or the password was wrong.

### Deployment considerations

- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` in Vercel's Production env vars — same as the database/email vars, `.env` never reaches Vercel.
- `/admin/**` and `/api/admin/**` get additional security headers (CSP, `X-Frame-Options: DENY`, etc.) scoped to just those paths — see `headers()` in `next.config.ts`.

---

## Design System

### Colors

```css
--color-gold: #B8924E;          /* Primary accent */
--color-gold-light: #D4B26A;    /* Hover state */
--color-gold-deep: #A07E3E;     /* Pressed state */
--color-navy-deep: #0B1B2E;     /* Primary background */
--color-navy-soft: #16263D;     /* Gradients, hover */
--color-cream-bg: #F7F4ED;      /* Page background */
--color-ivory: #FBF9F4;          /* Card background */
```

### Fonts

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | Inter | Body text, paragraphs |
| `font-display` | Plus Jakarta Sans | Headings, buttons, cards |
| `font-serif` | Playfair Display | Accent italic text (hero, footer wordmark) |
| `font-mono` | JetBrains Mono | Labels, numbers, badges |

### Easing

```ts
EASE = [0.16, 1, 0.3, 1]           // Expo-out — primary entrance
EASE_STANDARD = [0.4, 0, 0.2, 1]   // Material standard — toggles
EASE_SINE = [0.45, 0, 0.55, 1]     // Sine in-out — hovers
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add all 8 environment variables (see above)
4. Deploy

**Build settings:** leave default (Vercel auto-detects Next.js). The `output: "standalone"` in `next.config.ts` is already set.

### Other platforms (Netlify, Render, Railway)

- Build command: `npm run build`
- Start command: `npm run start`
- Ensure all env vars are set

### Post-deploy checklist

- [ ] Visit `/api/ogi/health?verify=true` → should return `"verified": true`
- [ ] Complete a test OGI assessment → verify both emails arrive
- [ ] Visit `/ogi-submissions.xlsx` → should download Excel with submissions
- [ ] Test on mobile → verify responsive layout
- [ ] Add DNS records on your domain for email deliverability:
  ```
  TXT  @       v=spf1 include:_spf.google.com ~all
  TXT  _dmarc  v=DMARC1; p=none; rua=mailto:info@avystra.co.in
  ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create + apply migration |
| `npm run db:reset` | Reset database (destructive) |

---

## Architecture Notes

### Loading Screen → Hero Handoff

The loading screen uses a self-contained GSAP timeline (`LoadingScreen.tsx`). When it completes, it calls `onComplete()`, which flips `pageReady` to `true` in `page.tsx`. This triggers:
1. The `.page-ready` class on `<html>` (starts hero CSS animations)
2. The page wrapper fades in (0.25s opacity transition)
3. All `useGsapReveal` hooks start observing (reveals play AFTER the loading screen, never behind it)

### `useGsapReveal` Hook

Two modes:
- `"fade"` — element lifts in as one unit (default, safe for headings with inline spans)
- `"words"` — splits text into word spans and staggers them (use only on plain text, NOT on headings with `<span>` children)

### ScrollTrigger Refresh

`page.tsx` has a `useEffect` that calls `ScrollTrigger.refresh()` after `pageReady` (via rAF + 1.5s timeout) to catch layout shifts from lazy-loaded components.

---

## License

Proprietary — AVYSTRA Consulting Private Limited. All rights reserved.

## Contact

- **Email:** info@avystra.co.in
- **Phone:** +91 85960 59607
- **Website:** https://avystra.co.in
