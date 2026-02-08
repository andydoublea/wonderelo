import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSessionStore } from '../stores/sessionStore';
import { useParticipantStore } from '../stores/participantStore';
import { storage } from '../utils/storage';
import { debugLog } from '../utils/debug';

/**
 * Sync Zustand stores with localStorage and external sources
 * Bridges between old localStorage system and new Zustand stores
 */

/**
 * Sync app store with localStorage
 * Loads initial auth state from localStorage
 */
export function useAppStoreSync() {
  useEffect(() => {
    const { setUser, setAccessToken, setIsInitializing } = useAppStore.getState();
    
    // Load user from localStorage
    const userStr = storage.get<string>('user');
    const accessToken = storage.get<string>('accessToken');
    
    if (userStr) {
      try {
        const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
        setUser(user);
        debugLog('App store synced: user loaded from localStorage');
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
    
    if (accessToken) {
      setAccessToken(accessToken);
      debugLog('App store synced: access token loaded');
    }
    
    setIsInitializing(false);
  }, []);
  
  // Subscribe to store changes and sync back to localStorage
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state) => {
        // Sync user
        if (state.user) {
          storage.set('user', JSON.stringify(state.user));
        } else {
          storage.remove('user');
        }
        
        // Sync access token
        if (state.accessToken) {
          storage.set('accessToken', state.accessToken);
        } else {
          storage.remove('accessToken');
        }
      }
    );
    
    return unsubscribe;
  }, []);
}

/**
 * Sync participant store with localStorage token
 */
export function useParticipantStoreSync() {
  useEffect(() => {
    const { setParticipantToken } = useParticipantStore.getState();
    
    // Load token from localStorage
    const token = storage.get<string>('participantToken');
    
    if (token) {
      setParticipantToken(token);
      debugLog('Participant store synced: token loaded');
    }
  }, []);
  
  // Subscribe to token changes
  useEffect(() => {
    const unsubscribe = useParticipantStore.subscribe(
      (state) => state.participantToken,
      (token) => {
        if (token) {
          storage.set('participantToken', token);
        } else {
          storage.remove('participantToken');
        }
      }
    );
    
    return unsubscribe;
  }, []);
}

/**
 * Initialize all stores on app mount
 */
export function useStoreInitialization() {
  useAppStoreSync();
  useParticipantStoreSync();
  
  useEffect(() => {
    debugLog('All stores initialized');
  }, []);
}

/**
 * Handle sign out - clear all stores and storage
 */
export function useSignOut() {
  return () => {
    const { signOut } = useAppStore.getState();
    const { reset: resetSession } = useSessionStore.getState();
    const { reset: resetParticipant } = useParticipantStore.getState();
    
    // Sign out from app store
    signOut();
    
    // Reset other stores
    resetSession();
    resetParticipant();
    
    // Clear specific storage items
    storage.remove('user');
    storage.remove('accessToken');
    storage.remove('participantToken');
    
    debugLog('Signed out: all stores and storage cleared');
  };
}

/**
 * React Query integration - invalidate queries on auth change
 */
export function useAuthQuerySync() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) {
      // Import dynamically to avoid circular dependencies
      import('../utils/queryClient').then(({ invalidateQueries }) => {
        // Invalidate all queries when user signs out
        invalidateQueries.all();
        debugLog('All queries invalidated due to auth change');
      });
    }
  }, [isAuthenticated]);
}

/**
 * Theme sync with document
 */
export function useThemeSync() {
  const theme = useAppStore((state) => state.theme);
  const isDarkMode = useAppStore((state) => state.isDarkMode());
  
  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Use system preference
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      root.classList.toggle('dark', darkModeMediaQuery.matches);
      
      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      
      darkModeMediaQuery.addEventListener('change', handler);
      return () => darkModeMediaQuery.removeEventListener('change', handler);
    } else {
      // Use explicit theme
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, isDarkMode]);
}

/**
 * Sync session store with React Query cache
 */
export function useSessionCacheSync(sessionId?: string) {
  useEffect(() => {
    if (!sessionId) return;
    
    import('../utils/queryClient').then(({ cacheHelpers, queryKeys }) => {
      // Get session from cache
      const cachedSession = cacheHelpers.get(queryKeys.session.detail(sessionId));
      
      if (cachedSession) {
        const { setCurrentSession } = useSessionStore.getState();
        setCurrentSession(cachedSession);
        debugLog('Session store synced from React Query cache');
      }
    });
  }, [sessionId]);
}

/**
 * Persist UI preferences
 */
export function useUIPersistence() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  
  useEffect(() => {
    storage.set('sidebarOpen', sidebarOpen);
  }, [sidebarOpen]);
  
  useEffect(() => {
    const saved = storage.get<boolean>('sidebarOpen');
    if (saved !== null) {
      useAppStore.getState().setSidebarOpen(saved);
    }
  }, []);
}

/**
 * Master sync hook - use in App.tsx
 */
export function useGlobalStoreSync() {
  useStoreInitialization();
  useAuthQuerySync();
  useThemeSync();
  useUIPersistence();
  
  useEffect(() => {
    debugLog('Global store sync active');
  }, []);
}
