// AI Model Providers
export type Provider = 'gemini' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: Provider;
  rpm?: number;  // requests per minute
  tpm?: number;  // tokens per minute
  free: boolean;
  recommended?: boolean;
}

// Gemini Models (Google AI)
export const GEMINI_MODELS: AIModel[] = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Fast & capable', 
    provider: 'gemini',
    rpm: 5, tpm: 250000, free: true, recommended: true
  },
  { 
    id: 'gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash Lite', 
    description: 'Lightweight', 
    provider: 'gemini',
    rpm: 10, tpm: 250000, free: true
  },
  { 
    id: 'gemini-1.5-flash', 
    name: 'Gemini 1.5 Flash', 
    description: 'Stable & reliable', 
    provider: 'gemini',
    rpm: 15, tpm: 1000000, free: true
  },
];

// OpenRouter Free Models (as of 2025)
export const OPENROUTER_MODELS: AIModel[] = [
  // Meta Llama Models
  { 
    id: 'meta-llama/llama-3.3-8b-instruct:free', 
    name: 'Llama 3.3 8B', 
    description: 'Fast & efficient', 
    provider: 'openrouter', free: true, recommended: true
  },
  { 
    id: 'meta-llama/llama-3.2-3b-instruct:free', 
    name: 'Llama 3.2 3B', 
    description: 'Lightweight', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'meta-llama/llama-3.2-1b-instruct:free', 
    name: 'Llama 3.2 1B', 
    description: 'Ultra-light', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'meta-llama/llama-3.1-8b-instruct:free', 
    name: 'Llama 3.1 8B', 
    description: 'Balanced performance', 
    provider: 'openrouter', free: true
  },
  
  // Google Gemma Models
  { 
    id: 'google/gemma-3-4b-it:free', 
    name: 'Gemma 3 4B', 
    description: 'Google open model', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'google/gemma-2-9b-it:free', 
    name: 'Gemma 2 9B', 
    description: 'Capable open model', 
    provider: 'openrouter', free: true
  },
  
  // Mistral Models (Great for French!)
  { 
    id: 'mistralai/mistral-small-3.1-24b-instruct:free', 
    name: 'Mistral Small 3.1', 
    description: 'Excellent French support', 
    provider: 'openrouter', free: true, recommended: true
  },
  { 
    id: 'mistralai/mistral-7b-instruct:free', 
    name: 'Mistral 7B', 
    description: 'Fast & French-friendly', 
    provider: 'openrouter', free: true
  },
  
  // Qwen Models (Alibaba)
  { 
    id: 'qwen/qwen-2.5-7b-instruct:free', 
    name: 'Qwen 2.5 7B', 
    description: 'Multilingual', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'qwen/qwen-2.5-coder-7b-instruct:free', 
    name: 'Qwen 2.5 Coder 7B', 
    description: 'Code-focused', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'qwen/qwen3-4b:free', 
    name: 'Qwen 3 4B', 
    description: 'Latest Qwen', 
    provider: 'openrouter', free: true
  },
  
  // Microsoft Phi Models
  { 
    id: 'microsoft/phi-3-mini-128k-instruct:free', 
    name: 'Phi 3 Mini', 
    description: 'Compact & smart', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'microsoft/phi-3-medium-128k-instruct:free', 
    name: 'Phi 3 Medium', 
    description: 'Balanced Phi', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'microsoft/phi-4-mini-instruct:free', 
    name: 'Phi 4 Mini', 
    description: 'Latest Phi', 
    provider: 'openrouter', free: true
  },
  
  // DeepSeek Models
  { 
    id: 'deepseek/deepseek-r1-0528:free', 
    name: 'DeepSeek R1', 
    description: 'Reasoning model', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'deepseek/deepseek-chat-v3-0324:free', 
    name: 'DeepSeek Chat V3', 
    description: 'Conversational', 
    provider: 'openrouter', free: true
  },
  
  // Other Free Models
  { 
    id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', 
    name: 'Nemotron 70B', 
    description: 'NVIDIA optimized', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'openchat/openchat-7b:free', 
    name: 'OpenChat 7B', 
    description: 'Community model', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'huggingfaceh4/zephyr-7b-beta:free', 
    name: 'Zephyr 7B', 
    description: 'HuggingFace model', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'nousresearch/hermes-3-llama-3.1-405b:free', 
    name: 'Hermes 3 405B', 
    description: 'Large & capable', 
    provider: 'openrouter', free: true
  },
  { 
    id: 'moonshotai/moonlight-16b-a3b-instruct:free', 
    name: 'Moonlight 16B', 
    description: 'Moonshot AI', 
    provider: 'openrouter', free: true
  },
];

// All available models
export const ALL_MODELS: AIModel[] = [...GEMINI_MODELS, ...OPENROUTER_MODELS];

// Default model
export const DEFAULT_MODEL = 'gemini-2.5-flash';

// Fallback order (prioritizes reliability and French support)
export const FALLBACK_ORDER: string[] = [
  // Gemini first
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash-lite',
  // OpenRouter Mistral (French support)
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  // OpenRouter Llama
  'meta-llama/llama-3.3-8b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  // OpenRouter others
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
];

export function getModelInfo(modelId: string): AIModel | undefined {
  return ALL_MODELS.find(m => m.id === modelId);
}

export function getModelProvider(modelId: string): Provider {
  const model = getModelInfo(modelId);
  return model?.provider || (modelId.includes('/') ? 'openrouter' : 'gemini');
}

export function getModelDisplayName(modelId: string): string {
  return getModelInfo(modelId)?.name || modelId;
}

export function getFreeModels(): AIModel[] {
  return ALL_MODELS.filter(m => m.free);
}

export function getModelsByProvider(provider: Provider): AIModel[] {
  return ALL_MODELS.filter(m => m.provider === provider);
}
