/**
 * Test Routes
 * Health check and deployment test endpoints
 */

import { Hono } from 'npm:hono';
import { emergencyTest } from './emergency-test.tsx';

export function registerTestRoutes(app: Hono) {
  // Health check endpoint
  app.get('/make-server-ce05600a/test', async (c) => {
    return c.json({ 
      message: 'Backend is working!', 
      timestamp: new Date().toISOString(),
      version: '6.33.0-emergency-debug',
      resendDomain: 'delivered@resend.dev'
    });
  });

  // Deployment test endpoint
  app.get('/make-server-ce05600a/deployment-test', async (c) => {
    return c.json({ 
      message: 'Deployment test successful',
      timestamp: new Date().toISOString(),
      version: '6.33.0-emergency-debug'
    });
  });

  // EMERGENCY: Direct test
  app.get('/make-server-ce05600a/emergency-test', async (c) => {
    const result = await emergencyTest();
    return c.json(result);
  });

  // DEBUG: Check environment variables
  app.get('/make-server-ce05600a/debug/env-check', async (c) => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Get all env var names (not values for security)
    const allEnvKeys = Object.keys(Deno.env.toObject());
    
    return c.json({
      hasSupabaseUrl: !!url,
      hasSupabaseKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
      urlPrefix: url ? url.substring(0, 20) + '...' : 'MISSING',
      allEnvVarKeys: allEnvKeys,
      totalEnvVars: allEnvKeys.length,
      version: '6.33.0-emergency-debug'
    });
  });
}