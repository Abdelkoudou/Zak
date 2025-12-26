'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Check for session expiry or logout messages
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const logoutMessage = sessionStorage.getItem('logout_message');

    if (errorParam === 'session_expired') {
      setInfo('⏰ Votre session a expiré. Veuillez vous reconnecter.');
    } else if (errorParam === 'insufficient_permissions') {
      setError('❌ Accès refusé. Vous n\'avez pas les permissions nécessaires.');
    }

    if (logoutMessage) {
      setInfo(logoutMessage);
      sessionStorage.removeItem('logout_message');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('No user data returned');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) throw new Error('Failed to verify user role.');
      if (!userData) throw new Error('User not found in users table');

      const userRecord = userData as { role: string };

      if (!['owner', 'admin', 'manager'].includes(userRecord.role)) {
        await supabase.auth.signOut();
        throw new Error(`Access denied. Role '${userRecord.role}' does not have admin privileges.`);
      }

      await supabase.auth.refreshSession();
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/questions';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.5, opacity: 0, rotate: -10 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
      {/* Left Side - Premium Branding (Desktop) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
        {/* Animated Background Elements */}
        <motion.div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5"
          variants={pulseVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute top-1/3 left-[10%] w-24 h-24 rounded-full bg-white/10"
          animate={{ 
            y: [0, -20, 0], 
            x: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-[15%] w-16 h-16 rounded-full bg-white/8"
          animate={{ 
            y: [0, 15, 0], 
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute top-[20%] right-[25%] w-12 h-12 rounded-full bg-white/6"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Content */}
        <motion.div 
          className="relative z-10 flex flex-col items-center justify-center w-full p-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={logoVariants}>
            <motion.div 
              className="relative w-44 h-44 bg-white/15 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl mb-10"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image 
                src="/logo.png" 
                alt="FMC APP Logo" 
                fill 
                className="object-contain p-6"
              />
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-6xl font-black text-white tracking-tight mb-3"
            variants={itemVariants}
          >
            FMC APP
          </motion.h1>
          
          <motion.div 
            className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full mb-6"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-white/95 text-sm font-bold tracking-widest uppercase">
              Premium Medical Learning
            </span>
          </motion.div>

          <motion.p 
            className="text-xl text-white/85 text-center max-w-md leading-relaxed"
            variants={itemVariants}
          >
            Interface d&apos;administration pour la gestion des contenus médicaux
          </motion.p>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
        >
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden text-center mb-10"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div 
                className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-3xl shadow-xl shadow-primary-500/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image 
                  src="/logo.png" 
                  alt="FMC APP Logo" 
                  fill 
                  className="object-contain p-4"
                />
              </motion.div>
            </div>
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500 tracking-tight">
              FMC APP
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">
              Interface d&apos;Administration
            </p>
          </motion.div>
          
          <motion.form 
            className="space-y-8 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          >
            {/* Animated gradient border */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            
            <motion.div 
              className="space-y-3 text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bienvenue 👋
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] px-4">
                Connectez-vous à votre espace administrateur
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  className="rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-red-500 text-lg"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      ⚠️
                    </motion.span>
                    <div className="text-sm font-bold text-red-800 dark:text-red-400 leading-tight">
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}

              {info && (
                <motion.div 
                  className="rounded-2xl bg-primary-50 dark:bg-primary-500/10 p-4 border border-primary-100 dark:border-primary-500/20"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-primary-500 text-lg">💎</span>
                    <div className="text-sm font-bold text-primary-800 dark:text-primary-400 leading-tight">
                      {info}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  📧 Adresse Email
                </label>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-0 focus:border-primary-500 transition-all text-sm font-medium"
                  placeholder="votre.nom@fmc-app.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  🔒 Mot de Passe
                </label>
                <motion.input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-0 focus:border-primary-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
            </motion.div>

            <motion.div 
              className="pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-500/25 overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(9, 178, 173, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>
                      <motion.span 
                        className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Authentification...
                    </>
                  ) : (
                    <>
                      Se Connecter
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.div 
            className="text-center space-y-3 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              🔒 Accès Restreint
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contactez l&apos;administrateur système pour vos identifiants.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement...</p>
        </motion.div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
