import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Listing all auth users...');

    // Get all auth users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing auth users:', authError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list auth users',
        details: authError.message
      });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    if (profilesError) {
      console.error('Error listing profiles:', profilesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list profiles',
        details: profilesError.message
      });
    }

    // Format the data for easy comparison
    const authUsers = authData.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      user_metadata: user.user_metadata
    }));

    return NextResponse.json({
      success: true,
      data: {
        authUsers: authUsers,
        profiles: profiles,
        summary: {
          totalAuthUsers: authUsers.length,
          totalProfiles: profiles.length,
          authEmails: authUsers.map(u => u.email).sort(),
          profileEmails: profiles.map(p => p.email).sort()
        }
      }
    });

  } catch (error) {
    console.error('List auth users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
