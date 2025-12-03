'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchActivationKeys,
  fetchFaculties,
  fetchSalesPoints,
  fetchDashboardStats,
  fetchSalesPointStats,
  generateBatchCodes,
  createSalesPoint,
  revokeActivationKey,
  exportToCsv,
} from '@/lib/activation-codes';
import type { 
  ActivationKey, 
  Faculty, 
  SalesPoint, 
  SalesPointStats,
  YearLevel 
} from '@/types/database';

export default function ActivationCodesPage() {
  // Auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [codes, setCodes] = useState<ActivationKey[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
  const [salesPointStats, setSalesPointStats] = useState<SalesPointStats[]>([]);
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0,
    expiredCodes: 0,
    totalRevenue: 0,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generate' | 'codes' | 'points'>('dashboard');
  const [filters, setFilters] = useState({
    year: '' as YearLevel | '',
    facultyId: '',
    salesPointId: '',
    status: '' as 'active' | 'used' | 'expired' | '',
    search: '',
  });

  // Form state (simplified - year/faculty removed as user fills these during registration)
  const [generateForm, setGenerateForm] = useState({
    salesPointId: '',
    durationDays: 365,
    quantity: 1,
    notes: '',
    pricePaid: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Sales point form
  const [showSalesPointForm, setShowSalesPointForm] = useState(false);
  const [salesPointForm, setSalesPointForm] = useState({
    code: '',
    name: '',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    commissionRate: 0,
    notes: '',
  });

  // Code detail modal
  const [selectedCode, setSelectedCode] = useState<ActivationKey | null>(null);

  // Check user role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (user) {
          setUserRole(user.role);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    const [codesRes, facultiesRes, pointsRes, statsRes, pointStatsRes] = await Promise.all([
      fetchActivationKeys({
        year: filters.year || undefined,
        facultyId: filters.facultyId || undefined,
        salesPointId: filters.salesPointId || undefined,
        isUsed: filters.status === 'used' ? true : filters.status === 'active' ? false : undefined,
        search: filters.search || undefined,
      }),
      fetchFaculties(),
      fetchSalesPoints(),
      fetchDashboardStats(),
      fetchSalesPointStats(),
    ]);

    setCodes(codesRes.data);
    setFaculties(facultiesRes.data);
    setSalesPoints(pointsRes.data);
    setStats(statsRes);
    setSalesPointStats(pointStatsRes.data);
  }, [filters]);

  useEffect(() => {
    if (userRole === 'owner') {
      loadData();
    }
  }, [userRole, loadData]);

  // Generate codes (simplified - no year/faculty, user fills these during registration)
  const handleGenerate = async () => {
    if (!userId || !generateForm.salesPointId) {
      alert('Veuillez sélectionner un point de vente');
      return;
    }

    setGenerating(true);
    const salesPoint = salesPoints.find(sp => sp.id === generateForm.salesPointId);

    if (!salesPoint) {
      alert('Point de vente invalide');
      setGenerating(false);
      return;
    }

    const result = await generateBatchCodes(
      {
        salesPointId: generateForm.salesPointId,
        durationDays: generateForm.durationDays,
        notes: generateForm.notes,
        pricePaid: generateForm.pricePaid,
        quantity: generateForm.quantity,
      },
      salesPoint.code,
      userId
    );

    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      setGeneratedCodes(result.codes);
      loadData();
    }
    setGenerating(false);
  };

  // Create sales point
  const handleCreateSalesPoint = async () => {
    if (!userId || !salesPointForm.code || !salesPointForm.name) {
      alert('Code et nom sont obligatoires');
      return;
    }

    const result = await createSalesPoint(
      {
        code: salesPointForm.code,
        name: salesPointForm.name,
        location: salesPointForm.location,
        contactName: salesPointForm.contactName,
        contactPhone: salesPointForm.contactPhone,
        contactEmail: salesPointForm.contactEmail,
        isActive: true,
        commissionRate: salesPointForm.commissionRate,
        notes: salesPointForm.notes,
      },
      userId
    );

    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      setShowSalesPointForm(false);
      setSalesPointForm({ code: '', name: '', location: '', contactName: '', contactPhone: '', contactEmail: '', commissionRate: 0, notes: '' });
      loadData();
    }
  };

  // Revoke code
  const handleRevoke = async (id: string, keyCode: string) => {
    if (!confirm(`Voulez-vous vraiment révoquer le code ${keyCode}?`)) return;
    
    const result = await revokeActivationKey(id);
    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      loadData();
    }
  };

  // Export
  const handleExport = () => {
    const csv = exportToCsv(codes);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activation-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Access denied
  if (userRole !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès Refusé</h1>
        <p className="text-gray-600">Cette page est réservée au propriétaire.</p>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          🔑 Gestion des Codes d&apos;Activation
        </h1>
        <p className="text-gray-600 mt-1">Générez et gérez les codes d&apos;activation pour les étudiants</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {[
          { id: 'dashboard', label: '📊 Dashboard', color: 'blue' },
          { id: 'generate', label: '➕ Générer', color: 'green' },
          { id: 'codes', label: '📋 Codes', color: 'purple' },
          { id: 'points', label: '🏪 Points de Vente', color: 'orange' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? `bg-${tab.color}-600 text-white`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total Codes" value={stats.totalCodes} icon="📊" color="blue" />
            <StatCard title="Actifs" value={stats.activeCodes} icon="✅" color="green" />
            <StatCard title="Utilisés" value={stats.usedCodes} icon="👤" color="purple" />
            <StatCard title="Expirés" value={stats.expiredCodes} icon="⏰" color="red" />
            <StatCard title="Revenus" value={`${stats.totalRevenue.toLocaleString()} DA`} icon="💰" color="yellow" />
          </div>

          {/* Sales Points Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🏆 Performance des Points de Vente</h2>
            {salesPointStats.length === 0 ? (
              <p className="text-gray-500">Aucun point de vente configuré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Point de Vente</th>
                      <th className="px-4 py-2 text-center">Total</th>
                      <th className="px-4 py-2 text-center">Vendus</th>
                      <th className="px-4 py-2 text-center">Actifs</th>
                      <th className="px-4 py-2 text-center">Taux</th>
                      <th className="px-4 py-2 text-right">Revenus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPointStats.sort((a, b) => b.usedCodes - a.usedCodes).map(sp => (
                      <tr key={sp.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{sp.name}</div>
                          <div className="text-sm text-gray-500">{sp.location}</div>
                        </td>
                        <td className="px-4 py-3 text-center">{sp.totalCodes}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{sp.usedCodes}</td>
                        <td className="px-4 py-3 text-center">{sp.activeCodes}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${
                            sp.totalCodes > 0 && (sp.usedCodes / sp.totalCodes) > 0.5 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sp.totalCodes > 0 ? Math.round((sp.usedCodes / sp.totalCodes) * 100) : 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{sp.totalRevenue.toLocaleString()} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Generation Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🔐 Générer des Codes</h2>
            <p className="text-sm text-gray-500 mb-4">
              L&apos;année et la faculté seront renseignées par l&apos;utilisateur lors de son inscription.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point de Vente *</label>
                <select
                  value={generateForm.salesPointId}
                  onChange={e => setGenerateForm({ ...generateForm, salesPointId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sélectionner un point de vente</option>
                  {salesPoints.filter(sp => sp.isActive).map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name} - {sp.location}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                  <select
                    value={generateForm.durationDays}
                    onChange={e => setGenerateForm({ ...generateForm, durationDays: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                    <option value={180}>180 jours</option>
                    <option value={365}>1 an</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={generateForm.quantity}
                    onChange={e => setGenerateForm({ ...generateForm, quantity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA)</label>
                <input
                  type="number"
                  min={0}
                  value={generateForm.pricePaid}
                  onChange={e => setGenerateForm({ ...generateForm, pricePaid: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Prix par code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={generateForm.notes}
                  onChange={e => setGenerateForm({ ...generateForm, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Notes optionnelles..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !generateForm.salesPointId}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? '⏳ Génération...' : `🔑 Générer ${generateForm.quantity} Code(s)`}
              </button>
            </div>
          </div>

          {/* Generated Codes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">✨ Codes Générés</h2>
            
            {generatedCodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🔑</div>
                <p>Les codes générés apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">{generatedCodes.length} code(s) générés</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCodes.join('\n'));
                      alert('Codes copiés!');
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    📋 Copier tout
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {generatedCodes.map((code, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded font-mono text-sm">
                      <span>{code}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="🔍 Rechercher un code..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="border rounded-lg px-3 py-2 w-48"
              />
              <select
                value={filters.year}
                onChange={e => setFilters({ ...filters, year: e.target.value as YearLevel | '' })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Toutes les années</option>
                <option value="1">1ère Année</option>
                <option value="2">2ème Année</option>
                <option value="3">3ème Année</option>
              </select>
              <select
                value={filters.facultyId}
                onChange={e => setFilters({ ...filters, facultyId: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Toutes les facultés</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                value={filters.salesPointId}
                onChange={e => setFilters({ ...filters, salesPointId: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Tous les points</option>
                {salesPoints.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value as typeof filters.status })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="used">Utilisés</option>
                <option value="expired">Expirés</option>
              </select>
              <button
                onClick={handleExport}
                className="ml-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                📥 Exporter CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Année</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Point de Vente</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Créé le</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Aucun code trouvé
                    </td>
                  </tr>
                ) : (
                  codes.map(code => {
                    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                    const status = code.isUsed ? 'used' : isExpired ? 'expired' : 'active';
                    const user = code.usedByUser;
                    
                    return (
                      <tr 
                        key={code.id} 
                        className={`border-t hover:bg-gray-50 cursor-pointer ${code.isUsed ? 'bg-purple-50/30' : ''}`}
                        onClick={() => setSelectedCode(code)}
                      >
                        <td className="px-4 py-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {code.keyCode}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {code.year}ère
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{code.salesPoint?.name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            status === 'active' ? 'bg-green-100 text-green-800' :
                            status === 'used' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status === 'active' ? '✅ Actif' : status === 'used' ? '👤 Utilisé' : '⏰ Expiré'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-gray-900">{user.fullName || 'Sans nom'}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.speciality && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {user.speciality}
                                  </span>
                                )}
                                {user.yearOfStudy && (
                                  <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                    {user.yearOfStudy}ère année
                                  </span>
                                )}
                                {user.region && (
                                  <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                                    {user.region}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Non utilisé</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{new Date(code.createdAt).toLocaleDateString('fr-FR')}</div>
                          {code.usedAt && (
                            <div className="text-xs text-purple-600">
                              Utilisé: {new Date(code.usedAt).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!code.isUsed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevoke(code.id, code.keyCode);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Révoquer"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination info */}
          <div className="p-4 border-t text-sm text-gray-600">
            {codes.length} code(s) affiché(s)
          </div>
        </div>
      )}

      {/* Sales Points Tab */}
      {activeTab === 'points' && (
        <div className="space-y-6">
          {/* Add button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSalesPointForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              ➕ Nouveau Point de Vente
            </button>
          </div>

          {/* Sales Points List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesPoints.map(sp => (
              <div key={sp.id} className={`bg-white rounded-lg shadow p-4 ${!sp.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{sp.name}</h3>
                    <p className="text-sm text-gray-500">{sp.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${sp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sp.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Code:</strong> {sp.code}</p>
                  {sp.contactName && <p><strong>Contact:</strong> {sp.contactName}</p>}
                  {sp.contactPhone && <p><strong>Tél:</strong> {sp.contactPhone}</p>}
                  {sp.commissionRate > 0 && <p><strong>Commission:</strong> {sp.commissionRate}%</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Add Sales Point Modal */}
          {showSalesPointForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4">🏪 Nouveau Point de Vente</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={salesPointForm.code}
                        onChange={e => setSalesPointForm({ ...salesPointForm, code: e.target.value.toUpperCase() })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="ALG01"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={salesPointForm.commissionRate}
                        onChange={e => setSalesPointForm({ ...salesPointForm, commissionRate: Number(e.target.value) })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={salesPointForm.name}
                      onChange={e => setSalesPointForm({ ...salesPointForm, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Librairie El Ilm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                    <input
                      type="text"
                      value={salesPointForm.location}
                      onChange={e => setSalesPointForm({ ...salesPointForm, location: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Alger Centre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Contact</label>
                    <input
                      type="text"
                      value={salesPointForm.contactName}
                      onChange={e => setSalesPointForm({ ...salesPointForm, contactName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={salesPointForm.contactPhone}
                      onChange={e => setSalesPointForm({ ...salesPointForm, contactPhone: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="0555 XX XX XX"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSalesPointForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateSalesPoint}
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Detail Modal */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">🔑 Détails du Code</h2>
              <button
                onClick={() => setSelectedCode(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Code Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <code className="text-lg font-mono font-bold text-purple-600">{selectedCode.keyCode}</code>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedCode.isUsed ? 'bg-purple-100 text-purple-800' :
                  (selectedCode.expiresAt && new Date(selectedCode.expiresAt) < new Date()) ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedCode.isUsed ? '👤 Utilisé' : 
                   (selectedCode.expiresAt && new Date(selectedCode.expiresAt) < new Date()) ? '⏰ Expiré' : '✅ Actif'}
                </span>
                {selectedCode.year && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{selectedCode.year}ère Année</span>
                )}
              </div>
            </div>

            {/* Code Details */}
            <div className="space-y-3 mb-4">
              <DetailRow label="Faculté" value={selectedCode.faculty?.name || '-'} />
              <DetailRow label="Point de Vente" value={selectedCode.salesPoint?.name || '-'} />
              <DetailRow label="Durée" value={`${selectedCode.durationDays} jours`} />
              <DetailRow label="Prix" value={selectedCode.pricePaid ? `${selectedCode.pricePaid} DA` : '-'} />
              <DetailRow label="Créé le" value={new Date(selectedCode.createdAt).toLocaleDateString('fr-FR')} />
              {selectedCode.expiresAt && (
                <DetailRow label="Expire le" value={new Date(selectedCode.expiresAt).toLocaleDateString('fr-FR')} />
              )}
              {selectedCode.notes && (
                <DetailRow label="Notes" value={selectedCode.notes} />
              )}
            </div>

            {/* User Info (if used) */}
            {selectedCode.usedByUser ? (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  👤 Utilisateur Inscrit
                </h3>
                <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                  <div className="font-medium text-lg">{selectedCode.usedByUser.fullName || 'Sans nom'}</div>
                  <div className="text-gray-600">{selectedCode.usedByUser.email}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCode.usedByUser.speciality && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        🎓 {selectedCode.usedByUser.speciality}
                      </span>
                    )}
                    {selectedCode.usedByUser.yearOfStudy && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        📚 {selectedCode.usedByUser.yearOfStudy}ère année
                      </span>
                    )}
                    {selectedCode.usedByUser.region && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                        📍 {selectedCode.usedByUser.region}
                      </span>
                    )}
                  </div>
                  {selectedCode.usedAt && (
                    <div className="text-sm text-gray-500 mt-2">
                      Inscrit le {new Date(selectedCode.usedAt).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <div className="text-center py-6 text-gray-400">
                  <div className="text-3xl mb-2">🔒</div>
                  <p>Ce code n&apos;a pas encore été utilisé</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCode(null)}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium">{value}</span>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
