/**
 * Authentication Routes
 * Handles signup, signin, profile management, and email change
 */

import { Hono } from 'npm:hono';
import * as kv from '../kv_wrapper.tsx';
import * as bcrypt from 'npm:bcryptjs@2.4.3';
import { supabase, getAuthenticatedUser } from '../utils/auth-helpers.tsx';
import { errorLog, debugLog } from '../debug.tsx';

export function registerAuthRoutes(app: Hono) {
  
  // Check URL slug availability
  app.get('/make-server-ce05600a/check-slug/:slug', async (c) => {
    try {
      const slug = c.req.param('slug');
      const existingMapping = await kv.get(`slug_mapping:${slug}`);
      
      return c.json({ available: !existingMapping });
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
      
      const { data: existingUser } = await supabase.auth.admin.listUsers();
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
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (authError || !authData.user) {
        return c.json({ error: authError?.message || 'Failed to create user' }, 400);
      }
      
      const userId = authData.user.id;
      
      // Store user profile
      await kv.set(`user_profile:${userId}`, {
        userId,
        email,
        organizerName,
        urlSlug,
        role: 'organizer',
        createdAt: new Date().toISOString()
      });
      
      // Store slug mapping
      await kv.set(`slug_mapping:${urlSlug}`, userId);
      
      // Sign in to get access token
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error || !data.session) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      // Get user profile
      const userProfile = await kv.get(`user_profile:${data.user.id}`);
      
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
      const userProfile = await kv.get(`user_profile:${authResult.user.id}`);
      
      if (!userProfile) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      
      return c.json({
        success: true,
        profile: userProfile
      });
      
    } catch (error) {
      errorLog('Error getting profile:', error);
      return c.json({ error: 'Failed to get profile' }, 500);
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
      
      const currentProfile = await kv.get(`user_profile:${authResult.user.id}`);
      
      if (!currentProfile) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      
      // If URL slug changed, update mapping
      if (urlSlug && urlSlug !== currentProfile.urlSlug) {
        // Check if new slug is available
        const existingMapping = await kv.get(`slug_mapping:${urlSlug}`);
        if (existingMapping && existingMapping !== authResult.user.id) {
          return c.json({ error: 'URL slug already taken' }, 400);
        }
        
        // Delete old mapping
        await kv.del(`slug_mapping:${currentProfile.urlSlug}`);
        
        // Create new mapping
        await kv.set(`slug_mapping:${urlSlug}`, authResult.user.id);
      }
      
      // Update profile
      const updatedProfile = {
        ...currentProfile,
        organizerName: organizerName || currentProfile.organizerName,
        urlSlug: urlSlug || currentProfile.urlSlug,
        phone: phone !== undefined ? phone : currentProfile.phone,
        website: website !== undefined ? website : currentProfile.website,
        description: description !== undefined ? description : currentProfile.description,
        profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : currentProfile.profileImageUrl,
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`user_profile:${authResult.user.id}`, updatedProfile);
      
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
