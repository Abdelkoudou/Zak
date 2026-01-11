'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import { ALL_MODELS, DEFAULT_MODEL, type AIModel } from '@/lib/ai-models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const selectedModelInfo = ALL_MODELS.find(m => m.id === selectedModel);

  // Filter models by search
  const filteredModels = ALL_MODELS.filter(model => 
    model.name.toLowerCase().includes(search.toLowerCase()) ||
    model.description.toLowerCase().includes(search.toLowerCase()) ||
    model.provider.toLowerCase().includes(search.toLowerCase())
  );

  // Group models by provider
  const geminiModels = filteredModels.filter(m => m.provider === 'gemini');
  const openrouterModels = filteredModels.filter(m => m.provider === 'openrouter');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProviderIcon = (provider: string) => {
    return provider === 'gemini' ? '✨' : '🌐';
  };

  const getProviderColor = (provider: string) => {
    if (provider === 'gemini') {
      return isDark ? 'text-blue-400' : 'text-blue-600';
    }
    return isDark ? 'text-purple-400' : 'text-purple-600';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Model Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          border transition-all duration-200
          ${isDark 
            ? 'bg-dark-200 border-dark-100 hover:border-primary-500/50' 
            : 'bg-white border-slate-200 hover:border-primary-500/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{getProviderIcon(selectedModelInfo?.provider || 'gemini')}</span>
          <div className="text-left">
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedModelInfo?.name || selectedModel}
            </div>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedModelInfo?.description || 'Unknown model'}
            </div>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`
          absolute z-50 w-full mt-2 rounded-xl border shadow-xl
          max-h-[400px] overflow-hidden flex flex-col
          ${isDark ? 'bg-dark-300 border-dark-100' : 'bg-white border-slate-200'}
        `}>
          {/* Search */}
          <div className={`p-3 border-b ${isDark ? 'border-dark-100' : 'border-slate-200'}`}>
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg text-sm
                ${isDark 
                  ? 'bg-dark-200 border-dark-100 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }
                border focus:outline-none focus:ring-2 focus:ring-primary-500/50
              `}
            />
          </div>

          {/* Models List */}
          <div className="overflow-y-auto flex-1">
            {/* Gemini Models */}
            {geminiModels.length > 0 && (
              <div>
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-dark-200' : 'text-slate-400 bg-slate-50'}`}>
                  ✨ Google Gemini
                </div>
                {geminiModels.map((model) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}

            {/* OpenRouter Models */}
            {openrouterModels.length > 0 && (
              <div>
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-dark-200' : 'text-slate-400 bg-slate-50'}`}>
                  🌐 OpenRouter (Free)
                </div>
                {openrouterModels.map((model) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}

            {filteredModels.length === 0 && (
              <div className={`p-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No models found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelOption({ 
  model, 
  isSelected, 
  onClick, 
  isDark 
}: { 
  model: AIModel; 
  isSelected: boolean; 
  onClick: () => void; 
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3 text-left
        transition-colors duration-150
        ${isSelected 
          ? isDark 
            ? 'bg-primary-900/30 text-primary-400' 
            : 'bg-primary-50 text-primary-700'
          : isDark 
            ? 'hover:bg-dark-200 text-slate-300' 
            : 'hover:bg-slate-50 text-slate-700'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{model.name}</span>
          {model.recommended && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
              ⭐ REC
            </span>
          )}
        </div>
        <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {model.description}
        </div>
      </div>
      {isSelected && (
        <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
