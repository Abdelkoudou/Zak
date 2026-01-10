'use client';

import { useState, useEffect } from 'react';
import { fetchUserById, updateUser, extendSubscription, revokeSubscription, deleteAllUserDevices } from '@/lib/users';
import { fetchUserDevices, deleteUserDevice } from '@/lib/activation-codes';
import type { ManagedUser, UserUpdateData } from '@/lib/users';
import type { DeviceSession, YearLevel, Speciality } from '@/types/database';

interface UserEditModalProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const YEAR_OPTIONS: { value: YearLevel; label: string }[] = [
  { value: '1', label: '1ère année' },
  { value: '2', label: '2ème année' },
  { value: '3', label: '3ème année' },
];

const SPECIALITY_OPTIONS: { value: Speciality; label: string }[] = [
  { value: 'Médecine', label: 'Médecine' },
  { value: 'Pharmacie', label: 'Pharmacie' },
  { value: 'Dentaire', label: 'Dentaire' },
];

export default function UserEditModal({ userId, onClose, onUpdate }: UserEditModalProps) {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'subscription' | 'devices'>('info');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState<UserUpdateData>({});
  const [extensionDays, setExtensionDays] = useState(30);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    setError('');

    const [userResult, devicesResult] = await Promise.all([
      fetchUserById(userId),
      fetchUserDevices(userId),
    ]);

    if (userResult.error) {
      setError(userResult.error);
    } else if (userResult.data) {
      setUser(userResult.data);
      setFormData({
        fullName: userResult.data.fullName || '',
        yearOfStudy: userResult.data.yearOfStudy,
        speciality: userResult.data.speciality,
        region: userResult.data.region || '',
      });
    }

    if (!devicesResult.error) {
      setDevices(devicesResult.data);
    }

    setLoading(false);
  };

  const handleSaveInfo = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const { error } = await updateUser(userId, formData);

    if (error) {
      setError(error);
    } else {
      setSuccess('Informations mises à jour avec succès');
      onUpdate();
      await loadUserData();
    }

    setSaving(false);
  };

  const handleExtendSubscription = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const { newExpiresAt, error } = await extendSubscription(userId, extensionDays);

    if (error) {
      setError(error);
    } else {
      setSuccess(`Abonnement prolongé jusqu'au ${newExpiresAt?.toLocaleDateString('fr-FR')}`);
      onUpdate();
      await loadUserData();
    }

    setSaving(false);
  };

  const handleRevokeSubscription = async () => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir révoquer l\'abonnement de cet utilisateur ?')) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const { error } = await revokeSubscription(userId);

    if (error) {
      setError(error);
    } else {
      setSuccess('Abonnement révoqué');
      onUpdate();
      await loadUserData();
    }

    setSaving(false);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Supprimer cet appareil ?')) return;

    const { error } = await deleteUserDevice(deviceId);

    if (error) {
      setError(error);
    } else {
      setSuccess('Appareil supprimé');
      const { data } = await fetchUserDevices(userId);
      setDevices(data);
      onUpdate();
    }
  };

  const handleDeleteAllDevices = async () => {
    if (!confirm('Supprimer tous les appareils de cet utilisateur ?')) return;

    const { error } = await deleteAllUserDevices(userId);

    if (error) {
      setError(error);
    } else {
      setSuccess('Tous les appareils ont été supprimés');
      setDevices([]);
      onUpdate();
    }
  };

  const getSubscriptionStatus = () => {
    if (!user) return { label: '', color: '' };
    if (!user.isPaid) return { label: 'Non activé', color: 'bg-slate-500' };
    if (!user.subscriptionExpiresAt) return { label: 'Payé (sans expiration)', color: 'bg-green-500' };
    
    const now = new Date();
    const expires = new Date(user.subscriptionExpiresAt);
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { label: 'Expiré', color: 'bg-red-500' };
    if (daysLeft <= 7) return { label: `Expire dans ${daysLeft}j`, color: 'bg-orange-500' };
    return { label: `Actif (${daysLeft}j restants)`, color: 'bg-green-500' };
  };

  const status = getSubscriptionStatus();

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Gestion Utilisateur
                </h2>
                {user && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              ❌
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['info', 'subscription', 'devices'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab === 'info' && '📝 Informations'}
                {tab === 'subscription' && '💳 Abonnement'}
                {tab === 'devices' && `📱 Appareils (${devices.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <p className="text-red-500">Utilisateur non trouvé</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm">
                  {success}
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nom de l'utilisateur"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Année d&apos;étude
                      </label>
                      <select
                        value={formData.yearOfStudy || ''}
                        onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value as YearLevel })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Non défini</option>
                        {YEAR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Spécialité
                      </label>
                      <select
                        value={formData.speciality || ''}
                        onChange={(e) => setFormData({ ...formData, speciality: e.target.value as Speciality })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Non défini</option>
                        {SPECIALITY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Région
                    </label>
                    <input
                      type="text"
                      value={formData.region || ''}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Région"
                    />
                  </div>

                  {/* Read-only info */}
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Email</span>
                      <span className="text-slate-900 dark:text-white font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Rôle</span>
                      <span className="text-slate-900 dark:text-white font-medium capitalize">{user.role}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Inscrit le</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {user.activationKeyCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Code activation</span>
                        <span className="text-slate-900 dark:text-white font-mono text-xs">{user.activationKeyCode}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveInfo}
                    disabled={saving}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Current status */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Statut actuel</span>
                      <span className={`px-3 py-1 ${status.color} text-white text-xs font-bold rounded-full`}>
                        {status.label}
                      </span>
                    </div>
                    {user.subscriptionExpiresAt && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Expire le: <span className="font-medium text-slate-900 dark:text-white">
                          {new Date(user.subscriptionExpiresAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Extend subscription */}
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                      ➕ Prolonger l&apos;abonnement
                    </h3>
                    <div className="flex gap-3">
                      <select
                        value={extensionDays}
                        onChange={(e) => setExtensionDays(Number(e.target.value))}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value={7}>7 jours</option>
                        <option value={30}>30 jours</option>
                        <option value={90}>90 jours</option>
                        <option value={180}>180 jours</option>
                        <option value={365}>365 jours</option>
                      </select>
                      <button
                        onClick={handleExtendSubscription}
                        disabled={saving}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        Prolonger
                      </button>
                    </div>
                  </div>

                  {/* Revoke subscription */}
                  {user.isPaid && (
                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20">
                      <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">
                        ⚠️ Zone dangereuse
                      </h3>
                      <p className="text-xs text-red-500 dark:text-red-400 mb-4">
                        Révoquer l&apos;abonnement supprimera l&apos;accès payant de l&apos;utilisateur.
                      </p>
                      <button
                        onClick={handleRevokeSubscription}
                        disabled={saving}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        Révoquer l&apos;abonnement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Devices Tab */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  {devices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                      <span className="text-4xl mb-4">📵</span>
                      <p className="font-medium text-slate-900 dark:text-white mb-1">Aucun appareil connecté</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cet utilisateur n&apos;a connecté aucun appareil.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {devices.length}/2 appareils connectés
                        </p>
                        <button
                          onClick={handleDeleteAllDevices}
                          className="text-xs text-red-500 hover:text-red-600 font-bold"
                        >
                          Supprimer tous
                        </button>
                      </div>

                      {devices.map((device) => (
                        <div 
                          key={device.id} 
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                {device.device_name}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-black uppercase tracking-wider rounded-md">
                                Actif
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                              Dernière activité: {new Date(device.last_active_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Supprimer l'appareil"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                      💡 Supprimer un appareil permettra à l&apos;utilisateur de se connecter sur un nouvel appareil.
                      La limite est fixée à 2 appareils simultanés.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
