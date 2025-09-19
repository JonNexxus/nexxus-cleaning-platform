import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting admin user fix...');

    // Step 1: List all current auth users to find admin
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

    // Step 2: Find or create admin auth user
    let adminUser = currentUsers.users.find(u => u.email === 'admin@nexxus.com');
    
    if (!adminUser) {
      console.log('Admin auth user not found, creating...');
      const { data: newAdminAuth, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@nexxus.com',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        }
      });

      if (adminAuthError) {
        console.error('Error creating admin auth user:', adminAuthError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create admin auth user',
          details: adminAuthError.message
        });
      }

      adminUser = newAdminAuth.user;
      console.log('Admin auth user created:', { id: adminUser.id, email: adminUser.email });
    } else {
      console.log('Admin auth user found:', { id: adminUser.id, email: adminUser.email });
      
      // Update password and metadata to ensure consistency
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
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

      if (updateError) {
        console.error('Error updating admin user:', updateError);
      } else {
        console.log('Admin auth user updated successfully');
      }
    }

    // Step 3: Check if admin profile exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking admin profile:', profileCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check admin profile',
        details: profileCheckError.message
      });
    }

    // Step 4: Create or update admin profile
    if (!existingProfile) {
      console.log('Creating admin profile...');
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: adminUser.id,
          email: 'admin@nexxus.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create admin profile',
          details: profileError.message
        });
      }

      console.log('Admin profile created:', newProfile);
    } else {
      console.log('Admin profile exists, updating...');
      const { data: updatedProfile, error: updateProfileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          email: 'admin@nexxus.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id)
        .select()
        .single();

      if (updateProfileError) {
        console.error('Error updating admin profile:', updateProfileError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update admin profile',
          details: updateProfileError.message
        });
      }

      console.log('Admin profile updated:', updatedProfile);
    }

    // Step 5: Final verification
    const { data: finalProfile, error: finalError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (finalError) {
      console.error('Error verifying final profile:', finalError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify admin profile',
        details: finalError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user fixed successfully!',
      adminUser: {
        authId: adminUser.id,
        email: adminUser.email,
        profile: finalProfile
      },
      credentials: {
        email: 'admin@nexxus.com',
        password: 'Admin123!'
      }
    });

  } catch (error) {
    console.error('Fix admin user error:', error);
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
