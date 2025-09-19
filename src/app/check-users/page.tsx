'use client';

import { useState, useEffect } from 'react';

export default function CheckUsersPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUsers = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/check-existing-users');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on page mount
  useEffect(() => {
    checkUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Check Existing Users</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 Database Status Check</h2>
            <p className="text-blue-800 mb-4">
              This will show you all existing users in your Supabase database so you know which accounts you can login with.
            </p>
            
            <button
              onClick={checkUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Checking...' : '🔍 Refresh User List'}
            </button>
          </div>

          {result && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Database Status:</h3>
              
              {result.success ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-green-800 mb-4">📊 Summary:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-green-700 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium">Auth Users</p>
                        <p className="text-2xl font-bold">{result.summary.totalAuthUsers}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium">User Profiles</p>
                        <p className="text-2xl font-bold">{result.summary.totalProfiles}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium">Cleaner Profiles</p>
                        <p className="text-2xl font-bold">{result.summary.totalCleanerProfiles}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-medium">Missing Profiles</p>
                        <p className="text-2xl font-bold">{result.summary.usersWithoutProfiles}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role Distribution */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">👥 Role Distribution:</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded">
                        <p className="text-purple-800 font-medium">Admins</p>
                        <p className="text-3xl font-bold text-purple-600">{result.summary.roleDistribution.admin}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <p className="text-blue-800 font-medium">Cleaners</p>
                        <p className="text-3xl font-bold text-blue-600">{result.summary.roleDistribution.cleaner}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <p className="text-green-800 font-medium">Homeowners</p>
                        <p className="text-3xl font-bold text-green-600">{result.summary.roleDistribution.homeowner}</p>
                      </div>
                    </div>
                  </div>

                  {/* Existing Users */}
                  {result.details?.profiles && result.details.profiles.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">👤 Existing Users (You can login with these):</h4>
                      <div className="space-y-2">
                        {result.details.profiles.map((profile: any, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                profile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                profile.role === 'cleaner' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {profile.role.toUpperCase()}
                              </span>
                              <span className="font-medium text-gray-900">{profile.email}</span>
                              {profile.name && (
                                <span className="text-gray-600">({profile.name})</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">ID: {profile.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auth Users without Profiles */}
                  {result.details?.usersWithoutProfiles && result.details.usersWithoutProfiles.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h4 className="font-semibold text-yellow-800 mb-4">⚠️ Auth Users Without Profiles:</h4>
                      <div className="space-y-2">
                        {result.details.usersWithoutProfiles.map((user: any, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                            <span className="text-yellow-800">{user.email}</span>
                            <span className="text-xs text-yellow-600">ID: {user.id}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-yellow-700 text-sm mt-3">
                        These users exist in auth but don't have profiles. They won't be able to login properly.
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-800 mb-4">💡 Next Steps:</h4>
                    <ol className="list-decimal list-inside text-blue-700 space-y-2">
                      <li>
                        <strong>Run the SQL script:</strong> Go to your Supabase dashboard → SQL Editor → 
                        Copy and paste the contents of <code className="bg-blue-100 px-1 rounded">disable-rls-sql-script.sql</code>
                      </li>
                      <li>
                        <strong>Test login:</strong> Try logging in with any of the users listed above
                      </li>
                      <li>
                        <strong>Check dashboards:</strong> Verify that admin, cleaner, and homeowner dashboards work
                      </li>
                    </ol>
                  </div>

                  {/* Recommendations from API */}
                  {result.recommendations && (
                    <div className="bg-gray-50 border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">🔍 System Recommendations:</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {result.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">❌</span>
                    <span className="text-red-800 font-semibold">Error: {result.error}</span>
                  </div>
                  
                  <div className="space-y-2 text-red-700">
                    <p><strong>Details:</strong> {result.details}</p>
                    <p><strong>Step:</strong> {result.step}</p>
                  </div>
                </div>
              )}

              <details className="mt-6">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  📋 View Full Response
                </summary>
                <pre className="mt-4 bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
