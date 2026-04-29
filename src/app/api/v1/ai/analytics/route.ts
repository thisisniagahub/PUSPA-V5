import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { z } from 'zod';

const validTypes = ['donor_churn', 'fraud_detection', 'programme_effectiveness', 'sdg_alignment'] as const;
type AnalyticsType = (typeof validTypes)[number];

const querySchema = z.object({
  type: z.enum(validTypes).default('donor_churn'),
});

// ── Simulated realistic data for PUSPA ──────────────────────────────────────

function getDonorChurnData() {
  const now = new Date();
  return {
    type: 'donor_churn',
    title: 'Ramalan Perpindahan Penderma',
    generatedAt: now.toISOString(),
    summary: {
      totalDonors: 89,
      atRisk: 14,
      lowRisk: 8,
      moderateRisk: 4,
      highRisk: 2,
      churnRate: 15.7,
    },
    donors: [
      {
        id: 'don-001',
        name: 'Encik Muhammad Amin bin Ismail',
        riskLevel: 'TINGGI',
        riskScore: 87,
        lastDonation: '2025-12-15',
        averageAmount: 500,
        frequency: 'Bulanan',
        tenureMonths: 18,
        reason: 'Tidak menderma selama 3 bulan berturut-turut. Penurunan 70% daripada purata biasa. Tiada respons terhadap komunikasi terakhir.',
        recommendation: 'Hubungi secara peribadi dalam tempoh 7 hari. Tawarkan kempen khas atau program zakat yang relevan.',
      },
      {
        id: 'don-002',
        name: 'Puan Siti Fatimah binti Ali',
        riskLevel: 'TINGGI',
        riskScore: 82,
        lastDonation: '2026-01-10',
        averageAmount: 300,
        frequency: 'Bulanan',
        tenureMonths: 24,
        reason: 'Corak derma tidak konsisten sejak 4 bulan lalu. Kali terakhir menyertai aktiviti ialah 6 bulan lalu.',
        recommendation: 'Jemput menyertai program sukarelawan. Hantar laporan kesan derma terkini.',
      },
      {
        id: 'don-003',
        name: 'Encik Hamzah bin Omar',
        riskLevel: 'SEDERHANA',
        riskScore: 68,
        lastDonation: '2026-02-20',
        averageAmount: 200,
        frequency: '2 bulan sekali',
        tenureMonths: 12,
        reason: 'Ketinggalan 1 kitaran pendermaan biasa. Baru sahaja berpindah ke kawasan baru.',
        recommendation: 'Hantar resit cukai dan laporan tahunan untuk mengukuhkan hubungan.',
      },
      {
        id: 'don-004',
        name: 'Puan Nur Hidayah binti Rahman',
        riskLevel: 'SEDERHANA',
        riskScore: 65,
        lastDonation: '2026-03-05',
        averageAmount: 150,
        frequency: 'Bulanan',
        tenureMonths: 9,
        reason: 'Pendermaan menurun secara beransur-ansur sejak 2 bulan lalu. Tiada interaksi di media sosial.',
        recommendation: 'Kemas kini data hubungan. Tawarkan pilihan autodebit untuk kemudahan.',
      },
      {
        id: 'don-005',
        name: 'Encik Rizal bin Hassan',
        riskLevel: 'SEDANG',
        riskScore: 58,
        lastDonation: '2026-03-15',
        averageAmount: 250,
        frequency: 'Bulanan',
        tenureMonths: 15,
        reason: 'Aktiviti menderma kekal tetapi jumlah menurun 30%. Mungkin berkaitan perubahan kewangan peribadi.',
        recommendation: 'Kenalkan pilihan pendermaan fleksibel. Berikan pengiktirafan khas.',
      },
      {
        id: 'don-006',
        name: 'Puan Aishah binti Yusof',
        riskLevel: 'SEDANG',
        riskScore: 55,
        lastDonation: '2026-03-20',
        averageAmount: 1000,
        frequency: 'Suku tahunan',
        tenureMonths: 36,
        reason: 'Penderma korporat yang menyatakan hasrat untuk memfokuskan kepada NGO lain. Perlu dihubungi sebelum kitaran seterusnya.',
        recommendation: 'Susun perjumpaan dengan pengerusi. Sedia laporan kesan komprehensif.',
      },
    ],
    insights: [
      'Kadar perpindahan penderma meningkat 2.3% berbanding suku tahun lepas.',
      'Penderma bulanan mempunyai kadar pengekalan 89%, lebih tinggi daripada penderma suku tahunan (72%).',
      'Penderma yang menyertai aktiviti sukarelawan mempunyai risiko perpindahan 60% lebih rendah.',
      'Tempoh kritikal untuk intervensi ialah selepas 60 hari tanpa pendermaan.',
    ],
  };
}

