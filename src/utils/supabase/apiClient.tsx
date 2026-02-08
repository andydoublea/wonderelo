import { projectId } from './info';

/**
 * Authenticated API client that automatically refreshes expired tokens
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<Response> {
  // Get current access token
  let currentToken = accessToken || localStorage.getItem('supabase_access_token') || '';

  // Function to make the actual request
  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a${endpoint}`,
      {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  // Try the request with current token
  let response = await makeRequest(currentToken);

  // If we get 401, try to refresh the token
  if (response.status === 401) {
    console.log('⚠️ Access token expired (401), attempting to refresh...');
    
    try {
      const { supabase } = await import('./client');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session && !error) {
        console.log('✅ Token refreshed successfully');
        
        // Update the token
        currentToken = session.access_token;
        localStorage.setItem('supabase_access_token', session.access_token);

        // Retry the request with new token
        response = await makeRequest(currentToken);
      } else {
        console.log('❌ Failed to refresh token:', error);
        
        // Clear auth state if refresh failed
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('oliwonder_authenticated');
        localStorage.removeItem('oliwonder_current_user');
        
        // Redirect to sign in
        window.location.href = '/signin';
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      throw error;
    }
  }

  return response;
}

