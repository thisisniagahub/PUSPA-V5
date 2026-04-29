import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { z } from 'zod';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'pendaftaran',
  'tadbir_urus',
  'kewangan',
  'pematuhan',
  'operasi',
  'program',
] as const;

const VALID_STATUSES = ['active', 'archived', 'deleted'] as const;

const documentCreateSchema = z.object({
  title: z.string().min(1, 'Tajuk dokumen diperlukan'),
  description: z.string().optional(),
  category: z.enum(VALID_CATEGORIES, { message: 'Kategori diperlukan' }),
  subcategory: z.string().optional(),
  fileName: z.string().min(1, 'Nama fail diperlukan'),
  fileSize: z.number().int().nonnegative().default(0),
  mimeType: z.string().optional(),
  fileUrl: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const documentUpdateSchema = documentCreateSchema.partial().extend({
  id: z.string(),
});

// ─── GET: List documents with pagination, search, filter, sort ───────────────

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { status: { not: 'deleted' } };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      where.category = category;
    }

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'category', 'expiryDate', 'fileSize'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.document.count({ where }),
    ]);

    // Parse tags JSON for each document
    const parsedDocs = documents.map((doc) => {
      let parsedTags: string[] = []
      if (doc.tags) {
        try {
          parsedTags = JSON.parse(doc.tags as string)
        } catch {
          parsedTags = []
        }
      }
      return { ...doc, tags: parsedTags }
    })

    return NextResponse.json({
      success: true,
      data: parsedDocs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan dokumen' },
      { status: 500 }
    );
  }
}

// ─── POST: Create document metadata ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validated = documentCreateSchema.parse(body);
    const actor = session.user.email || session.user.name || session.user.id;

    // Auto-generate title from fileName if not provided
    const title = validated.title || validated.fileName.replace(/\.[^/.]+$/, '');

    const document = await db.document.create({
      data: {
        title,
        description: validated.description || null,
        category: validated.category,
        subcategory: validated.subcategory || null,
        fileName: validated.fileName,
        fileSize: validated.fileSize || 0,
        mimeType: validated.mimeType || null,
        fileUrl: validated.fileUrl || null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        tags: validated.tags ? JSON.stringify(validated.tags) : null,
        uploadedBy: actor,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...document, tags: document.tags ? JSON.parse(document.tags as string) : [] },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencipta dokumen' },
      { status: 500 }
    );
  }
}

// ─── PUT: Update document metadata ───────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID dokumen diperlukan' },
        { status: 400 }
      );
    }

    const validated = documentCreateSchema.partial().parse(updateData);

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Dokumen tidak dijumpai' },
        { status: 404 }
      );
    }

    const document = await db.document.update({
      where: { id },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        subcategory: validated.subcategory ?? undefined,
        mimeType: validated.mimeType ?? undefined,
        fileUrl: validated.fileUrl ?? undefined,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        tags: validated.tags ? JSON.stringify(validated.tags) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...document, tags: document.tags ? JSON.parse(document.tags as string) : [] },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengemas kini dokumen' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete (set status to 'deleted') ───────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID dokumen diperlukan' },
        { status: 400 }
      );
    }

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Dokumen tidak dijumpai' },
        { status: 404 }
      );
    }

    await db.document.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ success: true, message: 'Dokumen berjaya dipadam' });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memadam dokumen' },
      { status: 500 }
    );
  }
}