function getFraudDetectionData() {
  return {
    type: 'fraud_detection',
    title: 'Pengesanan Penipuan & Anomali',
    generatedAt: new Date().toISOString(),
    summary: {
      totalDisbursements: 156,
      flagged: 5,
      reviewRequired: 3,
      cleared: 2,
      riskLevel: 'SEDARHANA',
    },
    flaggedItems: [
      {
        id: 'flag-001',
        type: 'Pemberian',
        reference: 'BMT-2026-0342',
        amount: 4500,
        recipient: 'Puan Kamariah binti Sulaiman',
        programme: 'AsnafCare',
        date: '2026-04-10',
        riskScore: 92,
        anomalies: [
          'Jumlah melebihi had biasa sebanyak 3x ganda',
          'Dua pemberian dalam tempoh 7 hari (menyalahi polisi)',
          'Penerima mempunyai dua akaun bank berdaftar',
        ],
        status: 'MENUNGGU SEMAKAN',
        recommendedAction: 'Tangguhkan pemberian seterusnya. Semak dengan pegawai kebajikan kawasan.',
      },
      {
        id: 'flag-002',
        type: 'Perbelanjaan',
        reference: 'OPR-2026-0187',
        amount: 3200,
        payee: 'Syarikat Perabot Mewah Sdn Bhd',
        category: 'Operasi',
        date: '2026-04-08',
        riskScore: 78,
        anomalies: [
          'Vendor tidak dalam senarai vendor diluluskan',
          'Tiada sebut harga perbandingan (3 quotes)',
          'Pembelian di luar kategori belanjawan yang diluluskan',
        ],
        status: 'MENUNGGU SEMAKAN',
        recommendedAction: 'Minta dokumentasi sokongan lengkap. Semak kelulusan jawatankuasa kewangan.',
      },
      {
        id: 'flag-003',
        type: 'Derma',
        reference: 'DNR-2026-0512',
        amount: 15000,
        donor: 'Entiti Tanpa Nama',
        method: 'Pemindahan Bank',
        date: '2026-04-12',
        riskScore: 85,
        anomalies: [
          'Penderma tidak berdaftar dalam pangkalan data',
          'Derma besar tanpa maklumat penderma yang lengkap',
          'Corak pemindahan tidak konsisten (berbeza bank setiap kali)',
        ],
        status: 'MENUNGGU SEMAKAN',
        recommendedAction: 'Laksanakan prosedur KYC (Kenali Pelanggan Anda). Laporkan kepada jawatankuasa pematuhan.',
      },
      {
        id: 'flag-004',
        type: 'Perbelanjaan',
        reference: 'OPR-2026-0191',
        amount: 850,
        payee: 'Encik Fadli bin Razak',
        category: 'Perjalanan',
        date: '2026-04-05',
        riskScore: 62,
        anomalies: [
          'Tuntutan perjalanan melebihi purata jabatan sebanyak 2x',
          'Tiada resit untuk makanan (RM 250)',
        ],
        status: 'SUDAH BERSIH',
        recommendedAction: 'Maklumkan kepada staf tentang polisi tuntutan. Resit makanan diperlukan untuk RM > 50.',
      },
      {
        id: 'flag-005',
        type: 'Pemberian',
        reference: 'BMT-2026-0338',
        amount: 1800,
        recipient: 'Keluarga Ismail bin Abu',
        programme: 'Bantuan Pendidikan',
        date: '2026-04-03',
        riskScore: 71,
        anomalies: [
          'Bantuan pendidikan tanpa dokumen sokongan (surat tawaran sekolah)',
          'Alamat penerima tidak sepadan dengan rekod keahlian',
        ],
        status: 'SUDAH BERSIH',
        recommendedAction: 'Kemas kini dokumen sokongan dalam fail penerima. Sahkan alamat semasa.',
      },
    ],
    insights: [
      'Jumlah anomali meningkat 15% berbanding bulan lepas - perlu pemantauan lebih ketat.',
      '5 daripada 5 pen标志 berasal dari kategori pemberian dan perbelanjaan.',
      'Sistem mengesan corak: vendor baharu sering dikaitkan dengan tuntutan bernilai tinggi.',
      'Cadangan: Laksanakan proses kelulusan dwi-tandatangan untuk transaksi melebihi RM 2,000.',
    ],
  };
}

