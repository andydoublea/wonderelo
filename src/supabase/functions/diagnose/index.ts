/**
 * STANDALONE DIAGNOSTIC ENDPOINT
 * This file imports NOTHING and tests EVERYTHING
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

serve(async (req) => {
  const url = new URL(req.url);
  
  // Only respond to /diagnose path
  if (!url.pathname.includes('/diagnose')) {
    return new Response('Not found', { status: 404 });
  }

  console.log('=== DIAGNOSTIC START ===');
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // CHECK 1: Deno.env exists
  try {
    diagnostics.checks.push({
      name: 'Deno.env exists',
      result: typeof Deno !== 'undefined' && typeof Deno.env !== 'undefined',
      status: 'ok'
    });
  } catch (e) {
    diagnostics.checks.push({
      name: 'Deno.env exists',
      result: false,
      status: 'error',
      error: String(e)
    });
  }

  // CHECK 2: Get SUPABASE_URL
  try {
    const url = Deno.env.get('SUPABASE_URL');
    diagnostics.checks.push({
      name: 'SUPABASE_URL',
      exists: !!url,
      type: typeof url,
      length: url?.length || 0,
      preview: url ? url.substring(0, 30) + '...' : 'UNDEFINED',
      status: url ? 'ok' : 'missing'
    });
  } catch (e) {
    diagnostics.checks.push({
      name: 'SUPABASE_URL',
      status: 'error',
      error: String(e)
    });
  }

  // CHECK 3: Get SUPABASE_SERVICE_ROLE_KEY
  try {
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    diagnostics.checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      exists: !!key,
      type: typeof key,
      length: key?.length || 0,
      status: key ? 'ok' : 'missing'
    });
  } catch (e) {
    diagnostics.checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'error',
      error: String(e)
    });
  }

  // CHECK 4: List ALL env vars
  try {
    const allEnv = Deno.env.toObject();
    const keys = Object.keys(allEnv);
    diagnostics.checks.push({
      name: 'All environment variables',
      count: keys.length,
      keys: keys,
      status: 'ok'
    });
  } catch (e) {
    diagnostics.checks.push({
      name: 'All environment variables',
      status: 'error',
      error: String(e)
    });
  }

  // CHECK 5: Try to create Supabase client
  try {
    const hardcodedUrl = Deno.env.get('SUPABASE_URL') || "https://tpsgnnrkwgvgnsktuicr.supabase.co";
    const envKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!envKey) {
      diagnostics.checks.push({
        name: 'Create Supabase client',
        status: 'failed',
        reason: 'SUPABASE_SERVICE_ROLE_KEY is not set',
        solution: 'Go to Supabase Dashboard → Settings → Edge Functions → Add Secret: SUPABASE_SERVICE_ROLE_KEY'
      });
    } else {
      const client = createClient(hardcodedUrl, envKey);
      diagnostics.checks.push({
        name: 'Create Supabase client',
        status: 'success',
        result: 'Client created successfully'
      });
    }
  } catch (e) {
    diagnostics.checks.push({
      name: 'Create Supabase client',
      status: 'error',
      error: String(e)
    });
  }

  // Final summary
  const hasUrl = diagnostics.checks.find((c: any) => c.name === 'SUPABASE_URL')?.exists;
  const hasKey = diagnostics.checks.find((c: any) => c.name === 'SUPABASE_SERVICE_ROLE_KEY')?.exists;
  
  diagnostics.summary = {
    ready: hasUrl && hasKey,
    missingVars: [
      !hasUrl && 'SUPABASE_URL',
      !hasKey && 'SUPABASE_SERVICE_ROLE_KEY'
    ].filter(Boolean),
    instruction: !hasKey ? 
      'REQUIRED: Set SUPABASE_SERVICE_ROLE_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets' : 
      'All environment variables are set correctly'
  };

  console.log('=== DIAGNOSTIC RESULTS ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  return new Response(JSON.stringify(diagnostics, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});
