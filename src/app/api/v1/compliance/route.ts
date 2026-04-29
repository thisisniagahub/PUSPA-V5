import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const toggleSchema = z.object({
  id: z.string().min(1, 'Compliance checklist item id is required'),
  isCompleted: z.boolean(),
});

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(_request);
    const [checklistItems] = await Promise.all([
      db.complianceChecklist.findMany({
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      }),
    ]);

    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter((item) => item.isCompleted).length;
    const overallScore = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    const groupedByCategory = checklistItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { category: item.category, items: [], completed: 0, total: 0 };
        }
        acc[item.category].items.push(item);
        acc[item.category].total += 1;
        if (item.isCompleted) acc[item.category].completed += 1;
        return acc;
      },
      {} as Record<string, { category: string; items: typeof checklistItems; completed: number; total: number }>
    );

    const categories = Object.values(groupedByCategory).map((cat) => ({
      ...cat,
      score: cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        checklistItems,
        categories,
        overallScore,
        totalItems,
        completedItems,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const schema = z.object({
      category: z.string().min(1, 'Category is required'),
      item: z.string().min(1, 'Item is required'),
      description: z.string().optional(),
      isCompleted: z.boolean().optional().default(false),
      evidenceUrl: z.string().optional(),
      notes: z.string().optional(),
      order: z.number().int().nonnegative().optional().default(0),
    });
    const validated = schema.parse(body);

    const checklistItem = await db.complianceChecklist.create({
      data: validated,
    });

    return NextResponse.json({ success: true, data: checklistItem }, { status: 201 });
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
    console.error('Error creating compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create compliance item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Compliance checklist item id is required' },
        { status: 400 }
      );
    }

    const existing = await db.complianceChecklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Compliance checklist item not found' },
        { status: 404 }
      );
    }

    const schema = z.object({
      category: z.string().optional(),
      item: z.string().optional(),
      description: z.string().optional(),
      isCompleted: z.boolean().optional(),
      evidenceUrl: z.string().optional(),
      notes: z.string().optional(),
      order: z.number().int().nonnegative().optional(),
    });
    const validated = schema.parse(updateData);

    const dataToUpdate: Record<string, unknown> = { ...validated };
    if (validated.isCompleted) {
      dataToUpdate.completedAt = new Date();
    } else if (validated.isCompleted === false) {
      dataToUpdate.completedAt = null;
    }

    const checklistItem = await db.complianceChecklist.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: checklistItem });
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
    console.error('Error updating compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compliance item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Compliance checklist item id is required' },
        { status: 400 }
      );
    }

    const existing = await db.complianceChecklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Compliance checklist item not found' },
        { status: 404 }
      );
    }

    await db.complianceChecklist.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Compliance checklist item deleted successfully' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete compliance item' },
      { status: 500 }
    );
  }
}
