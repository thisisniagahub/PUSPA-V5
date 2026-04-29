import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const resumeSchema = z.object({
  context: z.string().optional(),
});

// ─── POST: Resume unfinished work ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const validated = resumeSchema.parse(body);

    const unfinishedStatuses = ['queued', 'in_progress', 'blocked', 'waiting_user', 'scheduled'];

    // Find most recent unfinished work item
    const candidates = await db.workItem.findMany({
      where: { status: { in: unfinishedStatuses } },
      orderBy: { updatedAt: 'desc' },
      take: 50, // fetch a reasonable batch to search through
    });

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, message: 'no_unfinished_work' });
    }

    let workItem = candidates[0];

    // If context is provided, try to find a semantically matching work item
    if (validated.context) {
      const contextWords = validated.context
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2); // ignore short words

      if (contextWords.length > 0) {
        // Score each candidate by how many context words appear in its requestText
        let bestScore = 0;
        for (const candidate of candidates) {
          const requestText = candidate.requestText.toLowerCase();
          const title = candidate.title.toLowerCase();
          let score = 0;
          for (const word of contextWords) {
            if (requestText.includes(word) || title.includes(word)) {
              score++;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            workItem = candidate;
          }
        }
      }
    }

    // Fetch full work item with execution events
    const fullWorkItem = await db.workItem.findUnique({
      where: { id: workItem.id },
      include: {
        executionEvents: {
          orderBy: { createdAt: 'desc' },
        },
        artifacts: true,
        automationJobs: true,
      },
    });

    return NextResponse.json({ success: true, data: fullWorkItem });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error resuming work:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resume work' },
      { status: 500 }
    );
  }
}
