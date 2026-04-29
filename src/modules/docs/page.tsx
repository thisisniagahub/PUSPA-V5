'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Rocket,
  UserPlus,
  Monitor,
  Package,
  Users,
  FileText,
  Heart,
  HandCoins,
  Banknote,
  BarChart3,
  Kanban,
  UserCheck,
  Gift,
  FolderOpen,
  ShieldCheck,
  ScanFace,
  Fingerprint,
  Sparkles,
  GraduationCap,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Building2,
  Landmark,
  FileBadge,
  Lock,
  Database,
  Webhook,
  Code,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// ============================================================================
// Types & Navigation Data
// ============================================================================

interface DocPage {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  content: React.ReactNode;
}

interface DocCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  pages: DocPage[];
}

// ============================================================================
// Rich Content Components
// ============================================================================

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6 mt-2">
      {children}
    </h1>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-10 mb-4 border-b border-border pb-2">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">{children}</h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground mb-4">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1.5 mb-4 text-sm text-muted-foreground ml-2">{children}</ul>;
}

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-1.5 mb-4 text-sm text-muted-foreground ml-2">{children}</ol>;
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

function StepBox({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-4 p-4 rounded-lg border border-purple-100 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/20">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold">
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'tip' | 'warning';
  children: React.ReactNode;
}) {
  const config = {
    info: {
      icon: <Info className="h-4 w-4" />,
      bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'Maklumat',
    },
    tip: {
      icon: <Lightbulb className="h-4 w-4" />,
      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'Petua',
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'Amaran',
    },
  };
  const c = config[type];
  return (
    <div className={`flex gap-3 rounded-lg border p-4 mb-4 ${c.bg}`}>
      <div className={`shrink-0 mt-0.5 ${c.iconColor}`}>{c.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground mb-1">{c.title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-zinc-900 text-zinc-100 p-4 text-xs font-mono overflow-x-auto mb-4 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4 rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuccessItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start text-sm text-muted-foreground mb-2">
      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ============================================================================
// All Documentation Content (Bahasa Melayu)
// ============================================================================

const DOC_CATEGORIES: DocCategory[] = [
  // ── Mula Di Sini ──
  {
    id: 'mula',
    icon: <Rocket className="h-4 w-4" />,
    title: 'Mula Di Sini',
    pages: [
      {
        id: 'pengenalan',
        title: 'Pengenalan PUSPACare',
        badge: 'Baharu',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        content: (
          <>
            <H1>Pengenalan PUSPACare</H1>
            <P>
              <strong className="text-foreground">PUSPACare</strong> ialah platform pengurusan NGO bersepadu yang dibangunkan khas untuk Pertubuhan Urus Peduli Asnaf (PUSPA) KL &amp; Selangor. Platform ini direka untuk menstrukturkan operasi harian pertubuhan berasaskan teknologi moden yang selamat, cekap, dan mudah digunakan.
            </P>
            <H2>Mengapa PUSPACare?</H2>
            <P>
              Pengurusan NGO di Malaysia sering menghadapi cabaran seperti pengumpulan data asnaf yang tidak tersusun, kelewatan pemprosesan bantuan, kekurangan laporan kewangan telus, dan pematuhan regulasi yang rumit. PUSPACare menyelesaikan masalah ini dengan menyediakan satu platform terpusat yang mengintegrasikan semua fungsi operasi pertubuhan.
            </P>
            <DocTable
              headers={['Ciri Utama', 'Penerangan', 'Manfaat']}
              rows={[
                ['Pengurusan Ahli Asnaf', 'Daftar, urus, dan jejak profil asnaf secara bersepadu', 'Data tersusun, senang dicari'],
                ['Aliran Kerja Kes', '12 peringkat aliran kerja dari permohonan hingga penutupan', 'Proses telus dan boleh diaudit'],
                ['Pengurusan Donasi', 'Pengasingan dana Zakat, Sedekah, Wakaf, dan Infaq (ISF)', 'Pematuhan Syariah terjamin'],
                ['eKYC & TapSecure', 'Pengesahan identiti digital dan pengurusan peranti', 'Keselamatan peringkat bank'],
                ['AI & Automasi', 'Penjanaan dokumen, analisis risiko, dan bantuan cerdas', 'Jimat masa, kurangkan ralat manusia'],
                ['Dashboard Compliance', 'Pemantauan pematuhan LHDN, BNM, ROS, dan PDPA', 'Sentiasa patuh regulasi'],
              ]}
            />
            <H2>Seni Bina Sistem</H2>
            <P>
              PUSPACare dibina menggunakan seni bina klien-pelayan moden dengan Next.js di bahagian hadapan dan Prisma ORM untuk interaksi pangkalan data. Semua data disimpan secara selamat dengan penyulitan hujung-ke-hujung (end-to-end encryption) dan kawalan akses berasaskan peranan (RBAC). Platform ini menyokong mod cerah dan gelap, reka bentuk responsif untuk peranti mudah alih, dan integrasi dengan pelbagai perkhidmatan pihak ketiga melalui API yang terbuka.
            </P>
            <Callout type="info">
              PUSPACare adalah projek sumber terbuka di bawah lesen MIT. Kod sumber boleh diakses oleh ahli pertubuhan untuk tujuan pengauditan dan penambahbaikan. Sila hubungi pasukan teknikal untuk mendapatkan akses repositori.
            </Callout>
            <H2>Peranan Pengguna</H2>
            <P>Platform ini menyokong empat peranan pengguna utama:</P>
            <UL>
              <LI><strong className="text-foreground">Pentadbir (Admin)</strong> — Akses penuh kepada semua modul, pengurusan pengguna, dan konfigurasi sistem.</LI>
              <LI><strong className="text-foreground">Operasi (Ops)</strong> — Menguruskan ahli asnaf, kes, dan program harian.</LI>
              <LI><strong className="text-foreground">Kewangan (Finance)</strong> — Menguruskan donasi, pembayaran, dan laporan kewangan.</LI>
              <LI><strong className="text-foreground">Sukarelawan (Volunteer)</strong> — Melihat tugasan, log jam khidmat, dan muat naik sijil.</LI>
            </UL>
            <Callout type="tip">
              Jika anda baru mula menggunakan PUSPACare, kami mengesyorkan agar anda membaca panduan <strong>Daftar &amp; Log Masuk</strong> terlebih dahulu untuk memahami cara mengakses sistem.
            </Callout>
          </>
        ),
      },
      {
        id: 'daftar-logmasuk',
        title: 'Daftar & Log Masuk',
        content: (
          <>
            <H1>Daftar &amp; Log Masuk</H1>
            <P>
              Untuk mula menggunakan PUSPACare, anda memerlukan akaun pengguna yang telah didaftarkan oleh pentadbir sistem. Proses pendaftaran dan pengesahan direka untuk memastikan hanya kakitangan yang sah dapat mengakses data sensitif asnaf dan kewangan pertubuhan.
            </P>
            <H2>Cara Mendaftar Akaun Baru</H2>
            <P>Pendaftaran akaun baharu hanya boleh dilakukan oleh pentadbir sistem. Jika anda adalah kakitangan baharu, sila ikuti langkah berikut:</P>
            <StepBox step={1} title="Hubungi Pentadbir Sistem">
              Berikan nama penuh, alamat e-mel rasmi pertubuhan, dan nombor telefon kepada pentadbir. Pentadbir akan mencipta akaun sementara untuk anda.
            </StepBox>
            <StepBox step={2} title="Semak E-mel Pengesahan">
              Anda akan menerima e-mel pengesahan dari sistem PUSPACare. Klik pautan pengesahan dalam tempoh 24 jam untuk mengaktifkan akaun anda.
            </StepBox>
            <StepBox step={3} title="Tetapkan Kata Laluan">
              Selepas pengesahan, anda akan diarahkan ke halaman tetapan kata laluan. Pilih kata laluan yang kuat dengan sekurang-kurangnya 8 aksara, termasuk huruf besar, huruf kecil, nombor, dan aksara khas.
            </StepBox>
            <StepBox step={4} title="Lengkapkan Profil">
              Log masuk dan lengkapkan profil anda dengan memuat naik gambar profil dan mengemas kini maklumat peribadi. Profil yang lengkap membantu pasukan mengenali anda di seluruh sistem.
            </StepBox>
            <H2>Cara Log Masuk</H2>
            <OL>
              <LI>Buka penyemak imbas web dan pergi ke URL rasmi PUSPACare yang diberikan oleh pentadbir.</LI>
              <LI>Masukkan alamat e-mel yang didaftarkan di medan e-mel.</LI>
              <LI>Masukkan kata laluan anda di medan kata laluan.</LI>
              <LI>Klik butang &quot;Log Masuk&quot; atau tekan kekunci Enter.</LI>
              <LI>Jika berjaya, anda akan dibawa ke halaman Dashboard utama.</LI>
            </OL>
            <H2>Penyelesaian Masalah</H2>
            <DocTable
              headers={['Masalah', 'Penyelesaian']}
              rows={[
                ['Lupa kata laluan', 'Klik "Lupa Kata Laluan" di halaman log masuk. Masukkan e-mel dan ikut arahan dalam e-mel yang diterima.'],
                ['Akaun dikunci', 'Akaun akan dikunci selepas 5 percubaan gagal. Hubungi pentadbir untuk membuka kunci.'],
                ['Pautan pengesahan tamat', 'Pautan sah selama 24 jam. Hubungi pentadbir untuk menghantar semula pautan baharu.'],
                ['Halaman kosong / ralat', 'Kosongkan cache penyemak imbas dan cuba lagi. Gunakan Chrome atau Firefox versi terkini.'],
              ]}
            />
            <Callout type="warning">
              Jangan sekali-kali berkongsi kata laluan anda dengan sesiapa. PUSPACare tidak akan meminta kata laluan anda melalui e-mel, telefon, atau mesej. Sekiranya anda mengesyaki akaun anda telah diakses secara tidak sah, segera hubungi pentadbir dan tukar kata laluan anda.
            </Callout>
          </>
        ),
      },
      {
        id: 'panduan-antaramuka',
        title: 'Panduan Antaramuka',
        content: (
          <>
            <H1>Panduan Antaramuka Pengguna</H1>
            <P>
              Antaramuka PUSPACare direka dengan pendekatan modular yang membolehkan anda menavigasi antara modul yang berbeza dengan pantas. Panduan ini menerangkan komponen utama antaramuka dan cara menggunakannya dengan berkesan.
            </P>
            <H2>Layout Utama</H2>
            <P>Antaramuka PUSPACare terbahagi kepada empat kawasan utama:</P>
            <OL>
              <LI><strong className="text-foreground">Bar Sisi (Sidebar)</strong> — Navigasi utama di sebelah kiri skrin. Mengandungi semua modul yang dikumpulkan mengikut kategori seperti Utama, Compliance, Pengurusan, dan AI &amp; Automasi.</LI>
              <LI><strong className="text-foreground">Pengepala (Header)</strong> — Bar atas yang menunjukkan modul semasa, butang tema cerah/gelap, dan profil pengguna.</LI>
              <LI><strong className="text-foreground">Kandungan Utama</strong> — Kawasan tengah yang memaparkan kandungan modul yang aktif. Semua operasi harian dilakukan di sini.</LI>
              <LI><strong className="text-foreground">Kaki (Footer)</strong> — Menunjukkan maklumat versi dan pendaftaran pertubuhan.</LI>
            </OL>
            <H2>Bar Sisi Navigasi</H2>
            <P>
              Bar sisi mengandungi senarai semua modul yang tersedia mengikut peranan pengguna anda. Modul yang tidak dapat diakses oleh peranan anda akan disembunyikan secara automatik. Klik pada mana-mana item untuk navigasi ke modul tersebut. Item aktif akan diserlahkan dengan warna ungu dan teks putih.
            </P>
            <Callout type="tip">
              Gunakan pintasan papan kekunci <strong>Ctrl+K</strong> (Windows/Linux) atau <strong>Cmd+K</strong> (Mac) untuk membuka palet arahan. Taip nama modul untuk navigasi dengan pantas tanpa menggunakan tetikus.
            </Callout>
            <H2>Operasi Biasa</H2>
            <P>Kebanyakan modul berkongsi corak interaksi yang sama untuk kemudahan penggunaan:</P>
            <UL>
              <LI><strong className="text-foreground">Jadual Data</strong> — Senarai data dipaparkan dalam jadual dengan lajur yang boleh disusun. Gunakan medan carian di atas jadual untuk menapis data.</LI>
              <LI><strong className="text-foreground">Butang Tindakan</strong> — Butang &quot;Tambah Baharu&quot; untuk mencipta rekod, dan butang tindakan pada setiap baris untuk mengedit, memadam, atau melihat butiran.</LI>
              <LI><strong className="text-foreground">Dialog</strong> — Operasi seperti tambah dan edit dibuka dalam dialog modal yang tidak mengubah halaman semasa.</LI>
              <LI><strong className="text-foreground">Toast Notifikasi</strong> — Pemberitahuan operasi berjaya atau gagal dipaparkan di sudut kanan atas skrin secara automatik.</LI>
            </UL>
            <H2>Mod Cerah &amp; Gelap</H2>
            <P>
              PUSPACare menyokong mod cerah dan gelap. Untuk menukar tema, klik butang matahari/bulan di pengepala. Keutamaan anda akan disimpan secara automatik dan digunakan semasa lawatan seterusnya. Mod gelap sesuai untuk penggunaan pada waktu malam dan mengurangkan ketegangan mata.
            </P>
            <Callout type="info">
              PUSPACare direka menggunakan prinsip reka bentuk responsif. Semua modul boleh diakses dari komputer riba, tablet, dan telefon pintar. Pada peranti mudah alih, bar sisi akan ditukar kepada menu helaian yang boleh dibuka melalui butang menu di pengepala.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Modul Teras ──
  {
    id: 'modul-teras',
    icon: <Package className="h-4 w-4" />,
    title: 'Modul Teras',
    pages: [
      {
        id: 'modul-ahli-asnaf',
        title: 'Pengurusan Ahli Asnaf',
        badge: 'Teras',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        content: (
          <>
            <H1>Pengurusan Ahli Asnaf</H1>
            <P>
              Modul Pengurusan Ahli Asnaf adalah komponen teras PUSPACare yang membolehkan pertubuhan mendaftar, mengurus, dan menjejak profil semua penerima bantuan (asnaf) secara bersepadu. Setiap ahli asnaf akan diberikan nombor ahli unik dalam format <strong className="text-foreground">PUSPA-XXXX</strong> untuk pengenalan mudah.
            </P>
            <H2>Ciri-ciri Utama</H2>
            <SuccessItem>Daftar ahli asnaf dengan maklumat peribadi, kewangan, dan keluarga yang lengkap</SuccessItem>
            <SuccessItem>Jejaki status ahli: aktif, tidak aktif, atau digantung</SuccessItem>
            <SuccessItem>Pengurusan ahli isi rumah dengan hubungan, pekerjaan, dan status OKU</SuccessItem>
            <SuccessItem>Cari dan tapis ahli mengikut nama, nombor IC, status, atau mana-mana medan</SuccessItem>
            <SuccessItem>Integrasi dengan modul eKYC untuk pengesahan identiti digital</SuccessItem>
            <H2>Cara Menambah Ahli Baharu</H2>
            <StepBox step={1} title="Buka Modul Ahli Asnaf">
              Klik pada item &quot;Ahli Asnaf&quot; di bar sisi navigasi atau gunakan Ctrl+K dan taip &quot;ahli&quot;.
            </StepBox>
            <StepBox step={2} title="Klik Butang Tambah">
              Klik butang &quot;Tambah Ahli&quot; di bahagian atas halaman untuk membuka borang pendaftaran.
            </StepBox>
            <StepBox step={3} title="Isi Maklumat Peribadi">
              Masukkan nama penuh, nombor kad pengenalan (IC), nombor telefon, alamat e-mel, dan alamat penuh. Medan bertanda * adalah wajib.
            </StepBox>
            <StepBox step={4} title="Isi Maklumat Kewangan">
              Masukkan saiz isi rumah, pendapatan bulanan, status perkahwinan, dan pekerjaan. Maklumat ini digunakan untuk penilaian kelayakan asnaf.
            </StepBox>
            <StepBox step={5} title="Simpan Rekod">
              Klik butang &quot;Simpan&quot;. Nombor ahli PUSPA-XXXX akan dijana secara automatik. Anda akan menerima pemberitahuan kejayaan.
            </StepBox>
            <Callout type="warning">
              Pastikan nombor IC yang dimasukkan adalah unik. Sistem tidak membenarkan penduaan nombor IC. Sekiranya ahli telah wujud, gunakan fungsi carian untuk mencari dan mengemas kini rekod sedia ada.
            </Callout>
            <H2>Penapisan &amp; Carian</H2>
            <P>
              Jadual ahli asnaf menyokong carian teks percuma yang mencari merentasi nama, nombor ahli, e-mel, telefon, dan IC. Anda juga boleh menapis mengikut status (aktif/tidak aktif/digantung) menggunakan butang penapis di atas jadual. Klik pada header lajur untuk menyusun data mengikut lajur tersebut.
            </P>
            <DocTable
              headers={['Medan', 'Jenis', 'Penerangan']}
              rows={[
                ['Nama', 'Teks', 'Nama penuh asnaf seperti dalam IC'],
                ['No. IC', 'Teks (unik)', 'Nombor kad pengenalan tanpa sengkang'],
                ['No. Telefon', 'Teks', 'Nombor telefon untuk dihubungi'],
                ['E-mel', 'Teks', 'Alamat e-mel (tidak wajib)'],
                ['Status', 'Enum', 'Aktif / Tidak Aktif / Digantung'],
                ['Pendapatan Bulanan', 'Nombor', 'Pendapatan kasar dalam RM'],
                ['Saiz Isi Rumah', 'Integer', 'Bilangan orang dalam isi rumah'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'modul-kes',
        title: 'Pengurusan Kes',
        content: (
          <>
            <H1>Pengurusan Kes</H1>
            <P>
              Modul Pengurusan Kes menguruskan kes bantuan dari permohonan awal sehingga penutupan. Setiap kes mengikut aliran kerja 12 peringkat yang memastikan proses telus, boleh diaudit, dan mematuhi piawaian tadbir urus NGO. Nombor kes unik dalam format <strong className="text-foreground">CS-XXXX</strong> dijana secara automatik.
            </P>
            <H2>12 Peringkat Aliran Kerja</H2>
            <DocTable
              headers={['Peringkat', 'Penerangan', 'Tindakan']}
              rows={[
                ['Draf', 'Kes baru dicipta tetapi belum diserahkan', 'Isi maklumat, sertakan dokumen'],
                ['Diserahkan', 'Permohonan telah diserahkan untuk semakan', 'Menunggu verifikasi'],
                ['Mengesahkan', 'Dokumen dan maklumat sedang disemak', 'Sahkan atau minta maklumat tambahan'],
                ['Disahkan', 'Semua dokumen dan maklumat telah disahkan', 'Lulus ke penilaian'],
                ['Menilaian', 'Penilaian skor kelayakan sedang dijalankan', 'Isi skor verifikasi dan kebajikan'],
                ['Dinilai', 'Penilaian selesai, menunggu kelulusan', 'Semak skor sebelum kelulusan'],
                ['Diluluskan', 'Kes diluluskan oleh pihak berkuasa', 'Proses pembayaran'],
                ['Membayar', 'Pembayaran sedang diproses', 'Sahkan butiran pembayaran'],
                ['Dibayar', 'Bantuan telah disalurkan kepada asnaf', 'Jejaki penerimaan'],
                ['Susulan', 'Kes memerlukan pemantauan lanjut', 'Jadual lawatan susulan'],
                ['Ditutup', 'Kes telah selesai dengan jayanya', 'Arkib rekod'],
                ['Ditolak', 'Permohonan tidak memenuhi kriteria', 'Rekod sebab penolakan'],
              ]}
            />
            <H2>Penilaian Skor</H2>
            <P>Setiap kes dinilai menggunakan dua skor utama:</P>
            <UL>
              <LI><strong className="text-foreground">Skor Pengesahan (Verification Score)</strong> — Menilai ketepatan dan kelengkapan dokumen yang dikemukakan. Markah 0-100 berdasarkan ketepatan IC, bukti pendapatan, dan dokumen sokongan.</LI>
              <LI><strong className="text-foreground">Skor Kebajikan (Welfare Score)</strong> — Menilai tahap keperluan asnaf berdasarkan pendapatan, saiz isi rumah, status kesihatan, dan keadaan hidup. Markah 0-100.</LI>
            </UL>
            <Callout type="tip">
              Gunakan modul AI untuk mendapatkan cadangan skor automatik berdasarkan data ahli asnaf. AI akan menganalisis semua maklumat yang tersedia dan memberikan cadangan penilaian yang boleh anda ubah sebelum pengesahan.
            </Callout>
            <H2>Nota &amp; Dokumen Kes</H2>
            <P>
              Setiap kes menyokong pencatatan nota pelbagai jenis: nota umum, log panggilan telefon, laporan lawatan, dan penilaian. Anda juga boleh memuat naik dokumen sokongan seperti salinan IC, bukti pendapatan, laporan perubatan, dan gambar keadaan kediaman. Semua dokumen disimpan dengan selamat dan boleh dimuat turun pada bila-bila masa.
            </P>
          </>
        ),
      },
      {
        id: 'modul-program',
        title: 'Pengurusan Program',
        content: (
          <>
            <H1>Pengurusan Program</H1>
            <P>
              Modul Pengurusan Program membolehkan pertubuhan merancang, melaksana, dan memantau program bantuan dan aktiviti kebajikan. Setiap program dikategorikan mengikut jenis bantuan seperti bantuan makanan, pendidikan, latihan kemahiran, penjagaan kesihatan, bantuan kewangan, pembangunan komuniti, bantuan kecemasan, dan dakwah.
            </P>
            <H2>Jenis Program</H2>
            <DocTable
              headers={['Kategori', 'Contoh', 'Sasaran']}
              rows={[
                ['food_aid', 'Program Bekal Makanan, Soup Kitchen', 'Keluarga miskin bandar'],
                ['education', 'Tuisyen Anak Asnaf, Dana Peralatan Sekolah', 'Kanak-kanak asnaf'],
                ['skills_training', 'Kursus Kemahiran Digital, Kraftangan', 'Belia dan wanita asnaf'],
                ['healthcare', 'Klinik Percuma, Program Kesihatan', 'Warga emas dan OKU'],
                ['financial_assistance', 'Wakaf Tunai, Bantuan Kewangan Bulanan', 'Asnaf fakir dan miskin'],
                ['community', 'Program Komuniti, Gotong-Royong', 'Masyarakat setempat'],
                ['emergency_relief', 'Bantuan Mangsa Banjir, Kebakaran', 'Mangsa bencana'],
                ['dawah', 'Kelas Fardhu Ain, Program Dakwah', 'Masyarakat Islam'],
              ]}
            />
            <H2>Pengurusan Belanjawan</H2>
            <P>
              Setiap program mempunyai belanjawan yang ditetapkan dan jumlah perbelanjaan yang dijejak secara automatik. Sistem memaparkan perbezaan antara belanjawan dan perbelanjaan sebenar dalam bentuk bar kemajuan visual. Jika perbelanjaan mendekati atau melebihi had belanjawan, amaran akan dipaparkan.
            </P>
            <Callout type="info">
              Kaitkan program dengan kes dan donasi untuk pemantauan kesan yang tepat. Sistem secara automatik mengira jumlah penerima manfaat sebenar berdasarkan kes yang dikaitkan dengan program tersebut.
            </Callout>
            <H2>Metrik Impak</H2>
            <P>
              Modul ini menyokong penjejakan metrik impak untuk setiap program. Anda boleh merekodkan nilai yang dilaporkan sendiri dan nilai yang disahkan oleh pihak ketiga. Metrik impak yang dikumpulkan boleh digunakan dalam laporan tahunan dan laporan impak untuk penderma dan pihak berkuasa.
            </P>
          </>
        ),
      },
      {
        id: 'modul-donasi',
        title: 'Pengurusan Donasi',
        badge: 'ISF',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        content: (
          <>
            <H1>Pengurusan Donasi &amp; Pemisahan Dana (ISF)</H1>
            <P>
              Modul Pengurusan Donasi mengendalikan semua penerimaan sumbangan dengan pemisahan dana berdasarkan kategori Islam: Zakat, Sedekah, Wakaf, Infaq, dan Sumbangan Am. Pemisahan dana (Islamic Segregation of Funds — ISF) memastikan setiap ringgit yang diterima dikategorikan dengan betul mengikut hukum Syariah dan tidak bercampur antara satu sama lain.
            </P>
            <H2>Pemisahan Dana Islam (ISF)</H2>
            <P>Konsep ISF adalah kritikal dalam pengurusan kewangan NGO Islam:</P>
            <UL>
              <LI><strong className="text-foreground">Zakat</strong> — Dana wajib yang mesti diagihkan kepada lapan asnaf yang ditetapkan. Kategori zakat termasuk fitrah, harta, pendapatan, dan perniagaan. Setiap kutipan zakat direkodkan dengan pihak berkuasa zakat yang berkaitan.</LI>
              <LI><strong className="text-foreground">Sedekah</strong> — Sumbangan sukarela yang boleh diagihkan kepada mana-mana penerima yang memerlukan tanpa sekatan kategori.</LI>
              <LI><strong className="text-foreground">Wakaf</strong> — Aset atau dana yang diwakafkan secara kekal. Pendapatan dari wakaf boleh digunakan untuk program tertentu.</LI>
              <LI><strong className="text-foreground">Infaq</strong> — Perbelanjaan untuk kebajikan umum yang tidak terhad kepada asnaf tertentu.</LI>
              <LI><strong className="text-foreground">Sumbangan Am</strong> — Sumbangan yang tidak dikategorikan secara khusus mengikut hukum Islam.</LI>
            </UL>
            <H2>Kaedah Penerimaan</H2>
            <P>Donasi boleh diterima melalui pelbagai kaedah:</P>
            <DocTable
              headers={['Kaedah', 'Proses', 'Resit']}
              rows={[
                ['Tunai', 'Direkodkan secara manual oleh kakitangan', 'Resit dicetak/digital serta-merta'],
                ['Transfer Bank', 'Disahkan setelah pembayaran masuk ke akaun', 'Resit dijana selepas pengesahan'],
                ['Dalam Talian', 'Auto-direkodkan melalui gateway pembayaran', 'Resit e-mel dihantar automatik'],
                ['Cek', 'Direkodkan setelah cek ditunaikan', 'Resit dijana selepas penebusan'],
                ['E-Wallet', 'Direkodkan melalui integrasi API', 'Resit dihantar melalui aplikasi'],
              ]}
            />
            <Callout type="warning">
              Semua donasi mesti direkodkan pada hari yang sama ia diterima. Penangguhan rekod boleh menyebabkan ketidakcocokan dalam laporan kewangan. Pastikan nombor resit dijana secara berurutan tanpa jurang.
            </Callout>
          </>
        ),
      },
      {
        id: 'modul-pembayaran',
        title: 'Pengurusan Pembayaran',
        content: (
          <>
            <H1>Pengurusan Pembayaran (Disbursement)</H1>
            <P>
              Modul Pembayaran menguruskan pengagihan dana bantuan kepada asnaf dan pihak berkenaan. Setiap pembayaran dikaitkan dengan kes atau program tertentu dan memerlukan kelulusan sebelum diproses. Nombor pembayaran unik dalam format <strong className="text-foreground">DB-XXXX</strong> dijana secara automatik.
            </P>
            <H2>Aliran Kerja Pembayaran</H2>
            <StepBox step={1} title="Penciptaan">
              Pegawai operasi mencipta rekod pembayaran baru dengan butiran penerima, jumlah, dan tujuan pembayaran. Pembayaran boleh dikaitkan dengan kes tertentu.
            </StepBox>
            <StepBox step={2} title="Kelulusan">
              Pembayaran menunggu kelulusan dari pegawai yang berkuasa (biasanya Bendahari atau Penasihat). Pegawai boleh meluluskan atau menolak pembayaran dengan catatan alasan.
            </StepBox>
            <StepBox step={3} title="Pemprosesan">
              Selepas kelulusan, pembayaran diproses melalui kaedah yang dipilih (transfer bank, tunai, atau e-wallet). Status dikemas kini kepada &quot;Memproses&quot;.
            </StepBox>
            <StepBox step={4} title="Selesai">
              Setelah pembayaran berjaya disalurkan, status dikemas kini kepada &quot;Selesai&quot; dan resit boleh dimuat naik sebagai bukti. Tarikh pemprosesan direkodkan secara automatik.
            </StepBox>
            <Callout type="tip">
              Gunakan ciri penjadualan pembayaran untuk merancang pembayaran berkala seperti bantuan bulanan. Sistem akan mengingatkan anda apabila tarikh pembayaran mendekat.
            </Callout>
            <H2>Pematuhan &amp; Audit</H2>
            <P>
              Semua transaksi pembayaran direkodkan dalam log audit dengan butiran pengguna yang melaksanakan, tarikh, dan perubahan status. Laporan pembayaran boleh dijana mengikut tempoh, program, kaedah pembayaran, atau status. Rekod ini penting untuk tujuan audit dan pematuhan LHDN.
            </P>
          </>
        ),
      },
      {
        id: 'modul-aktiviti',
        title: 'Pengurusan Aktiviti',
        content: (
          <>
            <H1>Pengurusan Aktiviti</H1>
            <P>
              Modul Aktiviti menyediakan papan Kanban yang intuitif untuk menguruskan tugas, acara, mesyuarat, dan kerja lapangan. Tugasan boleh dialih antara lajur status (Dirancang, Sedang Dijalankan, Selesai, Dibatalkan) dengan seret dan lepasy (drag-and-drop) untuk pengurusan projek yang visual dan efisien.
            </P>
            <H2>Jenis Aktiviti</H2>
            <UL>
              <LI><strong className="text-foreground">Tugas (Task)</strong> — Kerja harian yang perlu diselesaikan seperti menghubungi asnaf, menyediakan dokumen, atau mengemas kini rekod.</LI>
              <LI><strong className="text-foreground">Acara (Event)</strong> — Acara terancang seperti program bantuan, ceramah, atau gotong-royong yang mempunyai tarikh dan lokasi tertentu.</LI>
              <LI><strong className="text-foreground">Mesyuarat (Meeting)</strong> — Sesi perbincangan dalaman atau dengan pihak luar yang memerlukan penyediaan agenda dan minit mesyuarat.</LI>
              <LI><strong className="text-foreground">Kerja Lapangan (Fieldwork)</strong> — Lawatan ke kediaman asnaf, penilaian tapak, atau kerja-kerja di lokasi luar pejabat.</LI>
            </UL>
            <H2>Ciri Papan Kanban</H2>
            <P>Papan Kanban membolehkan pengurusan tugasan secara visual:</P>
            <SuccessItem>Lajur status boleh diubah mengikut keperluan projek</SuccessItem>
            <SuccessItem>Seret dan lepasy kad antara lajur untuk mengemas kini status</SuccessItem>
            <SuccessItem>Kaitkan aktiviti dengan program tertentu untuk penjejakan</SuccessItem>
            <SuccessItem>Tetapkan tugasan kepada anggota pasukan dengan medan penugasan</SuccessItem>
            <SuccessItem>Tetapkan tarikh mula dan tamat untuk penjejakan masa</SuccessItem>
            <Callout type="info">
              Gunakan modul Aktiviti bersama modul Sukarelawan untuk pengurusan penempatan sukarelawan. Kaitkan aktiviti dengan sukarelawan tertentu untuk menjejak komitmen dan sumbangan masa khidmat.
            </Callout>
          </>
        ),
      },
      {
        id: 'modul-sukarelawan',
        title: 'Pengurusan Sukarelawan',
        content: (
          <>
            <H1>Pengurusan Sukarelawan</H1>
            <P>
              Modul Pengurusan Sukarelawan menguruskan profil, penempatan, jam khidmat, dan sijil penghargaan bagi semua sukarelawan pertubuhan. Setiap sukarelawan diberikan nombor unik dalam format <strong className="text-foreground">VOL-XXXX</strong> dan profil lengkap yang merangkumi kemahiran, ketersediaan, dan rekod khidmat.
            </P>
            <H2>Profil Sukarelawan</H2>
            <P>Rekod profil merangkumi maklumat berikut:</P>
            <DocTable
              headers={['Medan', 'Penerangan', 'Contoh']}
              rows={[
                ['Nama & IC', 'Maklumat peribadi asas', 'Ahmad bin Ali, 900101-XX-XXXX'],
                ['Kemahiran', 'Senarai kemahiran yang dimiliki', 'Mengajar, Perubatan, Memandu'],
                ['Ketersediaan', 'Masa yang tersedia untuk khidmat', 'Hari minggu, Bila-bila masa'],
                ['Jam Khidmat', 'Jumlah keseluruhan jam khidmat', '156.5 jam'],
                ['Status', 'Status semasa sukarelawan', 'Aktif / Tidak Aktif / Senarai Hitam'],
              ]}
            />
            <H2>Log Jam Khidmat</H2>
            <P>
              Sukarelawan atau penyelaras boleh merekodkan jam khidmat selepas setiap sesi penempatan. Setiap log memerlukan tarikh, bilangan jam, dan penerangan aktiviti yang dilakukan. Log perlu diluluskan oleh penyelaras program sebelum dimasukkan ke jumlah keseluruhan.
            </P>
            <Callout type="tip">
              Sijil penghargaan boleh dijana secara automatik berdasarkan jumlah jam khidmat yang diluluskan. Tetapkan ambang jam tertentu (contohnya 50 jam, 100 jam) untuk pencapaian tahap yang berbeza.
            </Callout>
          </>
        ),
      },
      {
        id: 'modul-penderma',
        title: 'CRM Penderma',
        content: (
          <>
            <H1>CRM Penderma</H1>
            <P>
              Modul CRM (Customer Relationship Management) Penderma membantu pertubuhan membina dan mengekalkan hubungan yang baik dengan penderma. Setiap penderma mempunyai profil lengkap yang merangkumi sejarah sumbangan, segmen penderma, komunikasi, dan resit cukai. Nombor penderma unik dalam format <strong className="text-foreground">DNR-XXXX</strong> dijana secara automatik.
            </P>
            <H2>Segmen Penderma</H2>
            <DocTable
              headers={['Segmen', 'Kriteria', 'Strategi']}
              rows={[
                ['Utama (Major)', 'Sumbangan melebihi RM10,000/tahun', 'Hubungan peribadi, laporan impak eksklusif'],
                ['Biasa (Regular)', 'Sumbangan berkala bulanan/kuartal', 'Komunikasi konsisten, program kesetiaan'],
                ['Sekali-sekala (Occasional)', 'Sumbangan tidak kerap', 'Kempen menjana semula minat'],
                ['Terhenti (Lapsed)', 'Tiada sumbangan lebih 12 bulan', 'Kempen penarikan semula khas'],
              ]}
            />
            <Callout type="info">
              Gunakan modul AI untuk menganalisis corak sumbangan penderma dan menghasilkan cadangan strategi pengekalan. AI boleh mengenal pasti penderma yang berpotensi untuk dinaikkan taraf ke segmen yang lebih tinggi.
            </Callout>
            <H2>Resit Cukai &amp; Pengecualian</H2>
            <P>
              PUSPA menyokong penjanaan resit cukai untuk penderma yang layak mendapat pengecualian cukai. Resit cukai dalam format <strong className="text-foreground">TR-YYYY-XXXX</strong> mengandungi rujukan kelulusan LHDN, jumlah sumbangan, dan tujuan derma. Resit boleh dimuat turun dalam format PDF dan dihantar kepada penderma melalui e-mel.
            </P>
          </>
        ),
      },
      {
        id: 'modul-dokumen',
        title: 'Gudang Dokumen',
        content: (
          <>
            <H1>Gudang Dokumen</H1>
            <P>
              Modul Gudang Dokumen menyediakan repositori berpusat untuk semua dokumen pertubuhan. Dokumen dikategorikan mengikut jenis (pendaftaran, tadbir urus, kewangan, pematuhan, operasi, program) dan disokong dengan sistem versi, tag, dan tarikh tamat tempoh untuk pengurusan yang cekap.
            </P>
            <H2>Kategori Dokumen</H2>
            <UL>
              <LI><strong className="text-foreground">Pendaftaran</strong> — Sijil ROS, perlembagaan pertubuhan, surat akuan pendaftaran.</LI>
              <LI><strong className="text-foreground">Tadbir Urus</strong> — Minit mesyuarat AJK, polisi dalaman, carta organisasi.</LI>
              <LI><strong className="text-foreground">Kewangan</strong> — Penyata kewangan, laporan audit, resit, invois.</LI>
              <LI><strong className="text-foreground">Pematuhan</strong> — Laporan pematuhan LHDN, BNM, PDPA, dan dokumen sokongan.</LI>
              <LI><strong className="text-foreground">Operasi</strong> — SOP, manual operasi, senarai semak prosedur.</LI>
              <LI><strong className="text-foreground">Program</strong> — Proposal, laporan aktiviti, gambar program.</LI>
            </UL>
            <Callout type="warning">
              Dokumen dengan tarikh tamat tempoh (seperti sijil ROS atau kelulusan LHDN) akan menampilkan amaran visual 30 hari sebelum tarikh tamat. Pastikan dokumen diperbaharui tepat pada masa untuk mengelakkan masalah pematuhan.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── eKYC & TapSecure ──
  {
    id: 'ekyc-tapsecure',
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'eKYC & TapSecure',
    pages: [
      {
        id: 'ekyc-verification',
        title: 'eKYC Verification',
        badge: 'BNM AMLA',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        content: (
          <>
            <H1>eKYC Verification</H1>
            <P>
              Modul eKYC (Electronic Know Your Customer) menyediakan pengesahan identiti digital yang mematuhi garis panduan Bank Negara Malaysia (BNM) dan Akta Pencegahan Pengubahan Wang Haram (AMLA). Proses ini melibatkan pengesanan kad pengenalan melalui OCR, pengesanan penipuan wajah (liveness detection), dan penilaian risiko AMLA.
            </P>
            <H2>Proses eKYC</H2>
            <StepBox step={1} title="Pengesanan Kad Pengenalan (OCR)">
              Ahli asnaf memuat naik gambar hadapan dan belakang kad pengenalan. Sistem OCR mengekstrak maklumat secara automatik termasuk nama, nombor IC, alamat, dan tarikh lahir. Data yang diekstrak dipaparkan untuk pengesahan manual.
            </StepBox>
            <StepBox step={2} title="Pengesanan Wajah (Liveness Detection)">
              Ahli asnaf mengambil gambar selfie melalui kamera peranti. Sistem menjalankan ujian pengesanan penipuan (anti-spoofing) termasuk berkelip mata, senyuman, dan putaran kepala untuk memastikan orang sebenar di hadapan kamera.
            </StepBox>
            <StepBox step={3} title="Pemadanan Wajah">
              Sistem membandingkan wajah dalam selfie dengan gambar pada kad pengenalan menggunakan algoritma pengenalan wajah AI. Skor pemadanan (0-100) menunjukkan tahap keyakinan. Had minimum ialah 70% untuk lulus.
            </StepBox>
            <StepBox step={4} title="Saringan AMLA">
              Maklumat ahli asnaf disaring terhadap senarai penalti AMLA dan senarai pihak yang dikenakan sekatan. Risiko dinilai sebagai rendah, sederhana, atau tinggi berdasarkan profil dan hasil saringan.
            </StepBox>
            <Callout type="warning">
              Proses eKYC mesti dilengkapkan sebelum had pembayaran e-wallet boleh dinaikkan. Tanpa eKYC, had pembayaran kekal pada RM200. Dengan eKYC yang diluluskan, had boleh dinaikkan sehingga RM5,000 bergantung pada tahap risiko.
            </Callout>
            <H2>Skor &amp; Had Pembayaran</H2>
            <DocTable
              headers={['Status eKYC', 'Skor Minimum', 'Had E-Wallet', 'Transfer Bank']}
              rows={[
                ['Tidak Lengkap', '-', 'RM200', 'Tidak tersedia'],
                ['Diluluskan (Risiko Rendah)', '70%', 'RM5,000', 'Tersedia'],
                ['Diluluskan (Risiko Sederhana)', '70%', 'RM2,000', 'Tersedia dengan kelulusan'],
                ['Diluluskan (Risiko Tinggi)', '80%', 'RM500', 'Perlu kelulusan manual'],
                ['Ditolak', '-', 'RM200', 'Tidak tersedia'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'tapsecure',
        title: 'TapSecure',
        badge: 'Keselamatan',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        content: (
          <>
            <H1>TapSecure — Pengurusan Peranti &amp; Keselamatan</H1>
            <P>
              TapSecure ialah modul keselamatan yang menguruskan pengikatan peranti, pengesahan biometrik, log keselamatan, dan tetapan sesi pengguna. Modul ini memastikan akses ke PUSPACare terhad kepada peranti yang dipercayai dan pengguna yang disahkan, mengurangkan risiko akses tidak sah dan pencurian data.
            </P>
            <H2>Pengikatan Peranti (Device Binding)</H2>
            <P>
              Setiap pengguna boleh mengikat satu atau lebih peranti yang dipercayai dengan akaun mereka. Apabila pengikatan peranti diaktifkan, log masuk dari peranti yang tidak dikenali akan disekat atau memerlukan pengesahan tambahan melalui OTP (One-Time Password).
            </P>
            <StepBox step={1} title="Ikatan Peranti Baharu">
              Log masuk dari peranti baharu dan ikuti arahan untuk menghantar OTP ke nombor telefon yang didaftarkan. Masukkan kod OTP dalam tempoh 5 minit untuk mengesahkan pengikatan.
            </StepBox>
            <StepBox step={2} title="Tetapkan Peranti Utama">
              Pilih satu peranti sebagai peranti utama yang digunakan untuk operasi kritikal seperti kelulusan pembayaran. Peranti utama mempunyai keutamaan tertinggi dalam pengesahan.
            </StepBox>
            <StepBox step={3} title="Pantau Log Keselamatan">
              Semua aktiviti keselamatan direkodkan dalam log keselamatan termasuk log masuk, log keluar, pengikatan peranti, pengesahan biometrik, dan percubaan akses gagal. Pantau log secara berkala untuk aktiviti mencurigakan.
            </StepBox>
            <H2>Tetapan Keselamatan</H2>
            <DocTable
              headers={['Tetapan', 'Lalai', 'Penerangan']}
              rows={[
                ['Transaksi Biometrik', 'Tidak aktif', 'Perlukan pengesahan biometrik untuk transaksi kewangan'],
                ['Hanya Peranti Terikat', 'Tidak aktif', 'Sekat akses dari peranti yang tidak diikat'],
                ['Masa Tamat Sesi', '30 minit', 'Tempoh tidak aktif sebelum sesi tamat secara automatik'],
              ]}
            />
            <Callout type="tip">
              Aktifkan semua tetapan keselamatan untuk akaun yang menguruskan data kewangan atau peribadi asnaf. Kombinasi pengikatan peranti, biometrik, dan masa tamat sesi yang pendek memberikan perlindungan berlapis terbaik.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── AI Tools ──
  {
    id: 'ai-tools',
    icon: <Sparkles className="h-4 w-4" />,
    title: 'AI Tools',
    pages: [
      {
        id: 'alat-ai',
        title: 'Alat AI',
        badge: 'Cerdas',
        badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
        content: (
          <>
            <H1>Alat AI PUSPACare</H1>
            <P>
              Modul AI Tools menyediakan pelbagai alat kecerdasan buatan yang membantu mempercepatkan operasi harian pertubuhan. Alat-alat ini termasuk penjanaan dokumen automatik, analisis risiko kes, penjanaan laporan, dan pembantu AI untuk menjawab soalan berkaitan operasi pertubuhan.
            </P>
            <H2>Ciri-ciri AI</H2>
            <DocTable
              headers={['Alat AI', 'Fungsi', 'Contoh Penggunaan']}
              rows={[
                ['Penjana Dokumen', 'Cipta surat, proposal, dan laporan secara automatik', 'Surat tawaran bantuan kepada asnaf'],
                ['Analisis Risiko', 'Nilai risiko kes berdasarkan data sejarah', 'Kenal pasti kes berisiko tinggi untuk keutamaan'],
                ['Cadangan Skor', 'Cadangkan skor penilaian kes berdasarkan data', 'Automatik isi skor verifikasi dan kebajikan'],
                ['Ringkasan Data', 'Ringkaskan data ahli, kes, atau program', 'Ringkasan profil asnaf untuk mesyuarat'],
                ['Pembantu Chat', 'Jawab soalan berkaitan operasi PUSPA', 'Cara mengisi borang permohonan kes baharu'],
              ]}
            />
            <Callout type="info">
              Semua alat AI berjalan di pelayan (server-side) menggunakan API yang dilindungi. Data sensitif asnaf tidak dihantar ke perkhidmatan pihak ketiga tanpa penyulitan. Log penggunaan AI direkodkan untuk tujuan audit.
            </Callout>
            <H2>Panduan Penggunaan</H2>
            <P>
              Untuk menggunakan alat AI, navigasi ke modul &quot;Alat AI&quot; di bar sisi dan pilih alat yang diingini. Setiap alat mempunyai antaramuka tersendiri dengan medan input dan butang &quot;Jana&quot;. Hasil yang dijana boleh disalin, diedit, atau disimpan terus ke modul yang berkaitan.
            </P>
            <OL>
              <LI>Pilih alat AI yang sesuai dengan keperluan anda.</LI>
              <LI>Isi medan input yang diperlukan (contohnya, jenis dokumen dan maklumat penerima).</LI>
              <LI>Klik butang &quot;Jana&quot; dan tunggu hasil yang dijana (biasanya 5-15 saat).</LI>
              <LI>Semak hasil dan buat pengubahsuaian yang perlu.</LI>
              <LI>Simpan atau salin hasil ke destinasi yang diingini.</LI>
            </OL>
            <Callout type="tip">
              AI berfungsi paling baik apabila diberikan maklumat input yang lengkap dan tepat. Semakin banyak konteks yang anda berikan, semakin berkualiti hasil yang dijana. Gunakan data sebenar dari modul lain sebagai input untuk hasil yang paling relevan.
            </Callout>
          </>
        ),
      },
      {
        id: 'openclaw-platform',
        title: 'Platform AI Ops Dalaman',
        badge: 'Lanjutan',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        content: (
          <>
            <H1>Platform AI Ops Dalaman</H1>
            <P>
              Platform AI Ops dalaman dalam PUSPACare menyediakan keupayaan MCP (Model Context Protocol), plugin, integrasi, terminal, ejen AI, penyedia model, dan automasi. Keupayaan ini membantu pertubuhan meluaskan operasi melalui integrasi pihak ketiga dan automasi aliran kerja.
            </P>
            <H2>Komponen AI Ops Dalaman</H2>
            <DocTable
              headers={['Komponen', 'Fungsi', 'Kegunaan']}
              rows={[
                ['Pelayan MCP', 'Model Context Protocol untuk konteks AI', 'Sambungkan sumber data luar ke AI'],
                ['Plugin', 'Sambungan tambahan untuk fungsi khusus', 'Integrasi WhatsApp, SMS, pos mel'],
                ['Integrasi', 'Sambungan ke perkhidmatan pihak ketiga', 'Perbankan, e-wallet, gateway pembayaran'],
                ['Terminal', 'Antaramuka baris perintah untuk pentadbir', 'Debug, ujian API, pengurusan data'],
                ['Ejen AI', 'AI autonomi untuk tugas berulang', 'Pemprosesan permohonan, penjanaan laporan'],
                ['Penyedia Model', 'Pengurusan model AI yang tersedia', 'Tukar antara model AI mengikut keperluan'],
                ['Automasi', 'Aliran kerja automatik berdasarkan acara', 'Pemberitahuan, penjanaan laporan berkala'],
              ]}
            />
            <H2>Menggunakan Pelayan MCP</H2>
            <P>
              Model Context Protocol (MCP) membolehkan AI mengakses konteks dari pelbagai sumber data. Anda boleh mendaftarkan pelayan MCP yang menyediakan data luaran seperti pangkalan data kerajaan, sistem kewangan, atau sumber data komuniti. AI akan menggunakan konteks ini untuk memberikan jawapan yang lebih tepat dan relevan.
            </P>
            <Callout type="warning">
              Integrasi AI Ops dalaman memerlukan konfigurasi teknikal yang lanjutan. Hanya pentadbir sistem yang boleh menguruskan pelayan MCP, plugin, dan integrasi. Sila rujuk dokumentasi teknikal untuk panduan konfigurasi terperinci.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Tutorial ──
  {
    id: 'tutorial',
    icon: <GraduationCap className="h-4 w-4" />,
    title: 'Tutorial',
    pages: [
      {
        id: 'tutorial-daftar-asnaf',
        title: 'Daftar Ahli Asnaf Baharu',
        content: (
          <>
            <H1>Tutorial: Daftar Ahli Asnaf Baharu</H1>
            <P>
              Tutorial langkah demi langkah ini menunjukkan cara mendaftarkan ahli asnaf baharu ke dalam sistem PUSPACare. Proses ini mengambil masa lebih kurang 5-10 minit untuk setiap pendaftaran, bergantung pada kelengkapan maklumat yang tersedia.
            </P>
            <H2>Prasyarat</H2>
            <UL>
              <LI>Akaun PUSPACare dengan peranan Pentadbir atau Operasi</LI>
              <LI>Salinan kad pengenalan asnaf (hadapan dan belakang)</LI>
              <LI>Maklumat peribadi asnaf (nama, alamat, telefon)</LI>
              <LI>Maklumat kewangan (pendapatan, saiz isi rumah)</LI>
            </UL>
            <H2>Langkah-langkah</H2>
            <StepBox step={1} title="Akses Modul Ahli Asnaf">
              Dari Dashboard, klik pada &quot;Ahli Asnaf&quot; di bar sisi navigasi. Anda akan melihat senarai semua ahli asnaf yang telah didaftarkan. Klik butang &quot;Tambah Ahli&quot; di penjuru atas kanan untuk membuka borang pendaftaran.
            </StepBox>
            <StepBox step={2} title="Isi Bahagian Maklumat Peribadi">
              Masukkan nama penuh asnaf sebagaimana yang tertera pada kad pengenalan. Sertakan nombor IC tanpa sengkang (contoh: 900101010001). Masukkan nombor telefon yang aktif dan alamat e-mel jika ada. Isi alamat penuh termasuk negeri dan poskod.
            </StepBox>
            <StepBox step={3} title="Isi Bahagian Kewangan &amp; Sosial">
              Tentukan saiz isi rumah (bilangan orang yang tinggal serumah). Masukkan anggaran pendapatan bulanan isi rumah. Pilih status perkahwinan dan nyatakan pekerjaan semasa jika berkaitan. Maklumat ini penting untuk penilaian kelayakan asnaf.
            </StepBox>
            <StepBox step={4} title="Tambah Ahli Isi Rumah">
              Jika asnaf mempunyai tanggungan (anak, pasangan, ibu bapa), klik bahagian &quot;Ahli Isi Rumah&quot; untuk menambah maklumat mereka. Sertakan nama, hubungan, umur, pekerjaan, pendapatan, dan tandakan jika ahli tersebut adalah OKU atau pelajar.
            </StepBox>
            <StepBox step={5} title="Simpan &amp; Sahkan">
              Semak semula semua maklumat yang dimasukkan. Pastikan tiada kesilapan pada nombor IC dan alamat. Klik butang &quot;Simpan&quot;. Sistem akan menjana nombor ahli PUSPA-XXXX secara automatik dan memaparkan pemberitahuan kejayaan.
            </StepBox>
            <Callout type="tip">
              Selepas mendaftar, anda boleh terus mencipta kes baharu dari profil ahli asnaf dengan mengklik butang &quot;Cipta Kes&quot; di halaman profil. Ini menjimatkan masa kerana maklumat peribadi asnaf akan dimasukkan secara automatik ke dalam borang permohonan kes.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-proses-kes',
        title: 'Proses Permohonan Kes',
        content: (
          <>
            <H1>Tutorial: Proses Permohonan Kes</H1>
            <P>
              Tutorial ini menerangkan cara memproses permohonan kes bantuan dari permulaan hingga penyelesaian. Proses ini melibatkan beberapa peringkat kelulusan dan verifikasi untuk memastikan bantuan disalurkan kepada asnaf yang benar-benar layak.
            </P>
            <StepBox step={1} title="Cipta Kes Baharu">
              Navigasi ke modul &quot;Kes&quot; dan klik &quot;Tambah Kes&quot;. Pilih ahli asnaf dari senarai atau daftar ahli baharu. Pilih kategori bantuan (Zakat, Sedekah, Wakaf, Infaq) dan program yang berkaitan. Masukkan jumlah bantuan yang dipohon dan sertakan sebab permohonan.
            </StepBox>
            <StepBox step={2} title="Serahkan untuk Semakan">
              Setelah maklumat lengkap, klik &quot;Serahkan&quot; untuk mengubah status kes ke &quot;Diserahkan&quot;. Pegawai verifikasi akan menerima notifikasi dan memulakan proses semakan dokumen.
            </StepBox>
            <StepBox step={3} title="Verifikasi Dokumen">
              Pegawai verifikasi menyemak semua dokumen yang dikemukakan. Pastikan salinan IC jelas, bukti pendapatan sahih, dan maklumat alamat sepadan. Jika maklumat tidak lengkap, kembalikan kes kepada pemohon dengan catatan maklumat tambahan yang diperlukan.
            </StepBox>
            <StepBox step={4} title="Penilaian Skor">
              Isi skor pengesahan (0-100) berdasarkan kelengkapan dan ketepatan dokumen. Isi skor kebajikan (0-100) berdasarkan tahap keperluan asnaf. Gunakan alat AI untuk mendapatkan cadangan skor automatik.
            </StepBox>
            <StepBox step={5} title="Kelulusan &amp; Pembayaran">
              Pegawai yang berkuasa menyemak skor dan meluluskan atau menolak kes. Jika diluluskan, proses pembayaran dimulakan. Setelah bantuan disalurkan, kes dikemas kini kepada status &quot;Dibayar&quot; dan butiran pembayaran direkodkan.
            </StepBox>
            <Callout type="info">
              Semua perubahan status dan tindakan direkodkan dalam log audit. Anda boleh melihat sejarah lengkap kes pada bila-bila masa untuk tujuan pemantauan dan audit.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-rekod-donasi',
        title: 'Rekod Donasi',
        content: (
          <>
            <H1>Tutorial: Rekod Donasi</H1>
            <P>
              Tutorial ini menunjukkan cara merakam penerimaan donasi ke dalam sistem PUSPACare. Setiap donasi mesti direkodkan dengan kategori dana yang betul (ISF) untuk memastikan pematuhan pemisahan dana Islam.
            </P>
            <StepBox step={1} title="Buka Modul Donasi">
              Navigasi ke modul &quot;Donasi&quot; di bar sisi. Anda akan melihat senarai semua donasi yang telah direkodkan. Klik butang &quot;Tambah Donasi&quot; untuk membuka borang penerimaan.
            </StepBox>
            <StepBox step={2} title="Isi Maklumat Penderma">
              Masukkan nama penderma. Jika penderma telah wujud dalam sistem, sistem akan mencadangkan nama secara automatik. Sertakan nombor IC jika tersedia untuk tujuan resit cukai. Pilih jika penderma ingin kekal tanpa nama.
            </StepBox>
            <StepBox step={3} title="Tetapkan Kategori Dana">
              Pilih jenis dana: Zakat, Sedekah, Wakaf, Infaq, atau Sumbangan Am. Jika Zakat, pilih subkategori (fitrah, harta, pendapatan, perniagaan) dan nyatakan pihak berkuasa zakat. Tandakan sama ada sumbangan layak pengecualian cukai.
            </StepBox>
            <StepBox step={4} title="Masukkan Butiran Pembayaran">
              Masukkan jumlah donasi dalam Ringgit Malaysia (RM). Pilih kaedah penerimaan (tunai, transfer bank, dalam talian, cek, e-wallet). Nyatakan program yang berkaitan jika donasi diperuntukkan untuk program tertentu.
            </StepBox>
            <StepBox step={5} title="Sahkan &amp; Cetak Resit">
              Semak semula semua maklumat dan klik &quot;Simpan&quot;. Nombor resit DN-XXXX akan dijana secara automatik. Cetak resit atau hantar melalui e-mel kepada penderma. Status donasi akan ditetapkan sebagai &quot;Sah&quot; untuk penerimaan dalam talian dan &quot;Menunggu&quot; untuk kaedah lain.
            </StepBox>
            <Callout type="warning">
              Pastikan pemilihan kategori dana adalah tepat. Dana Zakat TIDAK BOLEH dicampur dengan dana Sedekah atau Sumbangan Am. Kesilapan pengkategorian boleh menyebabkan masalah pematuhan Syariah dan audit. Jika anda tidak pasti, rujuk kepada Bendahari atau penasihat Syariah pertubuhan.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-laporan-kewangan',
        title: 'Jana Laporan Kewangan',
        content: (
          <>
            <H1>Tutorial: Jana Laporan Kewangan</H1>
            <P>
              Tutorial ini menerangkan cara menjana laporan kewangan menggunakan modul Laporan Kewangan. Laporan kewangan penting untuk pengurusan pertubuhan, pematuhan audit, dan transparansi kepada penderma dan pihak berkuasa.
            </P>
            <StepBox step={1} title="Akses Modul Laporan">
              Navigasi ke modul &quot;Laporan Kewangan&quot; di bawah kategori Compliance. Anda akan melihat dashboard ringkasan dengan carta dan metrik kewangan terkini.
            </StepBox>
            <StepBox step={2} title="Pilih Jenis Laporan">
              Pilih jenis laporan yang diingini: ringkasan bulanan, penyata penerimaan dan perbelanjaan, laporan donasi mengikut kategori, laporan pembayaran, atau laporan penyeimbangan dana. Setiap laporan boleh ditapis mengikut tempoh masa.
            </StepBox>
            <StepBox step={3} title="Tetapkan Tempoh Masa">
              Pilih julat tarikh untuk laporan. Anda boleh memilih tempoh pratetap (bulan ini, suku tahun ini, tahun ini) atau menetapkan tarikh mula dan tamat secara manual. Laporan akan dikemas kini secara dinamik mengikut pilihan anda.
            </StepBox>
            <StepBox step={4} title="Semak &amp; Eksport">
              Semak data dalam jadual dan carta. Gunakan ciri penapis untuk menumpukan pada data tertentu. Klik butang &quot;Eksport&quot; untuk memuat turun laporan dalam format PDF atau Excel. Laporan PDF sesuai untuk pengedaran rasmi manakala Excel sesuai untuk analisis lanjutan.
            </StepBox>
            <Callout type="tip">
              Jadualkan penjanaan laporan secara automatik menggunakan modul Automasi AI Ops dalaman. Anda boleh mengkonfigurasi laporan bulanan dihantar secara automatik ke e-mel pengerusi dan bendahari pada tarikh tertentu setiap bulan.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-ekyc-asnaf',
        title: 'Lakukan eKYC untuk Asnaf',
        content: (
          <>
            <H1>Tutorial: Lakukan eKYC untuk Asnaf</H1>
            <P>
              Tutorial ini menunjukkan cara menjalankan proses eKYC untuk ahli asnaf. Proses ini diperlukan untuk meningkatkan had pembayaran dan membolehkan transfer bank terus kepada asnaf.
            </P>
            <StepBox step={1} title="Akses Profil Ahli Asnaf">
              Buka profil ahli asnaf dari modul Ahli Asnaf. Klik pada tab &quot;eKYC&quot; atau butang &quot;Mula eKYC&quot;. Pastikan maklumat peribadi asnaf telah lengkap sebelum memulakan proses eKYC.
            </StepBox>
            <StepBox step={2} title="Muat Naik Gambar IC">
              Minta asnaf menyediakan kad pengenalan asal. Ambil gambar hadapan dan belakang IC menggunakan kamera peranti atau telefon pintar. Pastikan gambar jelas, tidak bergelap, dan semua maklumat boleh dibaca. Muat naik kedua-dua gambar ke sistem.
            </StepBox>
            <StepBox step={3} title="Lakukan Pengesanan Wajah">
              Minta asnaf menghadap kamera peranti. Sistem akan memandu asnaf melalui beberapa cabaran pengesanan penipuan seperti berkelip mata, tersenyum, atau memusing kepala. Pastikan pencahayaan mencukupi dan tiada orang lain dalam bingkai kamera.
            </StepBox>
            <StepBox step={4} title="Semak Hasil Pengesahan">
              Sistem akan memaparkan hasil OCR, skor pemadanan wajah, dan keputusan saringan AMLA. Semak semua data yang diekstrak untuk ketepatan. Jika skor pemadanan wajah melebihi 70% dan saringan AMLA lulus, klik &quot;Lulus&quot;. Jika tidak, rekodkan sebab penolakan.
            </StepBox>
            <Callout type="warning">
              Proses eKYC melibatkan data peribadi sensitif. Pastikan proses dijalankan dalam persekitaran yang selamat dan peribadi. Jangan tangkap gambar IC atau selfie asnaf di kawasan awam. Data eKYC disimpan dengan penyulitan dan hanya boleh diakses oleh pengguna yang berkuasa.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-deploy-sukarelawan',
        title: 'Tempatkan Sukarelawan ke Program',
        content: (
          <>
            <H1>Tutorial: Tempatkan Sukarelawan ke Program</H1>
            <P>
              Tutorial ini menunjukkan cara menempatkan sukarelawan ke program atau aktiviti tertentu. Penempatan sukarelawan yang terancang memastikan setiap program mempunyai bilangan sukarelawan yang mencukupi dengan kemahiran yang sesuai.
            </P>
            <StepBox step={1} title="Pilih Program">
              Navigasi ke modul Program dan buka program yang memerlukan sukarelawan. Semak keperluan program untuk menentukan bilangan dan jenis sukarelawan yang diperlukan.
            </StepBox>
            <StepBox step={2} title="Cari Sukarelawan yang Sesuai">
              Gunakan modul Sukarelawan untuk mencari sukarelawan mengikut kemahiran, ketersediaan, dan lokasi. Tapis senarai untuk menunjukkan hanya sukarelawan aktif yang tersedia pada tarikh program.
            </StepBox>
            <StepBox step={3} title="Cipta Penempatan">
              Klik &quot;Tambah Penempatan&quot; dan pilih sukarelawan dari senarai. Tetapkan peranan (penyelaras, peserta, ketua), tarikh mula dan tamat, dan lokasi. Hantar pemberitahuan kepada sukarelawan melalui sistem komunikasi.
            </StepBox>
            <StepBox step={4} title="Pantau &amp; Rekod Jam Khidmat">
              Semasa program berlangsung, pastikan sukarelawan merekodkan jam khidmat mereka. Selepas program, semak dan luluskan log jam khidmat. Jumlah jam akan dikemas kini secara automatik ke profil sukarelawan.
            </StepBox>
            <Callout type="tip">
              Gunakan modul AI untuk mencadangkan sukarelawan yang sesuai berdasarkan kemahiran program dan sejarah penempatan terdahulu. AI boleh mengenal pasti sukarelawan yang berpengalaman dalam jenis program yang sama.
            </Callout>
          </>
        ),
      },
      {
        id: 'tutorial-compliance-checklist',
        title: 'Lengkapkan Senarai Semak Pematuhan',
        content: (
          <>
            <H1>Tutorial: Lengkapkan Senarai Semak Pematuhan</H1>
            <P>
              Tutorial ini menunjukkan cara menggunakan Dashboard Compliance untuk melengkapkan senarai semak pematuhan pertubuhan. Pematuhan yang konsisten memastikan pertubuhan beroperasi dalam rangka undang-undang dan mengekalkan kepercayaan penderma dan pihak berkuasa.
            </P>
            <H2>Kategori Pematuhan</H2>
            <UL>
              <LI><strong className="text-foreground">Pendaftaran</strong> — Sijil ROS, perlembagaan, mesyuarat AGM tahunan</LI>
              <LI><strong className="text-foreground">Tadbir Urus</strong> — Struktur AJK, quorum mesyuarat, polisi kewangan</LI>
              <LI><strong className="text-foreground">Kewangan</strong> — Penyata audit, kelulusan LHDN, rekod bank</LI>
              <LI><strong className="text-foreground">Program</strong> — Laporan aktiviti, bukti pembelanjawan, metrik impak</LI>
              <LI><strong className="text-foreground">Transparansi</strong> — Laporan tahunan awam, laporan kewangan, akses maklumat</LI>
            </UL>
            <StepBox step={1} title="Buka Dashboard Compliance">
              Navigasi ke modul Dashboard Compliance di bawah kategori Compliance. Anda akan melihat skor pematuhan keseluruhan dan senarai semak mengikut kategori.
            </StepBox>
            <StepBox step={2} title="Semak Item Belum Lengkap">
              Tapis senarai semak untuk menunjukkan item yang belum lengkap. Klik pada setiap item untuk melihat penerangan terperinci dan bukti yang diperlukan.
            </StepBox>
            <StepBox step={3} title="Muat Naik Bukti">
              Untuk setiap item, muat naik dokumen bukti yang berkaitan (contohnya, sijil ROS yang dikemas kini, minit mesyuarat, atau penyata audit). Tandakan item sebagai lengkap dan catatkan tarikh siap.
            </StepBox>
            <StepBox step={4} title="Pantau Skor Pematuhan">
              Skor pematuhan dikemas kini secara automatik berdasarkan item yang telah lengkap. Sasarkan skor 100% untuk memastikan pematuhan penuh. Item yang hampir tamat tempoh akan dipaparkan dengan amaran.
            </StepBox>
            <Callout type="warning">
              Sijil pendaftaran ROS perlu diperbaharui setiap tahun. Pastikan mesyuarat AGM diadakan tepat pada waktu dan minit mesyuarat direkodkan. Kegagalan mematuhi boleh menyebabkan pendaftaran pertubuhan dibatalkan oleh ROS.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Panduan Pematuhan ──
  {
    id: 'pematuhan',
    icon: <Building2 className="h-4 w-4" />,
    title: 'Panduan Pematuhan',
    pages: [
      {
        id: 'pematuhan-lhdn',
        title: 'Pematuhan LHDN',
        badge: 'Kewangan',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        content: (
          <>
            <H1>Pematuhan Lembaga Hasil Dalam Negeri (LHDN)</H1>
            <P>
              Pertubuhan PUSPA sebagai badan kebajikan yang berdaftar perlu mematuhi semua peraturan LHDN berkaitan pengecualian cukai, pemfailan penyata, dan penerimaan sumbangan. Pematuhan LHDN memastikan pertubuhan layak memberikan resit pengecualian cukai kepada penderma dan mengelakkan penalti.
            </P>
            <H2>Pengecualian Cukai (Section 44(6A))</H2>
            <P>
              Di bawah Akta Cukai Pendapatan 1967, Section 44(6A), sumbangan kepada pertubuhan yang diluluskan oleh LHDN layak untuk pengecualian cukai. PUSPA perlu memastikan kelulusan LHDN sentiasa sah dan dikemas kini. Rujukan kelulusan dan tarikh tamat tempoh direkodkan dalam Profil Organisasi di modul Compliance.
            </P>
            <H2>Tanggungjawab Pematuhan</H2>
            <DocTable
              headers={['Tanggungjawab', 'Kekerapan', 'Penerangan']}
              rows={[
                ['Pemfailan Penyata Tahunan', 'Setiap tahun', 'Failkan penyata pendapatan pertubuhan sebelum tarikh akhir yang ditetapkan'],
                ['Pembaharuan Kelulusan', 'Sekiranya perlu', 'Pastikan kelulusan pengecualian cukai LHDN masih sah dan tidak tamat'],
                ['Penerbitan Resit Cukai', 'Setiap sumbangan', 'Jana resit cukai TR-XXXX untuk setiap sumbangan yang layak pengecualian'],
                ['Rekod Audit', 'Setiap tahun', 'Sediakan dan simpan penyata kewangan yang diaudit'],
                ['Penyimpanan Rekod', '7 tahun', 'Simpan semua rekod kewangan sekurang-kurangnya 7 tahun'],
              ]}
            />
            <Callout type="warning">
              Kegagalan mematuhi peraturan LHDN boleh mengakibatkan pemotongan kelulusan pengecualian cukai, penalti kewangan, dan kerosakan reputasi. Pastikan semua penerimaan sumbangan direkodkan dengan tepat dan resit cukai dijana secara berurutan tanpa jurang nombor.
            </Callout>
            <Callout type="info">
              Modul Laporan Kewangan PUSPACare menyediakan laporan sedia ada yang memenuhi keperluan pemfailan LHDN. Gunakan fungsi eksport untuk menjana laporan dalam format yang diperlukan oleh LHDN.
            </Callout>
          </>
        ),
      },
      {
        id: 'pematuhan-bnm',
        title: 'Pematuhan BNM',
        badge: 'AMLA',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        content: (
          <>
            <H1>Pematuhan Bank Negara Malaysia (BNM) &amp; AMLA</H1>
            <P>
              Sebagai pertubuhan yang menguruskan dana awam dan melaksanakan pengesahan identiti digital (eKYC), PUSPA perlu mematuhi garis panduan BNM dan Akta Pencegahan Pengubahan Wang Haram, Pendanaan Keganasan dan Hasil Daripadanya 2001 (AMLA). Pematuhan ini melibatkan prosedur KYC (Know Your Customer), pelaporan transaksi mencurigakan, dan pengurusan risiko.
            </P>
            <H2>Garis Panduan eKYC BNM</H2>
            <P>Proses eKYC PUSPACare direka mengikut garis panduan eKYC BNM yang merangkumi:</P>
            <OL>
              <LI><strong className="text-foreground">Pengumpulan Data</strong> — Pengumpulan maklumat identiti yang mencukupi termasuk nama, IC, alamat, dan maklumat kewangan.</LI>
              <LI><strong className="text-foreground">Pengesahan Data</strong> — Pengesahan maklumat yang dikumpulkan terhadap dokumen sumber yang sahih.</LI>
              <LI><strong className="text-foreground">Pengesanan Penipuan</strong> — Implementasi langkah anti-penipuan seperti pengesanan penipuan wajah (liveness detection).</LI>
              <LI><strong className="text-foreground">Penilaian Risiko</strong> — Penilaian risiko AMLA berdasarkan profil pengguna dan hasil saringan.</LI>
              <LI><strong className="text-foreground">Pemantauan Berterusan</strong> — Pemantauan berterusan terhadap aktiviti akaun yang mencurigakan.</LI>
            </OL>
            <H2>Tanggungjawab AMLA</H2>
            <DocTable
              headers={['Tanggungjawab', 'Keterangan', 'Tindakan']}
              rows={[
                ['Pelaporan STR', 'Suspected Transaction Report', 'Laporkan transaksi mencurigakan kepada BNM'],
                ['Senarai Penalti', 'Saringan senarai pihak dikenakan sekatan', 'Saringan automatik melalui modul eKYC'],
                ['Rekod Pelanggan', 'Simpan rekod KYC sekurang-kurangnya 6 tahun', 'Simpan semua data eKYC dan saringan'],
                ['Latihan Staf', 'Latihan AMLA untuk staf berkaitan', 'Jadual latihan berkala setiap tahun'],
                ['Polisi AML/CFT', 'Dokumen polisi anti pengubahan wang haram', 'Simpan dan kemas kini polisi secara berkala'],
              ]}
            />
            <Callout type="warning">
              Kegagalan mematuhi AMLA boleh mengakibatkan denda sehingga RM1 juta atau penjara sehingga 5 tahun. Pastikan semua staf yang terlibat dalam pengurusan kewangan memahami tanggungjawab AMLA mereka.
            </Callout>
          </>
        ),
      },
      {
        id: 'pematuhan-ros',
        title: 'Pematuhan ROS',
        content: (
          <>
            <H1>Pematuhan Pesuruhjaya Persatuan Malaysia (ROS)</H1>
            <P>
              PUSPA didaftarkan di bawah Akta Pertubuhan 1966 dan tertakluk kepada peraturan Pesuruhjaya Persatuan Malaysia (ROS). Pematuhan terhadap ROS memastikan status pertubuhan kekal sah dan boleh beroperasi secara sah di Malaysia.
            </P>
            <H2>Tanggungjawab Pematuhan ROS</H2>
            <OL>
              <LI><strong className="text-foreground">Pendaftaran &amp; Pembaharuan</strong> — Sijil pendaftaran perlu diperbaharui mengikut jadual yang ditetapkan oleh ROS. PUSPA berdaftar dengan nombor PPM-006-14-14032020.</LI>
              <LI><strong className="text-foreground">Mesyuarat Agung Tahunan (AGM)</strong> — AGM mesti diadakan sekurang-kurangnya sekali setiap tahun dengan notis yang mencukupi kepada semua ahli.</LI>
              <LI><strong className="text-foreground">Penyediaan Perlembagaan</strong> — Perlembagaan pertubuhan mesti dikemas kini dan diserahkan kepada ROS sebarang pindaan.</LI>
              <LI><strong className="text-foreground">Pengurusan Jawatankuasa</strong> — Jawatankuasa pengurusan (AJK) mesti dipilih melalui pilihan raya semasa AGM dan mematuhi had penggal yang ditetapkan.</LI>
              <LI><strong className="text-foreground">Penyerahan Dokumen</strong> — Minit mesyuarat AJK dan AGM, penyata kewangan tahunan, dan laporan aktiviti perlu diserahkan kepada ROS mengikut jadual.</LI>
            </OL>
            <Callout type="info">
              Guna modul Gudang Dokumen untuk menyimpan semua dokumen ROS secara terpusat. Tetapkan peringatan tarikh tamat tempoh untuk sijil pendaftaran dan jadual penyerahan dokumen. Sistem akan memberi amaran 30 hari sebelum tarikh akhir.
            </Callout>
          </>
        ),
      },
      {
        id: 'pematuhan-pdpa',
        title: 'Pematuhan PDPA',
        badge: 'Privasi',
        badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
        content: (
          <>
            <H1>Pematuhan Akta Perlindungan Data Peribadi (PDPA)</H1>
            <P>
              Akta Perlindungan Data Peribadi 2010 (PDPA) mengawal pemprosesan data peribadi individu di Malaysia. PUSPA memproses data peribadi asnaf, penderma, dan sukarelawan dan mesti mematuhi semua prinsip PDPA untuk melindungi maklumat peribadi individu.
            </P>
            <H2>7 Prinsip PDPA</H2>
            <DocTable
              headers={['Prinsip', 'Penerangan', 'Pelaksanaan di PUSPA']}
              rows={[
                ['Am', 'Pemberitahuan jelas tujuan pemprosesan data', 'Notis privasi dipaparkan semasa pendaftaran ahli asnaf'],
                ['Tujuan Khas', 'Data hanya diproses untuk tujuan yang dinyatakan', 'Data asnaf hanya untuk pengurusan bantuan'],
                ['Had', 'Data yang dikumpulkan mestilah relevan &amp; tidak berlebihan', 'Hanya medan perlu dikumpul semasa pendaftaran'],
                ['Tepat', 'Data peribadi mestilah tepat dan dikemas kini', 'Fungsi edit profil untuk asnaf dan penderma'],
                ['Selamat', 'Langkah keselamatan mesti dilaksanakan', 'Penyulitan, pengikatan peranti, kawalan akses'],
                ['Pengekalan', 'Data disimpan selama diperlukan sahaja', 'Pemadaman data selepas tempoh pengekalan'],
                ['Integriti', 'Data peribadi mesti diproses dengan integriti', 'Log audit untuk semua akses dan perubahan data'],
              ]}
            />
            <H2>Hak Individu</H2>
            <P>Individu yang datanya diproses oleh PUSPA mempunyai hak berikut:</P>
            <UL>
              <LI>Hak untuk mengakses data peribadi mereka yang disimpan oleh PUSPA</LI>
              <LI>Hak untuk membetulkan data peribadi yang tidak tepat atau tidak lengkap</LI>
              <LI>Hak untuk menarik balik persetujuan pemprosesan data</LI>
              <LI>Hak untuk memadam data peribadi dalam keadaan tertentu</LI>
            </UL>
            <Callout type="warning">
              PUSPA mesti membalas permintaan akses data dalam tempoh 21 hari bekerja. Kegagalan mematuhi PDPA boleh mengakibatkan denda sehingga RM500,000 dan/atau penjara sehingga 3 tahun. Pastikan proses permintaan akses data didokumenkan dan dilaksanakan dengan cekap.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Teknikal ──
  {
    id: 'teknikal',
    icon: <Code className="h-4 w-4" />,
    title: 'Teknikal',
    pages: [
      {
        id: 'seni-bina',
        title: 'Seni Bina Sistem',
        badge: 'Dev',
        badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-300',
        content: (
          <>
            <H1>Seni Bina Sistem PUSPACare</H1>
            <P>
              PUSPACare dibina menggunakan seni bina klien-pelayan moden dengan pemisahan yang jelas antara bahagian hadapan (frontend) dan bahagian belakang (backend). Reka bentuk modular membolehkan setiap modul dibangunkan dan diuji secara berasingan sebelum diintegrasikan ke dalam sistem utama.
            </P>
            <H2>Bahagian Hadapan (Frontend)</H2>
            <P>Teknologi yang digunakan di bahagian hadapan:</P>
            <DocTable
              headers={['Teknologi', 'Versi', 'Fungsi']}
              rows={[
                ['Next.js', '16', 'Kerangka aplikasi web dengan App Router'],
                ['TypeScript', '5', 'Bahasa pengaturcaraan dengan penaipan statik'],
                ['Tailwind CSS', '4', 'Kerangka utiliti CSS untuk penataan'],
                ['shadcn/ui', 'Terkini', 'Pustaka komponen UI berdasarkan Radix UI'],
                ['Lucide Icons', 'Terkini', 'Ikon SVG berkualiti tinggi'],
                ['Zustand', 'Terkini', 'Pengurusan状态 klien'],
                ['TanStack Query', 'Terkini', 'Pengurusan data pelayan'],
              ]}
            />
            <H2>Bahagian Belakang (Backend)</H2>
            <P>Teknologi yang digunakan di bahagian belakang:</P>
            <DocTable
              headers={['Teknologi', 'Fungsi']}
              rows={[
                ['API Routes Next.js', 'Titik akhir REST API di /api/v1/*'],
                ['Prisma ORM', 'Pengurusan pangkalan data dengan penaipan'],
                ['SQLite', 'Pangkalan data lalai (boleh ditukar ke PostgreSQL)'],
                ['Zod', 'Pengesahan data masukan API'],
                ['OpenClaw Gateway', 'AI provider server-side melalui /v1/chat/completions'],
              ]}
            />
            <H2>Struktur Fail</H2>
            <CodeBlock>{`src/
├── app/                    # Laluan Next.js App Router
│   ├── api/v1/             # API REST endpoints
│   └── page.tsx            # Halaman utama (router SPA)
├── components/
│   ├── ui/                 # Komponen shadcn/ui
│   └── app-sidebar.tsx     # Bar sisi navigasi
├── lib/
│   ├── db.ts               # Klien Prisma
│   └── utils.ts            # Fungsi utiliti
├── modules/                # Modul aplikasi
│   ├── dashboard/
│   ├── members/
│   └── ...                 # Modul lain
├── stores/                 # Kedai Zustand
└── types/                  # Definisi TypeScript`}</CodeBlock>
            <Callout type="info">
              PUSPACare menggunakan corak Single Page Application (SPA) di mana semua modul dikendalikan oleh satu halaman Next.js dengan penghalaan berasaskan keadaan (state-based routing). Ini membolehkan navigasi pantas tanpa muat semula halaman.
            </Callout>
          </>
        ),
      },
      {
        id: 'api-endpoints',
        title: 'Titik Akhir API',
        content: (
          <>
            <H1>Titik Akhir API PUSPACare</H1>
            <P>
              Semua API PUSPACare mengikuti konvensi RESTful dan terletak di bawah laluan <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/v1/</code>. Setiap titik akhir menyokong operasi CRUD standard (Create, Read, Update, Delete) dengan pengesahan input menggunakan skema Zod.
            </P>
            <H2>Format Respons</H2>
            <P>Semua respons API mengikut format berikut:</P>
            <CodeBlock>{`// Berjaya
{
  "success": true,
  "data": { ... },
  "total": 100,
  "page": 1,
  "pageSize": 20
}

// Gagal
{
  "success": false,
  "error": "Mesej ralat",
  "details": [...]  // Hanya untuk ralat pengesahan
}`}</CodeBlock>
            <H2>Senarai Titik Akhir</H2>
            <DocTable
              headers={['Laluan', 'Kaedah', 'Fungsi']}
              rows={[
                ['/api/v1/members', 'GET/POST/PUT/DELETE', 'Pengurusan ahli asnaf'],
                ['/api/v1/cases', 'GET/POST/PUT/DELETE', 'Pengurusan kes'],
                ['/api/v1/programmes', 'GET/POST/PUT/DELETE', 'Pengurusan program'],
                ['/api/v1/donations', 'GET/POST/PUT/DELETE', 'Pengurusan donasi'],
                ['/api/v1/disbursements', 'GET/POST/PUT/DELETE', 'Pengurusan pembayaran'],
                ['/api/v1/activities', 'GET/POST/PUT/DELETE', 'Pengurusan aktiviti'],
                ['/api/v1/volunteers', 'GET/POST/PUT/DELETE', 'Pengurusan sukarelawan'],
                ['/api/v1/notifications', 'GET/POST/PUT', 'Pengurusan notifikasi'],
                ['/api/v1/ekyc', 'GET/POST', 'Pengesahan eKYC'],
                ['/api/v1/tapsecure/*', 'GET/POST/PUT', 'Keselamatan peranti'],
                ['/api/v1/dashboard/*', 'GET', 'Data dashboard'],
                ['/api/v1/compliance', 'GET/PUT', 'Data pematuhan'],
              ]}
            />
            <H2>Pengesahan Input</H2>
            <P>
              Semua data yang diterima oleh API disahkan menggunakan skema Zod sebelum diproses. Jika pengesahan gagal, API akan memulangkan kod status 400 dengan butiran ralat yang menunjukkan medan yang bermasalah dan mesej ralat yang berkaitan.
            </P>
            <Callout type="tip">
              Gunakan status code HTTP yang betul apabila membangunkan integrasi: 200 untuk berjaya, 201 untuk dicipta, 400 untuk ralat pengesahan, 404 untuk tidak dijumpai, dan 500 untuk ralat pelayan.
            </Callout>
          </>
        ),
      },
      {
        id: 'integrasi-webhook',
        title: 'Integrasi &amp; Webhook',
        content: (
          <>
            <H1>Integrasi &amp; Webhook</H1>
            <P>
              PUSPACare menyokong integrasi dengan perkhidmatan luar melalui modul AI Ops dalaman. Integrasi membolehkan pertubuhan menyambung ke sistem perbankan, gateway pembayaran, platform komunikasi, dan perkhidmatan pihak ketiga lain untuk operasi yang lebih cekap.
            </P>
            <H2>Jenis Integrasi</H2>
            <DocTable
              headers={['Jenis', 'Contoh', 'Kegunaan']}
              rows={[
                ['Pembayaran', 'DuitNow, GrabPay, Touch\'n Go', 'Terima donasi dalam talian'],
                ['Komunikasi', 'WhatsApp API, E-mel SMTP', 'Hubungi asnaf dan penderma'],
                ['Perbankan', 'API Bank Islam, Maybank2U', 'Pemindahan dana automatik'],
                ['Identiti', 'JPN MyIdentity, MCOB', 'Pengesahan data IC'],
                ['Analitik', 'Google Analytics, Mixpanel', 'Jejak penggunaan sistem'],
              ]}
            />
            <H2>Webhook</H2>
            <P>
              Webhook membolehkan PUSPACare menghantar pemberitahuan automatik ke perkhidmatan luar apabila acara tertentu berlaku. Contoh acara yang menyokong webhook:
            </P>
            <UL>
              <LI>Kes baharu dicipta atau status kes berubah</LI>
              <LI>Donasi diterima atau pembayaran diproses</LI>
              <LI>Ahli asnaf didaftarkan atau dikemas kini</LI>
              <LI>Laporan dijana atau dijadualkan</LI>
              <LI>Pemberitahuan penting memerlukan tindakan segera</LI>
            </UL>
            <Callout type="info">
              Konfigurasi webhook dan integrasi pihak ketiga hanya boleh dilakukan oleh pentadbir sistem. Pastikan URL webhook menggunakan HTTPS dan token pengesahan disimpan dengan selamat.
            </Callout>
          </>
        ),
      },
      {
        id: 'penyelesaian-masalah',
        title: 'Penyelesaian Masalah',
        content: (
          <>
            <H1>Penyelesaian Masalah (Troubleshooting)</H1>
            <P>
              Bahagian ini menyediakan panduan penyelesaian masalah untuk isu-isu biasa yang mungkin dihadapi semasa menggunakan PUSPACare. Jika masalah anda tidak disenaraikan di sini, sila hubungi pasukan teknikal melalui sistem tiket atau e-mel sokongan.
            </P>
            <H2>Soalan Lazim (FAQ)</H2>
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="faq1">
                <AccordionTrigger className="text-sm text-left">Mengapa halaman dimuatkan perlahan?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Muatkan perlahan boleh disebabkan oleh sambungan internet yang perlahan, saiz data yang besar dalam jadual, atau cache penyemak imbas yang penuh. Cuba kosongkan cache, gunakan penyemak imbas versi terkini, dan hadkan bilangan item yang dipaparkan setiap halaman.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq2">
                <AccordionTrigger className="text-sm text-left">Bagaimana memulihkan data yang terpadam?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Data yang dipadam secara sengaja tidak boleh dipulihkan melalui antaramuka pengguna. Sila hubungi pentadbir sistem untuk pemulihan data dari sandaran (backup). Pemulihan data dari sandaran mungkin mengambil masa 1-2 hari bekerja.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq3">
                <AccordionTrigger className="text-sm text-left">Mengapa saya tidak boleh mengakses modul tertentu?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Akses modul dikawal berdasarkan peranan pengguna. Jika anda memerlukan akses ke modul tambahan, sila hubungi pentadbir sistem untuk mengemas kini peranan anda. Perubahan akses berkuat kuasa serta-merta selepas dikemas kini.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq4">
                <AccordionTrigger className="text-sm text-left">Bagaimana mengeksport data dalam kuantiti besar?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Gunakan fungsi eksport di setiap modul untuk mengeksport data dalam format CSV atau Excel. Untuk eksport lebih daripada 10,000 rekod, hubungi pentadbir untuk mendapatkan eksport secara pukal dari pangkalan data secara langsung.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq5">
                <AccordionTrigger className="text-sm text-left">Adakah data saya selamat?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Ya, semua data disimpan dengan penyulitan dan kawalan akses yang ketat. PUSPACare menggunakan penyulitan hujung-ke-hujung, pengikatan peranti, dan log audit yang komprehensif. Data sensitif seperti nombor IC dan maklumat kewangan dilindungi dengan tahap keselamatan tambahan.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq6">
                <AccordionTrigger className="text-sm text-left">Bagaimana melaporkan pepijat (bug)?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Laporkan pepijat melalui sistem tiket sokongan atau e-mel teknikal. Sertakan penerangan terperinci, langkah untuk menghasilkan semula pepijat, tangkapan skrin, dan maklumat penyemak imbas. Pasukan teknikal akan menyiasat dan membetulkan pepijat secepat mungkin.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <H2>Kontak Sokongan</H2>
            <DocTable
              headers={['Saluran', 'Maklumat', 'Waktu Respons']}
              rows={[
                ['E-mel', 'tech@puspa.org.my', '1 hari bekerja'],
                ['Tiket', 'Modul Tiket dalam sistem', '2 hari bekerja'],
                ['Telefon', '+603-XXXX XXXX', 'Hari bekerja 9 pagi - 5 petang'],
                ['WhatsApp', '+60XX-XXX XXXX', 'Mesej sahaja, respons dalam 24 jam'],
              ]}
            />
          </>
        ),
      },
    ],
  },
];

// ============================================================================
// Flatten all pages with parent references for navigation
// ============================================================================

interface FlatPage extends DocPage {
  categoryId: string;
  categoryTitle: string;
  index: number;
  totalInCategory: number;
}

function flattenPages(): FlatPage[] {
  const flat: FlatPage[] = [];
  for (const cat of DOC_CATEGORIES) {
    cat.pages.forEach((page, idx) => {
      flat.push({
        ...page,
        categoryId: cat.id,
        categoryTitle: cat.title,
        index: idx,
        totalInCategory: cat.pages.length,
      });
    });
  }
  return flat;
}

const ALL_PAGES = flattenPages();

// ============================================================================
// Main Component
// ============================================================================

export default function Docs() {
  const [activePageId, setActivePageId] = useState('pengenalan');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    mula: true,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activePage = useMemo(
    () => ALL_PAGES.find((p) => p.id === activePageId) || ALL_PAGES[0],
    [activePageId],
  );

  const activeCategory = useMemo(
    () => DOC_CATEGORIES.find((c) => c.id === activePage.categoryId),
    [activePage.categoryId],
  );

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return DOC_CATEGORIES
      .map((cat) => ({
        ...cat,
        pages: cat.pages.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.pages.length > 0);
  }, [searchQuery]);

  const prevPage = useMemo(() => {
    const idx = ALL_PAGES.findIndex((p) => p.id === activePageId);
    return idx > 0 ? ALL_PAGES[idx - 1] : null;
  }, [activePageId]);

  const nextPage = useMemo(() => {
    const idx = ALL_PAGES.findIndex((p) => p.id === activePageId);
    return idx < ALL_PAGES.length - 1 ? ALL_PAGES[idx + 1] : null;
  }, [activePageId]);

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handlePageSelect = (pageId: string) => {
    setActivePageId(pageId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r bg-card flex-col h-full">
        <DocSidebarContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredCategories={filteredCategories}
          openCategories={openCategories}
          toggleCategory={toggleCategory}
          activePageId={activePageId}
          handlePageSelect={handlePageSelect}
        />
      </aside>

      {/* ── Mobile Sheet ── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigasi Panduan</SheetTitle>
          <DocSidebarContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCategories={filteredCategories}
            openCategories={openCategories}
            toggleCategory={toggleCategory}
            activePageId={activePageId}
            handlePageSelect={handlePageSelect}
          />
        </SheetContent>
      </Sheet>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span>Panduan PUSPA</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageSelect('pengenalan');
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Panduan PUSPA
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      const first = DOC_CATEGORIES.find(
                        (c) => c.id === activePage.categoryId,
                      );
                      if (first?.pages[0]) handlePageSelect(first.pages[0].id);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {activePage.categoryTitle}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-medium text-foreground">
                    {activePage.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page content */}
            <article className="prose-docs">
              {activePage.content}
            </article>

            {/* Previous / Next */}
            <Separator className="my-10" />
            <div className="flex items-center justify-between gap-4 pb-8">
              {prevPage ? (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-sm"
                  onClick={() => handlePageSelect(prevPage.id)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Sebelum
                    </p>
                    <p className="font-medium text-xs">{prevPage.title}</p>
                  </div>
                </Button>
              ) : (
                <div />
              )}
              {nextPage ? (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-sm ml-auto"
                  onClick={() => handlePageSelect(nextPage.id)}
                >
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Seterusnya
                    </p>
                    <p className="font-medium text-xs">{nextPage.title}</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ============================================================================
// Sidebar Content (shared between desktop & mobile)
// ============================================================================

function DocSidebarContent({
  searchQuery,
  setSearchQuery,
  filteredCategories,
  openCategories,
  toggleCategory,
  activePageId,
  handlePageSelect,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredCategories: DocCategory[];
  openCategories: Record<string, boolean>;
  toggleCategory: (id: string) => void;
  activePageId: string;
  handlePageSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5" style={{ color: '#4B0082' }} />
          <h2 className="text-sm font-bold" style={{ color: '#4B0082' }}>📘 Panduan PUSPA</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari panduan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 pl-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 pb-4">
        <nav className="flex flex-col gap-1 mt-1" aria-label="Navigasi panduan">
          {filteredCategories.map((cat) => {
            const isOpen = openCategories[cat.id] ?? false;
            return (
              <Collapsible
                key={cat.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(cat.id)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {cat.pages.length}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-3 pl-3 border-l border-border/50 flex flex-col gap-0.5 mt-0.5 mb-1">
                    {cat.pages.map((page) => {
                      const isActive = activePageId === page.id;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => handlePageSelect(page.id)}
                          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-left transition-colors ${
                            isActive
                              ? 'bg-purple-600 text-white font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span className="truncate">{page.title}</span>
                          {page.badge && (
                            <span
                              className={`ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold leading-none ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : page.badgeColor || ''
                              }`}
                            >
                              {page.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          PUSPACare v2.1.0 • {ALL_PAGES.length} halaman panduan
        </p>
      </div>
    </div>
  );
}
