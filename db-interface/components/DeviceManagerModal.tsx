'use client';

import { useState, useEffect } from 'react';
import { fetchUserDevices, deleteUserDevice } from '@/lib/activation-codes';
import type { DeviceSession } from '@/types/database';

interface DeviceManagerModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function DeviceManagerModal({ userId, userName, onClose }: DeviceManagerModalProps) {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, [userId]);

  const loadDevices = async () => {
    setLoading(true);
    const { data, error } = await fetchUserDevices(userId);
    if (!error) {
      setDevices(data);
    }
    setLoading(false);
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appareil ? L\'utilisateur pourra en connecter un nouveau.')) {
      return;
    }

    setDeletingId(deviceId);
    const { error } = await deleteUserDevice(deviceId);
    
    if (error) {
      alert(`Erreur: ${error}`);
    } else {
      await loadDevices();
    }
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Appareils Connectés</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{userName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            ❌
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chargement...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
            <span className="text-4xl mb-4">📵</span>
            <p className="font-medium text-slate-900 dark:text-white mb-1">Aucun appareil connecté</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cet utilisateur n&apos;a connecté aucun appareil.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl group hover:border-slate-200 dark:hover:border-white/10 transition-all"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm break-all">{device.device_name}</h3>
                    <span className="shrink-0 text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-black uppercase tracking-wider rounded-md mt-0.5">Actif</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                    Dernière activité: {new Date(device.last_active_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(device.id)}
                  disabled={deletingId === device.id}
                  className="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                  title="Supprimer l'appareil"
                >
                  {deletingId === device.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
            Supprimer un appareil permettra à l&apos;utilisateur de se connecter sur un nouvel appareil.
            La limite est fixée à 2 appareils simultanés.
          </p>
        </div>
      </div>
    </div>
  );
}
