import type { ViewId } from '@/types'

export const MODULE_DESCRIPTIONS: Record<string, { label: string; description: string; actions?: string[] }> = {
  dashboard: {
    label: 'Dashboard',
    description: 'Gambaran keseluruhan statistik dan aktiviti PUSPA',
    actions: ['Lihat ringkasan organisasi', 'Semak statistik semua modul', 'Analisis trend'],
  },
  members: {
    label: 'Ahli Asnaf',
    description: 'Pengurusan profil dan data ahli asnaf yang berdaftar',
    actions: ['Cari ahli', 'Daftar ahli baru', 'Kemaskini maklumat ahli', 'Lihat profil lengkap', 'Semak status eKYC'],
  },
  cases: {
    label: 'Kes Bantuan',
    description: 'Permohonan dan pengurusan kes bantuan zakat, sedekah, wakaf — aliran kerja 12 langkah',
    actions: ['Cari kes', 'Buat kes baru', 'Kemaskini status kes', 'Tambah nota kes', 'Proses kelulusan', 'Lihat butiran lengkap'],
  },
  programmes: {
    label: 'Program Inkubasi',
    description: 'Program pembangunan dan bantuan asnaf',
    actions: ['Senarai program', 'Buat program baru', 'Kemaskini program', 'Semak bajet dan perbelanjaan'],
  },
  donations: {
    label: 'Donasi',
    description: 'Rekod dan pengurusan sumbangan kewangan (zakat, sedekah, wakaf, infak)',
    actions: ['Ringkasan donasi', 'Rekod donasi baru', 'Analisis trend', 'Pecahan mengikut jenis dana'],
  },
  donors: {
    label: 'Penderma',
    description: 'CRM dan pengurusan hubungan penderma',
    actions: ['Cari penderma', 'Tambah penderma baru', 'Analisis segmen', 'Semak sejarah sumbangan'],
  },
  disbursements: {
    label: 'Pembayaran',
    description: 'Pengurusan pembayaran bantuan kepada penerima',
    actions: ['Senarai pembayaran', 'Buat pembayaran baru', 'Lulus pembayaran', 'Semak pembayaran tertunggak'],
  },
  volunteers: {
    label: 'Sukarelawan',
    description: 'Pengurusan sukarelawan dan penempatan',
    actions: ['Cari sukarelawan', 'Daftar sukarelawan baru', 'Rekod jam sukarelawan', 'Penempatan sukarelawan'],
  },
  activities: {
    label: 'Aktiviti',
    description: 'Pengurusan aktiviti dan operasi harian (Kanban board)',
    actions: ['Senarai aktiviti', 'Buat aktiviti baru', 'Kemaskini status aktiviti'],
  },
  compliance: {
    label: 'Pematuhan',
    description: 'Senarai semak pematuhan peraturan dan audit (ROS, LHDN, PDPA)',
    actions: ['Semak status pematuhan', 'Tandakan item selesai', 'Senarai item tertunggak'],
  },
  documents: {
    label: 'Dokumen',
    description: 'Pengurusan dokumen organisasi',
    actions: ['Senarai dokumen', 'Dokumen mengikut kategori'],
  },
  reports: {
    label: 'Laporan Kewangan',
    description: 'Laporan dan analisis kewangan',
    actions: ['Jana laporan', 'Laporan bulanan', 'Analisis trend', 'Penilaian risiko'],
  },
  admin: {
    label: 'Pentadbiran',
    description: 'Tetapan dan konfigurasi sistem',
    actions: ['Jejak audit', 'Notifikasi', 'Pengguna'],
  },
  ekyc: {
    label: 'eKYC',
    description: 'Pengesahan identiti elektronik ahli (IC, selfie, liveness)',
    actions: ['Status pengesahan', 'Statistik eKYC'],
  },
  tapsecure: {
    label: 'TapSecure',
    description: 'Keselamatan biometrik dan pengikatan peranti',
    actions: ['Log keselamatan', 'Peranti diikat'],
  },
  'agihan-bulan': { label: 'Agihan Bulan', description: 'Agihan makan ruji bulanan kepada asnaf' },
  'sedekah-jumaat': { label: 'Sedekah Jumaat', description: 'Pengurusan program Sedekah Jumaat' },
  'gudang-barangan': { label: 'Gudang Barangan', description: 'Inventori dan pengurusan barangan bantuan' },
  asnafpreneur: { label: 'Asnafpreneur', description: 'Program keusahawanan digital asnaf' },
  'kelas-ai': { label: 'Kelas AI', description: 'Kelas AI dan Vibe Coding untuk asnaf' },
  'ops-conductor': { label: 'Ops Conductor', description: 'Pengendali operasi berkuasa AI' },
  ai: { label: 'Alat AI', description: 'Alat AI dan analitik lanjutan' },
  docs: { label: 'Panduan', description: 'Dokumentasi dan panduan sistem' },
  'openclaw-mcp': { label: 'Pelayan MCP', description: 'MCP server management' },
  'openclaw-plugins': { label: 'Plugin', description: 'Plugin management' },
  'openclaw-integrations': { label: 'Sambungan', description: 'Gateway & integrasi saluran' },
  'openclaw-terminal': { label: 'Konsol Operator', description: 'Konsol terminal operator' },
  'openclaw-agents': { label: 'Ejen AI', description: 'Pengurusan ejen AI' },
  'openclaw-models': { label: 'Enjin Model', description: 'Pengurusan enjin model LLM' },
  'openclaw-automation': { label: 'Automasi', description: 'Automasi dan pengurusan cron' },
  'openclaw-graph': { label: 'Graf Visual', description: 'Penjelajah graf visual' },
}

export function getModuleDescription(viewId: string): { label: string; description: string; actions?: string[] } {
  return MODULE_DESCRIPTIONS[viewId] || { label: viewId, description: 'Modul tidak dikenali' }
}
