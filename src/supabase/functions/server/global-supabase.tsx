/**
 * ULTRA-SAFE SUPABASE CLIENT
 * Every line wrapped in try-catch with logging
 */

import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

let clientInstance: any = null;

export function getGlobalSupabaseClient() {
  try {
    console.log('🔵 getGlobalSupabaseClient() called');
    
    // Return cached if exists
    if (clientInstance) {
      console.log('✅ Returning cached client');
      return clientInstance;
    }
    
    console.log('🔧 No cached client, creating new one...');
    
    // Get URL from environment — NO hardcoded fallback
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    console.log('📍 URL:', SUPABASE_URL);
    
    // Try to get env var
    console.log('🔑 Getting SUPABASE_SERVICE_ROLE_KEY...');
    let SUPABASE_SERVICE_ROLE_KEY;
    
    try {
      SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      console.log('🔑 Result:', typeof SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');
    } catch (envError) {
      console.error('❌ Error getting env var:', envError);
      throw envError;
    }
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is empty or undefined!');
      
      // Try to list all env vars
      try {
        const allEnv = Object.keys(Deno.env.toObject());
        console.error('📋 Available env vars:', allEnv);
      } catch (e) {
        console.error('❌ Cannot list env vars:', e);
      }
      
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    
    console.log('✅ Key exists, length:', SUPABASE_SERVICE_ROLE_KEY.length);
    console.log('🏗️ Calling createClient()...');
    
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log('✅✅✅ Client created successfully!');
      return clientInstance;
    } catch (createError) {
      console.error('❌ createClient() failed:', createError);
      console.error('❌ Error type:', typeof createError);
      console.error('❌ Error message:', createError instanceof Error ? createError.message : String(createError));
      throw createError;
    }
    
  } catch (outerError) {
    console.error('💥💥💥 FATAL ERROR in getGlobalSupabaseClient:');
    console.error('Error:', outerError);
    console.error('Stack:', outerError instanceof Error ? outerError.stack : 'No stack');
    throw outerError;
  }
}
