'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';

interface SalesPoint {
  id: string;
  name: string;
}

interface AnalyticsModeFormProps {
  initialMode: 'dev' | 'production';
  initialProductionSalesPoints: string[];
  salesPoints: SalesPoint[];
}

export default function AnalyticsModeForm({
  initialMode,
  initialProductionSalesPoints,
  salesPoints,
}: AnalyticsModeFormProps) {
  const [mode, setMode] = useState<'dev' | 'production'>(initialMode);
  const [selectedSalesPoints, setSelectedSalesPoints] = useState<string[]>(initialProductionSalesPoints);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = () => {
    setMode(prev => prev === 'dev' ? 'production' : 'dev');
  };

  const handleSalesPointToggle = (id: string) => {
    if (mode === 'dev') return;
    setSelectedSalesPoints(prev =>
      prev.includes(id) ? prev.filter(spId => spId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (mode === 'dev') return;
    if (selectedSalesPoints.length === salesPoints.length) {
      setSelectedSalesPoints([]);
    } else {
      setSelectedSalesPoints(salesPoints.map(sp => sp.id));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    // Cache current values for potential rollback
    const previousMode = initialMode;
    const previousSalesPoints = JSON.stringify(initialProductionSalesPoints);

    try {
      // 1. Update analytics_mode
      const { error: modeError } = await supabase
        .from('app_config')
        .update({ value: mode, updated_at: new Date().toISOString() })
        .eq('key', 'analytics_mode');

      if (modeError) throw modeError;

      // 2. Update production_sales_points
      const { error: spError } = await supabase
        .from('app_config')
        .update({ value: JSON.stringify(selectedSalesPoints), updated_at: new Date().toISOString() })
        .eq('key', 'production_sales_points');

      if (spError) {
        // Rollback analytics_mode if sales points update fails
        try {
          await supabase
            .from('app_config')
            .update({ value: previousMode, updated_at: new Date().toISOString() })
            .eq('key', 'analytics_mode');
        } catch (rollbackError) {
          console.error('[AnalyticsModeForm] Rollback failed for analytics_mode! Original spError:', spError, 'previousMode:', previousMode, 'Rollback error:', rollbackError);
          throw new Error(`Failed to save sales points AND rollback failed: ${spError.message}. Rollback error: ${rollbackError}`);
        }
        throw spError;
      }

      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving analytics mode:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if a sales point is likely a test point based on name
  const isLikelyTest = (name: string) => {
    const testPatterns = ['test', 'tester', 'delegate'];
    return testPatterns.some(pattern => name.toLowerCase().includes(pattern));
  };

  const isDevMode = mode === 'dev';

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h4 className="font-semibold text-brand-black">Mode Analytique</h4>
          <p className="text-sm text-gray-600">
            {isDevMode 
              ? 'Affiche toutes les données (y compris les tests)'
              : 'Affiche uniquement les données de production'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={mode === 'production'}
          aria-label="Activer le mode production"
          onClick={handleToggle}
          className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            mode === 'production' ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              mode === 'production' ? 'translate-x-8' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Mode Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
          isDevMode
            ? 'bg-amber-100 text-amber-700 border border-amber-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {isDevMode ? '🔧 Mode Dev' : '🚀 Mode Production'}
        </span>
        <span className="text-sm text-gray-500">
          {!isDevMode 
            ? `${selectedSalesPoints.length} point(s) de vente sélectionné(s)`
            : 'Toutes les données visibles'}
        </span>
      </div>

      {/* Sales Points Selection */}
      <div 
        className={`transition-opacity ${isDevMode ? 'opacity-50' : ''}`}
        aria-disabled={isDevMode}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-brand-black">Points de vente pour Production</h4>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={isDevMode}
            tabIndex={isDevMode ? -1 : 0}
            className="text-sm text-primary hover:underline font-medium disabled:no-underline disabled:text-gray-400"
          >
            {selectedSalesPoints.length === salesPoints.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez les points de vente à inclure dans les analyses en mode production.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {salesPoints.map(sp => (
            <label
              key={sp.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isDevMode ? 'cursor-not-allowed' : 'cursor-pointer'
              } ${
                selectedSalesPoints.includes(sp.id)
                  ? 'bg-primary/5 border-primary'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSalesPoints.includes(sp.id)}
                onChange={() => handleSalesPointToggle(sp.id)}
                disabled={isDevMode}
                tabIndex={isDevMode ? -1 : 0}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
              />
              <span className="text-sm text-brand-black flex-1">{sp.name}</span>
              {isLikelyTest(sp.name) && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                  TEST
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        
        {message && (
          <span className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
