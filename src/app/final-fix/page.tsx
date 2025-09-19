'use client';

import { useState } from 'react';

export default function FinalFix() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runFinalFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cleanup-and-create-users', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to run final fix', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Final User Fix</h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">Comprehensive Solution</h2>
        <p className="text-green-700 mb-4">
          This will completely fix the user authentication issue by:
        </p>
        <ol className="text-green-700 mb-4 list-decimal list-inside space-y-1">
          <li>Delete existing orphaned profiles for homeowner@nexxus.com and cleaner@nexxus.com</li>
          <li>Create proper auth user for homeowner@nexxus.com with password Homeowner123!</li>
          <li>Create matching profile for the homeowner with correct role</li>
          <li>Create proper auth user for cleaner@nexxus.com with password Cleaner123!</li>
          <li>Create matching profile for the cleaner with correct role</li>
          <li>Verify all users and profiles are properly linked</li>
        </ol>
        <p className="text-green-700 mb-4 font-medium">
          After this, all three users (admin, homeowner, cleaner) should be able to login successfully!
        </p>
        <button
          onClick={runFinalFix}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Running Final Fix...' : 'Run Final Fix'}
        </button>
      </div>

      {result && (
        <div className={`border rounded-lg p-4 ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
