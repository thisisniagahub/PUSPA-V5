---
Task ID: 1-2
Agent: Main
Task: Clone and analyze PUSPA-V4 project

Work Log:
- Cloned PUSPA-V4 repository (already existed)
- Read and analyzed all key files: package.json, schema.prisma, page.tsx, layout.tsx, db.ts, auth.ts, api.ts, etc.
- Reviewed all API routes (dashboard/stats, members, cases, donations, donors, disbursements)
- Reviewed module pages (dashboard, members)
- Reviewed auth system (Supabase-based), middleware, auth-provider

Stage Summary:
- **CRITICAL ISSUE #1: PostgreSQL Schema** - Prisma schema uses `provider = "postgresql"` with `@db.Decimal(12,2)`. Won't work with SQLite.
- **CRITICAL ISSUE #2: No .env file** - No DATABASE_URL, no Supabase credentials. App cannot start.
- **CRITICAL ISSUE #3: Supabase Auth dependency** - Entire auth system depends on external Supabase service. Without Supabase credentials, login is impossible.
- **MOCK DATA in members page** - `initialMembers` array with 13 fake records used as initial state (lines 216-490 of members/page.tsx). Falls back to mock data if API fails.
- **Hardcoded dashboard widgets** - "3 Kes Menunggu", "5 Donasi Baharu" etc. are hardcoded numbers, not from API.
- **Fake SystemMetrics** - CPU/latency data in developer dashboard is entirely hardcoded.
- **API routes are REAL** - Members, cases, donations, donors, disbursements all use real Prisma queries with proper CRUD, validation, and error handling.
- **Seed data is REAL** - prisma/seed.ts has realistic seed data for 15 members, 15 cases, 20 donations, 8 programmes, etc.
- **Architecture is solid** - ViewRenderer pattern, Zustand stores, dynamic imports, proper API envelope pattern, domain normalization.
