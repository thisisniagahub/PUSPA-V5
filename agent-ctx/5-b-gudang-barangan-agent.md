# Task 5-b: Fix Gudang Barangan Module — Replace Hardcoded Data with Real API Calls

**Agent**: Main
**Date**: 2025-03-05

## Task Description
Fix the `gudang-barangan` (warehouse/inventory) module page that had entirely hardcoded mock data (4 inventory items, 3 donations, 2 distributions, ZERO API calls). Redesign it to use real API data from existing endpoints.

## Changes Made

### File: `/home/z/my-project/src/modules/gudang-barangan/page.tsx`

**Before**: 
- Hardcoded `inventory` array (4 items), `donations` array (3 items), `distributions` array (2 items)
- Stats computed from hardcoded arrays
- No API calls, no loading states, no error handling

**After**:
- Fetches real donations from `/api/v1/donations` via `api.getEnvelope`
- Fetches real disbursements from `/api/v1/disbursements` via `api.getEnvelope`
- Stats computed from real API data:
  - **Barangan Masuk**: Count of confirmed donations + total value
  - **Diagihkan**: Count of disbursed disbursements + total value
  - **Baki Inventori**: Balance (total in - total out) in currency
  - **Menunggu Pengesahan**: Count of pending donations
- Added loading state with spinner
- Added error state with retry button
- Tabs redesigned:
  - **Ringkasan**: Fund type breakdown from confirmed donations + recent activity feed from both donations and disbursements
  - **Barangan Masuk**: Real donation records table (was "Terima Barang")
  - **Inventori**: Confirmed donations filtered as "available stock" with search
  - **Barangan Keluar**: Real disbursement records table (was "Agihan & Jualan")
- Preserved same visual style (emerald theme, cards, tabs, tables, dark mode support)

### Data Mapping
| Original Mock Concept | Real Data Source |
|---|---|
| `donations` (3 items) | `GET /api/v1/donations` — confirmed donations represent incoming goods |
| `distributions` (2 items) | `GET /api/v1/disbursements` — disbursed records represent outgoing goods |
| `inventory` (4 items) | Derived: confirmed donations available for distribution |
| Stats (hardcoded counts) | Computed from real API data |

### Technical Details
- Uses `api.getEnvelope` from `@/lib/api` (same pattern as donations module)
- Parallel fetching of both endpoints with `Promise.all`
- Proper TypeScript types for API responses (`ApiDonation`, `ApiDisbursement`)
- Helper functions for status badges, currency formatting, date formatting
- Responsive design maintained
- Lint: PASSED (0 errors)
