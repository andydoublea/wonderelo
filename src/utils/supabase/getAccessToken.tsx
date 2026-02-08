/**
 * Get the current access token from Supabase session
 * @returns The access token or null if no session exists
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { supabase } = await import('./client');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session for access token:', error);
      return null;
    }
    
    if (!session?.access_token) {
      console.warn('No session found when getting access token');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Exception getting access token:', error);
    return null;
  }
}
