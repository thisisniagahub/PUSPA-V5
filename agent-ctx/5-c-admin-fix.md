# Task 5-c: Fix Admin Module Page

## Task
Replace hardcoded mock data in `/home/z/my-project/src/modules/admin/page.tsx` with real API calls.

## Changes Made

### 1. Removed all mock data constants
- **`initialOrgProfile`** (lines 131-146): Full fake org profile with hardcoded PUSPA data
- **`initialBoardMembers`** (lines 148-240): 7 fake board members with Malay names/roles
- **`initialBankingInfo`** (lines 242-250): Full fake banking info

### 2. Added API response types
- `OrgProfileApiResponse`: Maps to OrganizationProfile Prisma model fields (legalName, tradeName, registrationType, registrationNumber, foundedDate, bankName, bankAccount, bankVerified, lhdnApprovalRef, lhdnApprovalExpiry, isTaxExempt, missionStatement, visionStatement, etc.)
- `BoardMemberApiResponse`: Maps to BoardMember Prisma model fields (id, name, title, role, appointmentDate, endDate, phone, email, photo, bio, isCurrent)

### 3. Added field mapping functions
- **`mapOrgFromApi()`**: Maps API field names to UI field names:
  - `registrationNumber` → `rosRegistrationNo`
  - `foundedDate` → `establishmentDate` (with date formatting)
  - `missionStatement` → `mission`
  - `visionStatement` → `vision`
- **`mapBankingFromApi()`**: Derives banking info from org profile:
  - `bankName` → `bankName`
  - `bankAccount` → `accountNumber`
  - `bankVerified` → `verified`
  - `lhdnApprovalRef` → `lhdnReference`
  - `lhdnApprovalExpiry` → `lhdnExpiryDate`
  - `isTaxExempt` → `taxExempt`
  - `legalName + tradeName` → `accountHolder` (derived)
- **`mapBoardMemberFromApi()`**: Maps API fields to UI:
  - `photo` → `photoUrl`
  - `role` enum → Malay label (via `API_ROLE_TO_LABEL`)
  - Date formatting for `appointmentDate` and `endDate`

### 4. Added role mapping
- **`API_ROLE_TO_LABEL`**: Maps API enum values (chairman, vice_chairman, secretary, etc.) to Malay labels (Pengerusi, Timbalan Pengerusi, Setiausaha, etc.)
- **`LABEL_TO_API_ROLE`**: Reverse mapping for form submission
- Updated `ROLE_LABELS` to use the same mapping (used by board member dialog Select)
- Updated the board member dialog Select to use Malay labels as values

### 5. Added data fetching
- **`fetchOrgProfile()`**: Calls `api.get('/organization')` - API auto-creates default profile if none exists. Also populates banking info state from same response.
- **`fetchBoardMembers()`**: Calls `api.get('/board-members')`
- **`fetchPartners()`**: Already existed, kept as-is
- All three fetch in parallel on mount via `useEffect`

### 6. Added loading states
- `orgLoading`: Shows skeleton placeholders for org profile form
- `boardLoading`: Shows skeleton placeholders for board member cards
- `partnersLoading`: Shows skeleton placeholders for partner cards (already existed)
- `bankingLoading`: Shows skeleton placeholders for banking form
- `saving`: Disables save buttons and shows spinner during API calls

### 7. Wired up save handlers to real API
- **`handleSaveOrg()`**: Calls `api.put('/organization', ...)` with mapped field names
- **`handleSaveBoardMember()`**: 
  - Edit: Calls `api.put('/board-members', { id, ...payload })` 
  - Create: Calls `api.post('/board-members', payload)`
  - Maps Malay role label back to API enum for submission
  - Updates local state from API response
- **`handleSaveBanking()`**: Calls `api.put('/organization', ...)` with banking fields (bankName, bankAccount, bankVerified, lhdnApprovalRef, lhdnApprovalExpiry, isTaxExempt)
- **`confirmDelete()`**: Now calls `api.delete('/board-members', { id })` for board member deletions (was previously just removing from local state without API call)
- All save handlers show error toasts on failure

### 8. Added empty states
- Board members tab shows "Tiada ahli lembaga" when no members exist
- Partners tab shows "Tiada rakan kongsi" when no partners exist

### 9. Minor UI improvements
- Replaced unused `User` icon import with `Loader2` for loading spinners
- Removed unused `DialogTrigger` import
- Added `Skeleton` component import for loading placeholders
- Save buttons show `Loader2` spinner while saving
- Added banking success message to `SUCCESS_MESSAGES`

## APIs Used
- `GET /api/v1/organization` - Auto-creates default profile if none exists
- `PUT /api/v1/organization` - Updates org profile (including banking fields)
- `GET /api/v1/board-members` - Lists board members
- `POST /api/v1/board-members` - Creates board member
- `PUT /api/v1/board-members` - Updates board member
- `DELETE /api/v1/board-members?id=xxx` - Deletes board member
- `GET /api/v1/partners` - Lists partners (already working)
- `POST /api/v1/partners` - Creates partner (already working)
- `PUT /api/v1/partners` - Updates partner (already working)
- `DELETE /api/v1/partners?id=xxx` - Deletes partner (already working)