function getProgrammeEffectivenessData() {
  return {
    type: 'programme_effectiveness',
    title: 'Keberkesanan Program',
    generatedAt: new Date().toISOString(),
    summary: {
      averageScore: 4.4,
      totalProgrammes: 5,
      highlyEffective: 2,
      effective: 2,
      needsImprovement: 1,
      totalBeneficiaries: 314,
    },
    programmes: [
      {
        id: 'prog-001',
        name: 'Pusat Sunnah Preschool',
        status: 'Aktif',
        effectivenessScore: 4.8,
        budgetUtilization: 94,
        beneficiarySatisfaction: 96,
        costPerBeneficiary: 354,
        impactMetrics: {
          'Kadar Kehadiran': '94%',
          'Kelulusan ke Sekolah Rendah': '100%',
          'Kemahiran Asas Al-Quran': '85%',
          'Kemahiran Motor Halus': '92%',
        },
        strengths: [
          'Kadar kehadiran tertinggi di kalangan semua program',
          '100% pelajar berjaya melanjutkan ke sekolah rendah',
          'Maklum balas positif daripada ibu bapa (96%)',
        ],
        improvements: [
          'Perlu tambah 1 kelas untuk senarai menunggu 12 orang',
          'Pertimbangkan program separuh hari untuk peningkatan',
        ],
        trend: 'meningkat',
        trendPercentage: 5.2,
      },
      {
        id: 'prog-002',
        name: 'AsnafCare - Bantuan Makanan',
        status: 'Aktif',
        effectivenessScore: 4.5,
        budgetUtilization: 97,
        beneficiarySatisfaction: 91,
        costPerBeneficiary: 204,
        impactMetrics: {
          'Ketahanan Makanan': '89%',
          'Peningkatan Nutrisi': '76%',
          'Kepuasan Penerima': '91%',
          'Pengurangan Makanan Tidak Selamat': '68%',
        },
        strengths: [
          'Sasaran keluarga melebihi 80% daripada yang dirancang',
          'Perkongsian dengan 3 pembekal tempatan mengurangkan kos 12%',
          'Sistem pengagihan tepat pada masa setiap bulan',
        ],
        improvements: [
          'Wujudkan sistem pemantauan nutrisi berkala',
          'Tambah variasi menu berdasarkan maklum balas',
        ],
        trend: 'stabil',
        trendPercentage: 1.8,
      },
      {
        id: 'prog-003',
        name: 'Kelas Tilawah Dewasa',
        status: 'Aktif',
        effectivenessScore: 4.3,
        budgetUtilization: 88,
        beneficiarySatisfaction: 89,
        costPerBeneficiary: 127,
        impactMetrics: {
          'Peserta Aktif': '67 orang',
          'Tahap Hafazan Purata': '3 Juz',
          'Kadar Kehadiran': '82%',
          'Kemajuan Semester': '1.5 Juz/semester',
        },
        strengths: [
          'Biaya per peserta paling rendah di kalangan semua program',
          '3 peserta berjaya menghafaz 10 Juz dalam setahun',
          'Hubungan komuniti yang kukuh melalui kelas',
        ],
        improvements: [
          'Kadar kehadiran menurun di musim hujan - perlu penempatan dalaman tetap',
          'Kekurangan pengajar berkelayakan untuk kelas lanjutan',
        ],
        trend: 'meningkat',
        trendPercentage: 3.1,
      },
      {
        id: 'prog-004',
        name: 'Klinik Kesihatan Komuniti',
        status: 'Aktif (Rakan Strategik)',
        effectivenessScore: 4.0,
        budgetUtilization: 82,
        beneficiarySatisfaction: 87,
        costPerBeneficiary: 192,
        impactMetrics: {
          'Peserta Dirawat': '156 orang',
          'Kes Discaj Berjaya': '94%',
          'Lawatan Berulang': '67%',
          'Rujukan ke Hospital': '12%',
        },
        strengths: [
          'Perkongsian kos dengan Klinik Nurain mengurangkan belanja 40%',
          'Kadar kepuasan yang tinggi daripada peserta',
          'Program pencegahan penyakit berkesan mengurangkan rujukan hospital',
        ],
        improvements: [
          'Perlu tingkatkan pemeriksaan kesihatan dari 2x sebulan ke 4x',
          'Tambah perkhidmatan pergigian asas untuk kanak-kanak',
        ],
        trend: 'stabil',
        trendPercentage: 0.5,
      },
      {
        id: 'prog-005',
        name: 'Mentoring Belia PUSPA',
        status: 'Sedang Berjalan',
        effectivenessScore: 3.8,
        budgetUtilization: 75,
        beneficiarySatisfaction: 83,
        costPerBeneficiary: 412,
        impactMetrics: {
          'Mentee Aktif': '34 orang',
          'Nisbah Mentor:Mentee': '1:2.8',
          'Kadar Penyertaan': '78%',
          'Lulus Penilaian Akhir': '85%',
        },
        strengths: [
          '34 belia telah menyertai program - melebihi sasaran awal (25)',
          '12 sukarelawan mentor komited',
          '2 mentee berjaya mendapat biasiswa pendidikan',
        ],
        improvements: [
          'Biaya per mentee tinggi - perlu cari penajaan korporat',
          'Nisbah mentor perlu dipertingkatkan (ideal: 1:2)',
          'Perlu program lanjutan untuk graduan mentoring',
        ],
        trend: 'menurun',
        trendPercentage: -2.1,
      },
    ],
    insights: [
      'Pusat Sunnah Preschool mempunyai skor tertinggi (4.8) - pertimbangkan pengembangan sebagai model terbaik.',
      'Program Mentoring Belia menunjukkan penurunan - perlu intervensi segera untuk mengekalkan mentee.',
      'Purata kos per penerima ialah RM 258 - dalam had belanjawan yang sihat.',
      'Peruntukan belanjawan dimanfaatkan pada purata 87.2% - perlu peningkatan pengurusan sumber.',
    ],
  };
}

