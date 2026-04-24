import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRouter } from 'expo-router'
import {
  FileText, Wifi, Target, BarChart2, BookOpen, Clock,
  Play, Smartphone, ChevronRight, Menu, X, Mail, CheckCircle2,
  ArrowRight, MapPin, Map, Share2, Award, Camera,
  HelpCircle, CloudOff, Filter, Edit3, Send, Instagram, Facebook,
  Loader2
} from 'lucide-react'
import { supabase } from '../src/lib/supabase'

// --- Types ---
interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  is_featured: boolean;
  description: string | null;
}

// Default features included in all plans
const PLAN_FEATURES_DEFAULT = [
  'Accès à <b>tous les QCMs</b> et modules',
  'Statistiques en temps réel via l\'application',
  'Ressources OneDrive et Telegram incluses',
];

const PLAN_FEATURES_FEATURED = [
  'Accès complet toute l\'année',
  'Mises à jour des QCMs en temps réel',
  'Mode hors-ligne débloqué',
  'Accès notes personnelles & favoris',
];

// --- Constants & Data ---
const STATS = [
  { target: 3000, prefix: '+', suffix: '', label: 'QCMs Vérifiés', staticVal: null },
  { target: 15, suffix: '+', label: 'Modules Clés', staticVal: null },
  { target: 5, label: 'Wilayas Actives', staticVal: null },
  { target: 0, staticVal: '24/7', label: 'Accès Illimité' }
]

const FEATURES = [
  { icon: HelpCircle, title: 'QCMs Interactifs', desc: 'Une base de données massive classée par module et par année pour une révision ciblée.', color: '#09b2ac', bg: 'rgba(9,178,172,0.2)' },
  { icon: CloudOff, title: 'Mode Hors-ligne', desc: "Réservez vos données. Téléchargez vos modules et révisez n'importe où sans connexion.", color: '#9840fe', bg: 'rgba(152,64,254,0.2)' },
  { icon: Filter, title: 'Filtrage Avancé', desc: 'Triez par source, par difficulté ou par thématique précise en un clic.', color: '#e98556', bg: 'rgba(233,133,86,0.2)' },
  { icon: BarChart2, title: 'Statistiques Détaillées', desc: 'Visualisez vos points forts et identifiez vos lacunes grâce à nos graphiques de performance en temps réel.', color: '#006a66', bg: 'rgba(0,106,102,0.2)' },
  { icon: Edit3, title: 'Notes Personnelles', desc: 'Ajoutez vos propres explications directement sur les questions difficiles.', color: '#7e17e4', bg: 'rgba(126,23,228,0.2)' },
]

const SELLING_POINTS = [
  { emoji: '📚', name: 'مكتبة The Best Print', city: 'CONSTANTINE', desc: 'مقابل مدخل جامعة قسنطينة 3', link: 'https://maps.app.goo.gl/QyXXSVMnx8nUfXmv5', color: '#09b2ac' },
  { emoji: '📚', name: 'مكتبة الواحة', city: 'CONSTANTINE', desc: 'علي منجلي - إقامة الياسمين وج15', link: 'https://maps.app.goo.gl/74pCVT3WK9LEaacp7', color: '#9840fe' },
  { emoji: '📱', name: 'Hero Phone', city: 'CONSTANTINE', desc: 'علي منجلي - بالقرب من محطة الاستقلال', link: 'https://maps.app.goo.gl/DSubQHw7Sbe4kUeY7', color: '#09b2ac' },
  { emoji: '📚', name: 'مكتبة نوميديا', city: 'BISKRA', desc: 'بسكرة - مقابل مدخل الجامعة', link: 'https://maps.app.goo.gl/7xDqRrwTm2TNRUtH6', color: '#e98556' },
  { emoji: '🏪', name: 'Khirou KMS', city: 'OUM EL BOUAGHI', desc: 'أم البواقي - مقابل مدخل الملحقة', link: 'https://goo.gl/maps/RrcPeibFArYGPWi98', color: '#09b2ac' },
  { emoji: '🏠', name: 'Foyer', city: 'KHENCHELA', desc: 'خنشلة - جامعة عباس لغرور', link: 'https://goo.gl/maps/33UHDZhf95412CjA9', color: '#7e17e4' },
  { emoji: '📚', name: 'مكتبة الأمان', city: 'SOUK AHRAS', desc: 'سوق أهراس - وسط المدينة', link: 'https://maps.app.goo.gl/kcb6RSTcSxJoSYH98', color: '#09b2ac' }
]

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

