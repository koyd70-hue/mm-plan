# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx prisma migrate dev   # Run DB migrations
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed sample data
npx prisma studio        # Visual DB browser
```

## Architecture

Next.js 15 App Router (TypeScript) full-stack app for managing monthly MM (Man-Month) plans.

**Scope**: Fiscal year April 2026 - March 2027. Teams/Members/Products with MM values in 0.01 decimal units.

### Key Data Flow
- `MMPlan` table holds the live/current plan data (unique per member+product+yearMonth)
- `MMPlanSnapshot` captures point-in-time copies when snapshots are created (manually or via cron)
- Comparison = current month's `MMPlan` vs previous month's `MMPlan` directly (month-to-month comparison)

### Pages
- `/` — Dashboard with quick links
- `/plan` — Spreadsheet-like grid for MM input (auto-save with 500ms debounce)
- `/comparison` — Month-over-month diff view with color-coded deltas
- `/settings` — CRUD for Teams, Members, Products, Email Recipients

### API Routes
All under `src/app/api/`. CRUD pattern for master data (`teams`, `members`, `products`, `email/recipients`). Plan-specific: `plans` (GET/POST), `plans/snapshot` (GET/POST), `comparison` (GET).

### Core Business Logic
- `src/lib/snapshot.ts` — `createSnapshot()` copies all MMPlan → MMPlanSnapshot; `getComparison()` computes deltas
- `src/lib/email-template.ts` — Builds inline-CSS HTML email with team-grouped grid and delta highlighting
- `src/lib/cron.ts` — node-cron runs on 15th of each month at 09:00 → creates snapshot → sends email
- `src/instrumentation.ts` — Registers cron on server startup

### Stack
- DB: PostgreSQL via Prisma ORM (`prisma/schema.prisma`) — Vercel Postgres for production
- Email: Nodemailer + Gmail SMTP (env vars: `GMAIL_USER`, `GMAIL_APP_PASSWORD`)
- UI: Tailwind CSS v4
- Cron: Vercel Cron Jobs (`vercel.json`) — 매월 15일 09:00 `/api/cron` GET 호출
- Cron endpoint `/api/cron` is protected by `CRON_SECRET` Bearer token

### Deployment
- Vercel에 배포 (Next.js native support)
- DB: Vercel Postgres (또는 Neon/Supabase PostgreSQL)
- `vercel.json`에 cron 스케줄 정의
