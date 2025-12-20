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

export default function ExportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<ExportStatus | null>(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkAccessAndFetchStatus();
  }, []);

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
      alert('✅ Export completed successfully!');

    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying access & loading status...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-red-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m-1-5v-2m5 2v-2m2 8v-2a2 2 0 100-4v-2M8 12V8a2 2 0 100-4v2m4 5h-1a2 2 0 00-2 2v1a2 2 0 002 2h1a1 1 0 001-1v-2a1 1 0 00-1-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            This area is restricted to <strong>Owner</strong> role only. 
            <br />
            Your current role is: <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{userRole || 'Unknown'}</span>
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              🔄 Export Control Center
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage database exports to Supabase Storage for mobile app synchronization.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              👑 Owner Access
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Status Card */}
          <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </span>
                Current Cloud Status
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Questions</p>
                      <p className="mt-1 text-3xl font-extrabold text-gray-900">
                        {data?.version?.total_questions || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Modules</p>
                      <p className="mt-1 text-3xl font-extrabold text-blue-600">
                        {data?.version?.total_modules || '0'}
                      </p>
                    </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-gray-200">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium text-gray-900">
                        {data?.version?.last_updated ? new Date(data.version.last_updated).toLocaleString() : 'Never'}
                      </span>
                   </div>
                   <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Version</span>
                      <span className="font-mono bg-gray-200 px-2 rounded text-xs py-0.5 text-gray-700">
                        {data?.version?.version || 'N/A'}
                      </span>
                   </div>
                 </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Export Actions</h4>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className={`w-full flex items-center justify-center px-4 py-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white transition-all ${
                    exporting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
                  }`}
                >
                  {exporting ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Processing Export...
                     </>
                  ) : (
                    <>
                      🚀 Run Full Export & Sync
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  This will overwrite existing files in Supabase Storage with current database content.
                </p>
              </div>
            </div>
          </div>

          {/* Recently Uploaded Files */}
          <div className="bg-white shadow rounded-xl border border-gray-100 flex flex-col h-[500px]">
             <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </span>
                    Stored Files ({data?.files?.length || 0})
                 </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                {data?.files ? (
                  <ul className="divide-y divide-gray-100">
                    {data.files.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()).map((file) => (
                      <li key={file.name} className="p-3 hover:bg-gray-50 rounded transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0">
                            <span className="bg-gray-100 text-gray-500 p-2 rounded mr-3">
                              📄
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(file.updated).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                             {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No files found</p>
                  </div>
                )}
             </div>
             <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center">
                <a 
                   href={data?.storage_url ? `${data.storage_url}version.json` : '#'}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`text-sm text-indigo-600 hover:text-indigo-800 font-medium ${!data?.storage_url ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Download Master version.json &rarr;
                </a>
             </div>
          </div>

        </div>

        {/* Instructions Block */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                <strong>How it works:</strong> Clicking &quot;Run Full Export&quot; will convert all questions in the SQL database into optimized JSON files (grouped by module) and upload them to the <code>questions</code> bucket. The mobile app checks <code>version.json</code> on launch to download updates.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
