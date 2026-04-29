# Task 3: Complete PostgreSQL Prisma Schema Migration for PUSPA NGO

**Agent**: Prisma Schema Agent  
**Date**: 2026-03-05  
**Status**: COMPLETED

## Summary

Migrated the entire Prisma schema from SQLite to PostgreSQL (Supabase) with comprehensive improvements including 35 enums, proper relations, cascade deletes, indexes, soft delete, Decimal money fields, UUIDs, and Supabase Auth integration.

## Changes Made

### 1. Datasource Change
- Changed provider from `sqlite` to `postgresql`
- Added `directUrl = env("DIRECT_URL")` for Supabase direct connections

### 2. Created 35 Enums
- UserRole, MemberStatus, MaritalStatus, ProgrammeCategory, ProgrammeStatus
- CaseStatus (12 states), CasePriority, CaseCategory
- DonationStatus, DonationMethod, FundType, ZakatCategory
- DisbursementStatus, ActivityType, ActivityStatus
- PartnerType, VerificationStatus, DonorSegment, DonorStatus
- CommunicationType, CommunicationStatus, VolunteerStatus, VolunteerAvailability
- DeploymentStatus, HourLogStatus, EKYCStatus, RiskLevel
- NotificationType, SecurityLogStatus, BoardMemberRole
- DocumentCategory, DocumentStatus, RegistrationType
- HermesMessageRole, HermesSkillSource, HermesMemoryCategory, HermesMemorySource, HermesProvider

### 3. Fixed Missing Relations
- Donation.caseId → Case (with Case.donations back-relation)
- Donation.donorId → NEW field → Donor (with Donor.donations back-relation)
- CaseNote.authorId → User (with User.caseNotes back-relation)
- CaseDocument.uploadedBy → renamed to uploadedById → User (with User.caseDocuments back-relation)
- Disbursement.approvedBy → renamed to approvedById → User (with User.disbursementsApproved back-relation)
- EKYCVerification.verifiedBy → renamed to verifiedById → User (with User.eKYCVerifications back-relation)
- DonorCommunication.sentBy → renamed to sentById → User (with User.donorCommunications back-relation)
- Capture.userId → User (with User.captures back-relation)
- HermesConversation.userId → User (with User.hermesConversations back-relation)
- HermesSkill.userId → User (with User.hermesSkills back-relation)
- HermesProviderConfig.userId → User (with User.hermesProviderConfig back-relation)
- VolunteerDeployment.activityId → Activity (with Activity.volunteerDeployments back-relation)
- VolunteerHourLog.deploymentId → VolunteerDeployment (with VolunteerDeployment.hourLogs back-relation)
- TaxReceipt.donationId → Donation (with Donation.taxReceipts back-relation)

### 4. Added Cascade Deletes
- Activity.programmeId → onDelete: Cascade
- Case.programmeId → onDelete: SetNull
- Case.creatorId → onDelete: Restrict
- Disbursement.programmeId → onDelete: SetNull
- Disbursement.caseId → onDelete: SetNull
- Disbursement.memberId → onDelete: SetNull
- Donation.programmeId → onDelete: SetNull
- Donation.caseId → onDelete: SetNull
- Donation.donorId → onDelete: SetNull
- VolunteerDeployment.programmeId → onDelete: SetNull
- VolunteerDeployment.activityId → onDelete: Cascade
- AuditLog.userId → onDelete: SetNull
- Notification.userId → onDelete: Cascade
- DeviceBinding.userId → onDelete: Cascade
- SecurityLog.userId → onDelete: SetNull
- SecuritySettings.userId → onDelete: Cascade
- EKYCVerification.memberId → onDelete: Cascade
- TaxReceipt.donorId → onDelete: Cascade
- TaxReceipt.donationId → onDelete: SetNull
- HermesProviderConfig.userId → onDelete: Cascade

### 5. Added Missing Indexes
- Donation: donatedAt, method, donorIC, donorEmail, donorPhone, programmeId, caseId, donorId
- Disbursement: programmeId, caseId, memberId, processedDate
- Activity: programmeId
- Case: programmeId, creatorId, assigneeId, createdAt
- AuditLog: userId, entity, createdAt
- Notification: userId (explicit)
- SecurityLog: userId, createdAt
- Donor: email, ic, phone
- DonorCommunication: type

### 6. Added Soft Delete Support
Added `deletedAt DateTime?` to: User, Member, Case, Donation, Disbursement, Programme, Volunteer, Donor, Partner, Branch

### 7. Fixed User.role Default
Changed from `@default("ops")` to `@default(staff)` using UserRole enum

### 8. Converted Float Money Fields to Decimal
- Member.monthlyIncome → Decimal @db.Decimal(12, 2)
- HouseholdMember.income → Decimal @db.Decimal(12, 2)
- Programme.budget → Decimal @db.Decimal(12, 2)
- Programme.totalSpent → Decimal @db.Decimal(12, 2)
- Case.amount → Decimal @db.Decimal(12, 2)
- Donation.amount → Decimal @db.Decimal(12, 2)
- Disbursement.amount → Decimal @db.Decimal(12, 2)
- Donor.totalDonated → Decimal @db.Decimal(12, 2)
- TaxReceipt.amount → Decimal @db.Decimal(12, 2)

Kept Float for: verificationScore, welfareScore, livenessScore, faceMatchScore, totalHours, successRate, confidence, walletLimit, previousLimit

### 9. Changed @default(cuid()) to @default(uuid())
Applied to ALL 35 models for Supabase UUID compatibility

### 10. Added supabaseId to User
Added `supabaseId String? @unique` field for linking to Supabase Auth

## Total Models: 35
## Total Enums: 35
## Total Fields Changed: 100+
