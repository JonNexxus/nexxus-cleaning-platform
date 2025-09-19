import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting cleanup and user creation process...');

    // Step 1: Delete existing orphaned profiles for homeowner and cleaner
    console.log('Step 1: Cleaning up orphaned profiles...');
    
    const { error: deleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .in('email', ['homeowner@nexxus.com', 'cleaner@nexxus.com']);

    if (deleteError) {
      console.error('Error deleting orphaned profiles:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to cleanup orphaned profiles',
        details: deleteError.message
      });
    }

    console.log('Successfully deleted orphaned profiles');

    // Step 2: Create homeowner auth user
    console.log('Step 2: Creating homeowner auth user...');
    
    const { data: homeownerAuth, error: homeownerAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'homeowner@nexxus.com',
      password: 'Homeowner123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
        role: 'homeowner'
      }
    });

    if (homeownerAuthError) {
      console.error('Error creating homeowner auth user:', homeownerAuthError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create homeowner auth user',
        details: homeownerAuthError.message,
        step: 'homeowner_auth'
      });
    }

    console.log('Homeowner auth user created:', homeownerAuth.user?.id);

    // Step 3: Create homeowner profile
    const { data: homeownerProfile, error: homeownerProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: homeownerAuth.user!.id,
        email: 'homeowner@nexxus.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'homeowner'
      })
      .select()
      .single();

    if (homeownerProfileError) {
      console.error('Error creating homeowner profile:', homeownerProfileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create homeowner profile',
        details: homeownerProfileError.message,
        step: 'homeowner_profile'
      });
    }

    console.log('Homeowner profile created:', homeownerProfile);

    // Step 4: Create cleaner auth user
    console.log('Step 4: Creating cleaner auth user...');
    
    const { data: cleanerAuth, error: cleanerAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'cleaner@nexxus.com',
      password: 'Cleaner123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'cleaner'
      }
    });

    if (cleanerAuthError) {
      console.error('Error creating cleaner auth user:', cleanerAuthError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create cleaner auth user',
        details: cleanerAuthError.message,
        step: 'cleaner_auth'
      });
    }

    console.log('Cleaner auth user created:', cleanerAuth.user?.id);

    // Step 5: Create cleaner profile
    const { data: cleanerProfile, error: cleanerProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: cleanerAuth.user!.id,
        email: 'cleaner@nexxus.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'cleaner'
      })
      .select()
      .single();

    if (cleanerProfileError) {
      console.error('Error creating cleaner profile:', cleanerProfileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create cleaner profile',
        details: cleanerProfileError.message,
        step: 'cleaner_profile'
      });
    }

    console.log('Cleaner profile created:', cleanerProfile);

    // Step 6: Verify all users exist
    const { data: allAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role')
      .order('email');

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up and created all users!',
      results: {
        homeowner: {
          authUserId: homeownerAuth.user?.id,
          profileId: homeownerProfile.id,
          email: homeownerProfile.email,
          role: homeownerProfile.role
        },
        cleaner: {
          authUserId: cleanerAuth.user?.id,
          profileId: cleanerProfile.id,
          email: cleanerProfile.email,
          role: cleanerProfile.role
        }
      },
      verification: {
        totalAuthUsers: allAuthUsers?.users.length || 0,
        totalProfiles: allProfiles?.length || 0,
        authUsers: allAuthUsers?.users.map(u => ({ id: u.id, email: u.email })) || [],
        profiles: allProfiles || []
      }
    });

  } catch (error) {
    console.error('Cleanup and create users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
