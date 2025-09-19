import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting cleanup and recreation of users...');

    // Step 1: List all current auth users
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

    // Step 2: Delete existing homeowner and cleaner auth users if they exist
    const homeownerUser = currentUsers.users.find(u => u.email === 'homeowner@nexxus.com');
    const cleanerUser = currentUsers.users.find(u => u.email === 'cleaner@nexxus.com');

    if (homeownerUser) {
      console.log('Deleting existing homeowner auth user...');
      const { error: deleteHomeownerError } = await supabaseAdmin.auth.admin.deleteUser(homeownerUser.id);
      if (deleteHomeownerError) {
        console.error('Error deleting homeowner user:', deleteHomeownerError);
      } else {
        console.log('Homeowner auth user deleted successfully');
      }
    }

    if (cleanerUser) {
      console.log('Deleting existing cleaner auth user...');
      const { error: deleteCleanerError } = await supabaseAdmin.auth.admin.deleteUser(cleanerUser.id);
      if (deleteCleanerError) {
        console.error('Error deleting cleaner user:', deleteCleanerError);
      } else {
        console.log('Cleaner auth user deleted successfully');
      }
    }

    // Step 3: Delete existing profiles for homeowner and cleaner
    console.log('Deleting existing profiles...');
    const { error: deleteProfilesError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .in('email', ['homeowner@nexxus.com', 'cleaner@nexxus.com']);

    if (deleteProfilesError) {
      console.error('Error deleting profiles:', deleteProfilesError);
    } else {
      console.log('Existing profiles deleted successfully');
    }

    // Step 4: Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Create fresh homeowner auth user
    console.log('Creating fresh homeowner auth user...');
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
        step: 'homeowner_creation'
      });
    }

    console.log('Homeowner auth user created:', { id: homeownerAuth.user.id, email: homeownerAuth.user.email });

    // Step 6: Create fresh cleaner auth user
    console.log('Creating fresh cleaner auth user...');
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
        step: 'cleaner_creation'
      });
    }

    console.log('Cleaner auth user created:', { id: cleanerAuth.user.id, email: cleanerAuth.user.email });

    // Step 7: Create homeowner profile
    console.log('Creating homeowner profile...');
    const { data: homeownerProfile, error: homeownerProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: homeownerAuth.user.id,
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create homeowner profile',
        details: homeownerProfileError.message,
        step: 'homeowner_profile_creation'
      });
    }

    // Step 8: Create cleaner profile
    console.log('Creating cleaner profile...');
    const { data: cleanerProfile, error: cleanerProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: cleanerAuth.user.id,
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create cleaner profile',
        details: cleanerProfileError.message,
        step: 'cleaner_profile_creation'
      });
    }

    // Step 9: Update admin user password for consistency
    const adminUser = currentUsers.users.find(u => u.email === 'admin@nexxus.com');
    if (adminUser) {
      console.log('Updating admin password...');
      const { error: adminUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        {
          password: 'Admin123!',
          user_metadata: {
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        }
      );

      if (adminUpdateError) {
        console.error('Error updating admin password:', adminUpdateError);
      }
    }

    // Step 10: Final verification
    const { data: finalUsers, error: finalUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const { data: finalProfiles, error: finalProfilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up and recreated complete authentication system!',
      results: {
        homeowner: {
          authUserId: homeownerAuth.user.id,
          email: homeownerAuth.user.email,
          profile: homeownerProfile
        },
        cleaner: {
          authUserId: cleanerAuth.user.id,
          email: cleanerAuth.user.email,
          profile: cleanerProfile
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
    console.error('Cleanup and recreate users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
