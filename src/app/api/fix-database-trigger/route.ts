import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Fixing database trigger...');

    // Step 1: Drop the existing problematic trigger
    console.log('Dropping existing trigger...');
    const dropTriggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `;

    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql: dropTriggerSQL
    });

    if (dropError) {
      console.log('Drop trigger error (may be expected):', dropError.message);
    }

    // Step 2: Drop the existing function
    console.log('Dropping existing function...');
    const dropFunctionSQL = `
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `;

    const { error: dropFunctionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: dropFunctionSQL
    });

    if (dropFunctionError) {
      console.log('Drop function error (may be expected):', dropFunctionError.message);
    }

    // Step 3: Create a new function that bypasses RLS
    console.log('Creating new trigger function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Use SECURITY DEFINER to bypass RLS
        INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')::user_role
        );
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the user creation
          RAISE WARNING 'Failed to create user profile: %', SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: createFunctionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (createFunctionError) {
      console.error('Create function error:', createFunctionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create new trigger function',
        details: createFunctionError.message,
        step: 'create_function'
      });
    }

    // Step 4: Recreate the trigger
    console.log('Creating new trigger...');
    const createTriggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: createTriggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTriggerSQL
    });

    if (createTriggerError) {
      console.error('Create trigger error:', createTriggerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create new trigger',
        details: createTriggerError.message,
        step: 'create_trigger'
      });
    }

    // Step 5: Test the fix by creating a test user
    console.log('Testing the fix with a test user...');
    const testEmail = `test-${Date.now()}@nexxus.com`;
    
    const { data: testUser, error: testError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'homeowner'
      }
    });

    if (testError) {
      console.error('Test user creation failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Trigger fix failed - test user creation failed',
        details: testError.message,
        step: 'test_user_creation'
      });
    }

    console.log('Test user created successfully:', testUser.user.id);

    // Step 6: Verify the profile was created
    const { data: testProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (profileError) {
      console.error('Test profile not found:', profileError);
      // Clean up test user
      await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);
      return NextResponse.json({
        success: false,
        error: 'Trigger fix failed - profile not created',
        details: profileError.message,
        step: 'test_profile_verification'
      });
    }

    // Clean up test user
    console.log('Cleaning up test user...');
    await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);

    return NextResponse.json({
      success: true,
      message: 'Database trigger fixed successfully!',
      details: {
        triggerDropped: !dropError,
        functionDropped: !dropFunctionError,
        functionCreated: !createFunctionError,
        triggerCreated: !createTriggerError,
        testUserCreated: true,
        testProfileCreated: !!testProfile,
        testUserCleaned: true
      },
      testResults: {
        testEmail,
        testUserId: testUser.user.id,
        testProfile
      }
    });

  } catch (error) {
    console.error('Fix database trigger error:', error);
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
