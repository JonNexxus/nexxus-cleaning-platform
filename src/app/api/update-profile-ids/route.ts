import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Updating profile IDs to match existing auth users...');

    // These are the correct UIDs from the Supabase Auth dashboard
    const HOMEOWNER_AUTH_ID = 'd811e717-8807-4cfd-928f-eb827b67ce87';
    const CLEANER_AUTH_ID = '71f7a3c8-6072-4dae-87a8-210d51d2fca2';

    // Step 1: Get current profiles
    const { data: currentProfiles, error: currentError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    if (currentError) {
      console.error('Error getting current profiles:', currentError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get current profiles',
        details: currentError.message
      });
    }

    console.log('Current profiles:', currentProfiles);

    // Step 2: Update homeowner profile ID
    console.log('Updating homeowner profile...');
    
    const { data: homeownerUpdate, error: homeownerError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        id: HOMEOWNER_AUTH_ID,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'homeowner@nexxus.com')
      .select();

    if (homeownerError) {
      console.error('Error updating homeowner profile:', homeownerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update homeowner profile',
        details: homeownerError.message,
        step: 'homeowner_profile_update'
      });
    }

    console.log('Homeowner profile updated:', homeownerUpdate);

    // Step 3: Update cleaner profile ID
    console.log('Updating cleaner profile...');
    
    const { data: cleanerUpdate, error: cleanerError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        id: CLEANER_AUTH_ID,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'cleaner@nexxus.com')
      .select();

    if (cleanerError) {
      console.error('Error updating cleaner profile:', cleanerError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update cleaner profile',
        details: cleanerError.message,
        step: 'cleaner_profile_update'
      });
    }

    console.log('Cleaner profile updated:', cleanerUpdate);

    // Step 4: Verify the updates
    const { data: updatedProfiles, error: verifyError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('email');

    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
    }

    // Step 5: Get auth users for comparison
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    return NextResponse.json({
      success: true,
      message: 'Successfully updated profile IDs to match existing auth users!',
      results: {
        homeowner: {
          authUserId: HOMEOWNER_AUTH_ID,
          email: 'homeowner@nexxus.com',
          profileUpdated: homeownerUpdate?.[0] || null
        },
        cleaner: {
          authUserId: CLEANER_AUTH_ID,
          email: 'cleaner@nexxus.com',
          profileUpdated: cleanerUpdate?.[0] || null
        }
      },
      verification: {
        beforeUpdate: currentProfiles,
        afterUpdate: updatedProfiles,
        authUsers: authData?.users.map(u => ({ 
          id: u.id, 
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })) || []
      },
      nextSteps: [
        "1. Go to your Supabase dashboard",
        "2. Navigate to Authentication > Users",
        "3. Find homeowner@nexxus.com and click the three dots > Reset Password",
        "4. Set password to: Homeowner123!",
        "5. Find cleaner@nexxus.com and click the three dots > Reset Password", 
        "6. Set password to: Cleaner123!",
        "7. Test login functionality"
      ]
    });

  } catch (error) {
    console.error('Update profile IDs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
