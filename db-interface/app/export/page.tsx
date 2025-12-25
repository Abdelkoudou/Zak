'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ExportStatus {
  files: Array<{
    name: string;
    size: number;
    updated: string;
  }>;
  version: {
    version: string;
    last_updated: string;
    total_questions: number;
    total_modules: number;
    modules: any;
    changelog: any[];
  } | null;
  storage_url: string;
}

interface ExportResult {
  total_questions: number;
  total_modules: number;
  modules: string[];
  version: string;
}

export default function ExportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<ExportStatus | null>(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; result?: ExportResult } | null>(null);

  useEffect(() => {
    checkAccessAndFetchStatus();
  }, []);

  // Auto-dismiss toast after 8 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const checkAccessAndFetchStatus = async () => {
    try {
      setLoading(true);
      // 1. Check User Role
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || !user) throw new Error('Failed to fetch user profile');

      const role = user.role;
      setUserRole(role);

      if (role !== 'owner') {
        setLoading(false);
        return; // Stop here, rendering will show "Access Denied"
      }

      setIsOwner(true);

      // 2. Fetch Export Status
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Failed to fetch export status');
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    setToast(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Export failed');
      }

      // Refresh status
      await checkAccessAndFetchStatus();
      
      // Show success toast with export details
      setToast({
        type: 'success',
        message: 'Exportation terminée avec succès!',
        result: result.data
      });

    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export');
      setToast({
        type: 'error',
        message: err.message || 'Échec de l\'exportation'
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-6"></div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500/50"></div>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-500/10 mb-8 transform group-hover:scale-110 transition-transform">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Accès Restreint</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Cette zone est strictement réservée au rôle <strong>Propriétaire</strong>.
            <br />
            Votre rôle actuel : <span className="inline-block mt-2 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">{userRole || 'Inconnu'}</span>
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 px-6 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Export Control Center
            </h1>
            <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Synchronisation des données • Application Mobile
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <span className="text-xl">👑</span>
            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
              Accès Propriétaire
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-[2rem] bg-red-50 dark:bg-red-500/10 p-6 border border-red-200 dark:border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-widest mb-1">Erreur d&apos;Export</h3>
                <p className="text-sm text-red-600 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-right fade-in duration-300 ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          } rounded-3xl shadow-2xl overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                    {toast.type === 'success' ? '✅' : '❌'}
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">
                      {toast.type === 'success' ? 'Succès' : 'Erreur'}
                    </h4>
                    <p className="text-white/90 font-medium text-sm">{toast.message}</p>
                    {toast.result && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                          📊 {toast.result.total_questions} questions
                        </span>
                        <span className="bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                          📦 {toast.result.total_modules} modules
                        </span>
                        <span className="bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                          v{toast.result.version}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setToast(null)}
                  className="text-white/70 hover:text-white transition-colors text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            {/* Progress bar for auto-dismiss */}
            <div className="h-1 bg-white/20">
              <div className="h-full bg-white/50 animate-shrink-width" style={{ animationDuration: '8s' }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-sm overflow-hidden group transition-all hover:shadow-xl hover:shadow-primary-500/5">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">État du Cloud</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Status de synchronisation en temps réel</p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-3xl p-8 mb-8">
                 <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Questions</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {data?.version?.total_questions || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Modules</p>
                      <p className="text-4xl font-black text-primary-600 dark:text-primary-400 tracking-tight">
                        {data?.version?.total_modules || '0'}
                      </p>
                    </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 dark:text-slate-500">Dernière Mise à jour</span>
                      <span className="text-slate-900 dark:text-slate-300">
                        {data?.version?.last_updated ? new Date(data.version.last_updated).toLocaleString('fr-FR') : 'Jamais'}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 dark:text-slate-500">Version du Master</span>
                      <span className="bg-slate-200 dark:bg-white/5 px-2 py-0.5 rounded text-slate-900 dark:text-white font-mono">
                        {data?.version?.version || 'N/A'}
                      </span>
                   </div>
                 </div>
              </div>

              <div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className={`w-full group flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-xl shadow-primary-500/20 active:scale-95 ${
                    exporting 
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {exporting ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                       Exportation en cours...
                     </>
                  ) : (
                    <>
                      🚀 Lancer l&apos;Exportation & Synchro
                    </>
                  )}
                </button>
                <p className="mt-4 text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                  Cette action écrasera les anciens fichiers du Cloud<br/>avec les données actuelles.
                </p>
              </div>
            </div>
          </div>

          {/* Recently Uploaded Files */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-sm flex flex-col h-[600px] overflow-hidden group transition-all hover:shadow-xl hover:shadow-primary-500/5">
             <div className="p-8 border-b border-slate-100 dark:border-white/5">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg">
                      📦
                    </div>
                    Fichiers Stockés ({data?.files?.length || 0})
                 </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {data?.files ? (
                  <div className="space-y-2">
                    {data.files.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()).map((file) => (
                      <div key={file.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-primary-500/20 rounded-2xl transition-all group/file">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg shadow-sm group-hover/file:scale-110 transition-transform">
                            📄
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-widest">{file.name}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {new Date(file.updated).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 family-mono">
                           {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 gap-4">
                    <div className="text-4xl animate-bounce">📂</div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun fichier trouvé</p>
                  </div>
                )}
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 text-center">
                <a 
                   href={data?.storage_url ? `${data.storage_url}version.json` : '#'}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors ${!data?.storage_url ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Télécharger master version.json <span>&rarr;</span>
                </a>
             </div>
          </div>

        </div>

        {/* Instructions Block */}
        <div className="bg-primary-500/5 dark:bg-primary-500/5 rounded-[2rem] p-8 border border-primary-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
          <div className="flex items-start gap-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-primary-500/20 flex items-center justify-center text-2xl shadow-sm">
              💡
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 px-1">Fonctionnement</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Le clic sur <strong>&quot;Lancer l&apos;Exportation&quot;</strong> convertira toutes les questions de la base de données SQL en fichiers JSON optimisés regroupés par module. Ces fichiers seront téléchargés dans le bucket <code>questions</code>. L&apos;application mobile interroge <code>version.json</code> à chaque lancement pour détecter et télécharger les mises à jour.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
