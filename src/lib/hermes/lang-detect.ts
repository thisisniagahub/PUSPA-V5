export function detectLocale(text: string): 'ms' | 'en' {
  const malayWords = /\b(berapa|siapa|mana|bila|kenapa|macam|tolong|tambah|buka|cari|senarai|jumlah|ahli|kes|derma|donasi|penderma|sukarelawan|program|bantuan|bulan|aktif|baru|semua|nak|saya|kita|buat|dah|lagi|dengan|untuk|dia|mereka|ada|tak|ini|itu|kami|anda|boleh|takboleh|takde|xde|xda)\b/i
  return malayWords.test(text) ? 'ms' : 'en'
}
