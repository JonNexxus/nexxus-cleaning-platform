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
        // Check if user already exists by listing all users and finding by email
        const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);
        
        let userId: string;

        if (existingUser) {
          // User exists in auth
          userId = existingUser.id;
          results[user.key].exists = true;
          results[user.key].message = `Auth user already exists: ${user.email}`;
        } else {
          // Try to create user using a different approach - direct SQL via supabase
          try {
            const { data: sqlResult, error: sqlError } = await supabaseAdmin
              .rpc('create_auth_user', {
                user_email: user.email,
                user_password: user.password
              });

            if (sqlError) {
              // Fallback: try to create using the admin API with different options
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

              if (createError || !newUser.user) {
                results[user.key].message = `Failed to create user: ${createError?.message || 'No user returned'}`;
                continue;
              }

              userId = newUser.user.id;
              results[user.key].message = `Created auth user via admin API: ${user.email}`;
            } else {
              userId = sqlResult;
              results[user.key].message = `Created auth user via SQL: ${user.email}`;
            }
          } catch (fallbackError) {
            results[user.key].message = `All creation methods failed: ${fallbackError}`;
            continue;
          }
        }

        // Now handle the profile
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (existingProfile && existingProfile.role === user.role) {
          results[user.key].success = true;
          results[user.key].message += ` with correct profile role: ${user.role}`;
        } else {
          // Create or update profile
          const { error: upsertError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
              id: userId,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (upsertError) {
            results[user.key].message += ` but profile upsert failed: ${upsertError.message}`;
          } else {
            results[user.key].success = true;
            results[user.key].message += ` and profile created/updated with role: ${user.role}`;
          }
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
    console.error('Direct user creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
