import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth(request)

    const { id } = await Promise.resolve(context.params)

    const volunteer = await db.volunteer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deployments: true,
            hourLogs: true,
            certificates: true,
          },
        },
      },
    })

    if (!volunteer) {
      return NextResponse.json(
        { success: false, error: 'Sukarelawan tidak dijumpai' },
        { status: 404 },
      )
    }

    const [
      activeDeployments,
      approvedHourLogs,
      pendingHourLogs,
      currentDeployment,
      latestDeployment,
      latestHourLog,
      latestApprovedHourLog,
      latestCertificate,
    ] = await Promise.all([
      db.volunteerDeployment.count({
        where: {
          volunteerId: id,
          status: { in: ['assigned', 'active'] },
        },
      }),
      db.volunteerHourLog.count({
        where: {
          volunteerId: id,
          status: 'approved',
        },
      }),
      db.volunteerHourLog.count({
        where: {
          volunteerId: id,
          status: 'pending',
        },
      }),
      db.volunteerDeployment.findFirst({
        where: {
          volunteerId: id,
          status: { in: ['assigned', 'active'] },
        },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          role: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          notes: true,
          programme: { select: { id: true, name: true } },
        },
      }),
      db.volunteerDeployment.findFirst({
        where: { volunteerId: id },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          role: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          notes: true,
          programme: { select: { id: true, name: true } },
        },
      }),
      db.volunteerHourLog.findFirst({
        where: { volunteerId: id },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          date: true,
          hours: true,
          activity: true,
          status: true,
          approvedBy: true,
          approvedAt: true,
        },
      }),
      db.volunteerHourLog.findFirst({
        where: {
          volunteerId: id,
          status: 'approved',
        },
        orderBy: [{ approvedAt: 'desc' }, { date: 'desc' }],
        select: {
          id: true,
          date: true,
          hours: true,
          activity: true,
          status: true,
          approvedBy: true,
          approvedAt: true,
        },
      }),
      db.volunteerCertificate.findFirst({
        where: { volunteerId: id },
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          certificateNumber: true,
          title: true,
          description: true,
          issuedAt: true,
          totalHours: true,
          issuedBy: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        volunteer,
        summary: {
          counts: {
            deployments: volunteer._count.deployments,
            activeDeployments,
            hourLogs: volunteer._count.hourLogs,
            approvedHourLogs,
            pendingHourLogs,
            certificates: volunteer._count.certificates,
          },
          currentDeployment,
          latestDeployment,
          latestHourLog,
          latestApprovedHourLog,
          latestCertificate,
        },
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Error fetching volunteer detail:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volunteer detail' },
      { status: 500 },
    )
  }
}
