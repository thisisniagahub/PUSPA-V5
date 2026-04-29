import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

/**
 * Branch-scoped Prisma access.
 *
 * Current state: The Prisma schema does NOT yet have `branchId` columns on
 * branch-aware models (Member, Case, Donation, etc.). Once branchId is added
 * to the relevant models, this module can provide filtered Prisma delegates.
 *
 * Until then:
 *   - Calling without a branchId returns the unscoped db client (safe).
 *   - Calling WITH a branchId returns the unscoped client but logs a warning,
 *     because branch filtering cannot be enforced without the column.
 *
 * TODO: Add `branchId String?` to Member, Case, Donation, Disbursement,
 *       Programme, Activity, and other branch-aware models. Then implement
 *       proper query interception or Prisma extensions to filter by branch.
 */

const WARNED_BRANCH_SCOPING = new Set<string>();

export function getScopedDb(branchId?: string): PrismaClient {
  if (branchId) {
    // Log once per session to avoid spam
    if (!WARNED_BRANCH_SCOPING.has(branchId)) {
      console.warn(
        `[db-rls] Branch scoping requested for branchId="${branchId}" but branchId columns ` +
        `are not yet present in the schema. Returning unscoped client. ` +
        `Add branchId to relevant models and implement filtering.`
      );
      WARNED_BRANCH_SCOPING.add(branchId);
    }
  }

  return db as unknown as PrismaClient;
}
