import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Setting passwords using Supabase Admin SDK...');

    // These are the correct UIDs from the Supabase Auth dashboard
    const HOMEOWNER_AUTH_ID = 'd811e717-8807-4cfd-928f-eb827b67ce87';
    const CLEANER_AUTH_ID = '71f7a3c8-6072-4dae-87a8-210d51d2fca2';

    // First, let's list all users to verify they exist
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: listError.message
      });
    }

    console.log('Found users:', allUsers.users.map(u => ({ id: u.id, email: u.email })));

    // Find the specific users
    const homeownerUser = allUsers.users.find(u => u.id === HOMEOWNER_AUTH_ID);
    const cleanerUser = allUsers.users.find(u => u.id === CLEANER_AUTH_ID);

    if (!homeownerUser) {
      return NextResponse.json({
        success: false,
        error: 'Homeowner user not found',
        details: `No user found with ID: ${HOMEOWNER_AUTH_ID}`
      });
    }

    if (!cleanerUser) {
      return NextResponse.json({
        success: false,
        error: 'Cleaner user not found',
        details: `No user found with ID: ${CLEANER_AUTH_ID}`
      });
    }

    console.log('Found homeowner user:', { id: homeownerUser.id, email: homeownerUser.email });
    console.log('Found cleaner user:', { id: cleanerUser.id, email: cleanerUser.email });

    // Step 1: Set homeowner password
    console.log('Setting homeowner password...');
    const { data: homeownerUpdate, error: homeownerError } = await supabaseAdmin.auth.admin.updateUserById(
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

    if (homeownerError) {
      console.error('Error setting homeowner password:', homeownerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to set homeowner password',
        details: homeownerError.message,
        step: 'homeowner_password'
      });
    }

    console.log('Homeowner password set successfully');

    // Step 2: Set cleaner password
    console.log('Setting cleaner password...');
    const { data: cleanerUpdate, error: cleanerError } = await supabaseAdmin.auth.admin.updateUserById(
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

    if (cleanerError) {
      console.error('Error setting cleaner password:', cleanerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to set cleaner password',
        details: cleanerError.message,
        step: 'cleaner_password'
      });
    }

    console.log('Cleaner password set successfully');

    // Step 3: Verify profiles exist and match
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    return NextResponse.json({
      success: true,
      message: 'Passwords set successfully using Admin SDK!',
      results: {
        homeowner: {
          authUserId: HOMEOWNER_AUTH_ID,
          email: homeownerUser.email,
          passwordSet: true,
          userUpdate: homeownerUpdate
        },
        cleaner: {
          authUserId: CLEANER_AUTH_ID,
          email: cleanerUser.email,
          passwordSet: true,
          userUpdate: cleanerUpdate
        }
      },
      verification: {
        totalAuthUsers: allUsers.users.length,
        totalProfiles: profiles?.length || 0,
        profiles: profiles || [],
        authUsers: allUsers.users.map(u => ({ 
          id: u.id, 
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        }))
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
    console.error('Set passwords error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
