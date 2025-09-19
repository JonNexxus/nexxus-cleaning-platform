'use client';

import { useState } from 'react';

export default function CreateUsersFinal() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-users-simple', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create users', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Final User Creation</h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">Create Missing Users</h2>
        <p className="text-green-700 mb-4">
          This will create the homeowner and cleaner users using the Supabase Admin API directly.
        </p>
        <ul className="text-green-700 mb-4 list-disc list-inside">
          <li><strong>Homeowner:</strong> homeowner@nexxus.com / Homeowner123!</li>
          <li><strong>Cleaner:</strong> cleaner@nexxus.com / Cleaner123!</li>
        </ul>
        <button
          onClick={createUsers}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating Users...' : 'Create Users'}
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
