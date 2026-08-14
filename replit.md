# SoleaPay / PowerAdd

## Project Overview
Full-stack investment and payments platform. Express + TypeScript backend, React + Vite frontend, PostgreSQL (Supabase) via Drizzle ORM, Passport.js session auth, NowPayments crypto integration.

## Stack
- **Backend**: Express 5, TypeScript, Passport.js (local strategy), Drizzle ORM
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, TanStack Query, Wouter
- **Database**: PostgreSQL via Supabase (pooler connection)
- **Payments**: NowPayments (crypto)

## Running the app
```bash
npm run dev       # development (port 5000)
npm run build     # production build
npm start         # serve production build
npm run db:push   # push schema to database
```

## Required Secrets
- `SUPABASE_DATABASE_URL` — Supabase PostgreSQL pooler connection string
- `SESSION_SECRET` — express-session secret

## Environment Variables
- `PORT` — defaults to 5000
- `APP_URL` — public URL (set in development env)

## Notes
- The seed script runs on every startup and is idempotent (preserves existing data)
- Production deployment targets Plesk (nginx reverse proxy + Passenger)
- See `.agents/memory/` for architecture decisions and known quirks

## User Preferences
