# Task 5-a: Fix Disbursements Module Page

## Summary
Replaced all hardcoded mock data (INITIAL_DATA with 12 fake records) with real API calls to `/api/v1/disbursements`.

## Changes Made

### File: `/home/z/my-project/src/modules/disbursements/page.tsx`

**Removed:**
- `INITIAL_DATA` array (12 hardcoded disbursement records, ~200 lines)
- `CASE_OPTIONS` array (6 hardcoded case options)
- `PROGRAMME_OPTIONS` array (6 hardcoded programme options)
- `generateNo()` function (client-side number generation — API handles this)
- Unused imports: `X`, `ArrowRight`, `DialogTrigger`, `SheetTrigger`, `CardHeader`, `CardTitle`
- Form fields `linkedCase` and `linkedProgramme` from `DisbursementFormData` (these were string labels, not real IDs)

**Added:**
- `import { useEffect } from 'react'`
- `import { toast } from 'sonner'`
- `import { api } from '@/lib/api'`
- `DisbursementApiRecord` interface — matches the API response shape including related `case`, `programme`, `member` objects
- `mapDisbursementFromApi()` — maps API field names to component's expected format:
  - `disbursementNumber` → `no`
  - `recipientBank` → `bankName`
  - `recipientAcc` → `accountNumber`
  - `scheduledDate` (Date string) → `scheduledDate` (date-only string)
  - `createdAt` (Date string) → `createdAt` (date-only string)
  - `case` (object) → `linkedCase` (formatted string)
  - `programme` (object) → `linkedProgramme` (name string)
  - `disbursed` status → `completed` status (API uses 'disbursed', UI uses 'completed')
- `mapStatusToApi()` — maps UI status back to API status (`completed` → `disbursed`)
- `loadDisbursements()` async function — calls `api.get('/disbursements', { pageSize: 100 })`
- `useEffect(() => { loadDisbursements() }, [])` — loads data on mount
- `loading` state + skeleton UI
- `submitting` state + spinner on form submit button
- Toast notifications for all CRUD operations
- All mutations (`onSubmit`, `advanceStatus`, `handleRejectOrCancel`) now call the API via `api.post()`, `api.put()` and update local state from the API response
- Proper error handling with toast messages

**Changed:**
- `useState<Disbursement[]>(INITIAL_DATA)` → `useState<Disbursement[]>([])`
- `onSubmit` — now async, calls API POST/PUT, maps response back to local state
- `advanceStatus` — now async, calls API PUT with `status: mapStatusToApi(nextStatus)`
- `handleRejectOrCancel` — now async, calls API PUT with `status: mapStatusToApi(newStatus)`
- Form sends API field names: `recipientBank`, `recipientAcc` instead of `bankName`, `accountNumber`
- View sheet shows linked case/programme dynamically from API data (only shown when present)
- Removed hardcoded case/programme dropdowns from the form (were using fake string labels that don't correspond to real DB IDs)

## API Field Mapping

| API Field | Component Field |
|-----------|----------------|
| `disbursementNumber` | `no` |
| `recipientBank` | `bankName` |
| `recipientAcc` | `accountNumber` |
| `scheduledDate` (ISO) | `scheduledDate` (date-only) |
| `createdAt` (ISO) | `createdAt` (date-only) |
| `case.caseNumber + case.title` | `linkedCase` |
| `programme.name` | `linkedProgramme` |
| `disbursed` (API) | `completed` (UI) |

## Verification
- `bun run lint` passes with no errors
- Dev server compiled successfully
