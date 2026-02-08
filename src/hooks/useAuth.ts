import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { debugLog, errorLog } from '../utils/debug';
import { AuthToasts } from '../utils/toastMessages';

/**
 * Custom hook for authentication state and actions
 * Centralizes auth patterns across the application
 */

export interface User {
  id: string;
  email: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

/**
 * Hook for managing authentication state
 * 
 * @example
 * ```tsx
 * const auth = useAuth();
 * 
 * if (auth.isLoading) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (!auth.isAuthenticated) {
 *   return <SignInPage />;
 * }
 * 
 * return <Dashboard user={auth.user} />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true
  });

  const navigate = useNavigate();

  /**
   * Check if user is authenticated
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
      return false;
    }

    // Verify token is still valid
    try {
      // This would typically call your auth verification endpoint
      // For now, we'll just check if token exists
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      if (user) {
        setAuthState({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
    } catch (error) {
      errorLog('Auth check failed:', error);
    }

    setAuthState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false
    });
    return false;
  }, []);

  /**
   * Sign in user
   */
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // This would be replaced with your actual sign-in API call
      debugLog('Signing in user:', email);
      
      // Store auth data
      // const response = await fetch('/api/auth/signin', { ... });
      // const { user, accessToken } = await response.json();
      
      // For now, this is a placeholder
      const user: User = { id: '1', email };
      const accessToken = 'mock-token';
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      
      setAuthState({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      
      AuthToasts.signInSuccess();
      return true;
    } catch (error) {
      errorLog('Sign in error:', error);
      AuthToasts.signInError();
      return false;
    }
  }, []);

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      debugLog('Signing out user');
      
      // Call sign-out API if needed
      // await fetch('/api/auth/signout', { ... });
      
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      
      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      AuthToasts.signOutSuccess();
      navigate('/');
    } catch (error) {
      errorLog('Sign out error:', error);
    }
  }, [navigate]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // This would typically refresh the access token
      debugLog('Refreshing session');
      return await checkAuth();
    } catch (error) {
      errorLog('Session refresh failed:', error);
      return false;
    }
  }, [checkAuth]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    signIn,
    signOut,
    refreshSession,
    checkAuth
  };
}

/**
 * Hook for protecting routes that require authentication
 * 
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isAllowed, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAllowed) return null; // Will redirect automatically
 *   
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = '/signin') {
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        debugLog('No access token found, redirecting to sign in');
        navigate(redirectTo);
        setIsAllowed(false);
        setIsLoading(false);
        return;
      }

      // Verify token is valid
      // In a real app, you'd verify with your backend
      setIsAllowed(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [navigate, redirectTo]);

  return { isAllowed, isLoading };
}

/**
 * Hook for checking if user has specific permission
 * 
 * @example
 * ```tsx
 * const canDelete = usePermission('sessions:delete');
 * 
 * return (
 *   <Button onClick={handleDelete} disabled={!canDelete}>
 *     Delete
 *   </Button>
 * );
 * ```
 */
export function usePermission(permission: string): boolean {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Check if user has permission
    // This would typically check against user's roles/permissions from context or API
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
      setHasPermission(false);
      return;
    }

    // For now, just a placeholder
    // In a real app: setHasPermission(user.permissions?.includes(permission));
    setHasPermission(true);
  }, [permission]);

  return hasPermission;
}

/**
 * Hook for session timeout handling
 * 
 * @example
 * ```tsx
 * useSessionTimeout(30 * 60 * 1000); // 30 minutes
 * ```
 */
export function useSessionTimeout(timeoutMs: number = 30 * 60 * 1000) {
  const navigate = useNavigate();
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        debugLog('Session timeout - signing out');
        AuthToasts.sessionExpired();
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        navigate('/signin');
      }, timeoutMs);
    };

    // Reset timeout on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    // Initial timeout
    resetTimeout();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [timeoutMs, navigate]);
}

/**
 * Get authorization header for API requests
 */
export function useAuthHeader(): { Authorization: string } | null {
  const [header, setHeader] = useState<{ Authorization: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setHeader({ Authorization: `Bearer ${token}` });
    } else {
      setHeader(null);
    }
  }, []);

  return header;
}