// --- Components ---
const AnimatedStat = ({ stat }: { stat: typeof STATS[0] }) => {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (stat.staticVal) return
    let start = 0
    const end = stat.target
    const duration = 1500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setVal(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [stat.target, stat.staticVal])

  const display = stat.staticVal || (val >= 1000 ? (val / 1000).toFixed(val >= 1000 ? 0 : 1) + 'K' : val)

  return (
    <motion.div variants={fadeIn} className="text-center md:text-left">
      <h4 className="text-4xl md:text-5xl font-extrabold font-['Manrope'] text-[#1d1b16] mb-2 tracking-tight">
        {stat.prefix || ''}{display}{stat.suffix || ''}
      </h4>
      <p className="text-[#3c4948] font-['Manrope'] text-sm uppercase tracking-widest font-bold">
        {stat.label}
      </p>
    </motion.div>
  )
}

export default function LandingWeb() {
  const router = useRouter()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkSection, setIsDarkSection] = useState(false)

  // Use body overflow reset to prevent Expo from locking the web page scrolling
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    const root = document.getElementById('root')
    if (root) root.style.overflow = 'visible'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      if (root) root.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setScrolled(latest > 50)
      
      const featuresEl = document.getElementById('features')
      const footerEl = document.querySelector('footer')
      if (featuresEl && footerEl) {
        const featuresTop = featuresEl.getBoundingClientRect().top
        const footerTop = footerEl.getBoundingClientRect().top
        setIsDarkSection(featuresTop <= 80 && footerTop > 80)
      }
    })
  }, [scrollY])

  const goAuth = () => router.push('/(auth)/welcome' as any)

  return (
    <div className="min-h-screen bg-[#fff9ef] text-[#1d1b16] font-['Cairo'] overflow-x-hidden selection:bg-[#09b2ac] selection:text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        .orb-gradient {
            background: radial-gradient(circle at 50% 50%, rgba(9, 178, 172, 0.15) 0%, rgba(153, 65, 255, 0.1) 50%, transparent 100%);
            filter: blur(80px);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* Navigation Shell */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl rounded-full border z-50 transition-all duration-300 flex justify-between items-center px-8 py-3 ${
        isDarkSection 
          ? 'bg-[#18181b]/80 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]' 
          : scrolled 
            ? 'bg-white/80 border-slate-200/50 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]' 
            : 'bg-white/10 border-white/20 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="FMC App" className="w-8 h-8 rounded-lg" />
          <div className="text-2xl font-extrabold tracking-tighter text-[#09b2ac] font-['Manrope']">FMC App</div>
        </div>
        
        <div className="hidden md:flex gap-8 items-center">
          <a className={`font-['Manrope'] font-bold text-sm tracking-wide hover:text-[#9941ff] transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-slate-700'}`} href="#features">Fonctionnalités</a>
          <a className={`font-['Manrope'] font-bold text-sm tracking-wide hover:text-[#9941ff] transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-slate-700'}`} href="#tarifs">Tarifs</a>
          <a className={`font-['Manrope'] font-bold text-sm tracking-wide hover:text-[#9941ff] transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-slate-700'}`} href="#points">Points de vente</a>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <button onClick={goAuth} className={`font-['Manrope'] font-bold text-sm tracking-wide hover:text-[#9941ff] transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-[#09b2ac]'}`}>Se connecter</button>
          <button onClick={goAuth} className="bg-[#09b2ac] text-white font-['Manrope'] font-bold text-sm px-6 py-2.5 rounded-full hover:scale-95 transition-all shadow-lg shadow-[#09b2ac]/20 hover:bg-[#0d9488]">Créer un compte</button>
        </div>

        <button className={`md:hidden p-2 transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-[#1d1b16]'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-4 right-4 bg-white rounded-3xl shadow-2xl p-6 z-40 md:hidden flex flex-col gap-6 border border-slate-100"
        >
          <div className="flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-['Manrope'] text-lg font-bold text-slate-800">Fonctionnalités</a>
            <a href="#tarifs" onClick={() => setMobileMenuOpen(false)} className="font-['Manrope'] text-lg font-bold text-slate-800">Tarifs</a>
            <a href="#points" onClick={() => setMobileMenuOpen(false)} className="font-['Manrope'] text-lg font-bold text-slate-800">Points de vente</a>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <button onClick={goAuth} className="w-full py-3 rounded-xl border border-slate-200 text-[#09b2ac] font-bold font-['Manrope']">Se connecter</button>
            <button onClick={goAuth} className="w-full py-3 rounded-xl bg-[#09b2ac] text-white font-bold font-['Manrope'] shadow-lg shadow-[#09b2ac]/20">Créer un compte</button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 orb-gradient pointer-events-none"></div>
        {/* Animated Orbs */}
        <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full blur-[80px]" style={{ width: 500, height: 500, background: 'rgba(9,178,172,0.15)', top: '-10%', right: '-10%', zIndex: 0 }} 
        />
        <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }} 
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute rounded-full blur-[80px]" style={{ width: 400, height: 400, background: 'rgba(153,65,255,0.08)', bottom: '10%', left: '-10%', zIndex: 0 }} 
        />

        <div className="relative z-10 max-w-5xl mx-auto w-full text-center mt-10">
          
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="pt-10">
            {/* Floating Pill */}
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white rounded-full shadow-sm mb-8 border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-[#006a66] animate-pulse"></span>
              <span className="text-xs font-['Manrope'] font-bold tracking-widest uppercase text-slate-600">2ème Année Médecine • Constantine</span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1 variants={fadeIn} className="font-['Manrope'] font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-6 tracking-tight text-[#1d1b16]">
              Révisez avec <br className="hidden md:block" />
              <span className="text-[#09b2ac]">Excellence</span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p variants={fadeIn} className="text-lg md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              La plateforme de révision incontournable pour les étudiants en médecine de Constantine.
            </motion.p>
            
            {/* CTAs */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
              <button onClick={goAuth} className="w-full sm:w-auto bg-[#006a66] text-white font-['Manrope'] font-bold text-lg px-10 py-5 rounded-[3rem] flex items-center justify-center gap-2 hover:bg-[#00504d] transition-all shadow-xl shadow-[#006a66]/20">
                Commencer gratuitement
                <ArrowRight size={20} />
              </button>
              <button onClick={goAuth} className="w-full sm:w-auto border-2 border-[#09b2ac]/30 text-[#09b2ac] font-['Manrope'] font-bold text-lg px-10 py-5 rounded-[3rem] hover:bg-[#09b2ac]/5 transition-all">
                J'ai déjà un compte
              </button>
            </motion.div>
          </motion.div>

          {/* Visual Component: Floating Card Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: [0, -15, 0] }} 
            transition={{ 
              opacity: { duration: 1, ease: 'easeOut', delay: 0.2 },
              y: { duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 0.2 }
            }}
            className="relative w-full max-w-3xl mx-auto mt-16 px-4 z-20"
          >
            <div className="relative bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 text-left max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="px-4 py-1.5 bg-[#eedcff] text-[#2a0054] rounded-full text-xs font-bold font-['Manrope']">PHYSIOLOGIE</span>
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-100"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#09b2ac]/20"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#9941ff]/20"></span>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-8 font-['Manrope'] leading-snug text-[#1d1b16]">Lequel de ces mécanismes n'intervient pas dans la régulation de la pression artérielle ?</h3>
              <div className="space-y-4">
                <div className="p-4 md:p-5 rounded-2xl bg-[#f9f3e9] border border-slate-200 flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full border border-[#006a66] text-[#006a66] text-sm flex items-center justify-center font-bold">A</span>
                  <p className="text-sm md:text-base font-medium">Système Rénine-Angiotensine</p>
                </div>
                <div className="p-4 md:p-5 rounded-2xl bg-[#09b2ac]/10 border-2 border-[#09b2ac] flex items-center justify-between shadow-lg shadow-[#09b2ac]/10 relative">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#006a66] text-white text-sm flex items-center justify-center font-bold">B</span>
                    <p className="text-sm md:text-base font-bold text-[#006a66]">Barorécepteurs carotidiens</p>
                  </div>
                  <CheckCircle2 size={24} className="text-[#006a66] absolute right-5" />
                </div>
                <div className="p-4 md:p-5 rounded-2xl bg-[#f9f3e9] border border-slate-200 flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full border border-[#006a66] text-[#006a66] text-sm flex items-center justify-center font-bold">C</span>
                  <p className="text-sm md:text-base font-medium">Inhibition de l'ADH</p>
                </div>
              </div>
            </div>

            {/* Progress Floating Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/2 left-0 md:-left-12 -translate-y-1/2 bg-white p-5 md:p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 md:gap-5 rotate-3"
            >
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                  <circle className="text-[#ede7de]" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                  <motion.circle 
                    className="text-[#09b2ac]" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"
                    strokeLinecap="round" strokeDasharray="175.9" strokeDashoffset="175.9"
                    animate={{ strokeDashoffset: 38.7 }} // 78% progress
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                  ></motion.circle>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-['Manrope'] font-extrabold text-xs md:text-sm text-[#006a66]">78%</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] md:text-xs font-['Manrope'] font-bold text-slate-500 uppercase tracking-widest mb-1">Progression</p>
                <p className="text-base md:text-lg font-bold text-[#1d1b16] leading-tight">Sémiologie</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-6 -mt-16 relative z-20">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
          className="max-w-6xl mx-auto bg-white p-10 md:p-12 rounded-3xl shadow-2xl shadow-slate-200/50 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 border border-slate-100"
        >
          {STATS.map((stat, i) => <AnimatedStat key={i} stat={stat} />)}
        </motion.div>
      </section>

      {/* Features Section (Dark) */}
      <section id="features" className="bg-[#262626] text-white pt-40 pb-32 px-6 mt-32 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
            <div className="max-w-2xl">
              <span className="text-[#09b2ac] font-['Manrope'] font-bold uppercase tracking-[0.2em] text-sm block mb-4">Fonctionnalités</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Manrope'] font-extrabold leading-tight">Étudiez plus intelligemment, pas plus dur.</h2>
            </div>
            <p className="text-slate-400 text-lg max-w-sm mb-2">Des outils conçus spécifiquement pour la méthode d'apprentissage médicale.</p>
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              const isWide = i === 3
              
              return (
                <motion.div key={i} variants={fadeIn} className={`glass-card p-10 rounded-2xl hover:bg-white/5 transition-all group border border-white/5 ${isWide ? 'md:col-span-2 flex flex-col md:flex-row gap-10 items-center' : ''}`}>
                  <div className={isWide ? 'flex-1' : ''}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform" style={{ backgroundColor: feat.bg }}>
                      <Icon color={feat.color} size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 font-['Manrope'] text-white">{feat.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-['Cairo']">{feat.desc}</p>
                  </div>
                  
                  {isWide && (
                    <div className="flex-1 w-full bg-black/20 p-6 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Moyenne Globale</span>
                        <span className="text-[#09b2ac] font-bold">14.5/20</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: '72%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-[#09b2ac] rounded-full"></motion.div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Cardiologie</span>
                          <span className="font-bold text-white">88%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Pneumologie</span>
                          <span className="font-bold text-red-400">42%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - Dynamically synced with database */}
      <PricingSection goAuth={goAuth} />

      {/* Points de Vente Section */}
      <section id="points" className="py-32 px-6 bg-[#262626] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-20">
            <span className="text-[#9941ff] font-['Manrope'] font-bold uppercase tracking-[0.2em] text-sm block mb-4">Disponibilité</span>
            <h2 className="text-4xl md:text-5xl font-['Manrope'] font-extrabold text-white mb-6">Où acheter votre code ?</h2>
            <p className="text-slate-400 text-lg">Nos partenaires vous accueillent pour activer votre abonnement FMC App.</p>
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SELLING_POINTS.map((point, i) => (
              <motion.div key={i} variants={fadeIn} className="bg-white/5 p-8 rounded-2xl border border-white/10 text-right group hover:bg-white/10 hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-6">
                  {point.link && (
                    <a href={point.link} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#09b2ac] transition-all">
                      <MapPin size={22} />
                    </a>
                  )}
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-['Manrope']" style={{ color: point.color, backgroundColor: `${point.color}20` }}>
                      {point.city}
                    </span>
                    <span className="text-4xl leading-none" role="img" aria-label={point.name}>{point.emoji}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-['Cairo']">{point.name}</h3>
                <p className="text-slate-400 text-sm mb-6 font-['Cairo']">{point.desc}</p>
                <div className="flex items-center justify-end gap-2 lowercase" style={{ color: point.color }}>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#09b2ac]">Disponible</span>
                  <span className="w-2 h-2 rounded-full bg-[#09b2ac] animate-pulse"></span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fff9ef] w-full relative z-10 border-t border-slate-200 py-16 text-sm font-['Manrope']">
        <div className="max-w-7xl mx-auto px-8 md:px-12 w-full grid grid-cols-1 md:grid-cols-4 gap-12 text-slate-600">
          
          <div className="flex flex-col gap-6 md:pr-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="FMC App Logo" className="w-10 h-10 rounded-xl" />
              <span className="text-2xl font-extrabold text-[#1d1b16] font-['Manrope'] tracking-tight">FMC App</span>
            </div>
            <p className="leading-relaxed font-['Cairo'] text-slate-500">
              Study Everywhere — La plateforme de révision pour les étudiants en médecine de Constantine.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-slate-400 font-extrabold text-[11px] uppercase tracking-widest">Liens Rapides</h4>
            <nav className="flex flex-col gap-4 font-['Cairo'] text-[15px]">
              <a className="hover:text-[#006a66] transition-colors" href="#features">Fonctionnalités</a>
              <a className="hover:text-[#006a66] transition-colors" href="#">Comment ça marche</a>
              <a className="hover:text-[#006a66] transition-colors" href="#points">Points de vente</a>
            </nav>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-slate-400 font-extrabold text-[11px] uppercase tracking-widest">Suivez-Nous</h4>
            <nav className="flex flex-col gap-4 font-['Cairo'] text-[15px]">
              <a className="hover:text-[#006a66] transition-colors flex items-center gap-3" href="https://t.me/FMC_App" target="_blank" rel="noreferrer">
                <Send size={18} className="text-slate-400" /> Telegram
              </a>
              <a className="hover:text-[#006a66] transition-colors flex items-center gap-3" href="https://www.instagram.com/fmc.app" target="_blank" rel="noreferrer">
                <Instagram size={18} className="text-slate-400" /> Instagram
              </a>
              <a className="hover:text-[#006a66] transition-colors flex items-center gap-3" href="#" target="_blank" rel="noreferrer">
                <Facebook size={18} className="text-slate-400" /> Facebook
              </a>
            </nav>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-slate-400 font-extrabold text-[11px] uppercase tracking-widest">Contact</h4>
            <nav className="flex flex-col gap-4 font-['Cairo'] text-[15px]">
              <a className="hover:text-[#006a66] transition-colors flex items-center gap-3" href="mailto:fmc.app.contact@gmail.com">
                <Mail size={18} className="text-slate-400" /> fmc.app.contact@gmail.com
              </a>
              <a className="hover:text-[#006a66] transition-colors flex items-center gap-3" href="https://play.google.com/store/apps/details?id=com.fmcapp.mobile" target="_blank" rel="noreferrer">
                <Smartphone size={18} className="text-slate-400" /> Google Play Store
              </a>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 md:px-12 mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-slate-500 font-['Cairo'] text-[13px]">
          <p>© 2026 FMC App. Tous droits réservés.</p>
          <p>Faculté de Médecine de Constantine</p>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// PricingSection - Dynamically synced with database
// ============================================================================

function PricingSection({ goAuth }: { goAuth: () => void }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error: fetchError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (fetchError) {
          console.error('[Landing] Error fetching plans:', fetchError)
          setError(true)
          return
        }

        if (data && data.length > 0) {
          setPlans(data as SubscriptionPlan[])
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('[Landing] Failed to fetch plans:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Helper to format duration for display
  const formatDuration = (days: number): string => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return years === 1 ? "1 an" : `${years} ans`
    }
    if (days >= 30) {
      const months = Math.round(days / 30)
      return `${months} mois`
    }
    return `${days} jours`
  }

  // Determine grid columns based on plan count
  const gridCols = plans.length === 1 
    ? 'grid-cols-1 max-w-lg mx-auto' 
    : plans.length === 3 
      ? 'grid-cols-1 md:grid-cols-3' 
      : 'grid-cols-1 md:grid-cols-2'

  return (
    <section id="tarifs" className="bg-[#262626] pb-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <span className="text-[#09b2ac] font-['Manrope'] font-bold uppercase tracking-[0.2em] text-sm block mb-4">Tarifs</span>
          <h2 className="text-4xl md:text-5xl font-['Manrope'] font-extrabold text-white mb-6">Investissez dans votre succès</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">Des tarifs simples pour un accès premium à toutes nos ressources.</p>
        </motion.div>

        {loading ? (
          /* Loading skeleton */
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10`}>
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/5 p-10 md:p-12 rounded-3xl border border-white/5 animate-pulse">
                <div className="h-7 w-32 bg-white/10 rounded-lg mb-3" />
                <div className="h-4 w-48 bg-white/5 rounded mb-8" />
                <div className="flex items-baseline gap-2 mb-8">
                  <div className="h-14 w-24 bg-white/10 rounded-lg" />
                  <div className="h-5 w-8 bg-white/5 rounded" />
                </div>
                <div className="space-y-5 mb-10">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-5 bg-white/5 rounded w-3/4" />
                  ))}
                </div>
                <div className="h-14 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : error || plans.length === 0 ? (
          /* Fallback: single featured plan */
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 max-w-lg mx-auto gap-8">
            <motion.div variants={fadeIn} className="bg-white/5 p-10 md:p-12 rounded-3xl border-2 border-[#09b2ac] shadow-[0_0_40px_rgba(9,178,172,0.15)] relative overflow-hidden group">
              <div className="absolute top-6 right-0 bg-[#09b2ac] text-white px-8 py-2 font-bold text-xs tracking-widest uppercase">Populaire</div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#09b2ac]/10 rounded-full translate-x-16 -translate-y-16 blur-2xl" />
              <h3 className="text-2xl font-bold font-['Manrope'] text-white mb-2">Accès Premium</h3>
              <p className="text-slate-400 mb-8 text-sm">Contactez-nous pour les tarifs actuels.</p>
              <button onClick={goAuth} className="w-full py-4 rounded-xl bg-[#09b2ac] text-white font-bold font-['Manrope'] hover:shadow-lg hover:bg-[#0d9488] hover:shadow-[#09b2ac]/30 transition-all relative z-10">
                Commencer maintenant
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* Dynamic plans from database */
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className={`grid ${gridCols} gap-8 md:gap-10`}>
            {plans.map((plan) => {
              const features = plan.is_featured ? PLAN_FEATURES_FEATURED : PLAN_FEATURES_DEFAULT

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeIn}
                  className={`bg-white/5 p-10 md:p-12 rounded-3xl relative overflow-hidden group transition-all ${
                    plan.is_featured
                      ? 'border-2 border-[#09b2ac] shadow-[0_0_40px_rgba(9,178,172,0.15)]'
                      : 'border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* Featured badge */}
                  {plan.is_featured && (
                    <>
                      <div className="absolute top-6 right-0 bg-[#09b2ac] text-white px-8 py-2 font-bold text-xs tracking-widest uppercase">Populaire</div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#09b2ac]/10 rounded-full translate-x-16 -translate-y-16 blur-2xl" />
                    </>
                  )}

                  {/* Plan name */}
                  <h3 className="text-2xl font-bold font-['Manrope'] text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 mb-8 text-sm">
                    {plan.description || `Accès pendant ${formatDuration(plan.duration_days)}`}
                  </p>

                  {/* Price */}
                  <div className={`flex items-baseline gap-2 mb-8 ${plan.is_featured ? 'relative z-10' : ''}`}>
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">DA</span>
                  </div>

                  {/* Features */}
                  <ul className={`space-y-5 mb-10 ${plan.is_featured ? 'relative z-10' : ''}`}>
                    {features.map((feature, i) => (
                      <li key={i} className={`flex items-start gap-4 text-slate-300 ${plan.is_featured && i === 0 ? 'font-bold' : ''}`}>
                        <CheckCircle2 className="text-[#09b2ac] flex-shrink-0" size={20} />
                        <span dangerouslySetInnerHTML={{ __html: feature }} />
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.is_featured ? (
                    <button onClick={goAuth} className="w-full py-4 rounded-xl bg-[#09b2ac] text-white font-bold font-['Manrope'] hover:shadow-lg hover:bg-[#0d9488] hover:shadow-[#09b2ac]/30 transition-all relative z-10">
                      Commencer maintenant
                    </button>
                  ) : (
                    <button onClick={goAuth} className="w-full py-4 rounded-xl border border-[#09b2ac]/50 text-[#09b2ac] font-bold font-['Manrope'] hover:bg-[#09b2ac] hover:text-white transition-all">
                      Choisir cette offre
                    </button>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}
