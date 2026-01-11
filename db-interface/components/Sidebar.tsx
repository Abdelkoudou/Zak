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
  { name: 'Utilisateurs', href: '/users', icon: '👥', badge: 'Owner' },
  { name: 'Courses', href: '/courses', icon: '📝', badge: 'Owner' },
  { name: 'Codes d\'Activation', href: '/activation-codes', icon: '🔑', badge: 'Owner' },
  { name: 'Paiements', href: '/payments', icon: '💳', badge: 'Owner' },
  { name: 'Contributions', href: '/contributions', icon: '💰', badge: 'Owner' },
  { name: 'Signalements', href: '/reports', icon: '🚩', badge: 'Owner' },
  { name: 'Export JSON', href: '/export', icon: '📤', badge: 'Owner' },
  { name: 'AI Chat', href: '/ai-chat', icon: '🤖', badge: 'AI' },
  { name: 'AI Analytics', href: '/ai-analytics', icon: '📊', badge: 'AI' },
  { name: 'Knowledge Base', href: '/knowledge', icon: '📚', badge: 'RAG' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
      <div className={`md:hidden ${isDark ? 'bg-dark-300' : 'bg-white'} border-b ${isDark ? 'border-dark-100' : 'border-slate-200'} p-4 flex items-center justify-between sticky top-0 z-50 transition-colors`}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image 
              src="/logo.png" 
              alt="FMC APP Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">
              FMC APP
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[10px] uppercase tracking-wider font-semibold`}>Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 ${isDark ? 'hover:bg-dark-100' : 'hover:bg-slate-100'} rounded-lg transition-colors border ${isDark ? 'border-dark-100' : 'border-slate-200'}`}
            aria-label="Toggle theme"
          >
            {isDark ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 ${isDark ? 'hover:bg-dark-100' : 'hover:bg-slate-100'} rounded-lg transition-colors border ${isDark ? 'border-dark-100' : 'border-slate-200'}`}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
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
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:sticky top-0 md:h-screen md:left-0 z-50
          w-72 h-[100dvh] md:h-screen ${isDark ? 'bg-dark-300' : 'bg-white'} border-r ${isDark ? 'border-dark-100' : 'border-slate-200'} p-6
          transform transition-transform duration-300 ease-in-out
          md:transform-none shadow-xl md:shadow-none flex flex-col overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Desktop Header */}
        <div className="mb-10 hidden md:flex items-center gap-4">
          <div className={`relative w-12 h-12 ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'} p-2 rounded-xl border ${isDark ? 'border-primary-800/50' : 'border-primary-100'} shadow-sm`}>
            <Image 
              src="/logo.png" 
              alt="FMC APP Logo" 
              fill 
              className="object-contain p-2"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">
              FMC APP
            </h1>
            <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-xs uppercase tracking-widest font-bold`}>Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 mt-4 md:mt-0 flex-1 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? isDark 
                      ? 'bg-primary-900/30 text-primary-400 border border-primary-800/30'
                      : 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50'
                    : isDark
                      ? 'text-slate-400 hover:bg-dark-100 hover:text-primary-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="font-semibold tracking-tight">{item.name}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(9,178,172,0.6)]"></div>
                )}
              </Link>
            );
          })}

          {/* Owner-only navigation */}
          {userRole === 'owner' && (
            <>
              <div className="pt-6 pb-2 px-4">
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Management</span>
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
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : isDark
                          ? 'text-slate-400 hover:bg-dark-100 hover:text-primary-400'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      <span className="font-semibold tracking-tight">{item.name}</span>
                    </div>
                    {item.badge && !isActive && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${isDark ? 'bg-dark-100 text-slate-400' : 'bg-slate-100 text-slate-500'} rounded-full uppercase tracking-tighter`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Theme Toggle */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-dark-100' : 'border-slate-200'} flex-shrink-0`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl ${isDark ? 'bg-dark-400 hover:bg-dark-100' : 'bg-slate-50 hover:bg-slate-100'} ${isDark ? 'text-slate-400' : 'text-slate-600'} border ${isDark ? 'border-dark-100' : 'border-slate-200'} transition-all duration-300 group shadow-sm hover:shadow-md`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-125">
                {isDark ? '🌙' : '☀️'}
              </span>
              <span className="font-bold tracking-tight text-sm uppercase tracking-widest px-1">
                {isDark ? 'Nuit' : 'Jour'}
              </span>
            </div>
            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-primary-500' : 'bg-slate-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
