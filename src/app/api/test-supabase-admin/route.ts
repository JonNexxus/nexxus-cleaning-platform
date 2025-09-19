import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('Testing Supabase Admin connection...');
    
    // Test 2: Try to list users (this requires admin privileges)
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: usersError.message,
        code: usersError.code
      });
    }

    // Test 3: Check user_profiles table access
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role')
      .limit(10);

    if (profilesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to access user_profiles table',
        details: profilesError.message,
        code: profilesError.code,
        usersCount: users?.users?.length || 0
      });
    }

    // Test 4: Check for existing test users
    const testEmails = ['homeowner@nexxus.com', 'cleaner@nexxus.com', 'admin@nexxus.com'];
    const existingUsers = users?.users?.filter(user => 
      testEmails.includes(user.email || '')
    ) || [];

    return NextResponse.json({
      success: true,
      message: 'Supabase Admin connection working!',
      data: {
        totalUsers: users?.users?.length || 0,
        totalProfiles: profiles?.length || 0,
        existingTestUsers: existingUsers.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at
        })),
        profiles: profiles || []
      }
    });

  } catch (error) {
    console.error('Supabase Admin test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error testing Supabase Admin',
      details: String(error)
    }, { status: 500 });
  }
}
