'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mounted, setMounted] = useState(false);

  // Animation on mount
  useEffect(() => {
    setMounted(true);
  }, []);

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
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Check if user is admin/manager/owner
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        throw new Error('Failed to verify user role. Make sure the user exists in the users table.');
      }

      if (!userData) {
        throw new Error('User not found in users table');
      }

      // Type assertion for userData
      const userRecord = userData as any;

      if (!['owner', 'admin', 'manager'].includes(userRecord.role)) {
        await supabase.auth.signOut();
        throw new Error(`Access denied. Role '${userRecord.role}' does not have admin privileges.`);
      }

      // Success! Redirect to questions page
      
      // Refresh session to ensure cookies are set (important for SSR middleware)
      await supabase.auth.refreshSession();
      
      // Wait a moment for cookies to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use window.location for full page reload (ensures middleware gets fresh cookies)
      window.location.href = '/questions';
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Left Side - Premium Branding (Desktop) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`} style={{ animationDelay: '0.2s' }} />
          <div className={`absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} />
          <div className={`absolute top-1/3 left-[10%] w-24 h-24 rounded-full bg-white/10 transition-all duration-1000 delay-500 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
          <div className={`absolute bottom-1/4 right-[15%] w-16 h-16 rounded-full bg-white/8 transition-all duration-1000 delay-700 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          {/* Logo */}
          <div className={`transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-90'}`}>
            <div className="relative w-44 h-44 bg-white/15 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl mb-10">
              <Image 
                src="/logo.png" 
                alt="FMC APP Logo" 
                fill 
                className="object-contain p-6"
              />
            </div>
          </div>

          <h1 className={`text-6xl font-black text-white tracking-tight mb-3 transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            FMC APP
          </h1>
          
          <div className={`bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full mb-6 transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <span className="text-white/95 text-sm font-bold tracking-widest uppercase">
              Premium Medical Learning
            </span>
          </div>

          <p className={`text-xl text-white/85 text-center max-w-md leading-relaxed transition-all duration-700 delay-400 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            Interface d&apos;administration pour la gestion des contenus médicaux
          </p>

          {/* Stats */}
          <div className={`flex gap-12 mt-16 transition-all duration-700 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-3xl shadow-xl shadow-primary-500/20">
                <Image 
                  src="/logo.png" 
                  alt="FMC APP Logo" 
                  fill 
                  className="object-contain p-4"
                />
              </div>
            </div>
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500 tracking-tight">
              FMC APP
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">
              Interface d&apos;Administration
            </p>
          </div>
          
          <form className="space-y-8 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group" onSubmit={handleLogin}>
            {/* Animated top border */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="space-y-3 text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenue 👋</h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] px-4">Connectez-vous à votre espace administrateur</p>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <div className="text-sm font-bold text-red-800 dark:text-red-400 leading-tight">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {info && (
              <div className="rounded-2xl bg-primary-50 dark:bg-primary-500/10 p-4 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-primary-500 text-lg">💎</span>
                  <div className="text-sm font-bold text-primary-800 dark:text-primary-400 leading-tight">
                    {info}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  📧 Adresse Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-0 focus:border-primary-500 transition-all text-sm font-medium"
                  placeholder="votre.nom@fmc-app.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  🔒 Mot de Passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-0 focus:border-primary-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group/btn relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-500/25 transition-all duration-300 active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      Authentification...
                    </>
                  ) : (
                    <>
                      Se Connecter
                      <span className="transform translate-x-0 group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000"></div>
              </button>
            </div>
          </form>

          <div className="text-center space-y-3 mt-8">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">🔒 Accès Restreint</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contactez l&apos;administrateur système pour vos identifiants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
