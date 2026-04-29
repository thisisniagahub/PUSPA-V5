import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { createOpenClawChatCompletion, isOpenClawGatewayConfigured, type OpenClawChatMessage } from '@/lib/openclaw';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Mesej diperlukan').max(2000, 'Mesej terlalu panjang'),
  context: z.string().optional(),
});

const SYSTEM_PROMPT = `Kamu adalah pembantu AI untuk PUSPA, sebuah Pertubuhan Kebajikan Sokongan Prihatin Asnaf yang berdaftar di Malaysia. Kamu membantu pengurusan NGO dalam bahasa Melayu.

Maklumat PUSPA:
- Lokasi: Hulu Klang, Gombak, Ampang (Selangor)
- Ahli berdaftar: 342 orang (287 aktif)
- Program utama: AsnafCare (bantuan makanan), Pusat Sunnah Preschool, Kelas Tilawah Dewasa, Mentoring Belia, Klinik Kesihatan Komuniti
- Kategori ahli: Ahli Biasa, Sukarelawan, Penderma Tetap, Ahli Sejahtera (BMT)
- Anggaran operasi bulanan: RM 45,000 - 55,000
- Pendapatan utama: Donasi individu (50%), Derma korporat (31%), Geran kerajaan (14%)

Jawab soalan dengan:
1. Bahasa Melayu yang sopan dan profesional
2. Maklumat yang tepat berdasarkan konteks PUSPA
3. Format yang mudah dibaca (senarai, jadual ringkas jika perlu)
4. Cadangan tindakan yang praktikal apabila sesuai

Jika tidak pasti, katakan dengan jujur dan cadangkan rujukan kepada pentadbir PUSPA.`;

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);

    if (!isOpenClawGatewayConfigured()) {
      return NextResponse.json(
        { success: false, error: 'OpenClaw Gateway belum dikonfigurasi' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, context } = chatSchema.parse(body);

    const messages: OpenClawChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Konteks tambahan dari pengguna: ${context}`,
      });
    }

    messages.push({ role: 'user', content: message });

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const openClawResult = await createOpenClawChatCompletion(messages, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const responseText = openClawResult.content;
      const estimatedInputTokens = Math.ceil((message.length + (context?.length || 0)) / 4);
      const estimatedOutputTokens = Math.ceil(responseText.length / 4);

      return NextResponse.json({
        success: true,
        data: {
          response: responseText,
          provider: 'openclaw',
          model: openClawResult.model,
          tokens: {
            input: openClawResult.usage?.prompt_tokens ?? estimatedInputTokens,
            output: openClawResult.usage?.completion_tokens ?? estimatedOutputTokens,
            total: openClawResult.usage?.total_tokens ?? estimatedInputTokens + estimatedOutputTokens,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (abortError) {
      clearTimeout(timeoutId);
      if (abortError instanceof Error && abortError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Permintaan timed out selepas 30 saat' },
          { status: 504 }
        );
      }
      throw abortError;
    }
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
    console.error('Error in OpenClaw AI chat:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses mesej melalui OpenClaw' },
      { status: 502 }
    );
  }
}
