// ============================================================================
// Landing Page - Web Only - Premium Marketing Page
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Logo placed in /public for direct web access (standard <img> tags need a URL string,
// not Expo's require() which returns an asset module ID)
const LogoImg = '/logo.png';

// ============================================================================
// Data
// ============================================================================

const FEATURES = [
  {
    icon: '📝',
    title: 'QCMs Interactifs',
    description: 'Des milliers de QCMs corrigés et commentés, classés par module et par cours.',
  },
  {
    icon: '📶',
    title: 'Mode Hors-ligne',
    description: 'Révisez partout, même sans connexion internet. Vos données sont synchronisées.',
  },
  {
    icon: '🎯',
    title: 'Filtrage Avancé',
    description: 'Filtrez par année, module, cours ou source pour une révision ciblée.',
  },
  {
    icon: '📊',
    title: 'Statistiques Détaillées',
    description: 'Suivez votre progression et identifiez vos points faibles en temps réel.',
  },
  {
    icon: '📒',
    title: 'Notes Personnelles',
    description: 'Prenez des notes directement sur chaque question pour mieux mémoriser.',
  },
  
];

const SELLING_POINTS = [
  { name: 'مكتبة The Best Print', city: 'كلية الطب قسنطينة', desc: 'مقابل مدخل جامعة قسنطينة 3', emoji: '📚', link: 'https://maps.app.goo.gl/QyXXSVMnx8nUfXmv5' },
  { name: 'مكتبة الواحة', city: 'كلية الطب قسنطينة', desc: 'علي منجلي - إقامة الياسمين وج15', emoji: '📚', link: 'https://maps.app.goo.gl/74pCVT3WK9LEaacp7' },
  { name: 'Hero Phone', city: 'كلية الطب قسنطينة', desc: 'علي منجلي - بالقرب من محطة الاستقلال', emoji: '📱', link: 'https://maps.app.goo.gl/DSubQHw7Sbe4kUeY7' },
  { name: 'مكتبة نوميديا', city: 'ملحقة بسكرة', desc: 'بسكرة - مقابل مدخل الجامعة', emoji: '📚', link: 'https://maps.app.goo.gl/7xDqRrwTm2TNRUtH6' },
  { name: 'Khirou KMS', city: 'ملحقة أم البواقي', desc: 'أم البواقي - مقابل مدخل الملحقة', emoji: '🏪', link: 'https://goo.gl/maps/RrcPeibFArYGPWi98' },
  { name: 'Foyer', city: 'ملحقة خنشلة', desc: 'خنشلة - جامعة عباس لغرور', emoji: '🏠', link: 'https://goo.gl/maps/33UHDZhf95412CjA9' },
  { name: 'مكتبة الأمان', city: 'ملحقة سوق أهراس', desc: 'سوق أهراس - وسط المدينة', emoji: '📚', link: 'https://maps.app.goo.gl/kcb6RSTcSxJoSYH98' },
];

const STATS = [
  { value: '+3K', label: 'QCMs' },
  { value: '15+', label: 'Modules' },
  { value: '5', label: 'Wilayas' },
  { value: '24/7', label: 'Disponible' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Créez votre compte', description: 'Inscrivez-vous en quelques secondes avec votre email.' },
  { step: '02', title: 'Choisissez vos modules', description: 'Sélectionnez les modules que vous souhaitez réviser.' },
  { step: '03', title: 'Révisez et progressez', description: 'Pratiquez avec des QCMs et suivez vos statistiques.' },
];

// ============================================================================
// Counter Animation Hook
// ============================================================================

function useCountUp(target: string, duration = 2000) {
  const [display, setDisplay] = useState('0');
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    // Extract numeric part
    const numMatch = target.match(/(\d+)/);
    if (!numMatch) {
      setDisplay(target);
      return;
    }

    const numericTarget = parseInt(numMatch[1], 10);
    const prefix = target.slice(0, target.indexOf(numMatch[1]));
    const suffix = target.slice(target.indexOf(numMatch[1]) + numMatch[1].length);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(numericTarget * eased);

      setDisplay(`${prefix}${current >= 1000 ? `${(current / 1000).toFixed(0)}K` : current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { ref, display };
}

// ============================================================================
// Scroll Animation Hook
// ============================================================================

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ============================================================================
// Landing Page Component
// ============================================================================

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to welcome on mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(auth)/welcome');
    }
  }, []);

  // Enable body scrolling for the landing page (Expo disables it by default)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById('root');
    
    // Save original styles
    const origBodyOverflow = body.style.overflow;
    const origBodyHeight = body.style.height;
    const origHtmlHeight = html.style.height;
    const origRootDisplay = root?.style.display || '';
    const origRootHeight = root?.style.height || '';
    
    // Enable scrolling
    body.style.overflow = 'auto';
    body.style.height = 'auto';
    html.style.height = 'auto';
    if (root) {
      root.style.display = 'block';
      root.style.height = 'auto';
    }
    
    return () => {
      // Restore original styles
      body.style.overflow = origBodyOverflow;
      body.style.height = origBodyHeight;
      html.style.height = origHtmlHeight;
      if (root) {
        root.style.display = origRootDisplay;
        root.style.height = origRootHeight;
      }
    };
  }, []);

  // Track scroll for navbar
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToLogin = useCallback(() => {
    router.push('/(auth)/login');
  }, []);

  const navigateToRegister = useCallback(() => {
    router.push('/(auth)/register');
  }, []);

  if (Platform.OS !== 'web') return null;

  // Standard HTML rendering for web — avoids React Native primitives for full CSS control
  return (
    <div className="landing-page">
      {/* Glass Background Layer */}
      <div className="glass-bg">
        <div className="glass-orb glass-orb-1"></div>
        <div className="glass-orb glass-orb-2"></div>
        <div className="glass-orb glass-orb-3"></div>
        <div className="glass-orb glass-orb-4"></div>
        <div className="glass-orb glass-orb-5"></div>
      </div>
      <div className="glass-frost"></div>

      {/* ================================================================
          NAVBAR
          ================================================================ */}
      <nav className={`landing-navbar ${scrolled ? 'landing-navbar--scrolled' : ''}`}>
        <div className="landing-container landing-navbar__inner">
          <div className="landing-navbar__brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={LogoImg} alt="FMC App Logo" className="landing-navbar__logo" />
            <span className="landing-navbar__name">FMC App</span>
          </div>

          <div className="landing-navbar__links landing-navbar__links--desktop">
            <a href="#features" className="landing-navbar__link">Fonctionnalités</a>
            <a href="#how-it-works" className="landing-navbar__link">Comment ça marche</a>
            <a href="#selling-points" className="landing-navbar__link">Points de vente</a>
          </div>

          <div className="landing-navbar__actions landing-navbar__actions--desktop">
            <button className="landing-btn landing-btn--ghost" onClick={navigateToLogin}>
              Se connecter
            </button>
            <button className="landing-btn landing-btn--primary" onClick={navigateToRegister}>
              Créer un compte
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="landing-navbar__hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span className={`landing-navbar__hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`landing-navbar__hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`landing-navbar__hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="landing-navbar__mobile-menu">
            <a href="#features" className="landing-navbar__mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="landing-navbar__mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Comment ça marche
            </a>
            <a href="#selling-points" className="landing-navbar__mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Points de vente
            </a>
            <div className="landing-navbar__mobile-actions">
              <button className="landing-btn landing-btn--ghost landing-btn--full" onClick={navigateToLogin}>
                Se connecter
              </button>
              <button className="landing-btn landing-btn--primary landing-btn--full" onClick={navigateToRegister}>
                Créer un compte
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="landing-hero">
        {/* Decorative elements */}
        <div className="landing-hero__orb landing-hero__orb--1" />
        <div className="landing-hero__orb landing-hero__orb--2" />
        <div className="landing-hero__orb landing-hero__orb--3" />
        <div className="landing-hero__grid-pattern" />

        <div className="landing-container landing-hero__content">
          <div className="landing-hero__text">
            <div className="landing-hero__badge">
              <span className="landing-hero__badge-dot" />
              2ème Année Médecine • Constantine
            </div>

            <h1 className="landing-hero__title">
              Révisez avec
              <span className="landing-hero__title-accent"> Excellence</span>
            </h1>

            <p className="landing-hero__subtitle">
              La plateforme de révision incontournable pour les étudiants en médecine de Constantine et ses annexes.
              QCMs interactifs, mode hors-ligne et suivi personnalisé.
            </p>

            <div className="landing-hero__actions">
              <button className="landing-btn landing-btn--hero-primary" onClick={navigateToRegister}>
                Commencer gratuitement
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="landing-btn landing-btn--hero-secondary" onClick={navigateToLogin}>
                J'ai déjà un compte
              </button>
            </div>

            <div className="landing-hero__trust">
              <div className="landing-hero__trust-avatars">
                <div className="landing-hero__trust-avatar" style={{ background: '#09b2ac' }}>M</div>
                <div className="landing-hero__trust-avatar" style={{ background: '#9941ff' }}>S</div>
                <div className="landing-hero__trust-avatar" style={{ background: '#0d9488' }}>A</div>
                <div className="landing-hero__trust-avatar" style={{ background: '#262626' }}>K</div>
              </div>
              <span className="landing-hero__trust-text">
                Rejoignez des centaines d'étudiants qui révisent déjà avec FMC App
              </span>
            </div>
          </div>

          <div className="landing-hero__visual">
            <div className="landing-hero__phone-mockup">
              <div className="landing-hero__phone-frame">
                <div className="landing-hero__phone-notch" />
                <div className="landing-hero__phone-screen">
                  <div className="landing-hero__phone-header">
                    <img src={LogoImg} alt="" className="landing-hero__phone-logo" />
                    <span>FMC App</span>
                  </div>
                  <div className="landing-hero__phone-content">
                    <div className="landing-hero__phone-card">
                      <div className="landing-hero__phone-card-icon">📝</div>
                      <div>
                        <div className="landing-hero__phone-card-title">QCM Pratique</div>
                        <div className="landing-hero__phone-card-sub">152 questions</div>
                      </div>
                    </div>
                    <div className="landing-hero__phone-card">
                      <div className="landing-hero__phone-card-icon">📊</div>
                      <div>
                        <div className="landing-hero__phone-card-title">Progression</div>
                        <div className="landing-hero__phone-card-sub">78% réussi</div>
                      </div>
                    </div>
                    <div className="landing-hero__phone-card">
                      <div className="landing-hero__phone-card-icon">🏥</div>
                      <div>
                        <div className="landing-hero__phone-card-title">Mode Examen</div>
                        <div className="landing-hero__phone-card-sub">Chronomètre intégré</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          STATS BAR
          ================================================================ */}
      <section className="landing-stats">
        <div className="landing-container landing-stats__grid">
          {STATS.map((stat, i) => (
            <StatItem key={i} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURES SECTION
          ================================================================ */}
      <FeaturesSection />

      {/* ================================================================
          HOW IT WORKS SECTION
          ================================================================ */}
      <HowItWorksSection />

      {/* ================================================================
          SELLING POINTS SECTION
          ================================================================ */}
      <SellingPointsSection />

      {/* ================================================================
          DOWNLOAD CTA
          ================================================================ */}
      <DownloadSection onRegister={navigateToRegister} />

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <div className="landing-footer__brand">
            <div className="landing-footer__brand-row">
              <img src={LogoImg} alt="FMC App" className="landing-footer__logo" />
              <span className="landing-footer__brand-name">FMC App</span>
            </div>
            <p className="landing-footer__tagline">
              Study Everywhere — La plateforme de révision pour les étudiants en médecine de Constantine.
            </p>
          </div>

          <div className="landing-footer__links-group">
            <h4 className="landing-footer__heading">Liens Rapides</h4>
            <a href="#features" className="landing-footer__link">Fonctionnalités</a>
            <a href="#how-it-works" className="landing-footer__link">Comment ça marche</a>
            <a href="#selling-points" className="landing-footer__link">Points de vente</a>
          </div>

          <div className="landing-footer__links-group">
            <h4 className="landing-footer__heading">Suivez-nous</h4>
            <a href="https://t.me/FMC_App" target="_blank" rel="noopener noreferrer" className="landing-footer__link">
              📱 Telegram
            </a>
            <a href="https://www.instagram.com/fmc.app" target="_blank" rel="noopener noreferrer" className="landing-footer__link">
              📷 Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61585713960728" target="_blank" rel="noopener noreferrer" className="landing-footer__link">
              👥 Facebook
            </a>
          </div>

          <div className="landing-footer__links-group">
            <h4 className="landing-footer__heading">Contact</h4>
            <a href="mailto:fmc.app.contact@gmail.com" className="landing-footer__link">
              ✉️ fmc.app.contact@gmail.com
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.fmcapp.mobile" target="_blank" rel="noopener noreferrer" className="landing-footer__link">
              📲 Google Play Store
            </a>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <div className="landing-container landing-footer__bottom-inner">
            <span>© {new Date().getFullYear()} FMC App. Tous droits réservés.</span>
            <span>Faculté de Médecine de Constantine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// StatItem component (extracted to avoid hooks-in-loop violation)
// ============================================================================

function StatItem({ value, label }: { value: string; label: string }) {
  const counter = useCountUp(value, 1500);
  return (
    <div className="landing-stats__item" ref={counter.ref as any}>
      <div className="landing-stats__value">{counter.display}</div>
      <div className="landing-stats__label">{label}</div>
    </div>
  );
}

// ============================================================================
// Sub-sections as components (for useScrollReveal hooks)
// ============================================================================

function FeaturesSection() {
  const reveal = useScrollReveal();
  return (
    <section className="landing-features" id="features">
      <div className="landing-container" ref={reveal.ref as any}>
        <div className="landing-section-header">
          <span className="landing-section-badge">Fonctionnalités</span>
          <h2 className="landing-section-title">
            Tout ce dont vous avez besoin pour <span className="landing-text-accent">réussir</span>
          </h2>
          <p className="landing-section-subtitle">
            Une plateforme complète conçue spécifiquement pour les étudiants en médecine.
          </p>
        </div>

        <div className={`landing-features__grid ${reveal.isVisible ? 'landing-animate-in' : ''}`}>
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="landing-features__card"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="landing-features__icon">{feature.icon}</div>
              <h3 className="landing-features__title">{feature.title}</h3>
              <p className="landing-features__desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const reveal = useScrollReveal();
  return (
    <section className="landing-how" id="how-it-works">
      <div className="landing-container" ref={reveal.ref as any}>
        <div className="landing-section-header">
          <span className="landing-section-badge">Simple et Rapide</span>
          <h2 className="landing-section-title">
            Comment ça <span className="landing-text-accent">marche</span>
          </h2>
        </div>

        <div className={`landing-how__grid ${reveal.isVisible ? 'landing-animate-in' : ''}`}>
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={i}
              className="landing-how__card"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="landing-how__step">{item.step}</div>
              <h3 className="landing-how__title">{item.title}</h3>
              <p className="landing-how__desc">{item.description}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="landing-how__connector" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SellingPointsSection() {
  const reveal = useScrollReveal();
  return (
    <section className="landing-selling" id="selling-points">
      <div className="landing-container" ref={reveal.ref as any}>
        <div className="landing-section-header">
          <span className="landing-section-badge">نقاط البيع</span>
          <h2 className="landing-section-title">
            Nos <span className="landing-text-accent">Points de Vente</span>
          </h2>
          <p className="landing-section-subtitle">
            Procurez-vous votre abonnement dans l'un de nos points de vente partenaires.
          </p>
        </div>

        <div className={`landing-selling__grid ${reveal.isVisible ? 'landing-animate-in' : ''}`}>
          {SELLING_POINTS.map((point, i) => (
            <div
              key={i}
              className="landing-selling__card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="landing-selling__emoji">{point.emoji}</div>
              <div className="landing-selling__info">
                <h4 className="landing-selling__name">{point.name}</h4>
                <span className="landing-selling__city">{point.city}</span>
                {point.desc && <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontFamily: 'Cairo, sans-serif' }}>{point.desc}</p>}
              </div>
              {point.link && (
                <a href={point.link} target="_blank" rel="noreferrer" title="Voir sur Google Maps" style={{ width: 44, height: 44, background: 'rgba(9,178,172,0.1)', color: '#09b2ac', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none', transition: 'all 0.2s', marginLeft: 'auto' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#09b2ac'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(9,178,172,0.1)'; e.currentTarget.style.color = '#09b2ac'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadSection({ onRegister }: { onRegister: () => void }) {
  const reveal = useScrollReveal();
  return (
    <section className="landing-download" ref={reveal.ref as any}>
      <div className="landing-container landing-download__inner">
        <div className="landing-download__content">
          <h2 className="landing-download__title">
            Prêt à réussir vos examens?
          </h2>
          <p className="landing-download__subtitle">
            Téléchargez FMC App sur Google Play ou accédez directement à la plateforme web.
          </p>
          <div className="landing-download__actions">
            <a
              href="https://play.google.com/store/apps/details?id=com.fmcapp.mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn landing-btn--download"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 13l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/>
              </svg>
              Google Play
            </a>
            <button className="landing-btn landing-btn--hero-primary" onClick={onRegister}>
              Accéder à la plateforme
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
