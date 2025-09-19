import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing Supabase admin connection...');

    // Test 1: List existing users
    console.log('Test 1: Listing existing users...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: listError.message,
        test: 'list_users'
      });
    }

    console.log(`Found ${users.users.length} existing users`);

    // Test 2: Check database connection
    console.log('Test 2: Testing database connection...');
    const { data: profiles, error: dbError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (dbError) {
      console.error('Error querying database:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query database',
        details: dbError.message,
        test: 'database_query'
      });
    }

    // Test 3: Try creating a user with a unique email
    const testEmail = `test-${Date.now()}@nexxus.com`;
    console.log(`Test 3: Creating test user with email: ${testEmail}`);
    
    const { data: testUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'test'
      }
    });

    if (createError) {
      console.error('Error creating test user:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test user',
        details: createError.message,
        test: 'user_creation',
        testEmail
      });
    }

    console.log('Test user created successfully:', testUser.user.id);

    // Clean up the test user
    console.log('Cleaning up test user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);
    if (deleteError) {
      console.log('Warning: Could not delete test user:', deleteError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'All admin connection tests passed!',
      results: {
        userCount: users.users.length,
        profileCount: profiles?.length || 0,
        testUserCreated: true,
        testUserDeleted: !deleteError
      }
    });

  } catch (error) {
    console.error('Admin connection test error:', error);
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
