import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { z } from 'zod';

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Nombor penerima diperlukan'),
  message: z.string().min(1, 'Mesej diperlukan').max(1000, 'Mesej terlalu panjang'),
  type: z.enum(['text', 'document', 'template', 'image']).default('text'),
});

// ── Message Templates ───────────────────────────────────────────────────────

const messageTemplates = [
  {
    id: 'donation_receipt',
    name: 'Resit Derma',
    category: 'Kewangan',
    description: 'Maklum balas resit derma kepada penderma',
    type: 'template',
    variables: ['nama_penderma', 'jumlah', 'no_rujukan', 'tarikh'],
    preview: 'Assalamualaikum {nama_penderma}, terima kasih atas derma sebanyak RM {jumlah} kepada PUSPA. No. Rujukan: {no_rujukan}. Tarikh: {tarikh}. Resit penuh akan dihantar melalui emel. Jazakallahu khairan!',
    language: 'Bahasa Melayu',
    usageCount: 234,
    lastUsed: '2026-04-20',
  },
  {
    id: 'volunteer_reminder',
    name: 'Peringatan Sukarelawan',
    category: 'Sukarelawan',
    description: 'Peringatan untuk program sukarelawan yang akan datang',
    type: 'template',
    variables: ['nama_sukarelawan', 'nama_program', 'tarikh', 'masa', 'lokasi'],
    preview: 'Assalamualaikum {nama_sukarelawan}, ini adalah peringatan bahawa anda berdaftar untuk {nama_program} pada {tarikh} jam {masa} di {lokasi}. Sila sahkan kehadiran anda. Terima kasih!',
    language: 'Bahasa Melayu',
    usageCount: 156,
    lastUsed: '2026-04-18',
  },
  {
    id: 'case_update',
    name: 'Kemas Kini Kes',
    category: 'Kes',
    description: 'Kemas kini status permohonan bantuan kepada pemohon',
    type: 'template',
    variables: ['nama_pemohon', 'no_kes', 'status', 'tindakan_seterusnya'],
    preview: 'Assalamualaikum {nama_pemohon}, kami ingin memaklumkan bahawa permohonan anda (No. Rujukan: {no_kes}) telah dikemaskini. Status: {status}. {tindakan_seterusnya}. Hubungi kami di 03-4108 XXXX untuk maklumat lanjut.',
    language: 'Bahasa Melayu',
    usageCount: 98,
    lastUsed: '2026-04-17',
  },
  {
    id: 'meeting_invite',
    name: 'Jemputan Mesyuarat',
    category: 'Pentadbiran',
    description: 'Jemputan mesyuarat jawatankuasa atau agensi',
    type: 'template',
    variables: ['nama_penerima', 'agenda', 'tarikh', 'masa', 'tempat'],
    preview: 'Assalamualaikum {nama_penerima}, anda dijemput hadir ke mesyuarat {agenda} pada {tarikh} jam {masa} di {tempat}. Sila sahkan kehadiran anda selewat-lewatnya sehari sebelum mesyuarat. Terima kasih.',
    language: 'Bahasa Melayu',
    usageCount: 67,
    lastUsed: '2026-04-15',
  },
  {
    id: 'new_member_welcome',
    name: 'Alu-aluan Ahli Baharu',
    category: 'Keahlian',
    description: 'Ucapan alu-aluan kepada ahli baharu PUSPA',
    type: 'template',
    variables: ['nama_ahli', 'no_ahli'],
    preview: 'Assalamualaikum {nama_ahli}, selamat datang ke keluarga PUSPA! No. Ahli anda: {no_ahli}. Kami sangat berbesar hati dengan keputusan anda menyertai kami. Dapatkan maklumat program terkini di laman sesawang kami. Jazakallahu khairan!',
    language: 'Bahasa Melayu',
    usageCount: 45,
    lastUsed: '2026-04-19',
  },
  {
    id: 'monthly_report',
    name: 'Laporan Bulanan',
    category: 'Pentadbiran',
    description: 'Ringkasan laporan bulanan untuk jawatankuasa',
    type: 'template',
    variables: ['bulan', 'jumlah_ahli', 'jumlah_program', 'jumlah_derma'],
    preview: 'Laporan PUSPA Bulan {bulan}:\n- Jumlah Ahli Aktif: {jumlah_ahli}\n- Program Berjalan: {jumlah_program}\n- Jumlah Derma: RM {jumlah_derma}\nLaporan terperinci boleh dimuat turun dari sistem PUSPA.',
    language: 'Bahasa Melayu',
    usageCount: 12,
    lastUsed: '2026-04-01',
  },
];

// ── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    return NextResponse.json({
      success: true,
      data: {
        templates: messageTemplates,
        total: messageTemplates.length,
        categories: [...new Set(messageTemplates.map((t) => t.category))],
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendapatkan templat mesej' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const { to, message, type } = sendMessageSchema.parse(body);

    // Simulate WhatsApp message sending
    // In production, this would integrate with WhatsApp Business API
    const messageId = `WA-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Normalize phone number
    const normalizedTo = to.replace(/\D/g, '');
    if (normalizedTo.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Nombor telefon tidak sah' },
        { status: 400 }
      );
    }

    // Simulate processing
    const status = type === 'template' ? 'DIPROSSES' : 'DIHANTAR';

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        messageId,
        to: normalizedTo.startsWith('6') ? normalizedTo : `6${normalizedTo}`,
        message,
        type,
        status,
        sentAt: new Date().toISOString(),
        deliveryEstimate: '5-10 saat',
        notes: 'Mesej dihantar melalui WhatsApp Business API (simulasi)',
      },
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
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghantar mesej WhatsApp' },
      { status: 500 }
    );
  }
}
