/**
 * Session Routes (STUB)
 * CRUD operations for networking sessions
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_wrapper.tsx';
import { getAuthenticatedUser } from './auth-helpers.tsx';
import { debugLog } from './debug.tsx';

export function registerSessionRoutes(app: Hono) {
  // GET /sessions - List user's sessions
  app.get('/make-server-ce05600a/sessions', async (c) => {
    const authResult = await getAuthenticatedUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    
    // getByPrefix returns an array of values
    const sessions = await kv.getByPrefix(`user_sessions:${authResult.user.id}:`);
    
    return c.json({ success: true, sessions });
  });
  
  debugLog('✅ Session routes registered (stub)');
}