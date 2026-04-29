import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['staff', 'admin', 'developer'])
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Tiada gambar disediakan' },
        { status: 400 }
      )
    }

    // Simulate VLM processing delay (e.g., waiting for GPT-4 Vision)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate intelligent extraction based on typical Malaysian IC data
    // In production, this would call the configured OpenClaw vision-capable model
    const extractedData = {
      name: 'Ahmad bin Abu',
      ic: '900101-14-5555',
      address: '123 Jalan Ampang, 50450 Kuala Lumpur',
      dateOfBirth: '1990-01-01',
      gender: 'Lelaki'
    }

    return NextResponse.json({ success: true, data: extractedData })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('Error in VLM extraction:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengekstrak maklumat dari gambar' },
      { status: 500 }
    )
  }
}
