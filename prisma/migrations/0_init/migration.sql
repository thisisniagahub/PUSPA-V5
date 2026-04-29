warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('staff', 'admin', 'developer');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed');

-- CreateEnum
CREATE TYPE "ProgrammeCategory" AS ENUM ('food_aid', 'education', 'skills_training', 'healthcare', 'financial_assistance', 'community', 'emergency_relief', 'dawah');

-- CreateEnum
CREATE TYPE "ProgrammeStatus" AS ENUM ('planned', 'active', 'completed', 'suspended');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('draft', 'submitted', 'verifying', 'verified', 'scoring', 'scored', 'approved', 'disbursing', 'disbursed', 'follow_up', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('urgent', 'high', 'normal', 'low');

-- CreateEnum
CREATE TYPE "CaseCategory" AS ENUM ('zakat', 'sedekah', 'wakaf', 'infak', 'government_aid');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('cash', 'bank_transfer', 'online', 'cheque', 'ewallet');

-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('zakat', 'sadaqah', 'waqf', 'infaq', 'donation_general');

-- CreateEnum
CREATE TYPE "ZakatCategory" AS ENUM ('fitrah', 'harta', 'pendapatan', 'perniagaan');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('pending', 'approved', 'processing', 'disbursed', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('event', 'meeting', 'training', 'outreach', 'fundraiser', 'volunteer', 'audit', 'visit', 'other');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('government', 'corporate', 'ngo', 'foundation', 'masjid', 'individual');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('claimed', 'partner_confirmed', 'publicly_verified');

-- CreateEnum
CREATE TYPE "DonorSegment" AS ENUM ('major', 'regular', 'occasional', 'lapsed');

-- CreateEnum
CREATE TYPE "DonorStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('email', 'phone', 'whatsapp');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('sent', 'draft', 'failed');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "VolunteerAvailability" AS ENUM ('weekday', 'weekend', 'anytime');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('assigned', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "HourLogStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "EKYCStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'error', 'success');

-- CreateEnum
CREATE TYPE "SecurityLogStatus" AS ENUM ('success', 'failed');

-- CreateEnum
CREATE TYPE "BoardMemberRole" AS ENUM ('chairman', 'vice_chairman', 'secretary', 'deputy_secretary', 'treasurer', 'committee_member', 'adviser', 'trustee', 'other');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('pendaftaran', 'tadbir_urus', 'kewangan', 'pematuhan', 'operasi', 'program');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('pertubuhan', 'syarikat', 'yayasan');

-- CreateEnum
CREATE TYPE "HermesMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "HermesSkillSource" AS ENUM ('auto', 'manual', 'imported');

-- CreateEnum
CREATE TYPE "HermesMemoryCategory" AS ENUM ('preference', 'fact', 'procedure', 'context', 'general');

-- CreateEnum
CREATE TYPE "HermesMemorySource" AS ENUM ('conversation', 'manual', 'skill');

-- CreateEnum
CREATE TYPE "HermesProvider" AS ENUM ('zai', 'openrouter', 'ollama');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'staff',
    "avatar" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ic" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "householdSize" INTEGER NOT NULL DEFAULT 1,
    "monthlyIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'single',
    "occupation" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "age" INTEGER,
    "occupation" TEXT,
    "income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isOKU" BOOLEAN NOT NULL DEFAULT false,
    "isStudent" BOOLEAN NOT NULL DEFAULT false,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProgrammeCategory" NOT NULL,
    "status" "ProgrammeStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "targetBeneficiaries" INTEGER,
    "actualBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "partners" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'draft',
    "priority" "CasePriority" NOT NULL DEFAULT 'normal',
    "category" "CaseCategory" NOT NULL DEFAULT 'zakat',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "applicantName" TEXT,
    "applicantIC" TEXT,
    "applicantPhone" TEXT,
    "applicantAddress" TEXT,
    "memberId" TEXT,
    "programmeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "verificationScore" DOUBLE PRECISION DEFAULT 0,
    "welfareScore" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'document',
    "url" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donationNumber" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorIC" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'pending',
    "method" "DonationMethod" NOT NULL DEFAULT 'cash',
    "channel" TEXT,
    "fundType" "FundType" NOT NULL DEFAULT 'donation_general',
    "zakatCategory" "ZakatCategory",
    "zakatAuthority" TEXT,
    "shariahCompliant" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "receiptNumber" TEXT,
    "programmeId" TEXT,
    "caseId" TEXT,
    "donorId" TEXT,
    "notes" TEXT,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL,
    "disbursementNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'pending',
    "recipientName" TEXT NOT NULL,
    "recipientIC" TEXT,
    "recipientBank" TEXT,
    "recipientAcc" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "processedDate" TIMESTAMP(3),
    "receiptUrl" TEXT,
    "notes" TEXT,
    "approvedById" TEXT,
    "caseId" TEXT,
    "programmeId" TEXT,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'other',
    "status" "ActivityStatus" NOT NULL DEFAULT 'planned',
    "date" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "programmeId" TEXT,
    "assignees" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "registrationType" "RegistrationType" NOT NULL DEFAULT 'pertubuhan',
    "registrationNumber" TEXT,
    "foundedDate" TIMESTAMP(3),
    "registeredAddress" TEXT,
    "operatingAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "lhdnApprovalRef" TEXT,
    "lhdnApprovalExpiry" TIMESTAMP(3),
    "isTaxExempt" BOOLEAN NOT NULL DEFAULT false,
    "rosCertificateUrl" TEXT,
    "constitutionUrl" TEXT,
    "logoUrl" TEXT,
    "missionStatement" TEXT,
    "visionStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" "BoardMemberRole" NOT NULL,
    "appointmentDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "bio" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'ngo',
    "relationship" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "verifiedStatus" "VerificationStatus" NOT NULL DEFAULT 'claimed',
    "verificationUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetric" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "description" TEXT,
    "selfReportedValue" DOUBLE PRECISION,
    "verifiedValue" DOUBLE PRECISION,
    "verificationSource" TEXT,
    "verificationDate" TIMESTAMP(3),
    "verificationUrl" TEXT,
    "methodology" TEXT,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "period" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceChecklist" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EKYCVerification" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "icFrontUrl" TEXT,
    "icBackUrl" TEXT,
    "icName" TEXT,
    "icNumber" TEXT,
    "icAddress" TEXT,
    "icDateOfBirth" TIMESTAMP(3),
    "icGender" TEXT,
    "selfieUrl" TEXT,
    "livenessScore" DOUBLE PRECISION,
    "livenessMethod" TEXT,
    "faceMatchScore" DOUBLE PRECISION,
    "status" "EKYCStatus" NOT NULL DEFAULT 'pending',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "bnmCompliant" BOOLEAN NOT NULL DEFAULT false,
    "amlaScreening" TEXT,
    "riskLevel" "RiskLevel",
    "screeningNotes" TEXT,
    "walletEnabled" BOOLEAN NOT NULL DEFAULT false,
    "walletLimit" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "previousLimit" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "limitUpgradedAt" TIMESTAMP(3),
    "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EKYCVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "biometricTransactions" BOOLEAN NOT NULL DEFAULT false,
    "boundDeviceOnly" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceBinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "deviceFingerprint" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "method" TEXT,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "SecurityLogStatus" NOT NULL DEFAULT 'success',
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volunteer" (
    "id" TEXT NOT NULL,
    "volunteerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ic" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "occupation" TEXT,
    "skills" TEXT,
    "availability" "VolunteerAvailability",
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Volunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerDeployment" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "programmeId" TEXT,
    "activityId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'assigned',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerHourLog" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "activity" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "HourLogStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerHourLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerCertificate" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "donorNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ic" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "segment" "DonorSegment" NOT NULL DEFAULT 'occasional',
    "preferredContact" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "totalDonated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "donationCount" INTEGER NOT NULL DEFAULT 0,
    "firstDonationAt" TIMESTAMP(3),
    "lastDonationAt" TIMESTAMP(3),
    "status" "DonorStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorCommunication" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donationId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "donationDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Sumbangan amal kepada PUSPA',
    "lhdnRef" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "subcategory" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "fileUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "uploadedBy" TEXT,
    "expiryDate" TIMESTAMP(3),
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "headName" TEXT,
    "headPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "workItemNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "project" TEXT NOT NULL DEFAULT 'PUSPA',
    "domain" TEXT NOT NULL,
    "sourceChannel" TEXT NOT NULL DEFAULT 'conductor',
    "requestText" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "currentStep" TEXT,
    "nextAction" TEXT,
    "blockerReason" TEXT,
    "resolutionSummary" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionEvent" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "toolName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "latencyMs" INTEGER,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "pathOrRef" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'one_time',
    "expr" TEXT,
    "tz" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "domain" TEXT NOT NULL DEFAULT 'general',
    "relatedProject" TEXT NOT NULL DEFAULT 'PUSPA',
    "workItemId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastResult" TEXT,
    "failureState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'bot',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HermesConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sesi Baru',
    "viewContext" TEXT NOT NULL DEFAULT 'dashboard',
    "provider" "HermesProvider" NOT NULL DEFAULT 'zai',
    "model" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HermesConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HermesMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "HermesMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "toolResults" TEXT,
    "model" TEXT,
    "provider" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HermesMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HermesSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "instructions" TEXT NOT NULL,
    "triggerPatterns" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "HermesSkillSource" NOT NULL DEFAULT 'auto',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HermesSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HermesMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "HermesMemoryCategory" NOT NULL DEFAULT 'general',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" "HermesMemorySource" NOT NULL DEFAULT 'conversation',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessed" TIMESTAMP(3),

    CONSTRAINT "HermesMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HermesProviderConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "HermesProvider" NOT NULL DEFAULT 'zai',
    "model" TEXT NOT NULL DEFAULT 'default',
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HermesProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_ic_key" ON "Member"("ic");

-- CreateIndex
CREATE INDEX "Member_memberNumber_idx" ON "Member"("memberNumber");

-- CreateIndex
CREATE INDEX "Member_ic_idx" ON "Member"("ic");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_caseNumber_idx" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_memberId_idx" ON "Case"("memberId");

-- CreateIndex
CREATE INDEX "Case_programmeId_idx" ON "Case"("programmeId");

-- CreateIndex
CREATE INDEX "Case_creatorId_idx" ON "Case"("creatorId");

-- CreateIndex
CREATE INDEX "Case_assigneeId_idx" ON "Case"("assigneeId");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_donationNumber_key" ON "Donation"("donationNumber");

-- CreateIndex
CREATE INDEX "Donation_fundType_idx" ON "Donation"("fundType");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_donatedAt_idx" ON "Donation"("donatedAt");

-- CreateIndex
CREATE INDEX "Donation_method_idx" ON "Donation"("method");

-- CreateIndex
CREATE INDEX "Donation_donorIC_idx" ON "Donation"("donorIC");

-- CreateIndex
CREATE INDEX "Donation_donorEmail_idx" ON "Donation"("donorEmail");

-- CreateIndex
CREATE INDEX "Donation_donorPhone_idx" ON "Donation"("donorPhone");

-- CreateIndex
CREATE INDEX "Donation_programmeId_idx" ON "Donation"("programmeId");

-- CreateIndex
CREATE INDEX "Donation_caseId_idx" ON "Donation"("caseId");

-- CreateIndex
CREATE INDEX "Donation_donorId_idx" ON "Donation"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "Disbursement_disbursementNumber_key" ON "Disbursement"("disbursementNumber");

-- CreateIndex
CREATE INDEX "Disbursement_status_idx" ON "Disbursement"("status");

-- CreateIndex
CREATE INDEX "Disbursement_programmeId_idx" ON "Disbursement"("programmeId");

-- CreateIndex
CREATE INDEX "Disbursement_caseId_idx" ON "Disbursement"("caseId");

-- CreateIndex
CREATE INDEX "Disbursement_memberId_idx" ON "Disbursement"("memberId");

-- CreateIndex
CREATE INDEX "Disbursement_processedDate_idx" ON "Disbursement"("processedDate");

-- CreateIndex
CREATE INDEX "Activity_programmeId_idx" ON "Activity"("programmeId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EKYCVerification_memberId_key" ON "EKYCVerification"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "SecuritySettings_userId_key" ON "SecuritySettings"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_volunteerNumber_key" ON "Volunteer"("volunteerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_ic_key" ON "Volunteer"("ic");

-- CreateIndex
CREATE INDEX "Volunteer_status_idx" ON "Volunteer"("status");

-- CreateIndex
CREATE INDEX "Volunteer_volunteerNumber_idx" ON "Volunteer"("volunteerNumber");

-- CreateIndex
CREATE INDEX "VolunteerDeployment_volunteerId_idx" ON "VolunteerDeployment"("volunteerId");

-- CreateIndex
CREATE INDEX "VolunteerDeployment_status_idx" ON "VolunteerDeployment"("status");

-- CreateIndex
CREATE INDEX "VolunteerHourLog_volunteerId_idx" ON "VolunteerHourLog"("volunteerId");

-- CreateIndex
CREATE INDEX "VolunteerHourLog_status_idx" ON "VolunteerHourLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerCertificate_certificateNumber_key" ON "VolunteerCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Donor_donorNumber_key" ON "Donor"("donorNumber");

-- CreateIndex
CREATE INDEX "Donor_segment_idx" ON "Donor"("segment");

-- CreateIndex
CREATE INDEX "Donor_status_idx" ON "Donor"("status");

-- CreateIndex
CREATE INDEX "Donor_email_idx" ON "Donor"("email");

-- CreateIndex
CREATE INDEX "Donor_ic_idx" ON "Donor"("ic");

-- CreateIndex
CREATE INDEX "Donor_phone_idx" ON "Donor"("phone");

-- CreateIndex
CREATE INDEX "DonorCommunication_donorId_idx" ON "DonorCommunication"("donorId");

-- CreateIndex
CREATE INDEX "DonorCommunication_type_idx" ON "DonorCommunication"("type");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReceipt_receiptNumber_key" ON "TaxReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "TaxReceipt_donorId_idx" ON "TaxReceipt"("donorId");

-- CreateIndex
CREATE INDEX "TaxReceipt_receiptNumber_idx" ON "TaxReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_workItemNumber_key" ON "WorkItem"("workItemNumber");

-- CreateIndex
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");

-- CreateIndex
CREATE INDEX "WorkItem_domain_idx" ON "WorkItem"("domain");

-- CreateIndex
CREATE INDEX "WorkItem_intent_idx" ON "WorkItem"("intent");

-- CreateIndex
CREATE INDEX "WorkItem_createdAt_idx" ON "WorkItem"("createdAt");

-- CreateIndex
CREATE INDEX "ExecutionEvent_workItemId_idx" ON "ExecutionEvent"("workItemId");

-- CreateIndex
CREATE INDEX "ExecutionEvent_type_idx" ON "ExecutionEvent"("type");

-- CreateIndex
CREATE INDEX "ExecutionEvent_createdAt_idx" ON "ExecutionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Artifact_workItemId_idx" ON "Artifact"("workItemId");

-- CreateIndex
CREATE INDEX "Artifact_type_idx" ON "Artifact"("type");

-- CreateIndex
CREATE INDEX "AutomationJob_isEnabled_idx" ON "AutomationJob"("isEnabled");

-- CreateIndex
CREATE INDEX "AutomationJob_nextRunAt_idx" ON "AutomationJob"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "BotApiKey_key_key" ON "BotApiKey"("key");

-- CreateIndex
CREATE INDEX "BotApiKey_keyPrefix_idx" ON "BotApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "BotApiKey_isActive_idx" ON "BotApiKey"("isActive");

-- CreateIndex
CREATE INDEX "HermesConversation_userId_idx" ON "HermesConversation"("userId");

-- CreateIndex
CREATE INDEX "HermesConversation_updatedAt_idx" ON "HermesConversation"("updatedAt");

-- CreateIndex
CREATE INDEX "HermesMessage_conversationId_idx" ON "HermesMessage"("conversationId");

-- CreateIndex
CREATE INDEX "HermesMessage_createdAt_idx" ON "HermesMessage"("createdAt");

-- CreateIndex
CREATE INDEX "HermesSkill_name_idx" ON "HermesSkill"("name");

-- CreateIndex
CREATE INDEX "HermesSkill_category_idx" ON "HermesSkill"("category");

-- CreateIndex
CREATE INDEX "HermesSkill_isActive_idx" ON "HermesSkill"("isActive");

-- CreateIndex
CREATE INDEX "HermesSkill_userId_idx" ON "HermesSkill"("userId");

-- CreateIndex
CREATE INDEX "HermesMemory_userId_idx" ON "HermesMemory"("userId");

-- CreateIndex
CREATE INDEX "HermesMemory_category_idx" ON "HermesMemory"("category");

-- CreateIndex
CREATE INDEX "HermesMemory_isActive_idx" ON "HermesMemory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HermesMemory_userId_key_key" ON "HermesMemory"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "HermesProviderConfig_userId_key" ON "HermesProviderConfig"("userId");

-- CreateIndex
CREATE INDEX "HermesProviderConfig_userId_idx" ON "HermesProviderConfig"("userId");

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactMetric" ADD CONSTRAINT "ImpactMetric_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EKYCVerification" ADD CONSTRAINT "EKYCVerification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EKYCVerification" ADD CONSTRAINT "EKYCVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecuritySettings" ADD CONSTRAINT "SecuritySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceBinding" ADD CONSTRAINT "DeviceBinding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerDeployment" ADD CONSTRAINT "VolunteerDeployment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerDeployment" ADD CONSTRAINT "VolunteerDeployment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerDeployment" ADD CONSTRAINT "VolunteerDeployment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHourLog" ADD CONSTRAINT "VolunteerHourLog_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHourLog" ADD CONSTRAINT "VolunteerHourLog_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "VolunteerDeployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCertificate" ADD CONSTRAINT "VolunteerCertificate_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCommunication" ADD CONSTRAINT "DonorCommunication_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCommunication" ADD CONSTRAINT "DonorCommunication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReceipt" ADD CONSTRAINT "TaxReceipt_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReceipt" ADD CONSTRAINT "TaxReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionEvent" ADD CONSTRAINT "ExecutionEvent_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HermesConversation" ADD CONSTRAINT "HermesConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HermesMessage" ADD CONSTRAINT "HermesMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HermesConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HermesSkill" ADD CONSTRAINT "HermesSkill_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HermesConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HermesSkill" ADD CONSTRAINT "HermesSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HermesProviderConfig" ADD CONSTRAINT "HermesProviderConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

