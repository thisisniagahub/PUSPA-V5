# Task 5-d: Fix Reports Module Page

## Summary
Replaced all hardcoded mock data in the FinancialImpakTab component of the reports page with live API data from `/api/v1/reports`.

## Changes Made

### File: `/home/z/my-project/src/modules/reports/page.tsx`

#### 1. Removed Hardcoded Mock Data (lines 281-345)
- **Removed** `incomeByFundData` (5 hardcoded items with amounts and colors)
- **Removed** `expenditureByProgrammeData` (8 hardcoded programme budget items)
- **Removed** `incomeVsExpenditureData` (12 months of fake monthly trend data)
- **Removed** `impactMetrics` (8 fake verified metrics with hardcoded values)
- **Removed** `monthlyOptions`, `quarterlyOptions`, `yearlyOptions` (unused after removing period selector)
- **Removed** old `ImpactMetric` interface (with `metrik`, `nilaiLaporSendiri`, etc.)

#### 2. Added API Types (replacing mock data section)
- **Added** `ImpactMetricRow` interface matching API response shape (`metricName`, `selfReportedValue`, `verifiedValue`, `verificationSource`, `programme`, etc.)
- **Added** `getVerificationStatus()` helper function to derive verification status dynamically from API data:
  - `verifiedValue` exists → 'Disahkan'
  - `selfReportedValue` exists but no `verifiedValue` → 'Lapor Sendiri'
  - Otherwise → 'Belum Disahkan'
- **Added** `ReportsData` interface matching `/api/v1/reports` response shape (summary, incomeByFundType, expenditureByProgramme, monthlyTrend, impactMetrics, programmeBudgets, etc.)

#### 3. Rewrote `FinancialImpakTab` Component
- **Added** `useState` for `data` (ReportsData) and `loading` state
- **Added** `useCallback` + `useEffect` to fetch data from `/api/v1/reports` on mount
- **Added** `useMemo` for derived chart data:
  - `incomeByFundData` → from `data.incomeByFundType` (mapped with ISF_LABELS and ISF_COLORS)
  - `incomeVsExpenditureData` → from `data.monthlyTrend` (mapped month/income/expenditure → month/pendapatan/perbelanjaan)
  - `programmeBudgetData` → from `data.programmeBudgets` (mapped name/totalSpent/budget → programme/spent/budget)
- **Replaced** static calculations with dynamic ones from API data:
  - `totalIncome` → `data.summary.totalIncome`
  - `totalExpenditure` → `data.summary.totalExpenditure`
  - `netBalance` → calculated from API summary
  - `verificationLevel` → calculated from API impact metrics
  - `budgetUtilization` → calculated from API programme budgets
- **Removed** the Period Selector card (was cosmetic-only with hardcoded options; Tab 2 already has functional period selector)
- **Added** proper loading skeleton state (4 stat cards + 2 chart placeholders + programme + table)
- **Added** empty state with retry button when API returns no data
- **Added** empty-state messages for charts/tables when no data items exist
- **Updated** Impact Metrics Table to show API-driven data:
  - Added "Program" column (from `metric.programme`)
  - Updated column headers and data bindings
  - Status derived dynamically via `getVerificationStatus()`

#### 4. Kept Intact
- All formatting helpers (`formatRinggit`, `formatDate`, `formatDateTime`)
- `StatusBadge`, `RinggitTooltip`, `CountTooltip` components
- `StatCard`, `LoadingCards` components
- `ISF_COLORS` and `ISF_LABELS` constants (used by both Tab 1 and Tab 2)
- `FinancialSummaryTab` (Tab 2) - already uses `/api/v1/reports/financial`
- `AuditTrailTab` (Tab 3) - already uses `/api/v1/audit`
- `ROSComplianceTab` (Tab 4) - already uses `/api/v1/compliance/ros`
- `PDPAComplianceTab` (Tab 5) - already uses `/api/v1/compliance/pdpa`
- `BranchManagementTab` (Tab 6) - already uses `/api/v1/branches`
- `ReportsPage` main component with tab navigation

## API Used
- **`GET /api/v1/reports`** - Returns: summary, incomeByFundType, expenditureByProgramme, monthlyTrend, impactMetrics, casesByStatus, membersByStatus, programmeBudgets
  - This API was already fully functional with real Prisma queries

## Lint Result
- ESLint passed with no errors
