'use client';

import { useState } from 'react';

export default function FixRoles() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fixCleanerRole = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-cleaner-role', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fix cleaner role', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fix User Roles</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Issue Found</h2>
        <p className="text-yellow-700 mb-4">
          The cleaner@nexxus.com user exists but has the wrong role. It's set to "homeowner" instead of "cleaner".
        </p>
        <p className="text-yellow-700 mb-4">
          This will fix the cleaner's role in the user_profiles table.
        </p>
        <button
          onClick={fixCleanerRole}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Fixing Role...' : 'Fix Cleaner Role'}
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
