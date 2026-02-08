import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { debugLog } from '../utils/debug';

/**
 * UI Store
 * Manages global UI state (modals, toasts, notifications)
 */

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  description?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}

interface UIState {
  // Modals
  modals: Modal[];
  
  // Toasts
  toasts: Toast[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Loading overlays
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Command palette
  commandPaletteOpen: boolean;
  
  // Mobile menu
  mobileMenuOpen: boolean;
  
  // Actions - Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Actions - Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  
  // Actions - Mobile Menu
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

let modalIdCounter = 0;
let toastIdCounter = 0;
let notificationIdCounter = 0;

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      modals: [],
      toasts: [],
      notifications: [],
      unreadCount: 0,
      globalLoading: false,
      loadingMessage: null,
      commandPaletteOpen: false,
      mobileMenuOpen: false,
      
      // Modal actions
      openModal: (modal) => {
        const id = `modal-${++modalIdCounter}`;
        set((state) => ({
          modals: [...state.modals, { ...modal, id }]
        }));
        debugLog('Modal opened:', id);
        return id;
      },
      
      closeModal: (id) => {
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id)
        }));
        debugLog('Modal closed:', id);
      },
      
      closeAllModals: () => {
        set({ modals: [] });
        debugLog('All modals closed');
      },
      
      // Toast actions
      addToast: (toast) => {
        const id = `toast-${++toastIdCounter}`;
        const duration = toast.duration || 5000;
        
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        
        debugLog('Toast added:', toast.title);
        
        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
        
        return id;
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      },
      
      clearToasts: () => {
        set({ toasts: [] });
      },
      
      // Notification actions
      addNotification: (notification) => {
        const id = `notification-${++notificationIdCounter}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
        
        debugLog('Notification added:', notification.message);
      },
      
      markNotificationRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: state.unreadCount - 1
          };
        });
      },
      
      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0
        }));
        debugLog('All notifications marked as read');
      },
      
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read 
              ? state.unreadCount - 1 
              : state.unreadCount
          };
        });
      },
      
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
        debugLog('All notifications cleared');
      },
      
      // Loading actions
      setGlobalLoading: (loading, message) => {
        set({ 
          globalLoading: loading, 
          loadingMessage: loading ? message || null : null 
        });
        debugLog('Global loading:', loading, message);
      },
      
      // Command palette actions
      openCommandPalette: () => {
        set({ commandPaletteOpen: true });
      },
      
      closeCommandPalette: () => {
        set({ commandPaletteOpen: false });
      },
      
      toggleCommandPalette: () => {
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
      },
      
      // Mobile menu actions
      openMobileMenu: () => {
        set({ mobileMenuOpen: true });
      },
      
      closeMobileMenu: () => {
        set({ mobileMenuOpen: false });
      },
      
      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      }
    }),
    { name: 'UIStore' }
  )
);

/**
 * Selectors
 */
export const useModals = () => useUIStore((state) => state.modals);
export const useToasts = () => useUIStore((state) => state.toasts);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useUnreadCount = () => useUIStore((state) => state.unreadCount);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useCommandPaletteOpen = () => useUIStore((state) => state.commandPaletteOpen);
export const useMobileMenuOpen = () => useUIStore((state) => state.mobileMenuOpen);

/**
 * Action hooks
 */
export const useModalActions = () => useUIStore((state) => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals
}));

export const useToastActions = () => useUIStore((state) => ({
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts
}));

export const useNotificationActions = () => useUIStore((state) => ({
  addNotification: state.addNotification,
  markNotificationRead: state.markNotificationRead,
  markAllNotificationsRead: state.markAllNotificationsRead,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications
}));
