# Zustand State Management Guide

Complete guide to using Zustand for global state management in Oliwonder.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Store Architecture](#store-architecture)
3. [Store Usage](#store-usage)
4. [Best Practices](#best-practices)
5. [Integration](#integration)
6. [Migration Guide](#migration-guide)

---

## Overview

Zustand is a minimal, fast state management solution for React. We use it for:

- ✅ **Global App State** - Auth, theme, settings
- ✅ **Session Management** - Current session, rounds
- ✅ **Participant Dashboard** - Participant data, rounds, contacts
- ✅ **UI State** - Modals, toasts, notifications

### Why Zustand?

**Before (Context + useState):**
- Props drilling through multiple levels
- Performance issues (entire context re-renders)
- Complex setup with multiple providers
- Difficult to debug

**After (Zustand):**
- No providers needed
- Optimized re-renders (only what changed)
- Simple, minimal API
- DevTools integration
- Automatic persistence

**Benefits:**
- 🚀 **Fast** - Uses React's useSyncExternalStore
- 📦 **Small** - Only 1.2KB gzipped
- 🎯 **Simple** - Minimal boilerplate
- 🔧 **DevTools** - Redux DevTools support
- 💾 **Persistence** - Built-in localStorage sync

---

## Store Architecture

We have 4 main stores:

### 1. App Store (`appStore.ts`)
Global application state: auth, theme, settings.

```typescript
interface AppState {
  // Auth
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // UI
  sidebarOpen: boolean;
  isInitializing: boolean;
  
  // Actions
  signIn: (user, token) => void;
  signOut: () => void;
  setTheme: (theme) => void;
  toggleSidebar: () => void;
}
```

### 2. Session Store (`sessionStore.ts`)
Session and rounds management.

```typescript
interface SessionState {
  currentSession: Session | null;
  rounds: Round[];
  currentRoundId: string | null;
  
  // Filters
  filterStatus: 'all' | 'upcoming' | 'active' | 'completed';
  searchQuery: string;
  sortBy: 'date' | 'title' | 'participants';
  
  // Actions
  setCurrentSession: (session) => void;
  setRounds: (rounds) => void;
  addRound: (round) => void;
  updateRound: (id, updates) => void;
  
  // Computed
  getFilteredRounds: () => Round[];
  getActiveRound: () => Round | null;
}
```

### 3. Participant Store (`participantStore.ts`)
Participant dashboard state.

```typescript
interface ParticipantState {
  currentParticipant: Participant | null;
  participantToken: string | null;
  rounds: ParticipantRound[];
  contacts: Contact[];
  activeTab: 'dashboard' | 'rounds' | 'contacts' | 'profile';
  
  // Actions
  setCurrentParticipant: (p) => void;
  setRounds: (rounds) => void;
  setContacts: (contacts) => void;
  
  // Computed
  getUpcomingRounds: () => ParticipantRound[];
  getNextRound: () => ParticipantRound | null;
}
```

### 4. UI Store (`uiStore.ts`)
UI interactions: modals, toasts, notifications.

```typescript
interface UIState {
  modals: Modal[];
  toasts: Toast[];
  notifications: Notification[];
  globalLoading: boolean;
  commandPaletteOpen: boolean;
  
  // Actions
  openModal: (modal) => string;
  addToast: (toast) => string;
  addNotification: (notification) => void;
  setGlobalLoading: (loading, message?) => void;
}
```

---

## Store Usage

### Basic Usage

```tsx
import { useAppStore } from '../stores/appStore';

function MyComponent() {
  // Get state
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  
  // Get actions
  const signOut = useAppStore((state) => state.signOut);
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Optimized Selectors

Use pre-defined selectors for better performance:

```tsx
import { useUser, useAuth } from '../stores/appStore';

function UserProfile() {
  // Only re-renders when user changes
  const user = useUser();
  
  // Get multiple related values
  const { signIn, signOut, isAuthenticated } = useAuth();
  
  return <div>{user?.name}</div>;
}
```

**Available Selectors:**

**App Store:**
- `useUser()` - Current user
- `useIsAuthenticated()` - Auth status
- `useTheme()` - Current theme
- `useSidebarOpen()` - Sidebar state
- `useAuth()` - Auth actions

**Session Store:**
- `useCurrentSession()` - Current session
- `useRounds()` - All rounds
- `useActiveRound()` - Active round
- `useFilteredRounds()` - Filtered rounds

**Participant Store:**
- `useCurrentParticipant()` - Current participant
- `useParticipantRounds()` - Participant rounds
- `useParticipantContacts()` - Contacts
- `useNextRound()` - Next round

**UI Store:**
- `useModals()` - Open modals
- `useToasts()` - Active toasts
- `useNotifications()` - Notifications
- `useUnreadCount()` - Unread count

### Actions

```tsx
import { useSessionStore } from '../stores/sessionStore';

function SessionManagement() {
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const addRound = useSessionStore((state) => state.addRound);
  
  const handleLoadSession = async (sessionId: string) => {
    const session = await fetchSession(sessionId);
    setCurrentSession(session);
  };
  
  const handleAddRound = () => {
    addRound({
      id: '123',
      roundNumber: 1,
      title: 'Round 1',
      // ...
    });
  };
  
  return <div>...</div>;
}
```

### Computed Values

```tsx
import { useSessionStore } from '../stores/sessionStore';

function RoundsList() {
  // Get computed filtered rounds
  const filteredRounds = useSessionStore((state) => state.getFilteredRounds());
  const activeRound = useSessionStore((state) => state.getActiveRound());
  
  return (
    <div>
      <h2>Active Round</h2>
      {activeRound && <RoundCard round={activeRound} />}
      
      <h2>All Rounds</h2>
      {filteredRounds.map(round => (
        <RoundCard key={round.id} round={round} />
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Selector Optimization

```tsx
// ❌ Bad - Re-renders on any state change
const store = useAppStore();

// ❌ Bad - Creates new object on every render
const user = useAppStore((state) => ({ name: state.user?.name }));

// ✅ Good - Only re-renders when user changes
const user = useAppStore((state) => state.user);

// ✅ Good - Use pre-defined selectors
const user = useUser();

// ✅ Good - Multiple values with shallow comparison
const { user, theme } = useAppStore((state) => ({
  user: state.user,
  theme: state.theme
}), shallow);
```

### 2. Actions Outside Components

```tsx
// Get store state outside React
import { useAppStore } from '../stores/appStore';

export async function handleSignIn(email: string, password: string) {
  const { signIn } = useAppStore.getState();
  
  const response = await fetch('/api/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  const { user, token } = await response.json();
  signIn(user, token);
}
```

### 3. Subscribe to Changes

```tsx
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

function AuthWatcher() {
  useEffect(() => {
    // Subscribe to user changes
    const unsubscribe = useAppStore.subscribe(
      (state) => state.user,
      (user, prevUser) => {
        console.log('User changed:', prevUser, '->', user);
      }
    );
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

### 4. Transient Updates (Don't Trigger Re-renders)

```tsx
// For values that change frequently but don't need to trigger re-renders
const updateMousePosition = useAppStore.getState().updateMousePosition;

useEffect(() => {
  const handler = (e: MouseEvent) => {
    // This won't cause subscribers to re-render
    updateMousePosition(e.clientX, e.clientY);
  };
  
  window.addEventListener('mousemove', handler);
  return () => window.removeEventListener('mousemove', handler);
}, []);
```

### 5. Reset on Sign Out

```tsx
import { resetAllStores } from '../stores';

function SignOutButton() {
  const handleSignOut = () => {
    // Reset all stores
    resetAllStores();
    
    // Navigate to home
    navigate('/');
  };
  
  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

---

## Integration

### App Initialization

Add to `App.tsx`:

```tsx
import { useGlobalStoreSync } from './hooks/useStoreSync';

function App() {
  // Initialize and sync all stores
  useGlobalStoreSync();
  
  return (
    <Router>
      <Routes>
        {/* ... */}
      </Routes>
    </Router>
  );
}
```

This hook handles:
- Loading initial state from localStorage
- Syncing stores with localStorage
- Theme synchronization
- Auth query invalidation
- UI preferences persistence

### UI Components

#### Global Loading

```tsx
import { useGlobalLoading, useUIStore } from '../stores/uiStore';

function GlobalLoadingOverlay() {
  const globalLoading = useGlobalLoading();
  const loadingMessage = useUIStore((state) => state.loadingMessage);
  
  if (!globalLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <LoadingSpinner />
        {loadingMessage && <p>{loadingMessage}</p>}
      </div>
    </div>
  );
}

// Usage
function MyComponent() {
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);
  
  const handleLongOperation = async () => {
    setGlobalLoading(true, 'Processing...');
    await performOperation();
    setGlobalLoading(false);
  };
}
```

#### Modal System

```tsx
import { useModalActions, useModals } from '../stores/uiStore';

function ModalRenderer() {
  const modals = useModals();
  const { closeModal } = useModalActions();
  
  return (
    <>
      {modals.map(modal => (
        <Dialog key={modal.id} open onOpenChange={() => closeModal(modal.id)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modal.title}</DialogTitle>
              {modal.description && (
                <DialogDescription>{modal.description}</DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => {
                closeModal(modal.id);
                modal.onCancel?.();
              }}>
                {modal.cancelText || 'Cancel'}
              </Button>
              <Button onClick={async () => {
                await modal.onConfirm?.();
                closeModal(modal.id);
              }}>
                {modal.confirmText || 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}

// Usage
function DeleteButton({ itemId }: { itemId: string }) {
  const { openModal } = useModalActions();
  
  const handleDelete = () => {
    openModal({
      type: 'confirm',
      title: 'Delete item',
      description: 'Are you sure? This cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        await deleteItem(itemId);
      }
    });
  };
  
  return <Button onClick={handleDelete}>Delete</Button>;
}
```

#### Toast System

```tsx
import { useToastActions } from '../stores/uiStore';

function MyForm() {
  const { addToast } = useToastActions();
  
  const handleSubmit = async () => {
    try {
      await submitForm();
      
      addToast({
        type: 'success',
        title: 'Success',
        description: 'Form submitted successfully',
        duration: 3000
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error.message,
        duration: 5000
      });
    }
  };
}
```

#### Notification System

```tsx
import { 
  useNotifications, 
  useUnreadCount,
  useNotificationActions 
} from '../stores/uiStore';

function NotificationBell() {
  const unreadCount = useUnreadCount();
  const { markAllNotificationsRead } = useNotificationActions();
  
  return (
    <button className="relative">
      <Bell />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

function NotificationList() {
  const notifications = useNotifications();
  const { markNotificationRead, removeNotification } = useNotificationActions();
  
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} className={notification.read ? 'opacity-50' : ''}>
          <p>{notification.message}</p>
          <button onClick={() => markNotificationRead(notification.id)}>
            Mark as read
          </button>
          <button onClick={() => removeNotification(notification.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// Add notification
const { addNotification } = useNotificationActions();

addNotification({
  type: 'info',
  message: 'New participant registered'
});
```

---

## Migration Guide

### From Context

**Before (Context):**

```tsx
// UserContext.tsx
const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}

// App.tsx
<UserProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</UserProvider>

// Component.tsx
const { user, setUser } = useUser();
```

**After (Zustand):**

```tsx
// stores/appStore.ts
export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));

// No providers needed!
// App.tsx
<App />

// Component.tsx
const user = useUser();
const setUser = useAppStore((state) => state.setUser);
```

### From useState + Props

**Before:**

```tsx
// Parent
function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  
  return (
    <div>
      <SessionView session={session} setSession={setSession} />
      <RoundsList rounds={rounds} setRounds={setRounds} session={session} />
    </div>
  );
}
```

**After:**

```tsx
// No props needed!
function Dashboard() {
  return (
    <div>
      <SessionView />
      <RoundsList />
    </div>
  );
}

function SessionView() {
  const session = useCurrentSession();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  // ...
}

function RoundsList() {
  const rounds = useRounds();
  const session = useCurrentSession();
  // ...
}
```

---

## DevTools

Zustand integrates with Redux DevTools:

1. Install Redux DevTools extension
2. Open DevTools
3. Switch to Redux tab
4. See all stores:
   - AppStore
   - SessionStore
   - ParticipantStore
   - UIStore

**Features:**
- 👁️ Inspect state
- ⏱️ Time travel debugging
- 📊 Action history
- 🔄 Replay actions
- 📸 State snapshots

---

## Performance Tips

1. **Use Selectors:** Only subscribe to what you need
2. **Avoid Object Creation:** Don't create new objects in selectors
3. **Shallow Comparison:** Use `shallow` for multiple values
4. **Computed Values:** Pre-compute in store, not component
5. **Transient Updates:** Use `getState()` for non-reactive updates

---

## Debugging

```tsx
// Log all stores
import { logAllStores } from '../stores';
logAllStores();

// Get current state without subscribing
const currentUser = useAppStore.getState().user;

// Subscribe and log changes
useAppStore.subscribe((state) => {
  console.log('Store updated:', state);
});
```

---

Last updated: December 2024  
Version: 1.0.0
