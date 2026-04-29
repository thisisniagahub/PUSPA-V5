# Worklog — Task 3: Fix Cases Page Dropdowns with API-Fetched Data

**Date:** 2025-03-04
**Task ID:** 3
**Agent:** main

## Summary

Replaced hardcoded `PROGRAMMES` and `MEMBERS` dropdown arrays in the Cases page with API-fetched data from `/api/v1/programmes` and `/api/v1/members`.

## Changes Made

### File: `/home/z/my-project/src/modules/cases/page.tsx`

1. **Removed hardcoded arrays** (formerly lines 321-335):
   - Removed `PROGRAMMES` array with 5 hardcoded programme entries
   - Removed `MEMBERS` array with 5 hardcoded member entries

2. **Added new types** (lines 321-337):
   - `ProgrammeOption` interface: `{ id, name, category? }`
   - `MemberOption` interface: `{ id, name, memberNumber?, ic?, phone?, address?, monthlyIncome?, householdSize? }`

3. **Updated `CaseFormDialog` component** (line 797):
   - Added `programmes: ProgrammeOption[]` and `members: MemberOption[]` props
   - Replaced `PROGRAMMES.map(...)` with `programmes.map(...)` in the "Pautan Program" dropdown
   - Replaced `MEMBERS.map(...)` with `members.map(...)` in the "Pautan Ahli" dropdown
   - Added empty-state fallback: "Tiada program tersedia" / "Tiada ahli tersedia" when lists are empty
   - Enhanced member display: shows `name (memberNumber)` when memberNumber is available

4. **Updated `CaseDetailSheet` component** (line 1226):
   - Added `programmes: ProgrammeOption[]` and `members: MemberOption[]` props
   - Replaced `PROGRAMMES.find(...)` with `programmes.find(...)` for programme lookup
   - Replaced `MEMBERS.find(...)` with `members.find(...)` for member lookup
   - Replaced `MEMBERS` with `members` in `computeRiskFlags` call
   - Added `members` to `useMemo` dependency array for risk flags

5. **Updated `CasesPage` main component** (line 1756):
   - Added `programmes` and `members` state with `useState<ProgrammeOption[]>([])` and `useState<MemberOption[]>([])`
   - Added `fetchDropdownOptions` callback that fetches from `/programmes` and `/members` (pageSize=100) in parallel via `Promise.all`
   - Added `fetchDropdownOptions()` call in the existing `useEffect` alongside `fetchCases()`
   - Passed `programmes` and `members` props to both `<CaseFormDialog>` and `<CaseDetailSheet>`

## Technical Details

- Uses `api.get()` from `@/lib/api` which unwraps the `{ success, data }` envelope
- API returns programme objects with `id`, `name`, `category`, etc.
- API returns member objects with `id`, `name`, `memberNumber`, `ic`, etc.
- Members endpoint supports `pageSize` query param; using `pageSize: 100` to get more members
- Fetch failures for dropdown data are silently caught (dropdowns will just be empty)
- The existing `api` helper from `@/lib/api` is used consistently

## Verification

- Lint check passes with no errors
- No remaining references to hardcoded `PROGRAMMES` or `MEMBERS` constants
- Dev server starts successfully
