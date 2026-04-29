import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

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

    // Use VLM SDK to analyze the IC image
    const zai = await ZAI.create()

    const prompt = `You are an OCR system specialized in reading Malaysian Identity Cards (Kad Pengenalan / MyKad). Analyze the provided image of a Malaysian IC and extract the following information. Return ONLY valid JSON with these exact keys, no extra text:

{
  "name": "Full name as written on the IC (in Malay format: Name bin/binti Father's name)",
  "ic": "IC number in format XXXXXX-XX-XXXX",
  "address": "Full address as printed on the IC",
  "dateOfBirth": "Date of birth in YYYY-MM-DD format (derived from the IC number if not explicitly shown)",
  "gender": "Lelaki or Perempuan (derived from the last digit of IC: odd=Lelaki, even=Perempuan)"
}

If any field cannot be read from the image, use an empty string for that field. Be as accurate as possible with the extraction.`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const vlmContent = response.choices[0]?.message?.content || ''

    // Parse the VLM response as JSON
    let extractedData: {
      name: string
      ic: string
      address: string
      dateOfBirth: string
      gender: string
    }

    try {
      // Try to extract JSON from the response — the VLM may wrap it in markdown code blocks
      const jsonMatch = vlmContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON object found in VLM response')
      }
    } catch {
      console.error('Failed to parse VLM response as JSON:', vlmContent)
      return NextResponse.json(
        { success: false, error: 'Gagal mengekstrak maklumat dari gambar — format respons tidak sah' },
        { status: 422 }
      )
    }

    // Validate and provide defaults for missing fields
    const result = {
      name: extractedData.name || '',
      ic: extractedData.ic || '',
      address: extractedData.address || '',
      dateOfBirth: extractedData.dateOfBirth || '',
      gender: extractedData.gender || '',
    }

    return NextResponse.json({ success: true, data: result })
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
