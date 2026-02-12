/**
 * Public Routes (STUB)
 * Public pages and data access
 */

import { Hono } from 'npm:hono';
import { getOrganizerBySlug } from './db.ts';
import { debugLog } from './debug.tsx';

export function registerPublicRoutes(app: Hono) {
  // GET /public/user/:slug - Get public organizer data
  app.get('/make-server-ce05600a/public/user/:slug', async (c) => {
    const slug = c.req.param('slug');
    const profile = await getOrganizerBySlug(slug);

    if (!profile) {
      return c.json({ error: 'Organizer not found' }, 404);
    }

    return c.json({
      success: true,
      organizerName: profile.organizerName,
      urlSlug: profile.urlSlug,
      profileImageUrl: profile.profileImageUrl,
      website: profile.website,
      description: profile.description
    });
  });
  
  debugLog('✅ Public routes registered (stub)');
}
