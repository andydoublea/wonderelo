import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publicAnonKey, projectId } from './info';

// Guard: if Supabase project changed (e.g. staging↔production deploy), clear stale auth
// This prevents blank pages caused by cached tokens for a different Supabase project.
if (typeof window !== 'undefined') {
  const STORED_PROJECT_KEY = 'wonderelo_supabase_project';
  const storedProject = localStorage.getItem(STORED_PROJECT_KEY);
  if (storedProject && storedProject !== projectId) {
    console.log(`🔄 Supabase project changed (${storedProject} → ${projectId}), clearing stale auth`);
    localStorage.removeItem('oliwonder-supabase-auth');
    localStorage.removeItem('oliwonder_current_user');
    localStorage.removeItem('oliwonder_authenticated');
    localStorage.removeItem('oliwonder_event_slug');
    localStorage.removeItem('oliwonder_service_type');
    localStorage.removeItem('supabase_access_token');
  }
  localStorage.setItem(STORED_PROJECT_KEY, projectId);
}

// Create a single supabase client with localStorage persistence for session
export const supabase = createClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'oliwonder-supabase-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true  // Enable to handle password recovery links
    }
  }
);
