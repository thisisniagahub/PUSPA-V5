import type { ViewId } from '@/types'

export interface QuickAction {
  id: string
  label: string
  query: string
  category: 'query' | 'action' | 'navigate' | 'crud'
}

export const QUICK_ACTIONS: Partial<Record<string, QuickAction[]>> = {
  dashboard: [
    { id: 'da-1', label: '📊 Ringkasan organisasi', query: 'Berikan ringkasan keseluruhan PUSPA', category: 'query' },
    { id: 'da-2', label: '💰 Jumlah donasi', query: 'Berapa jumlah donasi yang diterima?', category: 'query' },
    { id: 'da-3', label: '📋 Kes tertunggak', query: 'Berapa kes yang masih menunggu tindakan?', category: 'query' },
    { id: 'da-4', label: '👥 Status ahli', query: 'Berapa jumlah ahli asnaf aktif?', category: 'query' },
    { id: 'da-5', label: '🚨 Risiko & amaran', query: 'Apakah risiko dan isu yang perlu perhatian segera?', category: 'query' },
  ],
  members: [
    { id: 'me-1', label: '📊 Status ahli', query: 'Berapa jumlah ahli aktif dan tidak aktif?', category: 'query' },
    { id: 'me-2', label: '🔍 Cari ahli', query: 'Cari ahli bernama ', category: 'query' },
    { id: 'me-3', label: '📈 Pendapatan purata', query: 'Apakah purata pendapatan ahli asnaf?', category: 'query' },
    { id: 'me-4', label: '➕ Daftar ahli baru', query: 'Saya nak daftarkan ahli asnaf baru', category: 'crud' },
  ],
  cases: [
    { id: 'ca-1', label: '📊 Status kes', query: 'Berapa kes mengikut status?', category: 'query' },
    { id: 'ca-2', label: '🚨 Kes urgent', query: 'Senaraikan kes yang urgent', category: 'query' },
    { id: 'ca-3', label: '📋 Kes tertunggak', query: 'Senaraikan kes yang masih tertunggak', category: 'query' },
    { id: 'ca-4', label: '➕ Buat kes baru', query: 'Saya nak buat kes bantuan baru', category: 'crud' },
    { id: 'ca-5', label: '⚡ Proses kelulusan', query: 'Proses kelulusan kes yang menunggu', category: 'action' },
  ],
  donations: [
    { id: 'do-1', label: '💰 Ringkasan donasi', query: 'Berikan ringkasan donasi', category: 'query' },
    { id: 'do-2', label: '📅 Bulan ini', query: 'Berapa jumlah donasi bulan ini?', category: 'query' },
    { id: 'do-3', label: '📊 Mengikut jenis', query: 'Pecahan donasi mengikut jenis dana', category: 'query' },
    { id: 'do-4', label: '📈 Trend donasi', query: 'Analisis trend donasi 6 bulan terakhir', category: 'query' },
    { id: 'do-5', label: '➕ Rekod donasi', query: 'Saya nak rekodkan donasi baru', category: 'crud' },
  ],
  donors: [
    { id: 'dr-1', label: '📊 Ringkasan penderma', query: 'Berapa jumlah penderma aktif?', category: 'query' },
    { id: 'dr-2', label: '📈 Mengikut segmen', query: 'Penderma mengikut segmen', category: 'query' },
    { id: 'dr-3', label: '➕ Tambah penderma', query: 'Saya nak tambah penderma baru', category: 'crud' },
  ],
  programmes: [
    { id: 'pr-1', label: '📋 Program aktif', query: 'Senaraikan semua program aktif', category: 'query' },
    { id: 'pr-2', label: '💰 Bajet program', query: 'Berapa bajet dan perbelanjaan program?', category: 'query' },
    { id: 'pr-3', label: '➕ Buat program', query: 'Saya nak buat program baru', category: 'crud' },
  ],
  compliance: [
    { id: 'co-1', label: '📊 Status pematuhan', query: 'Apakah status pematuhan semasa?', category: 'query' },
    { id: 'co-2', label: '⚠️ Item tertunggak', query: 'Item pematuhan mana yang belum selesai?', category: 'query' },
  ],
  volunteers: [
    { id: 'vo-1', label: '📊 Status sukarelawan', query: 'Berapa jumlah sukarelawan aktif?', category: 'query' },
    { id: 'vo-2', label: '⏱️ Jumlah jam', query: 'Berapa jumlah jam sukarelawan?', category: 'query' },
    { id: 'vo-3', label: '➕ Daftar sukarelawan', query: 'Saya nak daftarkan sukarelawan baru', category: 'crud' },
  ],
  disbursements: [
    { id: 'di-1', label: '📊 Status pembayaran', query: 'Berapa pembayaran mengikut status?', category: 'query' },
    { id: 'di-2', label: '⚠️ Pembayaran tertunggak', query: 'Senaraikan pembayaran yang tertunggak', category: 'query' },
    { id: 'di-3', label: '➕ Buat pembayaran', query: 'Saya nak buat pembayaran baru', category: 'crud' },
  ],
  activities: [
    { id: 'ac-1', label: '📊 Status aktiviti', query: 'Berapa aktiviti mengikut status?', category: 'query' },
    { id: 'ac-2', label: '➕ Tambah aktiviti', query: 'Saya nak tambah aktiviti baru', category: 'crud' },
  ],
  documents: [
    { id: 'dc-1', label: '📊 Dokumen mengikut kategori', query: 'Senaraikan dokumen mengikut kategori', category: 'query' },
  ],
  reports: [
    { id: 'rp-1', label: '📊 Laporan bulanan', query: 'Jana laporan bulanan donasi', category: 'query' },
    { id: 'rp-2', label: '📈 Trend tahunan', query: 'Analisis trend tahun ini', category: 'query' },
  ],
}

export const UNIVERSAL_QUICK_ACTIONS: QuickAction[] = [
  { id: 'u-1', label: '📋 Semak Status Kes', query: 'Semak status kes bantuan yang menunggu tindakan', category: 'query' },
  { id: 'u-2', label: '💰 Status Bantuan', query: 'Berapa jumlah bantuan yang telah disalurkan bulan ini?', category: 'query' },
  { id: 'u-3', label: '🏫 Bantuan Program', query: 'Senaraikan program bantuan yang tersedia', category: 'query' },
  { id: 'u-4', label: '👨‍💼 Hubungi Pentadbir', query: 'Saya perlukan bantuan pentadbir', category: 'action' },
]

export function getQuickActions(viewId: string): QuickAction[] {
  const moduleActions = QUICK_ACTIONS[viewId] || []
  return [...moduleActions, ...UNIVERSAL_QUICK_ACTIONS]
}
