import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating missing auth users...');

    // Step 1: Get all existing auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to list auth users',
        details: authError.message
      });
    }

    // Step 2: Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role, first_name, last_name');

    if (profilesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get profiles',
        details: profilesError.message
      });
    }

    // Step 3: Find profiles without corresponding auth users
    const existingAuthEmails = new Set(authUsers.users.map(user => user.email));
    const missingAuthUsers = profiles?.filter(profile => 
      !existingAuthEmails.has(profile.email)
    ) || [];

    console.log('Missing auth users:', missingAuthUsers.map(p => p.email));

    const results = [];

    // Step 4: Create missing auth users
    for (const profile of missingAuthUsers) {
      try {
        // Determine password based on role
        let password = '';
        if (profile.email === 'homeowner@nexxus.com') {
          password = 'Homeowner123!';
        } else if (profile.email === 'cleaner@nexxus.com') {
          password = 'Cleaner123!';
        } else {
          password = 'TempPassword123!'; // fallback
        }

        console.log(`Creating auth user for ${profile.email} with ID ${profile.id}`);

        // Create auth user with the same ID as the profile
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: profile.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role
          }
        });

        if (createError) {
          console.error(`Failed to create auth user for ${profile.email}:`, createError);
          results.push({
            email: profile.email,
            success: false,
            error: createError.message,
            step: 'auth_creation'
          });
          continue;
        }

        if (!newAuthUser.user) {
          results.push({
            email: profile.email,
            success: false,
            error: 'No user returned from auth creation',
            step: 'auth_creation'
          });
          continue;
        }

        console.log(`Auth user created for ${profile.email}, new ID: ${newAuthUser.user.id}`);

        // Step 5: Update the profile to use the new auth user ID
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            id: newAuthUser.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('email', profile.email);

        if (updateError) {
          console.error(`Failed to update profile ID for ${profile.email}:`, updateError);
          results.push({
            email: profile.email,
            success: false,
            error: updateError.message,
            step: 'profile_update',
            authUserId: newAuthUser.user.id,
            oldProfileId: profile.id
          });
          continue;
        }

        results.push({
          email: profile.email,
          success: true,
          message: 'Auth user created and profile updated',
          authUserId: newAuthUser.user.id,
          oldProfileId: profile.id,
          role: profile.role
        });

      } catch (error) {
        console.error(`Unexpected error for ${profile.email}:`, error);
        results.push({
          email: profile.email,
          success: false,
          error: String(error),
          step: 'unexpected_error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount === totalCount,
      message: `${successCount}/${totalCount} missing auth users created successfully`,
      missingCount: missingAuthUsers.length,
      results,
      existingAuthUsers: authUsers.users.map(u => ({ id: u.id, email: u.email }))
    });

  } catch (error) {
    console.error('Create missing auth users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
