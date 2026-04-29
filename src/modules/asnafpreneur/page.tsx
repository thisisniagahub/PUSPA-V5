'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion'
import { 
  Rocket, 
  Brain, 
  Code, 
  Users, 
  Target, 
  ArrowRight, 
  Shield, 
  Zap, 
  Bot, 
  Layers, 
  Cpu, 
  Globe, 
  Layout, 
  Smartphone, 
  Home, 
  LayoutDashboard, 
  Info, 
  Star,
  ExternalLink,
  Calculator,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import './asnafpreneur.css'
import Aurora from '@/components/Aurora'

// ─── Animations ─────────────────────────────────────────────────────────────

const FadeInView = ({ children, delay = 0, y = 20 }: { children: React.ReactNode; delay?: number; y?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

const RotatingText = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [words.length])

  return (
    <div className="rotating-wrapper">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="gradient-text"
          style={{ display: 'block', position: 'absolute', width: '100%' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const SpotlightCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color = 'emerald' 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color?: string 
}) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const { left, top } = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - left}px`)
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - top}px`)
  }

  return (
    <div 
      ref={cardRef} 
      className="spotlight-card" 
      onMouseMove={handleMouseMove}
    >
      <div className={`card-icon ${color}`}>
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

const IdeaCard = ({ emoji, title, description, price }: { emoji: string; title: string; description: string; price: string }) => (
  <motion.div 
    className="idea-card"
    whileHover={{ x: 5 }}
  >
    <div className="idea-emoji">{emoji}</div>
    <div className="idea-info">
      <h4>{title}</h4>
      <p>{description}</p>
      <div className="idea-price">{price}</div>
    </div>
  </motion.div>
)

const IncomeCalculator = () => {
  const [users, setUsers] = useState(50)
  const [price, setPrice] = useState(49)
  
  const revenue = users * price
  
  return (
    <div className="income-calculator backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Calculator className="text-emerald-400" size={20} />
        </div>
        <h3 className="text-lg font-bold text-white m-0">Kalkulator Income SaaS</h3>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-emerald-300">
            <span>Jumlah Pelanggan (Subs)</span>
            <span className="font-mono">{users} orang</span>
          </div>
          <input 
            type="range" min="10" max="500" step="10" aria-label="Jumlah Pelanggan"
            value={users} onChange={(e) => setUsers(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm text-emerald-300">
            <span>Yuran Langganan / Bulan</span>
            <span className="font-mono">RM {price}</span>
          </div>
          <input 
            type="range" min="10" max="200" step="5" aria-label="Yuran Langganan"
            value={price} onChange={(e) => setPrice(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="pt-4 border-t border-white/10 mt-6">
          <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Potensi Recurring Revenue</div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-emerald-400">RM {revenue.toLocaleString()}</span>
            <span className="text-emerald-400/60 font-medium">/ bulan</span>
          </div>
          <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
            *Ini adalah anggaran pendapatan kasar berdasarkan model langganan bulanan.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AsnafpreneurLanding() {
  const [activeStep, setActiveStep] = useState(0)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <div className="asnafpreneur-root">
      <div className="grain-overlay" />
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="scroll-progress" 
        style={{ 
          scaleX, 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '3px', 
          background: 'var(--accent-emerald)', 
          zIndex: 1000, 
          transformOrigin: '0%' 
        }} 
      />

      {/* Navigation */}
      <nav className="pill-nav">
        <a href="#hero" className="active">Mula</a>
        <a href="#program">Program</a>
        <a href="#cara">Cara</a>
        <a href="#saas">SaaS</a>
        <a href="#sponsor">Sponsor</a>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="absolute inset-0 z-0">
          <Aurora 
            colorStops={['#101415', '#ecb2ff', '#00fbfb']} 
            speed={0.5}
            amplitude={1.5}
          />
        </div>
        <div className="hero-grid" />
        
        <div className="hero-content">
          <FadeInView delay={0}>
            <div className="hero-badge">
              <span className="dot" />
              PENDAFTARAN DIBUKA — 2026
            </div>
          </FadeInView>

          <FadeInView delay={0.1}>
            <h1>
              Dari Asnaf ke<br />
              <RotatingText words={['Usahawan AI', 'SaaS Developer', 'Digital CEO']} />
            </h1>
          </FadeInView>

          <FadeInView delay={0.2}>
            <p className="hero-subtitle">
              Program keusahawanan AI pertama di Malaysia. Bina bisnes perisian SaaS — modal RM200/bulan, potensi income RM2,000-10,000/bulan. 100% percuma.
            </p>
          </FadeInView>

          <FadeInView delay={0.3}>
            <div className="cta-group">
              <a href="#daftar" className="btn-primary bg-[var(--primary)] shadow-[0_0_20px_rgba(236,178,255,0.3)]">
                Daftar Sekarang <ArrowRight size={18} />
              </a>
              <a href="#program" className="btn-secondary border-[var(--secondary-fixed-dim)] text-[var(--secondary-fixed-dim)]">
                Bagaimana ia Berfungsi
              </a>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">RM0</div>
            <div className="stat-label">Kos Latihan</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">12</div>
            <div className="stat-label">Bulan Inkubasi</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Tajaan Penuh</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">AI</div>
            <div className="stat-label">Fokus Utama</div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Program Features */}
      <section id="program">
        <div className="section-header">
          <span className="section-tag emerald">Modul Utama</span>
          <h2>Kenapa ASNAFPRENEUR?</h2>
          <p>Kami tidak mengajar cara manual. Kami mengajar cara membina empayar digital menggunakan kuasa AI.</p>
        </div>

        <div className="bento-grid">
          <div className="bento-item-large">
            <SpotlightCard 
              icon={Brain} 
              title="AI Proficiency Mastery" 
              description="Belajar menggunakan ChatGPT, Claude, dan Midjourney untuk menggantikan 80% kerja manual dalam bisnes. Kami ajar advance prompt engineering yang tidak diajar di tempat lain."
              color="emerald"
            />
          </div>
          <div className="bento-item">
            <SpotlightCard 
              icon={Code} 
              title="Vibe Coding" 
              description="Bina apps tanpa perlu hafal sintaks. Fokus pada logic."
              color="cyan"
            />
          </div>
          <div className="bento-item">
            <SpotlightCard 
              icon={Zap} 
              title="SaaS Ecosystem" 
              description="Lancar perisian SaaS sendiri untuk recurring revenue."
              color="violet"
            />
          </div>
          <div className="bento-item-wide">
            <SpotlightCard 
              icon={Target} 
              title="Market Validation & Growth" 
              description="Kami bantu validate idea SaaS anda supaya ia betul-betul ada pembeli sebelum anda mula bina. Akses kepada database asnaf untuk market testing."
              color="amber"
            />
          </div>
          <div className="bento-item">
            <SpotlightCard 
              icon={Shield} 
              title="Funding 2026" 
              description="Tajaan penuh token AI dan server."
              color="rose"
            />
          </div>
          <div className="bento-item">
            <SpotlightCard 
              icon={Users} 
              title="Mentor Network" 
              description="Akses terus kepada founder SaaS."
              color="emerald"
            />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* How it works (Stepper) */}
      <section id="cara">
        <div className="section-header">
          <span className="section-tag violet">Roadmap 2026</span>
          <h2>Laluan Kejayaan Anda</h2>
          <p>Dari zero ke Digital CEO dalam masa 12 bulan melalui 3 fasa intensif.</p>
        </div>

        <div className="stepper">
          {[
            { 
              title: "Fasa 1: AI Foundation", 
              desc: "Belajar Prompt Engineering, Vibe Coding (Next.js/React), dan design thinking. Fokus pada membina MVP (Minimum Viable Product).",
              duration: "Bulan 1-4"
            },
            { 
              title: "Fasa 2: Builder Sprint", 
              desc: "Membangunkan SaaS yang sebenar. Integrasi Stripe/Billplz untuk payment. Ujian beta kepada pengguna real-world.",
              duration: "Bulan 5-8"
            },
            { 
              title: "Fasa 3: Scale & Launch", 
              desc: "Marketing menggunakan AI Automation. Pelancaran rasmi dan scaling ke pasaran global. Persediaan untuk Seed Funding.",
              duration: "Bulan 9-12"
            }
          ].map((step, i) => (
            <div 
              key={i} 
              className={`step ${activeStep >= i ? 'active' : ''}`}
              onMouseEnter={() => setActiveStep(i)}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <span className="step-duration">{step.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* SaaS Ideas */}
      <section id="saas">
        <div className="section-header">
          <span className="section-tag cyan">Idea Bisnes</span>
          <h2>Apa yang Anda Boleh Bina?</h2>
          <p>Potensi SaaS yang asnaf boleh bina menggunakan AI dengan kos yang sangat rendah.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-12">
          <div className="lg:col-span-7 ideas-grid">
            <IdeaCard 
              emoji="🏪" 
              title="KedaiAI" 
              description="SaaS untuk bantu kedai runcit auto-generate caption & poster marketing harian."
              price="RM49/bulan"
            />
            <IdeaCard 
              emoji="📝" 
              title="TutorBot" 
              description="Platform AI untuk bantu pelajar sekolah buat latihan subjek mengikut silibus KPM."
              price="RM29/bulan"
            />
            <IdeaCard 
              emoji="📋" 
              title="HR-Simple" 
              description="Sistem pengurusan staf & payroll untuk SME yang tak nak guna software mahal."
              price="RM99/bulan"
            />
            <IdeaCard 
              emoji="⚖️" 
              title="Shariah-Check" 
              description="AI tool untuk check status pelaburan atau kontrak mengikut hukum Shariah secara pantas."
              price="RM59/bulan"
            />
          </div>
          <div className="lg:col-span-5">
            <FadeInView delay={0.4}>
              <IncomeCalculator />
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section id="sponsor" className="logo-section">
        <div className="section-header mb-8">
          <p className="text-xs uppercase tracking-[2px]">Dibiayai & Disokong Oleh</p>
        </div>
        <div className="logo-track">
          {[
            { icon: "🕌", name: "PUSPA KL & Selangor" },
            { icon: "🛡️", name: "HIJRAH SELANGOR" },
            { icon: "🏦", name: "Bank Muamalat (iTEKAD)" },
            { icon: "💻", name: "Codex AI SaaS Lab" },
            { icon: "🌐", name: "Teraju Ekonomi" },
            { icon: "🕌", name: "PUSPA KL & Selangor" },
            { icon: "🛡️", name: "HIJRAH SELANGOR" },
            { icon: "🏦", name: "Bank Muamalat (iTEKAD)" },
            { icon: "💻", name: "Codex AI SaaS Lab" },
            { icon: "🌐", name: "Teraju Ekonomi" }
          ].map((logo, i) => (
            <div key={i} className="logo-item">
              <span className="logo-icon">{logo.icon}</span>
              <span>{logo.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section id="daftar" className="cta-final">
        <div className="cta-final-bg" />
        <div className="cta-final-content">
          <FadeInView delay={0}>
            <h2>Ubah Masa Depan Anda Hari Ini</h2>
          </FadeInView>
          <FadeInView delay={0.1}>
            <p>Penyertaan adalah terhad kepada 50 asnaf terpilih di Selangor & KL bagi kohort pertama 2026.</p>
          </FadeInView>
          <FadeInView delay={0.2}>
            <div className="cta-group">
              <button className="btn-primary" onClick={() => window.location.href='/login'}>
                Login ke PuspaCare & Daftar <ArrowRight size={18} />
              </button>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 ASNAFPRENEUR — Program di bawah naungan <a href="https://puspacare.org">PUSPA KL & Selangor</a>.</p>
      </footer>

      {/* Mobile Dock */}
      <div className="dock-wrapper">
        <div className="dock">
          <a href="#hero" className="dock-item" aria-label="Mula"><Home size={20} /></a>
          <a href="#program" className="dock-item" aria-label="Program"><LayoutDashboard size={20} /></a>
          <a href="#saas" className="dock-item" aria-label="SaaS"><Bot size={20} /></a>
          <a href="#daftar" className="dock-item" aria-label="Daftar"><Users size={20} /></a>
        </div>
      </div>
    </div>
  )
}
