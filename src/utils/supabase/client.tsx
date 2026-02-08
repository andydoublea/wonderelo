import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a single supabase client with localStorage persistence for session
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
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
