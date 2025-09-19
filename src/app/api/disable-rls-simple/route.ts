import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting simple RLS bypass and user creation...');

    // Since we can't execute raw SQL directly, let's work with what we have
    // The service role should already bypass RLS, so let's test user creation directly

    // Step 1: Clean up any existing test users
    console.log('Cleaning up existing test users...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError && existingUsers) {
      const testEmails = ['admin@nexxus.com', 'cleaner@nexxus.com', 'homeowner@nexxus.com'];
      
      for (const user of existingUsers.users) {
        if (user.email && testEmails.includes(user.email)) {
          console.log(`Deleting existing user: ${user.email}`);
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        }
      }
    }

    // Clean up existing profiles
    console.log('Cleaning up existing profiles...');
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .in('email', ['admin@nexxus.com', 'cleaner@nexxus.com', 'homeowner@nexxus.com']);

    await supabaseAdmin
      .from('cleaner_profiles')
      .delete()
      .in('id', (await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .in('email', ['cleaner@nexxus.com'])
      ).data?.map(p => p.id) || []);

    // Step 2: Test basic user creation (this should work with service role)
    console.log('Testing basic user creation...');
    
    const testEmail = `test-${Date.now()}@nexxus.com`;
    const { data: testUser, error: testUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!',
      email_confirm: true
    });

    let userCreationWorks = false;
    let triggerWorks = false;

    if (!testUserError && testUser) {
      console.log('✅ Basic user creation works!');
      userCreationWorks = true;

      // Check if trigger created profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.user.id)
        .single();

      if (!profileError && profile) {
        console.log('✅ Trigger created profile automatically!');
        triggerWorks = true;
      } else {
        console.log('❌ Trigger failed, will create profiles manually');
      }

      // Clean up test user
      await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);
    } else {
      console.log('❌ User creation failed:', testUserError?.message);
    }

    // Step 3: Create users with manual profile creation
    console.log('Creating test users with manual profile handling...');
    
    const usersToCreate = [
      { email: 'admin@nexxus.com', password: 'Admin123!', role: 'admin', firstName: 'Admin', lastName: 'User' },
      { email: 'cleaner@nexxus.com', password: 'Clean123!', role: 'cleaner', firstName: 'Test', lastName: 'Cleaner' },
      { email: 'homeowner@nexxus.com', password: 'Owner123!', role: 'homeowner', firstName: 'Test', lastName: 'Owner' }
    ];

    const createdUsers = [];
    const userErrors = [];

    for (const userData of usersToCreate) {
      try {
        console.log(`Creating ${userData.role} user: ${userData.email}`);

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role
          }
        });

        if (createError) {
          console.error(`❌ Failed to create ${userData.role}:`, createError.message);
          userErrors.push({ 
            role: userData.role, 
            email: userData.email, 
            error: createError.message,
            step: 'auth_creation'
          });
          continue;
        }

        console.log(`✅ Auth user created for ${userData.role}`);

        // Wait a moment for trigger to potentially run
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', newUser.user.id)
          .single();

        if (!existingProfile) {
          console.log(`Creating profile manually for ${userData.role}...`);
          
          // Create profile manually using service role (should bypass RLS)
          const { data: newProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              id: newUser.user.id,
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: userData.role
            })
            .select()
            .single();

          if (profileError) {
            console.error(`❌ Failed to create profile for ${userData.role}:`, profileError.message);
            userErrors.push({ 
              role: userData.role, 
              email: userData.email, 
              error: profileError.message,
              step: 'profile_creation'
            });
            // Clean up auth user
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            continue;
          }

          console.log(`✅ Profile created manually for ${userData.role}`);
        } else {
          console.log(`✅ Profile already exists for ${userData.role} (trigger worked)`);
        }

        // If cleaner, create cleaner profile
        if (userData.role === 'cleaner') {
          console.log('Creating cleaner profile...');
          
          const { data: cleanerProfile, error: cleanerError } = await supabaseAdmin
            .from('cleaner_profiles')
            .insert({
              id: newUser.user.id,
              bio: 'Professional cleaning service provider',
              experience_years: 3,
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
            console.error('❌ Failed to create cleaner profile:', cleanerError.message);
          } else {
            console.log('✅ Cleaner profile created successfully');
          }
        }

        createdUsers.push({
          role: userData.role,
          email: userData.email,
          id: newUser.user.id,
          password: userData.password
        });

      } catch (err) {
        console.error(`❌ Error creating ${userData.role}:`, err);
        userErrors.push({ 
          role: userData.role, 
          email: userData.email, 
          error: String(err),
          step: 'general_error'
        });
      }
    }

    // Step 4: Verify final state
    console.log('Verifying final state...');
    
    const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers();
    const { data: finalProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    const { data: cleanerProfiles } = await supabaseAdmin
      .from('cleaner_profiles')
      .select('*');

    // Test data access for each role
    console.log('Testing data access...');
    const accessTests = [];

    for (const user of createdUsers) {
      try {
        // Test if we can read the user's profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();

        accessTests.push({
          role: user.role,
          email: user.email,
          profileAccess: !profileError,
          profileData: profile ? { role: profile.role, name: `${profile.first_name} ${profile.last_name}` } : null
        });
      } catch (err) {
        accessTests.push({
          role: user.role,
          email: user.email,
          profileAccess: false,
          error: String(err)
        });
      }
    }

    return NextResponse.json({
      success: createdUsers.length > 0,
      message: `Successfully created ${createdUsers.length} users! ${userErrors.length > 0 ? `(${userErrors.length} errors)` : ''}`,
      summary: {
        userCreationWorks,
        triggerWorks,
        usersCreated: createdUsers.length,
        userCreationErrors: userErrors.length,
        totalAuthUsers: finalUsers?.users.length || 0,
        totalProfiles: finalProfiles?.length || 0,
        totalCleanerProfiles: cleanerProfiles?.length || 0
      },
      details: {
        createdUsers,
        userErrors,
        accessTests,
        finalState: {
          authUsers: finalUsers?.users.map(u => ({ 
            id: u.id.substring(0, 8) + '...', 
            email: u.email 
          })) || [],
          profiles: finalProfiles?.map(p => ({ 
            id: p.id.substring(0, 8) + '...', 
            email: p.email, 
            role: p.role 
          })) || [],
          cleanerProfiles: cleanerProfiles?.map(cp => ({
            id: cp.id.substring(0, 8) + '...',
            rating: cp.rating,
            hourlyRate: cp.hourly_rate
          })) || []
        }
      },
      credentials: createdUsers.map(u => ({
        role: u.role,
        email: u.email,
        password: u.password
      })),
      nextSteps: [
        'Test login with each user credential',
        'Verify dashboard access for each role',
        'Check that role-based navigation works',
        'Test data visibility for each user type'
      ]
    });

  } catch (error) {
    console.error('Simple RLS bypass error:', error);
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
