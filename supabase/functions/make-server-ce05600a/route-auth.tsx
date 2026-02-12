/**
 * Authentication Routes
 * Handles signup, signin, profile management
 */

import { Hono } from 'npm:hono';
import * as dbModule from './db.ts';
import { getSupabase, getAuthenticatedUser } from './auth-helpers.tsx';
import { errorLog, debugLog } from './debug.tsx';

export function registerAuthRoutes(app: Hono) {
  
  // Check URL slug availability
  app.get('/make-server-ce05600a/check-slug/:slug', async (c) => {
    try {
      const slug = c.req.param('slug');
      const available = await dbModule.isSlugAvailable(slug);

      return c.json({ available });
    } catch (error) {
      errorLog('Error checking slug availability:', error);
      return c.json({ error: 'Failed to check slug availability' }, 500);
    }
  });

  // Check email availability
  app.get('/make-server-ce05600a/check-email/:email', async (c) => {
    try {
      const email = c.req.param('email');
      const normalizedEmail = email.toLowerCase().trim();
      
      const { data: existingUser } = await getSupabase().auth.admin.listUsers();
      const emailExists = existingUser?.users.some(u => u.email?.toLowerCase() === normalizedEmail);
      
      return c.json({ available: !emailExists });
    } catch (error) {
      errorLog('Error checking email availability:', error);
      return c.json({ error: 'Failed to check email availability' }, 500);
    }
  });

  // Sign up
  app.post('/make-server-ce05600a/signup', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password, organizerName, urlSlug } = body;
      
      if (!email || !password || !organizerName || !urlSlug) {
        return c.json({ error: 'Missing required fields' }, 400);
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (authError || !authData.user) {
        return c.json({ error: authError?.message || 'Failed to create user' }, 400);
      }
      
      const userId = authData.user.id;
      
      // Store user profile (slug uniqueness handled by DB constraint)
      await dbModule.createOrganizerProfile({
        userId,
        email,
        organizerName,
        urlSlug,
      });
      
      // Sign in to get access token
      const { data: signInData, error: signInError } = await getSupabase().auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError || !signInData.session) {
        return c.json({ error: 'User created but failed to sign in' }, 500);
      }
      
      return c.json({
        success: true,
        user: authData.user,
        accessToken: signInData.session.access_token,
        urlSlug
      });
      
    } catch (error) {
      errorLog('Error in signup:', error);
      return c.json({ error: 'Failed to sign up' }, 500);
    }
  });

  // Sign in
  app.post('/make-server-ce05600a/signin', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = body;
      
      if (!email || !password) {
        return c.json({ error: 'Email and password required' }, 400);
      }
      
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password
      });
      
      if (error || !data.session) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      // Get user profile
      const userProfile = await dbModule.getOrganizerById(data.user.id);
      
      return c.json({
        success: true,
        user: data.user,
        accessToken: data.session.access_token,
        urlSlug: userProfile?.urlSlug
      });
      
    } catch (error) {
      errorLog('Error in signin:', error);
      return c.json({ error: 'Failed to sign in' }, 500);
    }
  });

  // Get user profile
  app.get('/make-server-ce05600a/profile', async (c) => {
    const authResult = await getAuthenticatedUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    
    try {
      const userProfile = await dbModule.getOrganizerById(authResult.user.id);

      if (!userProfile) {
        errorLog(`Profile not found for user: ${authResult.user.id}`);
        return c.json({ error: 'Profile not found' }, 404);
      }

      return c.json({
        success: true,
        profile: userProfile
      });
      
    } catch (error) {
      errorLog('Error getting profile:', error);
      return c.json({ 
        error: 'Failed to get profile',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // Update user profile
  app.put('/make-server-ce05600a/profile', async (c) => {
    const authResult = await getAuthenticatedUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    
    try {
      const body = await c.req.json();
      const { organizerName, urlSlug, phone, website, description, profileImageUrl } = body;
      
      const currentProfile = await dbModule.getOrganizerById(authResult.user.id);

      if (!currentProfile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      // If URL slug changed, check availability
      if (urlSlug && urlSlug !== currentProfile.urlSlug) {
        const slugAvailable = await dbModule.isSlugAvailable(urlSlug, authResult.user.id);
        if (!slugAvailable) {
          return c.json({ error: 'URL slug already taken' }, 400);
        }
      }

      // Update profile (slug uniqueness handled by DB constraint)
      const updatedProfile = await dbModule.updateOrganizerProfile(authResult.user.id, {
        organizerName: organizerName || currentProfile.organizerName,
        urlSlug: urlSlug || currentProfile.urlSlug,
        phone: phone !== undefined ? phone : currentProfile.phone,
        website: website !== undefined ? website : currentProfile.website,
        description: description !== undefined ? description : currentProfile.description,
        profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : currentProfile.profileImageUrl,
      });

      return c.json({
        success: true,
        profile: updatedProfile
      });
      
    } catch (error) {
      errorLog('Error updating profile:', error);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  });

  debugLog('✅ Auth routes registered');
}