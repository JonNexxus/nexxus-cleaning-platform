import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating missing auth users and setting up complete authentication...');

    // Step 1: List current auth users to see what we have
    const { data: currentUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing current users:', listError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list current users',
        details: listError.message
      });
    }

    console.log('Current auth users:', currentUsers.users.map(u => ({ id: u.id, email: u.email })));

    // Step 2: Check if homeowner and cleaner auth users exist
    const homeownerExists = currentUsers.users.find(u => u.email === 'homeowner@nexxus.com');
    const cleanerExists = currentUsers.users.find(u => u.email === 'cleaner@nexxus.com');

    let homeownerAuthUser = homeownerExists;
    let cleanerAuthUser = cleanerExists;

    // Step 3: Create homeowner auth user if missing
    if (!homeownerExists) {
      console.log('Creating homeowner auth user...');
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
          step: 'homeowner_auth_creation'
        });
      }

      homeownerAuthUser = homeownerAuth.user;
      console.log('Homeowner auth user created:', { id: homeownerAuthUser.id, email: homeownerAuthUser.email });
    } else {
      console.log('Homeowner auth user already exists, updating password...');
      const { data: homeownerUpdate, error: homeownerUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        homeownerExists.id,
        {
          password: 'Homeowner123!',
          user_metadata: {
            first_name: 'John',
            last_name: 'Doe',
            role: 'homeowner'
          }
        }
      );

      if (homeownerUpdateError) {
        console.error('Error updating homeowner password:', homeownerUpdateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update homeowner password',
          details: homeownerUpdateError.message,
          step: 'homeowner_password_update'
        });
      }
    }

    // Step 4: Create cleaner auth user if missing
    if (!cleanerExists) {
      console.log('Creating cleaner auth user...');
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
          step: 'cleaner_auth_creation'
        });
      }

      cleanerAuthUser = cleanerAuth.user;
      console.log('Cleaner auth user created:', { id: cleanerAuthUser.id, email: cleanerAuthUser.email });
    } else {
      console.log('Cleaner auth user already exists, updating password...');
      const { data: cleanerUpdate, error: cleanerUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        cleanerExists.id,
        {
          password: 'Cleaner123!',
          user_metadata: {
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'cleaner'
          }
        }
      );

      if (cleanerUpdateError) {
        console.error('Error updating cleaner password:', cleanerUpdateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update cleaner password',
          details: cleanerUpdateError.message,
          step: 'cleaner_password_update'
        });
      }
    }

    // Step 5: Get current profiles
    const { data: currentProfiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    if (profilesError) {
      console.error('Error getting current profiles:', profilesError);
    }

    // Step 6: Create or update homeowner profile
    if (!homeownerAuthUser) {
      return NextResponse.json({
        success: false,
        error: 'Homeowner auth user is missing after creation/update',
        step: 'homeowner_profile_setup'
      });
    }

    const homeownerProfile = currentProfiles?.find(p => p.email === 'homeowner@nexxus.com');
    let homeownerProfileResult;

    if (!homeownerProfile) {
      console.log('Creating homeowner profile...');
      const { data: newHomeownerProfile, error: homeownerProfileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: homeownerAuthUser.id,
          email: 'homeowner@nexxus.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'homeowner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (homeownerProfileError) {
        console.error('Error creating homeowner profile:', homeownerProfileError);
      } else {
        homeownerProfileResult = newHomeownerProfile;
      }
    } else {
      console.log('Updating homeowner profile ID...');
      const { data: updatedHomeownerProfile, error: homeownerProfileUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          id: homeownerAuthUser.id,
          first_name: 'John',
          last_name: 'Doe',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'homeowner@nexxus.com')
        .select()
        .single();

      if (homeownerProfileUpdateError) {
        console.error('Error updating homeowner profile:', homeownerProfileUpdateError);
      } else {
        homeownerProfileResult = updatedHomeownerProfile;
      }
    }

    // Step 7: Create or update cleaner profile
    if (!cleanerAuthUser) {
      return NextResponse.json({
        success: false,
        error: 'Cleaner auth user is missing after creation/update',
        step: 'cleaner_profile_setup'
      });
    }

    const cleanerProfile = currentProfiles?.find(p => p.email === 'cleaner@nexxus.com');
    let cleanerProfileResult;

    if (!cleanerProfile) {
      console.log('Creating cleaner profile...');
      const { data: newCleanerProfile, error: cleanerProfileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: cleanerAuthUser.id,
          email: 'cleaner@nexxus.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'cleaner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (cleanerProfileError) {
        console.error('Error creating cleaner profile:', cleanerProfileError);
      } else {
        cleanerProfileResult = newCleanerProfile;
      }
    } else {
      console.log('Updating cleaner profile ID...');
      const { data: updatedCleanerProfile, error: cleanerProfileUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          id: cleanerAuthUser.id,
          first_name: 'Jane',
          last_name: 'Smith',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'cleaner@nexxus.com')
        .select()
        .single();

      if (cleanerProfileUpdateError) {
        console.error('Error updating cleaner profile:', cleanerProfileUpdateError);
      } else {
        cleanerProfileResult = updatedCleanerProfile;
      }
    }

    // Step 8: Final verification
    const { data: finalUsers, error: finalUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const { data: finalProfiles, error: finalProfilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    return NextResponse.json({
      success: true,
      message: 'Successfully created missing auth users and synchronized profiles!',
      results: {
        homeowner: {
          authUserId: homeownerAuthUser.id,
          email: homeownerAuthUser.email,
          authUserCreated: !homeownerExists,
          profileResult: homeownerProfileResult
        },
        cleaner: {
          authUserId: cleanerAuthUser.id,
          email: cleanerAuthUser.email,
          authUserCreated: !cleanerExists,
          profileResult: cleanerProfileResult
        }
      },
      verification: {
        totalAuthUsers: finalUsers?.users.length || 0,
        totalProfiles: finalProfiles?.length || 0,
        authUsers: finalUsers?.users.map(u => ({ 
          id: u.id, 
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })) || [],
        profiles: finalProfiles || []
      },
      testCredentials: {
        homeowner: {
          email: 'homeowner@nexxus.com',
          password: 'Homeowner123!'
        },
        cleaner: {
          email: 'cleaner@nexxus.com',
          password: 'Cleaner123!'
        },
        admin: {
          email: 'admin@nexxus.com',
          password: 'Admin123!'
        }
      }
    });

  } catch (error) {
    console.error('Create missing auth users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
