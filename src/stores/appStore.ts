import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { debugLog } from '../utils/debug';

/**
 * Global App Store
 * Manages application-wide state like auth, theme, settings
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer';
  organizationId?: string;
  createdAt: string;
}

interface AppState {
  // Auth state
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // UI state
  sidebarOpen: boolean;
  
  // Loading states
  isInitializing: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsInitializing: (loading: boolean) => void;
  
  // Computed
  isDarkMode: () => boolean;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        isAuthenticated: false,
        theme: 'system',
        sidebarOpen: true,
        isInitializing: true,
        
        // Actions
        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
          debugLog('User updated:', user?.email);
        },
        
        setAccessToken: (token) => {
          set({ accessToken, isAuthenticated: !!token });
          debugLog('Access token updated');
        },
        
        signIn: (user, token) => {
          set({
            user,
            accessToken: token,
            isAuthenticated: true
          });
          debugLog('User signed in:', user.email);
        },
        
        signOut: () => {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false
          });
          debugLog('User signed out');
        },
        
        setTheme: (theme) => {
          set({ theme });
          debugLog('Theme changed:', theme);
        },
        
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }));
        },
        
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },
        
        setIsInitializing: (loading) => {
          set({ isInitializing: loading });
        },
        
        // Computed
        isDarkMode: () => {
          const { theme } = get();
          if (theme === 'dark') return true;
          if (theme === 'light') return false;
          // System preference
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }),
      {
        name: 'oliwonder-app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen
        })
      }
    ),
    { name: 'AppStore' }
  )
);

/**
 * Selectors for optimized re-renders
 */
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useAccessToken = () => useAppStore((state) => state.accessToken);

/**
 * Action hooks
 */
export const useAuth = () => useAppStore((state) => ({
  signIn: state.signIn,
  signOut: state.signOut,
  user: state.user,
  isAuthenticated: state.isAuthenticated
}));

export const useThemeActions = () => useAppStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
  isDarkMode: state.isDarkMode
}));
