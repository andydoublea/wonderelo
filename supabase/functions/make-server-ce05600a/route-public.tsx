/**
 * Public Routes (STUB)
 * Public pages and data access
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_wrapper.tsx';
import { debugLog } from './debug.tsx';

export function registerPublicRoutes(app: Hono) {
  // GET /public/user/:slug - Get public organizer data
  app.get('/make-server-ce05600a/public/user/:slug', async (c) => {
    const slug = c.req.param('slug');
    const userId = await kv.get(`slug_mapping:${slug}`);
    
    if (!userId) {
      return c.json({ error: 'Organizer not found' }, 404);
    }
    
    const profile = await kv.get(`user_profile:${userId}`);
    
    return c.json({
      success: true,
      organizerName: profile?.organizerName,
      urlSlug: profile?.urlSlug,
      profileImageUrl: profile?.profileImageUrl,
      website: profile?.website,
      description: profile?.description
    });
  });
  
  debugLog('✅ Public routes registered (stub)');
}
