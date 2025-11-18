'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call export API
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        // Try to parse error message
        let errorMessage = 'Export failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Export failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Export Questions to JSON
          </h1>
          <p className="text-gray-600 mb-6">
            Export all questions from the database to JSON files and upload them to Supabase Storage.
            The mobile app will automatically download these files.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-blue-900 font-semibold mb-2">📱 How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Questions are exported from database to JSON format</li>
              <li>JSON files are uploaded to Supabase Storage (questions bucket)</li>
              <li>Mobile app checks for updates on launch</li>
              <li>Students get new questions instantly - no app update needed!</li>
            </ol>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              '🚀 Export & Upload to Storage'
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-900 font-semibold mb-1">❌ Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-900 font-semibold mb-2">✅ Export Successful!</h3>
              <div className="space-y-2 text-sm text-green-800">
                <p><strong>Total Questions:</strong> {result.data.total_questions}</p>
                <p><strong>Total Modules:</strong> {result.data.total_modules}</p>
                <p><strong>Version:</strong> {result.data.version}</p>
                
                <div className="mt-3">
                  <p className="font-semibold mb-1">Exported Modules:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {result.data.modules.map((module: string) => (
                      <li key={module}>{module}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-green-300">
                  <p className="text-green-900 font-medium">
                    📱 Mobile app users will receive these updates on next launch!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 When to Export</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>After adding new questions</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>After editing existing questions</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Before a new exam period</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Whenever you want students to get updates</span>
              </li>
            </ul>
          </div>

          {/* Storage Info */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-900 font-semibold mb-2">💾 Storage Location</h3>
            <p className="text-gray-700 text-sm mb-2">
              Files are uploaded to: <code className="bg-gray-200 px-2 py-1 rounded">Supabase Storage → questions bucket</code>
            </p>
            <p className="text-gray-600 text-xs">
              You can view uploaded files in your Supabase Dashboard → Storage → questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
