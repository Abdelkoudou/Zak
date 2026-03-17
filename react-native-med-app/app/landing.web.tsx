import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRouter } from 'expo-router'
import {
  FileText, Wifi, Target, BarChart2, BookOpen, Clock,
  Play, Smartphone, ChevronRight, Menu, X, Mail, CheckCircle2
} from 'lucide-react'

// --- Constants & Data ---
const STATS = [
  { target: 3000, prefix: '+', suffix: '', label: 'QCMs', staticVal: null },
  { target: 15, suffix: '+', label: 'Modules', staticVal: null },
  { target: 5, label: 'Wilayas', staticVal: null },
  { target: 0, staticVal: '24/7', label: 'Disponible' }
]

const FEATURES = [
  { icon: FileText, title: 'QCMs Interactifs', desc: 'Des milliers de QCMs corrigés et commentés, classés par module.', color: '#09b2ac', bg: 'rgba(9,178,172,0.12)' },
  { icon: Wifi, title: 'Mode Hors-ligne', desc: 'Révisez partout, même sans connexion internet. Synchronisation auto.', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { icon: Target, title: 'Filtrage Avancé', desc: 'Filtrez par année, module, cours pour une révision ciblée.', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { icon: BarChart2, title: 'Statistiques Détaillées', desc: 'Suivez votre progression et identifiez vos points faibles en temps réel.', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { icon: BookOpen, title: 'Notes Personnelles', desc: 'Prenez des notes directement sur chaque question pour mémoriser.', color: '#9941ff', bg: 'rgba(153,65,255,0.12)' },
 
]

const SELLING_POINTS = [
  { emoji: '📚', name: 'مكتبة The Best Print', city: 'قسنطينة' },
  { emoji: '📚', name: 'مكتبة الواحة', city: 'قسنطينة' },
  { emoji: '📱', name: 'Hero Phone', city: 'قسنطينة' },
  { emoji: '📚', name: 'مكتبة نوميديا', city: 'ملحقة بسكرة' },
  { emoji: '🏪', name: 'Khirou KMS', city: 'ملحقة أم البواقي' },
  { emoji: '🏠', name: 'Foyer', city: 'ملحقة خنشلة' },
  { emoji: '📚', name: 'مكتبة الأمان', city: 'ملحقة سوق أهراس' }
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
    <motion.div variants={fadeIn} className="fm-stat-item">
      <div className="fm-stat-value">
        {stat.prefix || ''}{display}{stat.suffix || ''}
      </div>
      <div className="fm-stat-label">{stat.label}</div>
    </motion.div>
  )
}

export default function LandingWeb() {
  const router = useRouter()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    })
  }, [scrollY])

  const goAuth = () => router.push('/(auth)/welcome')

  return (
    <div className="fm-landing">
      {/* Glass background layer with animated orbs */}
      <div className="fm-glass-bg">
        <div className="fm-glass-orb fm-glass-orb-1" />
        <div className="fm-glass-orb fm-glass-orb-2" />
        <div className="fm-glass-orb fm-glass-orb-3" />
        <div className="fm-glass-orb fm-glass-orb-4" />
        <div className="fm-glass-orb fm-glass-orb-5" />
      </div>
      <div className="fm-glass-frost" />
      {/* Styles injected to avoid contaminating global styles but keep component self-contained */}
      <style dangerouslySetInnerHTML={{ __html: `
        .fm-landing { font-family: 'Manrope', sans-serif; color: #262626; background: transparent; overflow-x: hidden; position: relative; }
        .fm-glass-bg { position: fixed; inset: 0; z-index: -2; background: linear-gradient(135deg, #e0f7f5 0%, #f0f4ff 30%, #fdf2f8 60%, #e8f5e9 100%); overflow: hidden; }
        .fm-glass-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.5; animation: fm-orb-drift 12s ease-in-out infinite alternate; }
        .fm-glass-orb-1 { width: 600px; height: 600px; background: rgba(9,178,172,0.25); top: -10%; left: -5%; animation-duration: 14s; }
        .fm-glass-orb-2 { width: 500px; height: 500px; background: rgba(99,102,241,0.18); top: 30%; right: -8%; animation-duration: 18s; animation-delay: -4s; }
        .fm-glass-orb-3 { width: 450px; height: 450px; background: rgba(236,72,153,0.12); bottom: -5%; left: 20%; animation-duration: 16s; animation-delay: -8s; }
        .fm-glass-orb-4 { width: 350px; height: 350px; background: rgba(153,65,255,0.15); top: 60%; left: -10%; animation-duration: 20s; animation-delay: -2s; }
        .fm-glass-orb-5 { width: 300px; height: 300px; background: rgba(245,158,11,0.1); top: 10%; right: 20%; animation-duration: 15s; animation-delay: -6s; }
        @keyframes fm-orb-drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(-20px, 30px) scale(0.95); }
        }
        .fm-glass-frost { position: fixed; inset: 0; z-index: -1; backdrop-filter: blur(60px) saturate(1.4); -webkit-backdrop-filter: blur(60px) saturate(1.4); background: rgba(255,255,255,0.55); }
        .fm-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .fm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); text-decoration: none; border: none; }
        .fm-btn-primary { padding: 10px 24px; background: #09b2ac; color: #fff; }
        .fm-btn-primary:hover { background: #0d9488; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(9,178,172,0.35); }
        .fm-navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 16px 0; transition: all 0.3s; background: rgba(255,255,255,0.45); backdrop-filter: blur(16px) saturate(1.2); -webkit-backdrop-filter: blur(16px) saturate(1.2); border-bottom: 1px solid rgba(255,255,255,0.3); }
        .fm-navbar.scrolled { background: rgba(255,255,255,0.8); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); box-shadow: 0 4px 30px rgba(0,0,0,0.08); border-bottom: 1px solid rgba(255,255,255,0.5); padding: 12px 0; }
        .fm-nav-inner { display: flex; align-items: center; justify-content: space-between; }
        .fm-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .fm-brand img { width: 40px; height: 40px; border-radius: 12px; }
        .fm-brand-name { font-size: 1.25rem; font-weight: 800; color: #111827; transition: color 0.3s; }
        .fm-links { display: flex; gap: 32px; }
        .fm-link { font-weight: 600; color: #4b5563; transition: color 0.2s; text-decoration: none; cursor: pointer;}
        .fm-link:hover { color: #09b2ac; }
        .fm-nav-actions { display: flex; gap: 12px; }
        .fm-btn-ghost { padding: 10px 24px; background: transparent; color: #111827; border: 1.5px solid #e5e7eb; }
        .fm-navbar.scrolled .fm-btn-ghost { background: #f9fafb; border-color: #d1d5db; }
        
        /* Hero Light Theme */
        .fm-hero { position: relative; min-height: 100vh; display: flex; align-items: center; background: rgba(255,255,255,0.3); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); overflow: hidden; padding: 120px 0 80px; }
        .fm-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(9,178,172,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(9,178,172,0.06) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%); }
        .fm-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
        .fm-hero-content { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 1; }
        .fm-title { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; color: #111827; line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 24px; }
        .fm-accent { color: #09b2ac; }
        .fm-subtitle { font-family: 'Cairo', sans-serif; font-size: 1.1875rem; color: #4b5563; line-height: 1.7; max-width: 520px; margin-bottom: 40px; }
        .fm-hero-actions { display: flex; gap: 16px; margin-bottom: 48px; }
        .fm-btn-hero { padding: 16px 32px; background: #09b2ac; color: #fff; border-radius: 16px; font-size: 1.0625rem; }
        .fm-btn-hero-secondary { padding: 16px 32px; background: transparent; color: #09b2ac; border-radius: 16px; border: 2px solid rgba(9,178,172,0.3); font-weight: 700; transition: all 0.3s; }
        .fm-btn-hero-secondary:hover { border-color: #09b2ac; background: rgba(9,178,172,0.05); }
        
        .fm-stats { margin-top: -40px; position: relative; z-index: 2; }
        .fm-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border: 1px solid rgba(255,255,255,0.6); }
        .fm-stat-item { padding: 40px 24px; text-align: center; position: relative; }
        .fm-stat-item:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 20%; height: 60%; width: 1px; background: #f3f4f6; }
        .fm-stat-value { font-size: clamp(1.75rem,3vw,2.5rem); font-weight: 800; color: #09b2ac; letter-spacing: -0.03em; }
        .fm-stat-label { font-size: 0.9375rem; color: #9ca3af; font-weight: 600; margin-top: 4px; }
        
        /* Features Section */
        .fm-features { padding: 120px 0; background: #0a0b10; position: relative; }
        .fm-features-header { text-align: center; margin-bottom: 64px; }
        .fm-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; background: rgba(9,178,172,0.12); color: #09b2ac; font-size: 14px; font-weight: 700; margin-bottom: 16px; }
        .fm-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .fm-feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px 32px; position: relative; overflow: hidden; transition: all 0.4s; }
        .fm-feature-title { font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .fm-feature-desc { font-family: 'Cairo', sans-serif; font-size: 0.9375rem; color: rgba(255,255,255,0.5); line-height: 1.7; }
        
        /* Pricing Section */
        .fm-pricing { padding: 120px 0; background: #0a0b10; position: relative; border-top: 1px solid rgba(255,255,255,0.03); }
        .fm-pricing-header { text-align: center; margin-bottom: 64px; }
        .fm-pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 900px; margin: 0 auto; }
        .fm-pricing-card { background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px 32px; position: relative; display: flex; flex-direction: column; transition: all 0.4s; }
        .fm-pricing-card.popular { border-color: rgba(9,178,172,0.5); background: linear-gradient(180deg, rgba(9,178,172,0.08) 0%, rgba(9,178,172,0) 100%); }
        .fm-pricing-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.15); }
        .fm-pricing-card.popular:hover { box-shadow: 0 20px 40px rgba(9,178,172,0.15); border-color: #09b2ac; }
        .fm-pricing-tag { position: absolute; top: -14px; right: 32px; background: #09b2ac; color: #fff; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 999px; box-shadow: 0 4px 12px rgba(9,178,172,0.3); }
        .fm-pricing-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .fm-pricing-subtitle { font-family: 'Cairo', sans-serif; font-size: 0.9375rem; color: rgba(255,255,255,0.6); margin-bottom: 24px; min-height: 44px; }
        .fm-pricing-price { font-size: 3.5rem; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1; display: flex; align-items: flex-start; gap: 8px; }
        .fm-pricing-currency { font-size: 1.25rem; color: rgba(255,255,255,0.5); font-weight: 600; margin-top: 8px; }
        .fm-pricing-features { flex: 1; margin: 32px 0; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 32px; }
        .fm-pricing-feature { display: flex; align-items: flex-start; gap: 12px; font-family: 'Cairo', sans-serif; font-size: 0.9375rem; color: rgba(255,255,255,0.8); line-height: 1.5; }
        .fm-pricing-icon { flex-shrink: 0; color: #09b2ac; margin-top: 2px; }
        .fm-btn-pricing { width: 100%; padding: 16px 24px; border-radius: 14px; font-weight: 700; font-size: 1.0625rem; text-align: center; transition: all 0.3s; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .fm-btn-pricing-primary { background: #09b2ac; color: #fff; }
        .fm-btn-pricing-primary:hover { background: #0d9488; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(9,178,172,0.25); }
        .fm-btn-pricing-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.1); }
        .fm-btn-pricing-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); }

        /* Footer */
        .fm-footer { background: #0a0b10; padding: 64px 0 0; border-top: 1px solid rgba(255,255,255,0.05); }
        .fm-footer-inner { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .fm-footer-brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .fm-footer-logo { width: 36px; height: 36px; border-radius: 10px; }
        .fm-footer-name { font-weight: 800; font-size: 1.25rem; color: #fff; }
        .fm-footer-tagline { font-size: 0.875rem; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 300px; }
        .fm-footer-heading { font-size: 0.875rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .fm-footer-links { display: flex; flex-direction: column; gap: 12px; }
        .fm-footer-link { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9375rem; color: rgba(255,255,255,0.7); transition: color 0.2s; text-decoration: none; cursor: pointer; }
        .fm-footer-link svg { width: 18px; height: 18px; stroke-width: 2; flex-shrink: 0; transition: transform 0.2s ease; }
        .fm-footer-link:hover { color: #09b2ac; }
        .fm-footer-link:hover svg { transform: scale(1.1) rotate(-5deg); }
        .fm-footer-bottom { padding: 24px 0; }
        .fm-footer-bottom-inner { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: rgba(255,255,255,0.35); }
        
        @media(max-width: 1024px) {
          .fm-hero-content { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .fm-subtitle { margin: 0 auto 40px; }
          .fm-hero-actions { justify-content: center; }
          .fm-visual { margin-top: 24px; display: flex; justify-content: center; transform: scale(0.95); }
          .fm-features-grid { grid-template-columns: repeat(2, 1fr); }
          .fm-links, .fm-nav-actions { display: none; }
          
          .fm-mobile-menu { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-radius: 0 0 24px 24px; border-top: 1px solid #f3f4f6; animation: fmSlideDown 0.3s ease-out; }
          .fm-mobile-links { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
          .fm-mobile-link { padding: 12px 16px; font-size: 1.0625rem; font-weight: 700; color: #262626; text-decoration: none; border-radius: 12px; transition: background 0.2s; }
          .fm-mobile-link:hover { background: rgba(9,178,172,0.08); color: #09b2ac; }
          .fm-mobile-actions { display: flex; flex-direction: column; gap: 12px; }
        }
        @media(max-width: 768px) {
          .fm-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .fm-stat-item:nth-child(2)::after { display: none; }
          .fm-features-grid { grid-template-columns: 1fr; }
          .fm-pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
          .fm-footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
          .fm-footer-bottom-inner { flex-direction: column; gap: 8px; text-align: center; }
          .fm-visual { transform: scale(0.85); margin-top: 10px; }
        }
        @media(max-width: 480px) {
          .fm-footer-inner { grid-template-columns: 1fr; }
          .fm-visual { transform: scale(0.7); margin-top: 0; margin-bottom: -40px; }
          .fm-title { font-size: 2.25rem; }
          .fm-hero-actions { flex-direction: column; }
          .fm-hero-actions .fm-btn { width: 100%; }
        }
        @keyframes fmSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* --- NAVBAR --- */}
      <nav className={`fm-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="fm-container fm-nav-inner">
          <div className="fm-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="FMC App" />
            <span className="fm-brand-name">FMC App</span>
          </div>
          <div className="fm-links">
            <a href="#features" className="fm-link">Fonctionnalités</a>
            <a href="#how" className="fm-link">Comment ça marche</a>
            <a href="#points" className="fm-link">Points de vente</a>
          </div>
          <div className="fm-nav-actions">
            <button onClick={goAuth} className="fm-btn fm-btn-ghost">Se connecter</button>
            <button onClick={goAuth} className="fm-btn fm-btn-primary">Créer un compte</button>
          </div>
          {/* Mobile hamburger icon */}
          <div className="md:hidden flex items-center justify-center p-2 cursor-pointer" 
               style={{ display: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'flex' : 'none', color: '#111827' }}
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="fm-mobile-menu">
            <div className="fm-mobile-links">
              <a href="#features" className="fm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
              <a href="#how" className="fm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
              <a href="#points" className="fm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Points de vente</a>
            </div>
            <div className="fm-mobile-actions">
              <button onClick={goAuth} className="fm-btn fm-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Se connecter</button>
              <button onClick={goAuth} className="fm-btn fm-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Créer un compte</button>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO --- */}
      <section className="fm-hero">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="fm-orb" style={{ width: 500, height: 500, background: 'rgba(9,178,172,0.15)', top: -100, right: -100 }} 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="fm-orb" style={{ width: 400, height: 400, background: 'rgba(153,65,255,0.08)', bottom: -100, left: -100 }} 
        />
        <div className="fm-hero-grid" />
        
        <div className="fm-container fm-hero-content">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="fm-badge mb-6" style={{ background: 'rgba(9,178,172,0.15)', color: '#09b2ac', padding: '8px 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#09b2ac' }} />
              2ème Année Médecine • Constantine
            </motion.div>
            <motion.h1 variants={fadeIn} className="fm-title">Révisez avec<br/><span className="fm-accent">Excellence</span></motion.h1>
            <motion.p variants={fadeIn} className="fm-subtitle">
              La plateforme de révision incontournable pour les étudiants en médecine
              de Constantine et ses annexes. QCMs interactifs, mode hors-ligne et suivi personnalisé.
            </motion.p>
            <motion.div variants={fadeIn} className="fm-hero-actions">
              <button onClick={goAuth} className="fm-btn fm-btn-hero">Commencer gratuitement <ChevronRight size={20} /></button>
              <button onClick={goAuth} className="fm-btn fm-btn-hero-secondary">J'ai déjà un compte</button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="fm-visual"
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              position: 'relative',
              width: '100%',
              height: '100%',
            }}
          >
            {/* Elegant UI Mockup accurately representing FMC App QCM view */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: 440, transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)' }}>
              {/* Main QCM Card */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                style={{
                  position: 'absolute', inset: 0, margin: 'auto', width: '100%', height: '100%',
                  background: 'rgba(255, 255, 255, 0.90)',
                  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  borderRadius: 32, padding: 24,
                  boxShadow: '0 30px 60px -12px rgba(9, 178, 172, 0.2), 0 0 0 1px rgba(255,255,255,0.8) inset, 0 0 0 1px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Header matching [moduleId].tsx */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: '#09b2ac', color: '#ffffff', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>Q14</span>
                    <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>EMD M23</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚩</div>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📥</div>
                  </div>
                </div>
                
                <h3 style={{ fontSize: 16, color: '#111827', lineHeight: 1.5, marginBottom: 24, fontWeight: 500 }}>
                  Parmi les signes suivants, lequel est typique d'une insuffisance cardiaque gauche ?
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                  {/* Option A - Unselected */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: 16, background: '#ffffff', border: '2px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <span style={{ fontWeight: 700, color: '#9ca3af', fontSize: 14 }}>A</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 16, color: '#111827', lineHeight: 1.4 }}>Hépatomégalie</span>
                  </div>
                  
                  {/* Option B - Selected & Correct (isSubmitted) */}
                  <motion.div 
                    initial={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    animate={{ background: ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.15)'], borderColor: ['rgba(16, 185, 129, 0.4)', 'rgba(16, 185, 129, 0.7)'] }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                    style={{ 
                      display: 'flex', alignItems: 'center', padding: '16px', borderRadius: 16, borderWidth: 2, borderStyle: 'solid',
                      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.1)'
                    }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: '#09b2ac', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, boxShadow: '0 2px 8px rgba(9,178,172,0.4)' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>B</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#10b981', lineHeight: 1.4 }}>Dyspnée d'effort</span>
                    <span style={{ color: '#10b981', fontSize: 20, marginLeft: 8, fontWeight: 800 }}>✓</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Badge 1 - Progress */}
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                style={{
                  position: 'absolute', top: -30, right: -60,
                  background: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  padding: '20px 24px', borderRadius: 24,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
                  display: 'flex', alignItems: 'center', gap: 16, zIndex: 10
                }}
              >
                <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                    <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                    <motion.circle 
                      cx="50" cy="50" r="42" stroke="#9941ff" strokeWidth="8" fill="none" 
                      strokeLinecap="round" strokeDasharray="264" strokeDashoffset="264" 
                      animate={{ strokeDashoffset: 58 }} // approx 78%
                      transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                    />
                  </svg>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>78%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Progression</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Excellente</span>
                </div>
              </motion.div>

             
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- STATS --- */}
      <section className="fm-stats">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="fm-container fm-stats-grid"
        >
          {STATS.map((stat, i) => <AnimatedStat key={i} stat={stat} />)}
        </motion.div>
      </section>

      {/* --- FEATURES --- */}
      <section className="fm-features" id="features">
        <div className="fm-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="fm-features-header">
            <span className="fm-badge">Fonctionnalités</span>
            <h2 className="fm-title" style={{ color: '#fff' }}>Tout ce dont vous avez besoin pour <span className="fm-accent">réussir</span></h2>
            <p className="fm-subtitle" style={{ color: 'rgba(255,255,255,0.5)' }}>Une plateforme complète conçue spécifiquement pour les étudiants en médecine.</p>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
            className="fm-features-grid"
          >
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div 
                  key={i} variants={fadeIn}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="fm-feature-card"
                >
                  {/* Simulated gradient border effect in React */}
                  <motion.div 
                    initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left, ${feat.color}40, transparent 60%)`, opacity: 0, zIndex: 0, pointerEvents: 'none' }} 
                  />
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -5, boxShadow: `0 0 20px ${feat.color}40` }}
                    style={{ width: 56, height: 56, background: feat.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}
                  >
                    <Icon color={feat.color} size={28} />
                  </motion.div>
                  <h3 className="fm-feature-title" style={{ position: 'relative', zIndex: 1 }}>{feat.title}</h3>
                  <p className="fm-feature-desc" style={{ position: 'relative', zIndex: 1 }}>{feat.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="tarifs" className="fm-pricing">
        <div className="fm-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="fm-pricing-header">
            <motion.div variants={fadeIn} className="fm-badge">Tarifs</motion.div>
            <motion.h2 variants={fadeIn} className="fm-title" style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Choisissez votre <span className="fm-accent">formule</span></motion.h2>
            <motion.p variants={fadeIn} className="fm-subtitle" style={{ margin: '16px auto 0' }}>Des offres adaptées à vos besoins pour une révision optimale.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="fm-pricing-grid">
            {/* 10 Days Plan */}
            <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="fm-pricing-card">
              <h3 className="fm-pricing-title">10 Jours</h3>
              <p className="fm-pricing-subtitle">Accès complet pendant 10 jours</p>
              <div className="fm-pricing-price">
                200 <span className="fm-pricing-currency">DA</span>
              </div>
              <div className="fm-pricing-features">
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Accès à <b>tous les QCMs</b> de l'année choisie</span>
                </div>
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Accès pour les QCMs de <b>tous les modules</b></span>
                </div>
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Ressources importantes (Drive, Chaîne Telegram)</span>
                </div>
              </div>
              <button onClick={goAuth} className="fm-btn fm-btn-pricing fm-btn-pricing-secondary">
                Choisir cette formule <ChevronRight size={18} />
              </button>
            </motion.div>

            {/* End of Year Plan (Popular) */}
            <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="fm-pricing-card popular">
              <div className="fm-pricing-tag">⭐️ Populaire</div>
              <h3 className="fm-pricing-title">Jusqu'à la fin d'année</h3>
              <p className="fm-pricing-subtitle">Accès illimité jusqu'à la fin d'année — Meilleure offre</p>
              <div className="fm-pricing-price">
                1000 <span className="fm-pricing-currency">DA</span>
              </div>
              <div className="fm-pricing-features">
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Accès à <b>tous les QCMs</b> de l'année choisie</span>
                </div>
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Accès pour les QCMs de <b>tous les modules</b></span>
                </div>
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Ressources importantes (Drive, Chaîne Telegram)</span>
                </div>
                <div className="fm-pricing-feature">
                  <CheckCircle2 size={20} className="fm-pricing-icon" />
                  <span>Mises à jour des <b>QCMs en temps réel</b></span>
                </div>
              </div>
              <button onClick={goAuth} className="fm-btn fm-btn-pricing fm-btn-pricing-primary">
                Commencer maintenant <ChevronRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="fm-footer">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="fm-container fm-footer-inner">
          <motion.div variants={fadeIn}>
            <div className="fm-footer-brand-row">
              <img src="/logo.png" alt="FMC App" className="fm-footer-logo" />
              <span className="fm-footer-name">FMC App</span>
            </div>
            <p className="fm-footer-tagline">Study Everywhere — La plateforme de révision pour les étudiants en médecine de Constantine.</p>
          </motion.div>
          <motion.div variants={fadeIn} className="fm-footer-links">
            <h4 className="fm-footer-heading">Liens Rapides</h4>
            <a href="#features" className="fm-footer-link">Fonctionnalités</a>
            <a href="#how" className="fm-footer-link">Comment ça marche</a>
            <a href="#points" className="fm-footer-link">Points de vente</a>
          </motion.div>
          <motion.div variants={fadeIn} className="fm-footer-links">
            <h4 className="fm-footer-heading">Suivez-nous</h4>
            <a href="https://t.me/FMC_App" target="_blank" rel="noreferrer" className="fm-footer-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Telegram
            </a>
            <a href="https://www.instagram.com/fmc.app" target="_blank" rel="noreferrer" className="fm-footer-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61585713960728" target="_blank" rel="noreferrer" className="fm-footer-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Facebook
            </a>
          </motion.div>
          <motion.div variants={fadeIn} className="fm-footer-links">
            <h4 className="fm-footer-heading">Contact</h4>
            <a href="mailto:fmc.app.contact@gmail.com" className="fm-footer-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> fmc.app.contact@gmail.com
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.fmcapp.mobile" target="_blank" rel="noreferrer" className="fm-footer-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> Google Play Store
            </a>
          </motion.div>
        </motion.div>
        <div className="fm-footer-bottom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="fm-container fm-footer-bottom-inner">
            <span>&copy; 2026 FMC App. Tous droits réservés.</span>
            <span>Faculté de Médecine de Constantine</span>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
