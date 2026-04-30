import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

// ─── POST /api/v1/ekyc/analyze-selfie ─────────────────────────────
// Analyzes a selfie against an IC photo using VLM to compute
// liveness and face-match scores.

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['staff', 'admin', 'developer'])
    const body = await request.json()
    const { selfieUrl, icFrontUrl } = body

    if (!selfieUrl) {
      return NextResponse.json(
        { success: false, error: 'URL selfie diperlukan' },
        { status: 400 }
      )
    }

    if (!icFrontUrl) {
      return NextResponse.json(
        { success: false, error: 'URL IC depan diperlukan' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // First: Liveness analysis — check if the selfie is a live photo
    const livenessPrompt = `You are a liveness detection system for identity verification. Analyze this selfie photo and determine if it appears to be a genuine live photo of a person (NOT a photo of a photo, NOT a screen capture, NOT a printed image, NOT a deepfake).

Look for:
- Natural lighting and shadows
- Skin texture that appears real
- No visible screen edges or print artifacts
- Natural facial features and proportions
- Consistent depth of field

Return ONLY a JSON object:
{
  "isLive": true/false,
  "confidence": <number between 0 and 100 representing confidence that this is a live photo>,
  "reason": "Brief explanation of your assessment"
}`

    // Second: Face match analysis — compare selfie against IC photo
    const faceMatchPrompt = `You are a face matching system for identity verification. Compare the person in the selfie with the person shown on the identity card (IC / MyKad).

Determine if they are the same person by comparing:
- Facial structure and shape
- Eye shape and spacing
- Nose shape
- Mouth and jawline
- Overall facial proportions

Return ONLY a JSON object:
{
  "isMatch": true/false,
  "confidence": <number between 0 and 100 representing your confidence that the faces match>,
  "reason": "Brief explanation of your assessment"
}`

    // Run both analyses in parallel
    const [livenessResponse, faceMatchResponse] = await Promise.all([
      zai.chat.completions.createVision({
        model: 'default',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: livenessPrompt },
              { type: 'image_url', image_url: { url: selfieUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      }),
      zai.chat.completions.createVision({
        model: 'default',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: faceMatchPrompt },
              { type: 'image_url', image_url: { url: selfieUrl } },
              { type: 'image_url', image_url: { url: icFrontUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      }),
    ])

    // Parse liveness response
    let livenessScore = 50 // default fallback
    try {
      const livenessContent = livenessResponse.choices[0]?.message?.content || ''
      const livenessMatch = livenessContent.match(/\{[\s\S]*\}/)
      if (livenessMatch) {
        const parsed = JSON.parse(livenessMatch[0])
        if (typeof parsed.confidence === 'number') {
          livenessScore = parsed.isLive === false
            ? Math.min(parsed.confidence, 45) // If not live, cap score low
            : parsed.confidence
        }
      }
    } catch (e) {
      console.error('Failed to parse liveness VLM response:', e)
    }

    // Parse face match response
    let faceMatchScore = 50 // default fallback
    try {
      const faceMatchContent = faceMatchResponse.choices[0]?.message?.content || ''
      const faceMatchJsonMatch = faceMatchContent.match(/\{[\s\S]*\}/)
      if (faceMatchJsonMatch) {
        const parsed = JSON.parse(faceMatchJsonMatch[0])
        if (typeof parsed.confidence === 'number') {
          faceMatchScore = parsed.isMatch === false
            ? Math.min(parsed.confidence, 45) // If not a match, cap score low
            : parsed.confidence
        }
      }
    } catch (e) {
      console.error('Failed to parse face match VLM response:', e)
    }

    // Round scores to 1 decimal place
    livenessScore = Math.round(livenessScore * 10) / 10
    faceMatchScore = Math.round(faceMatchScore * 10) / 10

    return NextResponse.json({
      success: true,
      data: {
        livenessScore,
        faceMatchScore,
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('Error analyzing selfie:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menganalisis selfie' },
      { status: 500 }
    )
  }
}