function getSDGAlignmentData() {
  return {
    type: 'sdg_alignment',
    title: 'Penjajaran Matlamat Pembangunan Mampan (SDG)',
    generatedAt: new Date().toISOString(),
    summary: {
      totalSDGsCovered: 8,
      primarySDGs: 4,
      secondarySDGs: 4,
      alignmentScore: 82,
    },
    sdgs: [
      {
        goalNumber: 1,
        title: 'Tiada Kemiskinan',
        titleEn: 'No Poverty',
        color: '#E5243B',
        alignmentLevel: 'UTAMA',
        alignmentScore: 92,
        contribution: 'Membantu 127 keluarga asnaf keluar daripada gelung kemiskinan melalui bantuan kewangan langsung, latihan kemahiran, dan program pemerkasaan.',
        programmes: ['AsnafCare', 'BMT Kewangan Bulanan', 'Program Back-to-School'],
        metrics: [
          { name: 'Keluarga dibantu', value: '127', target: '150' },
          { name: 'Penurunan kemiskinan', value: '34%', target: '50%' },
          { name: 'Kemahiran baharu', value: '89', target: '120' },
        ],
        initiatives: [
          'Program bantuan makanan bulanan untuk 89 keluarga',
          'Bantuan kewangan langsung melalui BMT',
          'Latihan kemahiran menjana pendapatan',
        ],
      },
      {
        goalNumber: 2,
        title: 'Tiada Kelaparan',
        titleEn: 'Zero Hunger',
        color: '#DDA63A',
        alignmentLevel: 'UTAMA',
        alignmentScore: 88,
        contribution: 'Menyediakan bekalan makanan berkhasiat secara konsisten kepada keluarga asnaf dan menggalakkan amalan pemakanan sihat.',
        programmes: ['AsnafCare', 'Program Taman Komuniti'],
        metrics: [
          { name: 'Keluarga menerima bantuan makanan', value: '89', target: '100' },
          { name: 'Peningkatan nutrisi', value: '76%', target: '85%' },
          { name: 'Ketahanan makanan', value: '89%', target: '95%' },
        ],
        initiatives: [
          'Pengedaran basket makanan bulanan',
          'Program tanaman komuniti',
          'Workshop pemakanan sihat',
        ],
      },
      {
        goalNumber: 3,
        title: 'Kesihatan dan Kesejahteraan',
        titleEn: 'Good Health and Well-being',
        color: '#4C9F38',
        alignmentLevel: 'UTAMA',
        alignmentScore: 80,
        contribution: 'Menyediakan akses perkhidmatan kesihatan asas kepada komuniti kurang bernasib baik melalui rakan strategik.',
        programmes: ['Klinik Kesihatan Komuniti', 'Program Kesihatan Mental'],
        metrics: [
          { name: 'Peserta dirawat', value: '156', target: '200' },
          { name: 'Kadar kepuasan', value: '87%', target: '90%' },
          { name: 'Sesi kesihatan/bulan', value: '2', target: '4' },
        ],
        initiatives: [
          'Klinik bergerak bersama Klinik Nurain',
          'Program pemeriksaan kesihatan percuma',
          'Sesi kaunseling komuniti',
        ],
      },
      {
        goalNumber: 4,
        title: 'Pendidikan Berkualiti',
        titleEn: 'Quality Education',
        color: '#C5192D',
        alignmentLevel: 'UTAMA',
        alignmentScore: 90,
        contribution: 'Menyediakan pendidikan prasekolah Islam berkualiti, kelas tilawah, dan bantuan pendidikan untuk anak-anak asnaf.',
        programmes: ['Pusat Sunnah Preschool', 'Bantuan Pendidikan', 'Kelas Tilawah Dewasa'],
        metrics: [
          { name: 'Pelajar prasekolah', value: '24', target: '30' },
          { name: 'Pelajar menerima bantuan', value: '67', target: '80' },
          { name: 'Peserta kelas tilawah', value: '67', target: '80' },
        ],
        initiatives: [
          'Pendidikan prasekolah berasaskan Al-Quran',
          'Bantuan buku dan alat tulis',
          'Kelas tambahan percuma',
        ],
      },
      {
        goalNumber: 8,
        title: 'Pekerjaan Wajar dan Pertumbuhan Ekonomi',
        titleEn: 'Decent Work and Economic Growth',
        color: '#A21942',
        alignmentLevel: 'SEKUNDER',
        alignmentScore: 65,
        contribution: 'Menggalakkan keusahawanan sosial dan kemahiran pekerjaan dalam kalangan belia dan wanita asnaf.',
        programmes: ['Mentoring Belia', 'Program Keusahawanan'],
        metrics: [
          { name: 'Belia dibimbing', value: '34', target: '50' },
          { name: 'Peserta keusahawanan', value: '18', target: '30' },
          { name: 'Perniagaan baharu', value: '5', target: '15' },
        ],
        initiatives: [
          'Program mentoring 1-on-1',
          'Bengkel keusahawanan asas',
          'Pembiayaan mikro kecil',
        ],
      },
      {
        goalNumber: 10,
        title: 'Kurang Ketidaksamaan',
        titleEn: 'Reduced Inequalities',
        color: '#DD1367',
        alignmentLevel: 'SEKUNDER',
        alignmentScore: 75,
        contribution: 'Mengurangkan jurang sosial-ekonomi melalui akses yang sama rata kepada pendidikan, kesihatan, dan bantuan kewangan.',
        programmes: ['Semua Program PUSPA'],
        metrics: [
          { name: 'Komuniti diliputi', value: '5', target: '8' },
          { name: 'Akses khidmat awam', value: '78%', target: '90%' },
          { name: 'Penyertaan wanita', value: '56%', target: '50%' },
        ],
        initiatives: [
          'Program inklusif tanpa diskriminasi',
          'Bantuan disasarkan berdasarkan keperluan',
          'Advokasi hak komuniti terpinggir',
        ],
      },
      {
        goalNumber: 11,
        title: 'Bandar dan Komuniti Mampan',
        titleEn: 'Sustainable Cities and Communities',
        color: '#FD9D24',
        alignmentLevel: 'SEKUNDER',
        alignmentScore: 58,
        contribution: 'Membina komuniti yang lebih kohesif dan mapan melalui program sosial dan aktiviti kejiranan.',
        programmes: ['Program Taman Komuniti', 'Gotong-Royong'],
        metrics: [
          { name: 'Komuniti aktif', value: '5', target: '8' },
          { name: 'Acara komuniti/tahun', value: '12', target: '20' },
          { name: 'Penyertaan jiran', value: '340', target: '500' },
        ],
        initiatives: [
          'Program gotong-royong bulanan',
          'Taman komuniti terkawal',
          'Program kejiranan sihat',
        ],
      },
      {
        goalNumber: 17,
        title: 'Perkongsian untuk Mencapai Matlamat',
        titleEn: 'Partnerships for the Goals',
        color: '#19486A',
        alignmentLevel: 'SEKUNDER',
        alignmentScore: 82,
        contribution: 'Membina rakan strategik dengan sektor swasta, agensi kerajaan, dan NGO lain untuk memaksimumkan kesan.',
        programmes: ['Program Rakan Strategik'],
        metrics: [
          { name: 'Rakan kongsi', value: '7', target: '12' },
          { name: 'Geran diperoleh', value: 'RM 38,500', target: 'RM 60,000' },
          { name: 'MOU aktif', value: '5', target: '8' },
        ],
        initiatives: [
          'Perkongsian dengan Klinik Nurain',
          'Kerjasama dengan Majlis Perbandaran',
          'Rangkaian NGO Kebajikan Hulu Klang',
        ],
      },
    ],
    insights: [
      'PUSPA menyumbang secara langsung kepada 4 SDG utama dan 4 SDG sokongan.',
      'Penjajaran terkuat ialah SDG 1 (Tiada Kemiskinan) dengan skor 92%.',
      'Perlu tingkatkan sumbangan kepada SDG 11 (Bandar Mampan) - skor paling rendah pada 58%.',
      'Cadangan: Menubuhkan jawatankuasa SDG khas untuk memantau dan melaporkan kemajuan secara berkala.',
    ],
  };
}

// ── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const searchParams = request.nextUrl.searchParams;
    const rawType = searchParams.get('type');

    const { type } = querySchema.parse({ type: rawType });

    let data;
    switch (type as AnalyticsType) {
      case 'donor_churn':
        data = getDonorChurnData();
        break;
      case 'fraud_detection':
        data = getFraudDetectionData();
        break;
      case 'programme_effectiveness':
        data = getProgrammeEffectivenessData();
        break;
      case 'sdg_alignment':
        data = getSDGAlignmentData();
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Jenis analitik tidak sah. Pilih dari: ${validTypes.join(', ')}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak sah', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in AI analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menjana analitik AI' },
      { status: 500 }
    );
  }
}
