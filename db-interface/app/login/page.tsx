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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
              <Image 
                src="/logo.png" 
                alt="QCM Med Logo" 
                fill 
                className="object-contain p-4"
              />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 tracking-tight">
            QCM Med
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
            Interface d&apos;Administration
          </p>
        </div>
        
        <form className="mt-8 space-y-8 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group" onSubmit={handleLogin}>
          {/* Animated top border */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="space-y-3 text-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenue</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Connectez-vous à votre espace administrateur</p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-red-500">⚠️</span>
                <div className="text-xs font-bold text-red-800 dark:text-red-400 leading-tight">
                  {error}
                </div>
              </div>
            </div>
          )}

          {info && (
            <div className="rounded-2xl bg-primary-50 dark:bg-primary-500/10 p-4 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-primary-500">💎</span>
                <div className="text-xs font-bold text-primary-800 dark:text-primary-400 leading-tight">
                  {info}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                Adresse Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
                placeholder="votre.nom@qcm-med.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                Mot de Passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
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
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-black uppercase tracking-widest rounded-[1.25rem] text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] overflow-hidden"
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
                    <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Accès Restreint</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Contactez l&apos;administrateur système pour vos identifiants.
          </p>
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
          <p className="text-slate-600 dark:text-slate-400 animate-pulse">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
