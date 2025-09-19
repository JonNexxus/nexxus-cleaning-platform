import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting sync with existing auth users...');

    // These are the correct UIDs from the Supabase Auth dashboard
    const HOMEOWNER_AUTH_ID = 'd811e717-8807-4cfd-928f-eb827b67ce87';
    const CLEANER_AUTH_ID = '71f7a3c8-6072-4dae-87a8-210d51d2fca2';

    // Step 1: Update homeowner profile to use the correct auth user ID
    console.log('Step 1: Updating homeowner profile...');
    
    const { data: homeownerUpdate, error: homeownerError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        id: HOMEOWNER_AUTH_ID,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'homeowner@nexxus.com')
      .select();

    if (homeownerError) {
      console.error('Error updating homeowner profile:', homeownerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update homeowner profile',
        details: homeownerError.message,
        step: 'homeowner_profile_update'
      });
    }

    console.log('Homeowner profile updated:', homeownerUpdate);

    // Step 2: Update cleaner profile to use the correct auth user ID
    console.log('Step 2: Updating cleaner profile...');
    
    const { data: cleanerUpdate, error: cleanerError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        id: CLEANER_AUTH_ID,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'cleaner@nexxus.com')
      .select();

    if (cleanerError) {
      console.error('Error updating cleaner profile:', cleanerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update cleaner profile',
        details: cleanerError.message,
        step: 'cleaner_profile_update'
      });
    }

    console.log('Cleaner profile updated:', cleanerUpdate);

    // Step 3: Set passwords for both auth users
    console.log('Step 3: Setting passwords...');

    // Set homeowner password
    const { error: homeownerPasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      HOMEOWNER_AUTH_ID,
      {
        password: 'Homeowner123!',
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe',
          role: 'homeowner'
        }
      }
    );

    if (homeownerPasswordError) {
      console.error('Error setting homeowner password:', homeownerPasswordError);
      return NextResponse.json({
        success: false,
        error: 'Failed to set homeowner password',
        details: homeownerPasswordError.message,
        step: 'homeowner_password'
      });
    }

    // Set cleaner password
    const { error: cleanerPasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      CLEANER_AUTH_ID,
      {
        password: 'Cleaner123!',
        user_metadata: {
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'cleaner'
        }
      }
    );

    if (cleanerPasswordError) {
      console.error('Error setting cleaner password:', cleanerPasswordError);
      return NextResponse.json({
        success: false,
        error: 'Failed to set cleaner password',
        details: cleanerPasswordError.message,
        step: 'cleaner_password'
      });
    }

    console.log('Passwords set successfully');

    // Step 4: Verify the sync worked
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role, first_name, last_name')
      .order('email');

    const { data: allAuthUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    return NextResponse.json({
      success: true,
      message: 'Successfully synced existing auth users with database profiles!',
      results: {
        homeowner: {
          authUserId: HOMEOWNER_AUTH_ID,
          email: 'homeowner@nexxus.com',
          profileUpdated: homeownerUpdate?.[0] || null
        },
        cleaner: {
          authUserId: CLEANER_AUTH_ID,
          email: 'cleaner@nexxus.com',
          profileUpdated: cleanerUpdate?.[0] || null
        }
      },
      verification: {
        totalAuthUsers: allAuthUsers?.users.length || 0,
        totalProfiles: allProfiles?.length || 0,
        profiles: allProfiles || [],
        authUsers: allAuthUsers?.users.map(u => ({ 
          id: u.id, 
          email: u.email,
          created_at: u.created_at 
        })) || []
      }
    });

  } catch (error) {
    console.error('Sync existing users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
