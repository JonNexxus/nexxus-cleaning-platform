import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking existing users and database connection...');

    // Step 1: Test basic connection
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Supabase',
        details: connectionError.message,
        step: 'connection_test'
      });
    }

    console.log('✅ Supabase connection successful');

    // Step 2: List existing auth users
    console.log('Listing existing auth users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Auth users error:', authError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list auth users',
        details: authError.message,
        step: 'list_auth_users'
      });
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    // Step 3: List existing profiles
    console.log('Listing existing user profiles...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    if (profilesError) {
      console.error('Profiles error:', profilesError);
    }

    console.log(`Found ${profiles?.length || 0} user profiles`);

    // Step 4: List existing cleaner profiles
    const { data: cleanerProfiles, error: cleanerError } = await supabaseAdmin
      .from('cleaner_profiles')
      .select('*');

    if (cleanerError) {
      console.error('Cleaner profiles error:', cleanerError);
    }

    console.log(`Found ${cleanerProfiles?.length || 0} cleaner profiles`);

    // Step 5: Check for users without profiles
    const usersWithoutProfiles = authUsers.users.filter(user => 
      !profiles?.some(profile => profile.id === user.id)
    );

    // Step 6: Check for missing roles
    const roleCount = {
      admin: profiles?.filter(p => p.role === 'admin').length || 0,
      cleaner: profiles?.filter(p => p.role === 'cleaner').length || 0,
      homeowner: profiles?.filter(p => p.role === 'homeowner').length || 0
    };

    return NextResponse.json({
      success: true,
      message: 'Database check completed successfully!',
      summary: {
        connectionWorking: true,
        totalAuthUsers: authUsers.users.length,
        totalProfiles: profiles?.length || 0,
        totalCleanerProfiles: cleanerProfiles?.length || 0,
        usersWithoutProfiles: usersWithoutProfiles.length,
        roleDistribution: roleCount
      },
      details: {
        authUsers: authUsers.users.map(u => ({
          id: u.id.substring(0, 8) + '...',
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })),
        profiles: profiles?.map(p => ({
          id: p.id.substring(0, 8) + '...',
          email: p.email,
          role: p.role,
          name: `${p.first_name} ${p.last_name}`.trim()
        })) || [],
        cleanerProfiles: cleanerProfiles?.map(cp => ({
          id: cp.id.substring(0, 8) + '...',
          rating: cp.rating,
          hourlyRate: cp.hourly_rate,
          isAvailable: cp.is_available
        })) || [],
        usersWithoutProfiles: usersWithoutProfiles.map(u => ({
          id: u.id.substring(0, 8) + '...',
          email: u.email
        }))
      },
      recommendations: [
        usersWithoutProfiles.length > 0 ? 
          `Create profiles for ${usersWithoutProfiles.length} users without profiles` : 
          'All users have profiles',
        roleCount.admin === 0 ? 'Need to create or assign admin role' : `${roleCount.admin} admin(s) found`,
        roleCount.cleaner === 0 ? 'Need to create or assign cleaner role' : `${roleCount.cleaner} cleaner(s) found`,
        roleCount.homeowner === 0 ? 'Need to create or assign homeowner role' : `${roleCount.homeowner} homeowner(s) found`
      ]
    });

  } catch (error) {
    console.error('Check existing users error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
