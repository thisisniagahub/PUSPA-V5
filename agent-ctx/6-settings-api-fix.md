# Task 6: Fix 4 medium-priority module pages with hardcoded/mockup data

## Summary
Fixed all 4 pages that had hardcoded or mockup data, replacing with real API calls using the `api` helper from `@/lib/api`.

## Changes Made

### 1. `/src/modules/compliance/page.tsx`
- **Removed**: `INITIAL_ITEMS` array (lines 125-272) containing 16 fake checklist items that were dead code — the page already fetches from `/api/v1/compliance`
- **Replaced with**: A comment noting compliance items come from the API

### 2. `/src/modules/settings/page.tsx`
- **Removed**: Hardcoded `notifSettings` array with 8 notification settings as initial state
- **Added**: 
  - Import of `api` from `@/lib/api`
  - `notifLoading` state
  - `fetchNotifSettings()` that calls `api.get('/settings')` 
  - `toggleNotif()` now does optimistic update + `api.put('/settings', { notifications })` to persist via API, with revert on error
  - Loading spinner and empty state in the notifications tab UI

### 3. `/src/modules/sedekah-jumaat/page.tsx`
- **Removed**: `INITIAL_DISTRIBUTIONS = []` constant (empty, zero API calls)
- **Added**:
  - Import of `api` from `@/lib/api`
  - `loading` state
  - `useEffect` fetch from `/api/v1/disbursements` filtering by purpose containing "jumaat"/"sedekah"/"sadaqah"
  - Fallback fetch from `/api/v1/donations` with `fundType=sadaqah` if no matching disbursements
  - API response mapping types (`DisbursementApiRecord`, `DonationApiRecord`)
  - Status mapping functions (`mapDisbursementStatus`, `mapDonationStatus`)
  - Loading state UI with spinner

### 4. `/src/modules/agihan-bulan/page.tsx`
- **Removed**: `STOCK_ITEMS` with 8 hardcoded stock items (Beras 350kg, Minyak 85 botol, etc.)
- **Removed**: `INITIAL_DISTRIBUTIONS = []` and `INITIAL_STOCK_MOVEMENTS = []`
- **Added**:
  - Import of `api` from `@/lib/api`
  - `loading` state
  - `DEFAULT_STOCK_ITEMS` with 0 stock (populated from API)
  - `useEffect` fetch from `/api/v1/disbursements` → maps to distributions
  - `useEffect` fetch from `/api/v1/donations` → computes stock levels proportionally and creates stock movements
  - Loading state UI with spinner

### 5. New API route: `/src/app/api/v1/settings/route.ts`
- **Created**: Settings API for notification preferences
- GET: Returns SecuritySettings + notification preferences for current user (auto-creates if missing)
- PUT: Updates notification preferences (stored as JSON in `notificationPrefs` field)
- Uses `requireAuth` for access control
- Default notification preferences match the original hardcoded values

### 6. Prisma schema: `prisma/schema.prisma`
- **Added**: `notificationPrefs String @default("{}")` field to SecuritySettings model for storing JSON notification toggle preferences
- Ran `bun run db:push` to sync

## Lint
All files pass `bun run lint` with zero errors.
