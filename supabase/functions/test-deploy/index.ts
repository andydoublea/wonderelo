/**
 * FORCE REDEPLOY TEST
 * Simple endpoint to verify backend deployment
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log('🚀 Backend starting - VERSION: FORCE-REDEPLOY-TEST');
console.log('⏰ Timestamp:', new Date().toISOString());

serve(async (req) => {
  const url = new URL(req.url);
  
  console.log('📨 Request received:', url.pathname);
  
  return new Response(JSON.stringify({
    status: 'Backend is LIVE',
    version: 'FORCE-REDEPLOY-TEST',
    timestamp: new Date().toISOString(),
    path: url.pathname,
    message: 'If you see this, new backend is deployed!'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});
