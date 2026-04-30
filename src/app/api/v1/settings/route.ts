import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

// ──────────────────────────────────────────────
// Default notification settings (used when no prefs stored yet)
// ──────────────────────────────────────────────

const DEFAULT_NOTIFICATION_PREFS = {
  n1: { label: 'Kes Baru', description: 'Notifikasi apabila ada kes bantuan baru', enabled: true, category: 'email' },
  n2: { label: 'Donasi Masuk', description: 'Notifikasi apabila ada donasi baru diterima', enabled: true, category: 'email' },
  n3: { label: 'Kelulusan Pembayaran', description: 'Notifikasi apabila pembayaran diluluskan', enabled: true, category: 'push' },
  n4: { label: 'Pematuhan Tertunggak', description: 'Peringatan item pematuhan belum selesai', enabled: false, category: 'email' },
  n5: { label: 'Laporan Mingguan', description: 'Ringkasan aktiviti setiap minggu', enabled: true, category: 'email' },
  n6: { label: 'Aktiviti Sukarelawan', description: 'Notifikasi aktiviti sukarelawan baru', enabled: false, category: 'push' },
  n7: { label: 'Keselamatan Akaun', description: 'Amaran aktiviti mencurigakan akaun', enabled: true, category: 'sms' },
  n8: { label: 'Kemas Kini Sistem', description: 'Notifikasi kemas kini dan penyelenggaraan', enabled: false, category: 'email' },
}

// ──────────────────────────────────────────────
// GET — Retrieve settings for current user
// ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id

    // Fetch or create SecuritySettings
    let securitySettings = await db.securitySettings.findUnique({ where: { userId } })

    if (!securitySettings) {
      securitySettings = await db.securitySettings.create({
        data: {
          userId,
          notificationPrefs: JSON.stringify(DEFAULT_NOTIFICATION_PREFS),
        },
      })
    }

    // Parse notification preferences
    let notifPrefs = DEFAULT_NOTIFICATION_PREFS
    try {
      const parsed = JSON.parse(securitySettings.notificationPrefs || '{}')
      if (Object.keys(parsed).length > 0) {
        notifPrefs = parsed
      }
    } catch {
      // use defaults
    }

    // Convert to array format for the UI
    const notificationSettings = Object.entries(notifPrefs).map(([id, pref]: [string, any]) => ({
      id,
      label: pref.label || id,
      description: pref.description || '',
      enabled: pref.enabled ?? true,
      category: pref.category || 'email',
    }))

    return NextResponse.json({
      success: true,
      data: {
        security: {
          biometricTransactions: securitySettings.biometricTransactions,
          boundDeviceOnly: securitySettings.boundDeviceOnly,
          sessionTimeout: securitySettings.sessionTimeout,
        },
        notifications: notificationSettings,
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan tetapan' },
      { status: 500 },
    )
  }
}

// ──────────────────────────────────────────────
// PUT — Update settings for current user
// ──────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.user.id
    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.security) {
      if (typeof body.security.biometricTransactions === 'boolean') {
        updateData.biometricTransactions = body.security.biometricTransactions
      }
      if (typeof body.security.boundDeviceOnly === 'boolean') {
        updateData.boundDeviceOnly = body.security.boundDeviceOnly
      }
      if (typeof body.security.sessionTimeout === 'number') {
        updateData.sessionTimeout = body.security.sessionTimeout
      }
    }

    if (body.notifications) {
      // Convert array format back to object format for storage
      const prefsMap: Record<string, unknown> = {}
      for (const notif of body.notifications) {
        prefsMap[notif.id] = {
          label: notif.label,
          description: notif.description,
          enabled: notif.enabled,
          category: notif.category,
        }
      }
      updateData.notificationPrefs = JSON.stringify(prefsMap)
    }

    // Upsert SecuritySettings
    const settings = await db.securitySettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        security: {
          biometricTransactions: settings.biometricTransactions,
          boundDeviceOnly: settings.boundDeviceOnly,
          sessionTimeout: settings.sessionTimeout,
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
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengemaskini tetapan' },
      { status: 500 },
    )
  }
}
