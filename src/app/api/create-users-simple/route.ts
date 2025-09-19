import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const results = [];

    // Users to create
    const usersToCreate = [
      {
        email: 'homeowner@nexxus.com',
        password: 'Homeowner123!',
        role: 'homeowner',
        firstName: 'John',
        lastName: 'Homeowner'
      },
      {
        email: 'cleaner@nexxus.com',
        password: 'Cleaner123!',
        role: 'cleaner',
        firstName: 'Jane',
        lastName: 'Cleaner'
      }
    ];

    for (const user of usersToCreate) {
      try {
        console.log(`Creating user: ${user.email}`);

        // Step 1: Create the auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role
          }
        });

        if (authError) {
          console.error(`Auth creation failed for ${user.email}:`, authError);
          results.push({
            email: user.email,
            success: false,
            step: 'auth_creation',
            error: authError.message
          });
          continue;
        }

        if (!authUser.user) {
          results.push({
            email: user.email,
            success: false,
            step: 'auth_creation',
            error: 'No user returned from auth creation'
          });
          continue;
        }

        console.log(`Auth user created for ${user.email}, ID: ${authUser.user.id}`);

        // Step 2: Create the profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: authUser.user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error(`Profile creation failed for ${user.email}:`, profileError);
          results.push({
            email: user.email,
            success: false,
            step: 'profile_creation',
            error: profileError.message,
            userId: authUser.user.id
          });
          continue;
        }

        console.log(`Profile created for ${user.email}`);

        results.push({
          email: user.email,
          success: true,
          userId: authUser.user.id,
          message: 'User and profile created successfully'
        });

      } catch (error) {
        console.error(`Unexpected error creating ${user.email}:`, error);
        results.push({
          email: user.email,
          success: false,
          step: 'unexpected_error',
          error: String(error)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount === totalCount,
      message: `${successCount}/${totalCount} users created successfully`,
      results
    });

  } catch (error) {
    console.error('Create users simple error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
