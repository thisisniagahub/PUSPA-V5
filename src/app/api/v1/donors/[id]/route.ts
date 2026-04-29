import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthorizationError, requireAuth } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth(request);
    const { id } = await Promise.resolve(context.params);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID penderma diperlukan' },
        { status: 400 }
      );
    }

    const donor = await db.donor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taxReceipts: true,
            communications: true,
          },
        },
      },
    });

    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Penderma tidak dijumpai' },
        { status: 404 }
      );
    }

    const [receiptAggregate, recentReceipts, communicationAggregate, recentCommunications, communicationByStatus] =
      await Promise.all([
        db.taxReceipt.aggregate({
          where: { donorId: id },
          _count: { id: true },
          _sum: { amount: true },
          _max: { issuedAt: true },
        }),
        db.taxReceipt.findMany({
          where: { donorId: id },
          orderBy: [{ donationDate: 'desc' }, { issuedAt: 'desc' }],
          take: 5,
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            donationDate: true,
            issuedAt: true,
            purpose: true,
            lhdnRef: true,
          },
        }),
        db.donorCommunication.aggregate({
          where: { donorId: id },
          _count: { id: true },
          _max: { sentAt: true, createdAt: true },
        }),
        db.donorCommunication.findMany({
          where: { donorId: id },
          orderBy: [{ createdAt: 'desc' }, { sentAt: 'desc' }],
          take: 5,
          select: {
            id: true,
            type: true,
            subject: true,
            content: true,
            status: true,
            sentAt: true,
            createdAt: true,
          },
        }),
        db.donorCommunication.groupBy({
          by: ['status'],
          where: { donorId: id },
          _count: { _all: true },
        }),
      ]);

    const communicationCounts = communicationByStatus.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        donor,
        receipts: {
          total: receiptAggregate._count.id || 0,
          totalAmount: receiptAggregate._sum.amount || 0,
          latestIssuedAt: receiptAggregate._max.issuedAt || null,
          items: recentReceipts,
        },
        communications: {
          total: communicationAggregate._count.id || 0,
          sentCount: communicationCounts.sent || 0,
          draftCount: communicationCounts.draft || 0,
          failedCount: communicationCounts.failed || 0,
          latestActivityAt:
            communicationAggregate._max.sentAt || communicationAggregate._max.createdAt || null,
          items: recentCommunications,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching donor detail:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan butiran penderma' },
      { status: 500 }
    );
  }
}
