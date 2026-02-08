/**
 * Central export for all Zustand stores
 * Import stores from here for consistency
 */

// App Store
export {
  useAppStore,
  useUser,
  useIsAuthenticated,
  useTheme,
  useSidebarOpen,
  useAccessToken,
  useAuth,
  useThemeActions
} from './appStore';
export type { User } from './appStore';

// Session Store
export {
  useSessionStore,
  useCurrentSession,
  useRounds,
  useCurrentRound,
  useActiveRound,
  useFilteredRounds,
  subscribeToSession
} from './sessionStore';
export type { Session, Round } from './sessionStore';

// Participant Store
export {
  useParticipantStore,
  useCurrentParticipant,
  useParticipantRounds,
  useParticipantContacts,
  useParticipantToken,
  useActiveRound as useParticipantActiveRound,
  useNextRound
} from './participantStore';
export type { Participant, ParticipantRound, Contact } from './participantStore';

// UI Store
export {
  useUIStore,
  useModals,
  useToasts,
  useNotifications,
  useUnreadCount,
  useGlobalLoading,
  useCommandPaletteOpen,
  useMobileMenuOpen,
  useModalActions,
  useToastActions,
  useNotificationActions
} from './uiStore';
export type { Toast, Modal, Notification } from './uiStore';

/**
 * Reset all stores (useful for sign out)
 */
export const resetAllStores = () => {
  useSessionStore.getState().reset();
  useParticipantStore.getState().reset();
  // Don't reset UI store as it contains UI state like modals/toasts
};

/**
 * DevTools: Log all store states
 */
export const logAllStores = () => {
  console.group('🏪 Zustand Stores');
  console.log('App Store:', useAppStore.getState());
  console.log('Session Store:', useSessionStore.getState());
  console.log('Participant Store:', useParticipantStore.getState());
  console.log('UI Store:', useUIStore.getState());
  console.groupEnd();
};
