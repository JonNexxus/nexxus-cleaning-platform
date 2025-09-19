import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Basic security check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const results = {
      homeowner: { success: false, message: '', exists: false },
      cleaner: { success: false, message: '', exists: false }
    };

    // Users to create
    const usersToCreate = [
      {
        email: 'homeowner@nexxus.com',
        password: 'Homeowner123!',
        role: 'homeowner',
        firstName: 'John',
        lastName: 'Homeowner',
        key: 'homeowner' as const
      },
      {
        email: 'cleaner@nexxus.com',
        password: 'Cleaner123!',
        role: 'cleaner',
        firstName: 'Jane',
        lastName: 'Cleaner',
        key: 'cleaner' as const
      }
    ];

    for (const user of usersToCreate) {
      try {
        // First check if user already exists by trying to list users with email filter
        const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);
        
        if (existingUser) {
          results[user.key].exists = true;
          results[user.key].message = `User already exists: ${user.email}`;
          
          // Check if profile exists and has correct role
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', existingUser.id)
            .single();

          if (profile && profile.role === user.role) {
            results[user.key].success = true;
            results[user.key].message += ` with correct role: ${user.role}`;
          } else {
            // Update or create profile with correct role
            const { error: upsertError } = await supabaseAdmin
              .from('user_profiles')
              .upsert({
                id: existingUser.id,
                email: user.email,
                first_name: user.firstName,
                last_name: user.lastName,
                role: user.role,
                updated_at: new Date().toISOString()
              });

            if (upsertError) {
              results[user.key].message += ` but profile update failed: ${upsertError.message}`;
            } else {
              results[user.key].success = true;
              results[user.key].message += ` and profile updated to role: ${user.role}`;
            }
          }
          continue;
        }

        // User doesn't exist, create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role
          }
        });

        if (createError) {
          results[user.key].message = `Failed to create user: ${createError.message}`;
          continue;
        }

        if (!newUser.user) {
          results[user.key].message = 'User creation returned no user object';
          continue;
        }

        // Create user profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: newUser.user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          results[user.key].message = `User created but profile failed: ${profileError.message}`;
        } else {
          results[user.key].success = true;
          results[user.key].message = `Successfully created user and profile for ${user.email}`;
        }

      } catch (error) {
        results[user.key].message = `Unexpected error: ${error}`;
      }
    }

    // Check final status
    const allSuccess = results.homeowner.success && results.cleaner.success;
    
    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess ? 'All users created/verified successfully!' : 'Some users had issues'
    });

  } catch (error) {
    console.error('Admin user creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
