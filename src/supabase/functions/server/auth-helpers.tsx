/**
 * Authentication Helpers
 * Shared authentication utilities for route handlers
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getOrganizerById } from './db.ts';
import { errorLog, debugLog } from './debug.tsx';
// IMPORTANT: Create client inline to ensure env vars are read at runtime, not import time
function getClient() {
  const url = Deno.env.get('SUPABASE_URL') || "https://tpsgnnrkwgvgnsktuicr.supabase.co";
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(url, key);
}

// Admin middleware
export async function requireAdmin(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Check if user is admin
    const userProfile = await getOrganizerById(user.id);
    
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    // Store user in context for handlers
    c.set('user', user);
    c.set('userProfile', userProfile);
    
    await next();
  } catch (error) {
    errorLog('Error in admin middleware:', error);
    return c.json({ error: 'Authorization failed' }, 500);
  }
}

// Get authenticated user from request
export async function getAuthenticatedUser(c: any) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization required', status: 401 };
    }
    
    const token = authHeader.split(' ')[1];
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }
    
    return { user };
  } catch (error) {
    errorLog('Error getting authenticated user:', error);
    return { error: 'Authorization failed', status: 500 };
  }
}

// Verify user owns resource
export async function verifyResourceOwnership(userId: string, resourceUserId: string) {
  return userId === resourceUserId;
}

// Export getter for supabase client (for use in route handlers)
export function getSupabase() {
  return getClient();
}