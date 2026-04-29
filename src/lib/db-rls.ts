import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

/**
 * Branch-scoped Prisma access is intentionally disabled until the schema has
 * real branchId columns on every branch-aware model and the queries can enforce
 * those predicates. Passing a branchId now fails closed instead of silently
 * returning an unscoped client.
 */
export function getScopedDb(branchId?: string): PrismaClient {
  if (branchId) {
    throw new Error('[db-rls] Branch scoping is unavailable because branchId is not in the schema');
  }

  return db as unknown as PrismaClient;
}
