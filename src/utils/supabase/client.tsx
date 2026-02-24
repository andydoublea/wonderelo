import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publicAnonKey } from './info';

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
