import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating cleaner user bypassing trigger...');

    // Step 1: Clean up any old cleaner data
    console.log('Cleaning up old cleaner data...');
    
    // Delete any existing cleaner auth users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && existingUsers) {
      const cleanerUsers = existingUsers.users.filter(u => 
        u.email === 'cleanertest@nexxus.com' || 
        u.email?.includes('cleaner')
      );
      
      for (const user of cleanerUsers) {
        console.log('Deleting existing user:', user.email);
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }

    // Delete any profiles with cleaner role
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .or('role.eq.cleaner,email.like.%cleaner%');

    // Step 2: Create auth user WITHOUT triggering the automatic profile creation
    // We'll do this by creating the user and then immediately creating the profile manually
    console.log('Creating auth user...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'cleanertest@nexxus.com',
      password: 'Clean123!',
      email_confirm: true,
      // Don't include user_metadata to avoid trigger issues
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create auth user',
        details: authError.message,
        step: 'auth_creation'
      });
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Step 3: Manually create user profile with admin privileges (bypassing RLS)
    console.log('Creating user profile manually...');
    
    // Use the service role to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: 'cleanertest@nexxus.com',
        first_name: 'Test',
        last_name: 'Cleaner',
        role: 'cleaner'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user profile',
        details: profileError.message,
        step: 'profile_creation'
      });
    }

    console.log('User profile created successfully:', profile);

    // Step 4: Create cleaner profile
    console.log('Creating cleaner profile...');
    
    const { data: cleanerProfile, error: cleanerError } = await supabaseAdmin
      .from('cleaner_profiles')
      .insert({
        id: authUser.user.id,
        bio: 'Experienced cleaner with attention to detail',
        experience_years: 2,
        hourly_rate: 25.00,
        rating: 4.8,
        total_jobs: 0,
        is_available: true,
        background_check_verified: true,
        insurance_verified: true
      })
      .select()
      .single();

    if (cleanerError) {
      console.error('Cleaner profile creation error:', cleanerError);
      // Don't fail the whole process for this, just log it
    }

    // Step 5: Verify everything was created
    const { data: finalProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    const { data: allProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    return NextResponse.json({
      success: true,
      message: 'Cleaner user created successfully (bypassing trigger)!',
      cleaner: {
        authId: authUser.user.id,
        email: authUser.user.email,
        profile: finalProfile,
        cleanerProfile: cleanerProfile
      },
      credentials: {
        email: 'cleanertest@nexxus.com',
        password: 'Clean123!'
      },
      verification: {
        totalAuthUsers: allUsers?.users.length || 0,
        totalProfiles: allProfiles?.length || 0,
        authUsers: allUsers?.users.map(u => ({ 
          id: u.id.substring(0, 8) + '...', 
          email: u.email 
        })) || [],
        profiles: allProfiles?.map(p => ({ 
          id: p.id.substring(0, 8) + '...', 
          email: p.email, 
          role: p.role 
        })) || []
      }
    });

  } catch (error) {
    console.error('Create cleaner bypass trigger error:', error);
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
