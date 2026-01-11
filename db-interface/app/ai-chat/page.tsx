'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import ModelSelector from '@/components/ModelSelector';
import { DEFAULT_MODEL } from '@/lib/ai-models';
import Link from 'next/link';

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
  const [showSidebar, setShowSidebar] = useState(false);
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
        setShowSidebar(false);
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
    setShowSidebar(false);
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Sidebar */}
      <div className={`
        ${showSidebar ? 'w-64' : 'w-0'} 
        transition-all duration-300 overflow-hidden flex-shrink-0
        ${isDark ? 'bg-gray-900 border-r border-gray-700' : 'bg-gray-50 border-r border-gray-200'}
      `}>
        <div className="w-64 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 border-b" style={{ borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)' }}>
            <button
              onClick={startNewChat}
              className={`w-full p-3 rounded-lg border border-dashed text-sm font-medium transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100'
              }`}
            >
              New chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingSessions ? (
              <div className={`text-center text-sm py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className={`text-center text-sm py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No conversations yet
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                    currentSessionId === session.id
                      ? isDark ? 'bg-gray-800' : 'bg-gray-200'
                      : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {session.title}
                      </p>
                      <p className={`text-xs truncate mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {session.preview || 'Empty chat'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded text-xs transition-opacity ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      ×
                    </button>
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {session.message_count} messages
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t" style={{ borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)' }}>
            <div className="space-y-2">
              <Link 
                href="/knowledge"
                className={`block w-full p-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Knowledge Base
              </Link>
              <Link 
                href="/ai-analytics"
                className={`block w-full p-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`flex-shrink-0 px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                FMC AI Assistant
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={exportChat}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Export
                </button>
              )}
              <div className="w-48">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </header>
        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  How can I help you today?
                </h2>
                <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ask me anything about FMC App, medical education, or study tips.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className={`p-4 text-left rounded-xl border transition-all hover:shadow-md ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300' 
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <p className="text-sm">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className="mb-6">
                <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-green-600' : 'bg-green-500'
                    }`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-2xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                    {message.role === 'user' && (
                      <div className="flex justify-end mb-1">
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          You
                        </span>
                      </div>
                    )}
                    
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>

                    {/* Assistant message actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2">
                        {/* Rating */}
                        {message.dbId && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => rateMessage(message.dbId!, star)}
                                className={`text-sm transition-colors ${
                                  message.rating && star <= message.rating 
                                    ? 'text-yellow-400' 
                                    : isDark ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Copy button */}
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            copiedId === message.id
                              ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                              : isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {copiedId === message.id ? 'Copied!' : 'Copy'}
                        </button>

                        {/* Model info badges */}
                        {message.modelName && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {message.modelName}
                          </span>
                        )}
                        
                        {message.ragUsed && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            isDark ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            RAG ({message.contextCount})
                          </span>
                        )}
                        
                        {message.fallbackUsed && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            isDark ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Fallback
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mb-6">
                <div className="flex gap-4 justify-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-green-600' : 'bg-green-500'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className={`p-4 rounded-2xl mr-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>
        {/* Input Area */}
        <footer className={`flex-shrink-0 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-3xl mx-auto p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message FMC AI Assistant..."
                disabled={isLoading}
                rows={1}
                className={`w-full px-4 py-3 pr-12 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } disabled:opacity-50`}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  !input.trim() || isLoading
                    ? isDark ? 'text-gray-600' : 'text-gray-400'
                    : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                } disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Footer info */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className={`flex items-center gap-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>Press Enter to send, Shift+Enter for new line</span>
                {autoFallback && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Auto-fallback enabled
                  </span>
                )}
              </div>
              <button
                onClick={() => setAutoFallback(!autoFallback)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  autoFallback
                    ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                    : isDark ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {autoFallback ? 'Auto-fallback ON' : 'Auto-fallback OFF'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}