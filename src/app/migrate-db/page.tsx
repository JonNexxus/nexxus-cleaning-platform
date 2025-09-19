'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function MigrateDBPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    setResult('Starting database migration...\n');
    
    try {
      // Create user_profiles table
      const createUserProfilesTable = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'homeowner' CHECK (role IN ('homeowner', 'cleaner', 'admin')),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      setResult(prev => prev + 'Creating user_profiles table...\n');
      
      const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', {
        sql: createUserProfilesTable
      });

      if (tableError) {
        setResult(prev => prev + `Table creation error: ${tableError.message}\n`);
        
        // Try alternative approach - create the admin profile directly
        setResult(prev => prev + 'Trying direct profile creation...\n');
        
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: '398b46f2-d083-4be1-863f-fd523017ddf0',
            email: 'admin@nexxus.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
          })
          .select();

        if (profileError) {
          setResult(prev => prev + `Profile creation error: ${profileError.message}\n`);
          setResult(prev => prev + `Error details: ${JSON.stringify(profileError, null, 2)}\n`);
        } else {
          setResult(prev => prev + `Profile created successfully: ${JSON.stringify(profileData, null, 2)}\n`);
        }
      } else {
        setResult(prev => prev + 'Table created successfully!\n');
        
        // Now create the admin profile
        setResult(prev => prev + 'Creating admin profile...\n');
        
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: '398b46f2-d083-4be1-863f-fd523017ddf0',
            email: 'admin@nexxus.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
          })
          .select();

        if (profileError) {
          setResult(prev => prev + `Profile creation error: ${profileError.message}\n`);
        } else {
          setResult(prev => prev + `Profile created successfully: ${JSON.stringify(profileData, null, 2)}\n`);
        }
      }

      // Test the profile query
      setResult(prev => prev + 'Testing profile query...\n');
      
      const { data: testProfile, error: testError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', '398b46f2-d083-4be1-863f-fd523017ddf0')
        .single();

      if (testError) {
        setResult(prev => prev + `Profile query error: ${testError.message}\n`);
      } else {
        setResult(prev => prev + `Profile query successful: ${JSON.stringify(testProfile, null, 2)}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `Unexpected error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Migration</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <h2 className="font-semibold text-yellow-800">Warning</h2>
          <p className="text-yellow-700">This will attempt to create the user_profiles table and admin user. Only run this once.</p>
        </div>
        
        <button
          onClick={runMigration}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Running Migration...' : 'Run Database Migration'}
        </button>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Migration Results:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
