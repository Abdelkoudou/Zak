'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Modules', href: '/modules', icon: '📚' },
  { name: 'Questions', href: '/questions', icon: '❓' },
  { name: 'Historique', href: '/history', icon: '📜' },
  { name: 'Ressources', href: '/resources', icon: '📁' },
];

const ownerOnlyNavigation = [
  { name: 'Codes d\'Activation', href: '/activation-codes', icon: '🔑', badge: 'Owner' },
  { name: 'Contributions', href: '/contributions', icon: '💰', badge: 'Owner' },
  { name: 'Export JSON', href: '/export', icon: '📤', badge: 'Owner' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (user) {
          setUserRole(user.role);
        }
      }
    };

    fetchUserRole();
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 p-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image 
              src="/logo.png" 
              alt="QCM Med Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">
              QCM Med
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:sticky top-0 md:h-screen md:left-0 z-50
          w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 p-6
          transform transition-transform duration-300 ease-in-out
          md:transform-none shadow-xl md:shadow-none flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Desktop Header */}
        <div className="mb-10 hidden md:flex items-center gap-4">
          <div className="relative w-12 h-12 bg-primary-50 dark:bg-primary-950/30 p-2 rounded-xl border border-primary-100 dark:border-primary-900/50 shadow-sm">
            <Image 
              src="/logo.png" 
              alt="QCM Med Logo" 
              fill 
              className="object-contain p-2"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">
              QCM Med
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-bold">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 mt-4 md:mt-0 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-100/50 dark:border-primary-800/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="font-semibold tracking-tight">{item.name}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                )}
              </Link>
            );
          })}

          {/* Owner-only navigation */}
          {userRole === 'owner' && (
            <>
              <div className="pt-6 pb-2 px-4">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Management</span>
              </div>
              {ownerOnlyNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      <span className="font-semibold tracking-tight">{item.name}</span>
                    </div>
                    {item.badge && !isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-tighter">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <span className="text-xl transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-125">
                {resolvedTheme === 'dark' ? '🌙' : '☀️'}
              </span>
              <span className="font-bold tracking-tight text-sm uppercase tracking-widest px-1">
                {resolvedTheme === 'dark' ? 'Nuit' : 'Jour'}
              </span>
            </div>
            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${resolvedTheme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
