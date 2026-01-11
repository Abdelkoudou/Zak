'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import ModelSelector from '@/components/ModelSelector';
import { DEFAULT_MODEL } from '@/lib/ai-models';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  dbId?: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  modelName?: string;
  fallbackUsed?: boolean;
  ragUsed?: boolean;
  contextCount?: number;
  rating?: number;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  message_count: number;
  updated_at: string;
}

const QUICK_PROMPTS = [
  'ما هي المواد المتاحة في السنة الثانية؟',
  'Comment fonctionne le système d\'abonnement?',
  'How does offline mode work?',
  'Quelles facultés sont supportées?',
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [autoFallback, setAutoFallback] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true); // Default to open for desktop feel
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
    setLoadingSessions(false);
  };

  const createSession = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/chat/sessions', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        await loadSessions();
        return data.session.id;
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
    return null;
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: Message[] = data.messages.map((m: any) => ({
          id: m.id,
          dbId: m.id,
          role: m.role,
          content: m.content,
          model: m.model,
          modelName: m.model_name,
          fallbackUsed: m.fallback_used,
          ragUsed: m.rag_used,
          contextCount: m.context_count,
          rating: m.rating,
          timestamp: new Date(m.created_at),
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        // On mobile we might want to close, but on desktop let's keep it open or user preference
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await fetch(`/api/chat/sessions?id=${sessionId}`, { method: 'DELETE' });
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
      await loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const saveMessage = async (sessionId: string, message: Partial<Message> & { role: string; content: string }) => {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: message.role,
          content: message.content,
          model: message.model,
          modelName: message.modelName,
          fallbackUsed: message.fallbackUsed,
          ragUsed: message.ragUsed,
          contextCount: message.contextCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.message.id;
      }
    } catch (err) {
      console.error('Failed to save message:', err);
    }
    return null;
  };

  const rateMessage = async (messageId: string, rating: number) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
      setMessages(prev => prev.map(m => 
        m.dbId === messageId ? { ...m, rating } : m
      ));
    } catch (err) {
      console.error('Failed to rate message:', err);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportChat = () => {
    const content = messages.map(m => 
      `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}\n`
    ).join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession();
      if (!sessionId) {
        console.error('Failed to create session');
        return;
      }
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    const userDbId = await saveMessage(sessionId, userMessage);
    if (userDbId) {
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, dbId: userDbId } : m
      ));
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
          autoFallback,
          enableRAG: true,
        }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        model: data.model,
        modelName: data.modelName,
        fallbackUsed: data.fallbackUsed,
        ragUsed: data.ragUsed,
        contextCount: data.contextCount,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      const assistantDbId = await saveMessage(sessionId, {
        ...assistantMessage,
        responseTimeMs: responseTime,
      } as any);
      if (assistantDbId) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id ? { ...m, dbId: assistantDbId } : m
        ));
      }

      // Refresh sessions list
      loadSessions();
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  return (
    <div className={`flex h-screen overflow-hidden text-sm md:text-base selection:bg-blue-500/30 ${isDark ? 'bg-[#0f1117] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Sidebar with Framer Motion */}
      <AnimatePresence mode="wait">
        {showSidebar && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`flex-shrink-0 h-full flex flex-col border-r z-20 overflow-hidden relative ${
              isDark ? 'bg-[#090a0d] border-white/10' : 'bg-[#f9f9fb] border-black/5'
            }`}
          >
            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={startNewChat}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border shadow-sm group ${
                  isDark 
                    ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-200' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700'
                }`}
              >
                 <svg className={`w-5 h-5 transition-transform group-hover:rotate-90 ${isDark ? 'text-gray-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">New chat</span>
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700/20 hover:scrollbar-thumb-gray-700/40">
              <div className={`px-2 py-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Recent
              </div>
              
              {loadingSessions ? (
                 <div className="space-y-3 px-2">
                   {[1,2,3].map(i => (
                     <div key={i} className={`h-10 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
                   ))}
                 </div>
              ) : sessions.length === 0 ? (
                <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No conversations yet
                </div>
              ) : (
                sessions.map(session => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`group relative flex items-center gap-3 px-3 py-3 ring-1 ring-transparent rounded-lg cursor-pointer transition-all duration-200 ${
                      currentSessionId === session.id
                        ? isDark ? 'bg-white/10 text-white' : 'bg-white shadow-md ring-black/5 text-gray-900'
                        : isDark ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                     <svg className={`w-4 h-4 flex-shrink-0 opacity-70 ${isDark ? '' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                     </svg>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium leading-none mb-1">{session.title}</div>
                      <div className="truncate text-xs opacity-60 font-light">{session.preview || 'Empty chat'}</div>
                    </div>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                        isDark 
                          ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' 
                          : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                      }`}
                      title="Delete chat"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Sidebar Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/knowledge"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    isDark ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs font-medium">Knowledge</span>
                </Link>
                <Link 
                  href="/ai-analytics"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    isDark ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                   <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-medium">Analytics</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className={`flex-shrink-0 h-16 px-4 flex items-center justify-between z-10 ${
            isDark ? 'bg-[#0f1117]/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
                <button
                onClick={exportChat}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
                }`}
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                </button>
            )}
            
            <button
                onClick={() => setAutoFallback(!autoFallback)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  autoFallback
                    ? isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'
                    : isDark ? 'bg-white/5 text-gray-500 border border-white/5' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${autoFallback ? 'bg-current animate-pulse' : 'bg-gray-400'}`} />
                {autoFallback ? 'Auto-Fallback On' : 'Fallback Off'}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-500/20">
          <div className="w-full max-w-3xl mx-auto px-4 pb-32 pt-8">
            <AnimatePresence mode="popLayout">
                {messages.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl rotate-3 ${
                    isDark ? 'bg-gradient-to-br from-blue-600 to-violet-600' : 'bg-gradient-to-br from-blue-500 to-violet-500'
                    }`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    </div>
                    <h2 className={`text-3xl font-bold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    FMC AI Assistant
                    </h2>
                    <p className={`text-base mb-10 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your intelligent companion for medical studies. Ask about courses, exams, or detailed explanations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        className={`p-4 text-left rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                            isDark 
                            ? 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10 text-gray-300' 
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 text-gray-700'
                        }`}
                        >
                        <p className="text-sm font-medium">{prompt}</p>
                        </motion.button>
                    ))}
                    </div>
                </motion.div>
                ) : (
                <div className="space-y-6">
                    {messages.map((message) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={message.id} 
                        className={`flex gap-4 md:gap-6 ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                        {/* Assistant Avatar */}
                        {message.role === 'assistant' && (
                        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md ${
                            isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'
                        }`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {message.role === 'user' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1 mr-1">You</span>
                        )}
                        {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>FMC AI</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}>{message.modelName || 'Model'}</span>
                            </div>
                        )}

                        <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
                            message.role === 'user'
                            ? isDark 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-black text-white rounded-tr-sm'
                            : isDark
                                ? 'bg-[#1a1d24] text-gray-200 rounded-tl-sm border border-white/5' 
                                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                        }`}>
                            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert break-words leading-relaxed whitespace-pre-wrap">
                            {message.content}
                            </div>
                        </div>

                        {/* Assistant Actions */}
                        {message.role === 'assistant' && (
                            <div className="flex items-center gap-3 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {/* Rating Star */}
                                <div className="flex items-center gap-0.5 bg-gray-500/10 px-1.5 py-1 rounded-full">
                                    {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => rateMessage(message.dbId!, star)}
                                        className={`p-0.5 transition-transform hover:scale-125 ${
                                        (message.rating || 0) >= star 
                                            ? 'text-yellow-400' 
                                            : isDark ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill={ (message.rating || 0) >= star ? "currentColor" : "none" } stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={() => copyToClipboard(message.content, message.id)}
                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    copiedId === message.id ? 'text-green-500' : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {copiedId === message.id ? (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            Copy
                                        </>
                                    )}
                                </button>

                                {message.ragUsed && (
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        RAG ({message.contextCount})
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    </motion.div>
                    ))}
                    
                    {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 md:gap-6"
                    >
                         <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md animate-pulse ${
                            isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'
                        }`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div className={`p-4 rounded-xl shadow-sm flex items-center gap-3 ${
                            isDark ? 'bg-[#1a1d24] border border-white/5' : 'bg-white border border-gray-100'
                        }`}>
                            <div className="flex gap-1.5">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ repeat: Infinity, duration: 1 }} 
                                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-500' : 'bg-indigo-600'}`} 
                                />
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
                                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-600'}`} 
                                />
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
                                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} 
                                />
                            </div>
                            <span className={`text-sm animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Generating response...</span>
                        </div>
                    </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                )}
            </AnimatePresence>
          </div>
        </main>

        {/* Input Area - Floating at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0f1117] dark:via-[#0f1117] dark:to-transparent z-20">
          <div className="max-w-3xl mx-auto">
             <div className={`relative rounded-3xl transition-shadow duration-300 ${
                isDark 
                    ? 'bg-[#1a1d24] shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-white/10 ring-1 ring-white/5 focus-within:ring-indigo-500/50' 
                    : 'bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] border border-gray-200 ring-1 ring-black/5 focus-within:ring-indigo-500/50'
             }`}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    rows={1}
                    className={`w-full pl-6 pr-14 py-4 bg-transparent border-none focus:ring-0 resize-none max-h-40 placeholder-opacity-50 ${
                        isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                />
                
                <div className="absolute right-2 bottom-2">
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-xl transition-all duration-200 ${
                        !input.trim() || isLoading
                            ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                            : isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-black text-white hover:bg-gray-800 shadow-md'
                        } disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                             <svg className="w-5 h-5 transform rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>
             </div>
             <div className="text-center mt-2">
                <p className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    AI can make mistakes. Verify important information.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}