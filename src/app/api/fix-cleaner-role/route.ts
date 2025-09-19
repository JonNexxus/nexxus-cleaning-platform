import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Fixing cleaner role...');

    // Update the cleaner's role from 'homeowner' to 'cleaner'
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        role: 'cleaner',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'cleaner@nexxus.com')
      .select();

    if (error) {
      console.error('Error updating cleaner role:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update cleaner role',
        details: error.message
      });
    }

    console.log('Cleaner role updated successfully:', data);

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, role')
      .in('email', ['admin@nexxus.com', 'homeowner@nexxus.com', 'cleaner@nexxus.com']);

    if (verifyError) {
      return NextResponse.json({
        success: true,
        message: 'Cleaner role updated but verification failed',
        updateResult: data,
        verifyError: verifyError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cleaner role updated successfully!',
      updateResult: data,
      allUsers: verifyData
    });

  } catch (error) {
    console.error('Fix cleaner role error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
