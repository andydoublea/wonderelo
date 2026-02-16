import React, { lazy, Suspense, createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { VersionBadge } from './components/VersionBadge';
import { TimeProvider } from './contexts/TimeContext';
import { TimeControl } from './components/TimeControl';
import { QueryProvider } from './components/QueryProvider';
import { PasswordGate } from './components/PasswordGate';
import type { NetworkingSession, SignUpData, ServiceType } from './App';
import { debugLog, errorLog, infoLog } from './utils/debug';
import { projectId } from './utils/supabase/info';
import { fetchSystemParameters } from './utils/systemParameters';

// Component imports
import { Homepage } from './components/Homepage';
import { SignUpFlow } from './components/SignUpFlow';
import { SignInFlow } from './components/SignInFlow';
import { ResetPasswordFlow } from './components/ResetPasswordFlow';
import { AuthenticatedNav } from './components/AuthenticatedNav';
import { SessionAdministration } from './components/SessionAdministration';
import { RoundFormPage } from './components/RoundFormPage';
import { Dashboard } from './components/Dashboard';
import { NetworkingDashboard } from './components/NetworkingDashboard';
import { AccountSettings } from './components/AccountSettings';
import { EventPageSettings } from './components/EventPageSettings';
import { BillingSettings } from './components/BillingSettings';
import { EmailVerification } from './components/EmailVerification';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { ParticipantRoundDetail } from './components/ParticipantRoundDetail';
import { MatchInfo } from './components/MatchInfo';
import { MatchPartner } from './components/MatchPartner';
import { MatchNetworking } from './components/MatchNetworking';
import { UserPublicPage } from './components/UserPublicPage';
import { EventPromoPage } from './components/EventPromoPage';
import { BlogListingPage } from './components/BlogListingPage';
import { BlogDetailPage } from './components/BlogDetailPage';
import { BlogManagement } from './components/BlogManagement';
import ParticipantProfile from './pages/ParticipantProfile';
import { BootstrapAdmin } from './components/BootstrapAdmin';

// Zustand stores
import { useAppStore, useAuth, useAccessToken } from './stores';
import { useStoreSync } from './hooks/useStoreSync';

// Lazy load admin components (only loaded when needed)
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminIceBreakers = lazy(() => import('./components/AdminIceBreakers').then(m => ({ default: m.AdminIceBreakers })));
const AdminNotificationTexts = lazy(() => import('./components/AdminNotificationTexts').then(m => ({ default: m.AdminNotificationTexts })));
const AdminGiftCards = lazy(() => import('./components/AdminGiftCards').then(m => ({ default: m.AdminGiftCards })));
const AdminOrganizers = lazy(() => import('./components/AdminOrganizers').then(m => ({ default: m.AdminOrganizers })));
const AdminParticipants = lazy(() => import('./components/AdminParticipants').then(m => ({ default: m.AdminParticipants })));
const AdminSessions = lazy(() => import('./components/AdminSessions').then(m => ({ default: m.AdminSessions })));
const AdminStatusesGuide = lazy(() => import('./components/AdminStatusesGuide').then(m => ({ default: m.AdminStatusesGuide })));
const AdminParticipantFlow = lazy(() => import('./components/AdminParticipantFlow').then(m => ({ default: m.AdminParticipantFlow })));
const AdminParameters = lazy(() => import('./components/AdminParameters').then(m => ({ default: m.AdminParameters })));
const AdminOrganizerRequests = lazy(() => import('./components/AdminOrganizerRequests').then(m => ({ default: m.AdminOrganizerRequests })));
const ThemeManager = lazy(() => import('./components/ThemeManager').then(m => ({ default: m.ThemeManager })));

// Loading component for lazy loaded routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: any;
  accessToken: string;
  serviceType: ServiceType;
  eventSlug: string;
  sessions: NetworkingSession[];
  isLoadingSessions: boolean;
  isAuthLoading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  setCurrentUser: (value: any) => void;
  setAccessToken: (value: string) => void;
  setServiceType: (value: ServiceType) => void;
  setEventSlug: (value: string) => void;
  setSessions: (value: NetworkingSession[]) => void;
  loadSessions: () => Promise<void>;
  addSession: (session: Omit<NetworkingSession, 'id'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<NetworkingSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  duplicateSession: (session: NetworkingSession) => Omit<NetworkingSession, 'id'>;
  updateEventSlug: (slug: string) => void;
  isAdminUser: () => boolean;
  handleSignOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser, isAuthLoading } = useApp();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return React.createElement(Navigate, { to: "/signin", state: { from: location }, replace: true });
  }

  return React.createElement(React.Fragment, null, children);
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdminUser, isAuthLoading } = useApp();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdminUser()) {
    return React.createElement(Navigate, { to: "/dashboard", state: { from: location }, replace: true });
  }

  return React.createElement(React.Fragment, null, children);
}

// 404 Not Found Component
function NotFoundRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Go back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to homepage
          </button>
        </div>
      </div>
    </div>
  );
}

// Route wrapper components that use navigate
function HomepageRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  // Don't redirect here - let Homepage handle its own redirect logic
  // This allows Homepage to properly handle participant token checks
  // and browsing flags before redirecting authenticated organizers

  return (
    <Homepage
      onGetStarted={() => navigate('/signup')}
      onSignIn={() => navigate('/signin')}
      onResetPassword={() => navigate('/reset-password')}
      isOrganizerAuthenticated={isAuthenticated}
    />
  );
}

function SignUpRoute() {
  const navigate = useNavigate();
  const {
    setServiceType,
    setEventSlug,
    setIsAuthenticated,
    setCurrentUser,
    isAuthenticated
  } = useApp();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignUpComplete = (signUpData: SignUpData) => {
    debugLog('Sign up completed:', signUpData);

    // Update app state with the user's choices
    setServiceType(signUpData.serviceType);
    setEventSlug(signUpData.urlSlug);
    setIsAuthenticated(true);
    const userData = {
      email: signUpData.email,
      serviceType: signUpData.serviceType,
      urlSlug: signUpData.urlSlug,
      organizerName: signUpData.organizerName
    };
    setCurrentUser(userData);

    // Update localStorage
    localStorage.setItem('oliwonder_service_type', signUpData.serviceType);
    localStorage.setItem('oliwonder_event_slug', signUpData.urlSlug);
    localStorage.setItem('oliwonder_authenticated', 'true');
    localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));

    navigate('/rounds');
  };

  return (
    <SignUpFlow
      onComplete={handleSignUpComplete}
      onBack={() => navigate('/')}
      onSwitchToSignIn={() => navigate('/signin')}
    />
  );
}

function SignInRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setServiceType,
    setEventSlug,
    setIsAuthenticated,
    setCurrentUser,
    setAccessToken,
    loadSessions,
    isAuthenticated
  } = useApp();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignInComplete = async (userData: any, sessionData?: any) => {
    debugLog('=== SIGN IN COMPLETE ===');
    debugLog('User data:', userData);
    debugLog('Session data present:', !!sessionData);
    debugLog('Access token present:', !!sessionData?.access_token);

    // Store access token for admin tools and API calls
    if (sessionData && sessionData.access_token) {
      debugLog('💾 STORING ACCESS TOKEN IN LOCAL STORAGE');
      localStorage.setItem('supabase_access_token', sessionData.access_token);
      
      // Set access token in app state
      setAccessToken(sessionData.access_token);
      
      // Set session in Supabase client
      try {
        const { supabase } = await import('./utils/supabase/client');
        
        debugLog('Setting session with data:', {
          hasAccessToken: !!sessionData.access_token,
          hasRefreshToken: !!sessionData.refresh_token,
          accessTokenLength: sessionData.access_token?.length,
          refreshTokenLength: sessionData.refresh_token?.length
        });
        
        const { data, error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        });
        
        if (error) {
          errorLog('❌ Error setting session in Supabase client:', error);
          errorLog('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
        } else {
          debugLog('✅ Session set in Supabase client successfully');
          debugLog('Session verification:', {
            hasSession: !!data.session,
            hasUser: !!data.user,
            userId: data.user?.id,
            userEmail: data.user?.email
          });
          
          // Verify session was stored
          const { data: verifyData } = await supabase.auth.getSession();
          debugLog('Session verification after set:', {
            hasSession: !!verifyData.session,
            sessionId: verifyData.session?.user?.id
          });
        }
      } catch (error) {
        errorLog('❌ Exception setting session in Supabase client:', error);
      }
    } else {
      debugLog('❌ NO ACCESS TOKEN PROVIDED IN SESSION DATA');
    }

    // Update app state with the user's data
    const serviceType = userData.serviceType || 'event';
    const eventSlug = userData.urlSlug || 'my-networking-event';
    setServiceType(serviceType);
    setEventSlug(eventSlug);
    setIsAuthenticated(true);
    setCurrentUser(userData);

    // Update localStorage
    localStorage.setItem('oliwonder_service_type', serviceType);
    localStorage.setItem('oliwonder_event_slug', eventSlug);
    localStorage.setItem('oliwonder_authenticated', 'true');
    localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));

    // Sessions will be loaded automatically by useEffect when we navigate
    debugLog('✅ Auth state updated, sessions will load on navigation');

    // Navigate to where user was trying to go, or dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <SignInFlow
      onComplete={handleSignInComplete}
      onBack={() => navigate('/')}
      onSwitchToSignUp={() => navigate('/signup')}
    />
  );
}

function ResetPasswordRoute() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setCurrentUser, setAccessToken } = useApp();

  const handleResetPasswordComplete = () => {
    // Clear any stored reset tokens
    localStorage.removeItem('oliwonder_reset_access_token');
    localStorage.removeItem('oliwonder_reset_token_timestamp');
    localStorage.removeItem('oliwonder_reset_password_initiated');
    
    navigate('/signin');
  };

  return (
    <ResetPasswordFlow
      onComplete={handleResetPasswordComplete}
      onBack={() => navigate('/')}
    />
  );
}

function RoundFormPageRoute() {
  const {
    currentUser,
    sessions,
    isLoadingSessions,
    eventSlug,
    addSession,
    updateSession,
    duplicateSession,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();
  const { id, action } = useParams<{ id?: string; action?: string }>();

  // If action is 'manage', show SessionAdministration instead
  if (action === 'manage' && id) {
    // Show loading state while sessions are being loaded
    if (isLoadingSessions) {
      return (
        <div className="min-h-screen bg-background">
          <AuthenticatedNav
            currentView="rounds"
            currentUser={currentUser}
            isAdminUser={isAdminUser()}
            onNavigateToDashboard={() => navigate('/dashboard')}
            onNavigateToRounds={() => navigate('/rounds')}
            onNavigateToAccountSettings={() => navigate('/account-settings')}
            onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
            onNavigateToBilling={() => navigate('/billing')}
            onNavigateToAdmin={() => navigate('/admin')}
            onSignOut={handleSignOut}
          />
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <p>Loading session...</p>
            </div>
          </div>
        </div>
      );
    }

    const session = sessions.find(s => s.id === id);
    if (!session) {
      // Session not found, redirect to rounds
      return <Navigate to="/rounds" replace />;
    }

    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedNav
          currentView="rounds"
          currentUser={currentUser}
          isAdminUser={isAdminUser()}
          onNavigateToDashboard={() => navigate('/dashboard')}
          onNavigateToRounds={() => navigate('/rounds')}
          onNavigateToAccountSettings={() => navigate('/account-settings')}
          onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
          onNavigateToBilling={() => navigate('/billing')}
          onNavigateToAdmin={() => navigate('/admin')}
          onSignOut={handleSignOut}
        />

        <div className="container mx-auto p-6">
          <SessionAdministration
            session={session}
            onBack={() => navigate('/rounds')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav
        currentView="rounds"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />

      <RoundFormPage
        sessions={sessions}
        isLoadingSessions={isLoadingSessions}
        onAddSession={addSession}
        onUpdateSession={updateSession}
        onDuplicateSession={duplicateSession}
        userEmail={currentUser?.email}
        organizerName={currentUser?.eventName || currentUser?.organizerName}
        profileImageUrl={currentUser?.profileImageUrl}
        userSlug={eventSlug}
      />
    </div>
  );
}

function DashboardRoute() {
  const {
    currentUser,
    sessions,
    isLoadingSessions,
    eventSlug,
    updateSession,
    deleteSession,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav
        currentView="dashboard"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto p-6">
        <Dashboard
          eventSlug={eventSlug}
          sessions={sessions}
          isLoadingSessions={isLoadingSessions}
          onUpdateSession={updateSession}
          onDeleteSession={deleteSession}
        />
      </div>
    </div>
  );
}

function RoundsRoute() {
  const {
    currentUser,
    sessions,
    isLoadingSessions,
    serviceType,
    eventSlug,
    addSession,
    updateSession,
    deleteSession,
    duplicateSession,
    updateEventSlug,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();
  const [dashboardKey, setDashboardKey] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav
        currentView="rounds"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => {
          setDashboardKey(prev => prev + 1);
          navigate('/rounds');
        }}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto p-6">
        <NetworkingDashboard
          key={dashboardKey}
          sessions={sessions}
          isLoadingSessions={isLoadingSessions}
          serviceType={serviceType}
          eventSlug={eventSlug}
          userEmail={currentUser?.email}
          organizerName={currentUser?.eventName || currentUser?.organizerName}
          profileImageUrl={currentUser?.profileImageUrl}
          onAddSession={addSession}
          onUpdateSession={updateSession}
          onDeleteSession={deleteSession}
          onDuplicateSession={duplicateSession}
          onUpdateEventSlug={updateEventSlug}
          onEditUrl={() => {
            navigate('/account-settings');
            localStorage.setItem('oliwonder_scroll_to_url', 'true');
          }}
        />
      </div>
    </div>
  );
}

function AccountSettingsRoute() {
  const {
    currentUser,
    accessToken,
    setCurrentUser,
    setEventSlug,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="account-settings"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <AccountSettings
        accessToken={accessToken}
        userEmail={currentUser?.email || ''}
        onBack={() => navigate('/dashboard')}
        onProfileUpdate={(updates) => {
          // Update currentUser state
          const updatedUser = {
            ...currentUser,
            ...updates
          };
          setCurrentUser(updatedUser);

          // Update localStorage
          localStorage.setItem('oliwonder_current_user', JSON.stringify(updatedUser));

          debugLog('Profile updated in AppRouter:', updates);
        }}
      />
    </>
  );
}

function EventPageSettingsRoute() {
  const {
    currentUser,
    accessToken,
    setCurrentUser,
    setEventSlug,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="event-page-settings"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <EventPageSettings
        accessToken={accessToken}
        onBack={() => navigate('/dashboard')}
        onProfileUpdate={(updates) => {
          // Update eventSlug state if URL changed
          if (updates.urlSlug) {
            setEventSlug(updates.urlSlug);
          }

          // Update currentUser state
          const updatedUser = {
            ...currentUser,
            ...updates
          };
          setCurrentUser(updatedUser);

          // Update localStorage
          localStorage.setItem('oliwonder_current_user', JSON.stringify(updatedUser));

          debugLog('Event page settings updated in AppRouter:', updates);
        }}
      />
    </>
  );
}

function EventPromoPageRoute() {
  const { eventSlug } = useApp();
  const navigate = useNavigate();

  return (
    <EventPromoPage 
      eventSlug={eventSlug} 
      onBack={() => navigate('/dashboard')} 
    />
  );
}

function BillingSettingsRoute() {
  const {
    currentUser,
    accessToken,
    isAdminUser,
    handleSignOut
  } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="billing"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <BillingSettings accessToken={accessToken} />
    </>
  );
}

function AdminDashboardRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminDashboard
          accessToken={accessToken}
          onBack={() => navigate('/dashboard')}
        />
      </Suspense>
    </>
  );
}

function AdminThemeRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<RouteLoader />}>
      <ThemeManager
        accessToken={accessToken}
        onBack={() => navigate('/admin')}
      />
    </Suspense>
  );
}

function AdminIceBreakersRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminIceBreakers
          accessToken={accessToken}
          onBack={() => navigate('/admin')}
        />
      </Suspense>
    </>
  );
}

function AdminNotificationTextsRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminNotificationTexts
          accessToken={accessToken}
          onBack={() => navigate('/admin')}
        />
      </Suspense>
    </>
  );
}

function AdminGiftCardsRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminGiftCards
          accessToken={accessToken}
        />
      </Suspense>
    </>
  );
}

function AdminBlogRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <div className="container mx-auto p-6">
        <BlogManagement accessToken={accessToken} />
      </div>
    </div>
  );
}

function AdminOrganizersRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminOrganizers
          accessToken={accessToken}
          onBack={() => navigate('/admin')}
          onNavigateToParticipant={(email) => {
            navigate('/admin/participants');
            // Store email to filter by it after navigation
            sessionStorage.setItem('admin_participant_filter', email);
          }}
          onNavigateToSession={(organizerUrlSlug, sessionId) => {
            navigate('/admin/sessions');
            // Store session ID to auto-expand after navigation
            sessionStorage.setItem('admin_sessions_filter', sessionId);
          }}
        />
      </Suspense>
    </>
  );
}

function AdminParticipantsRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminParticipants
          accessToken={accessToken}
          onBack={() => navigate('/admin')}
          onNavigateToSession={(organizerUrlSlug, sessionId) => {
            navigate('/admin/organizers');
            // Store organizer URL slug and session ID to auto-expand after navigation
            sessionStorage.setItem('admin_organizer_filter', organizerUrlSlug);
            sessionStorage.setItem('admin_session_filter', sessionId);
          }}
        />
      </Suspense>
    </>
  );
}

function AdminSessionsRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminSessions
          onBack={() => navigate('/admin')}
          onNavigateToOrganizer={(organizerId) => {
            navigate('/admin/organizers');
            // Store organizer ID to auto-expand after navigation
            sessionStorage.setItem('admin_organizer_id_filter', organizerId);
          }}
          onNavigateToParticipants={() => {
            navigate('/admin/participants');
            // Filter values are already stored in sessionStorage by AdminSessions
            // (admin_participant_filter_session and admin_participant_filter_round)
          }}
        />
      </Suspense>
    </>
  );
}

function AdminStatusesGuideRoute() {
  const { currentUser, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminStatusesGuide />
      </Suspense>
    </>
  );
}

function AdminParticipantFlowRoute() {
  const navigate = useNavigate();

  return (
    <Suspense fallback={<RouteLoader />}>
      <AdminParticipantFlow onBack={() => navigate('/admin')} />
    </Suspense>
  );
}

function AdminParametersRoute() {
  const { accessToken } = useApp();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<RouteLoader />}>
      <AdminParameters accessToken={accessToken} onBack={() => navigate('/admin')} />
    </Suspense>
  );
}


function AdminOrganizerRequestsRoute() {
  const { currentUser, accessToken, isAdminUser, handleSignOut } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <AuthenticatedNav
        currentView="admin"
        currentUser={currentUser}
        isAdminUser={isAdminUser()}
        onNavigateToDashboard={() => navigate('/dashboard')}
        onNavigateToRounds={() => navigate('/rounds')}
        onNavigateToAccountSettings={() => navigate('/account-settings')}
        onNavigateToEventPageSettings={() => navigate('/event-page-settings')}
        onNavigateToBilling={() => navigate('/billing')}
        onNavigateToAdmin={() => navigate('/admin')}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<RouteLoader />}>
        <AdminOrganizerRequests accessToken={accessToken} />
      </Suspense>
    </>
  );
}


function UserPublicPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for token in URL and preserve it
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  return (
    <UserPublicPage
      userSlug={slug || ''}
      onBack={() => navigate('/')}
    />
  );
}

function BlogListingPageRoute() {
  return <BlogListingPage />;
}

function BlogDetailPageRoute() {
  return <BlogDetailPage />;
}

function BootstrapAdminRoute() {
  return <BootstrapAdmin />;
}

export default function AppRouter() {
  return (
    <PasswordGate>
      <BrowserRouter>
        <AppProviderWithRouter />
      </BrowserRouter>
    </PasswordGate>
  );
}

function AppProviderWithRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Zustand stores - for future gradual migration
  const appStore = useAppStore();
  
  // State management (keeping existing implementation for stability)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('oliwonder_authenticated') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('oliwonder_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [accessToken, _setAccessToken] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('supabase_access_token') || '';
  });

  // Wrapper to track all access token changes
  const setAccessToken = (newToken: string) => {
    debugLog('🔑 ACCESS TOKEN CHANGE:', {
      from: accessToken ? `${accessToken.substring(0, 20)}...` : 'empty',
      to: newToken ? `${newToken.substring(0, 20)}...` : 'empty',
      stack: new Error().stack?.split('\n')[2]?.trim()
    });
    _setAccessToken(newToken);
  };

  const [serviceType, setServiceType] = useState<ServiceType>(() => {
    const saved = localStorage.getItem('oliwonder_service_type');
    return (saved as ServiceType) || 'event';
  });
  const [eventSlug, setEventSlug] = useState(() => {
    return localStorage.getItem('oliwonder_event_slug') || 'event3';
  });
  const [sessions, setSessions] = useState<NetworkingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const isLoadingSessionsRef = useRef(false);
  const isInitializingAuthRef = useRef(false); // Prevent duplicate auth initialization
  const lastSessionLoadPathRef = useRef(''); // Track last path where sessions were loaded

  // Helper function to update auth state in a single batch
  const updateAuthState = useCallback((userData: any, token: string) => {
    const serviceType = userData.serviceType || 'event';
    const eventSlug = userData.urlSlug || 'my-networking-event';
    
    // Batch all state updates together (React 18 automatically batches, but this makes it explicit)
    setAccessToken(token);
    setServiceType(serviceType);
    setEventSlug(eventSlug);
    setIsAuthenticated(true);
    setCurrentUser(userData);
    
    // Update localStorage once
    localStorage.setItem('oliwonder_service_type', serviceType);
    localStorage.setItem('oliwonder_event_slug', eventSlug);
    localStorage.setItem('oliwonder_authenticated', 'true');
    localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));
  }, []);

  // Load and apply theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { loadAndApplyTheme } = await import('./utils/themeLoader');
        await loadAndApplyTheme();
      } catch (error) {
        errorLog('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Load system parameters on mount
  useEffect(() => {
    const loadParameters = async () => {
      try {
        await fetchSystemParameters();
        debugLog('✅ System parameters loaded');
      } catch (error) {
        errorLog('Error loading system parameters:', error);
      }
    };
    
    loadParameters();
  }, []);

  // Auto status checker - check every minute for status transitions
  useEffect(() => {
    // Skip if no sessions
    if (sessions.length === 0) {
      return;
    }

    const checkSessionStatuses = () => {
      const now = new Date();
      let hasChanges = false;

      const updatedSessions = sessions.map(session => {
        let updates: Partial<NetworkingSession> = {};

        // scheduled -> published: when registrationStart is in the past
        if (session.status === 'scheduled' && session.registrationStart) {
          const registrationStartTime = new Date(session.registrationStart);
          if (now >= registrationStartTime) {
            updates.status = 'published';
            hasChanges = true;
            debugLog(`✅ Session "${session.name}" transitioned from scheduled to published`);
          }
        }

        // published -> completed: when session endTime is reached
        if (session.status === 'published' && session.date && session.endTime) {
          const sessionEndTime = new Date(`${session.date}T${session.endTime}:00`);
          
          // Check if session should be completed
          if (now >= sessionEndTime) {
            updates.status = 'completed';
            hasChanges = true;
            debugLog(`🏁 Session "${session.name}" is now completed (endTime passed)`);
          }
        }

        return Object.keys(updates).length > 0 ? { ...session, ...updates } : session;
      });

      if (hasChanges) {
        setSessions(updatedSessions);
        
        // Update backend if authenticated
        updatedSessions.forEach(async (session, index) => {
          const oldSession = sessions[index];
          if (oldSession.status !== session.status) {
            // Update backend
            if (accessToken) {
              try {
                const { authenticatedFetch } = await import('./utils/supabase/apiClient');
                await authenticatedFetch(
                  `/sessions/${session.id}`,
                  {
                    method: 'PUT',
                    body: JSON.stringify({
                      status: session.status
                    }),
                  },
                  accessToken
                );
              } catch (error) {
                errorLog('Error updating session status in backend:', error);
              }
            }
          }
        });
      }
    };

    // Check immediately
    checkSessionStatuses();

    // Check every minute
    const interval = setInterval(checkSessionStatuses, 60000);

    return () => clearInterval(interval);
  }, [sessions, accessToken]);

  // Load sessions from backend with duplicate call prevention
  const loadSessions = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingSessionsRef.current) {
      debugLog('⏭️ Sessions already loading, skipping duplicate call');
      return;
    }

    debugLog('=== LOADING SESSIONS ===');
    debugLog('Access token:', accessToken ? 'present' : 'missing');
    debugLog('IsAuthenticated:', isAuthenticated);
    debugLog('Current user:', currentUser?.email);

    if (!accessToken) {
      debugLog('�� No valid token, sessions not loaded');
      return;
    }

    isLoadingSessionsRef.current = true;
    setIsLoadingSessions(true);

    try {
      debugLog('Making authenticated request to sessions endpoint...');
      
      const { authenticatedFetch } = await import('./utils/supabase/apiClient');
      const response = await authenticatedFetch('/sessions', {}, accessToken);

      debugLog('Sessions response status:', response.status);
      debugLog('Sessions response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        debugLog('Sessions loaded from backend (authenticated):', result);
        debugLog('Number of sessions:', result.sessions?.length || 0);
        
        // Convert old 'live' status to 'published' for backward compatibility
        const convertedSessions = (result.sessions || [])
          .map((session: any) => ({
            ...session,
            status: session.status === 'live' ? 'published' : session.status
          }))
          .filter((session: any) => {
            if (!session.id) {
              debugLog('️ Session without ID found and filtered out:', session);
              return false;
            }
            return true;
          });
        
        // Remove duplicates based on session.id (should not happen as backend now filters)
        const uniqueSessions = convertedSessions.reduce((acc: NetworkingSession[], current: NetworkingSession) => {
          const duplicate = acc.find(item => item.id === current.id);
          if (!duplicate) {
            return [...acc, current];
          }
          debugLog('⚠️ Frontend: Duplicate session found and filtered out (should be fixed by backend):', current.id);
          return acc;
        }, [] as NetworkingSession[]);
        
        setSessions(uniqueSessions);
        debugLog('✅ Sessions state updated with', uniqueSessions.length, 'sessions (', convertedSessions.length, 'before dedup)');
      } else {
        debugLog('❌ Failed to load sessions:', response.status);
        setSessions([]);
      }
    } catch (error) {
      errorLog('💥 Error loading sessions:', error);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
      isLoadingSessionsRef.current = false;
    }
  }, [accessToken, isAuthenticated, currentUser]);

  // Session management functions
  const addSession = async (session: Omit<NetworkingSession, 'id'>): Promise<NetworkingSession> => {
    debugLog('=== ADDING SESSION ===');
    debugLog('Session data:', session);
    debugLog('Access token:', accessToken ? 'present' : 'missing');

    if (accessToken) {
      try {
        const { authenticatedFetch } = await import('./utils/supabase/apiClient');
        const response = await authenticatedFetch(
          '/sessions',
          {
            method: 'POST',
            body: JSON.stringify(session),
          },
          accessToken
        );

        if (response.ok) {
          const result = await response.json();
          debugLog('Session added to backend:', result);
          
          // Optimistically add to local state immediately for instant UI update
          setSessions(prevSessions => [...prevSessions, result.session]);
          
          // Reload sessions from backend to ensure fresh data and get any server-side changes
          await loadSessions();
          
          const { toast } = await import('sonner@2.0.3');
          toast.success(`${session.name} created successfully`);
          
          return result.session;
        } else {
          const { toast } = await import('sonner@2.0.3');
          toast.error('Error creating round', {
            description: 'Failed to save to server.'
          });
          throw new Error('Failed to create session');
        }
      } catch (error) {
        errorLog('Error adding session:', error);
        const { toast } = await import('sonner@2.0.3');
        toast.error('Error creating round', {
          description: 'Network error.'
        });
        throw error;
      }
    }
    throw new Error('No access token available');
  };

  const updateSession = async (id: string, updates: Partial<NetworkingSession>) => {
    debugLog('=== UPDATING SESSION ===');
    debugLog('Session ID:', id);
    debugLog('Updates:', updates);
    debugLog('Access token:', accessToken ? 'present' : 'missing');

    const oldSession = sessions.find(s => s.id === id);
    const sessionName = oldSession?.name || 'Round';

    // Optimistically update local state immediately
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === id ? { ...session, ...updates } : session
      )
    );

    if (accessToken) {
      try {
        const { authenticatedFetch } = await import('./utils/supabase/apiClient');
        const response = await authenticatedFetch(
          `/sessions/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(updates),
          },
          accessToken
        );

        if (response.ok) {
          debugLog('Session updated on backend');
          
          // Reload sessions from backend to ensure fresh data
          await loadSessions();
          
          // Don't show toast if status is being changed to completed (specific toast is shown in component)
          if (updates.status !== 'completed') {
            const { toast } = await import('sonner@2.0.3');
            toast.success(`${sessionName} updated successfully`);
          }
        } else {
          // Revert optimistic update on failure
          setSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === id ? oldSession! : session
            )
          );
          
          const { toast } = await import('sonner@2.0.3');
          toast.error('Error updating round', {
            description: 'Round updated locally but server sync failed.'
          });
        }
      } catch (error) {
        errorLog('Error updating session on backend:', error);
        
        // Revert optimistic update on error
        if (oldSession) {
          setSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === id ? oldSession : session
            )
          );
        }
      }
    }
  };

  const deleteSession = async (id: string) => {
    debugLog('=== DELETING SESSION ===');
    debugLog('Session ID:', id);
    debugLog('Access token:', accessToken ? 'present' : 'missing');

    const sessionToDelete = sessions.find(s => s.id === id);
    const sessionName = sessionToDelete?.name || 'Round';

    setSessions(prevSessions => prevSessions.filter(session => session.id !== id));

    if (accessToken) {
      try {
        const { authenticatedFetch } = await import('./utils/supabase/apiClient');
        const response = await authenticatedFetch(
          `/sessions/${id}`,
          {
            method: 'DELETE',
          },
          accessToken
        );

        if (response.ok) {
          debugLog('Session deleted from backend');
          const { toast } = await import('sonner@2.0.3');
          toast.success(`${sessionName} deleted successfully`);
        } else {
          const { toast } = await import('sonner@2.0.3');
          toast.error('Error deleting round', {
            description: 'Round deleted locally but server sync failed.'
          });
        }
      } catch (error) {
        errorLog('Error deleting session:', error);
        const { toast } = await import('sonner@2.0.3');
        toast.error('Error deleting round', {
          description: 'Network error.'
        });
      }
    } else {
      const { toast } = await import('sonner@2.0.3');
      toast.success(`${sessionName} deleted successfully`);
    }
  };

  const duplicateSession = (session: NetworkingSession): Omit<NetworkingSession, 'id'> => {
    return {
      ...session,
      name: `${session.name} (Copy)`,
      status: 'draft',
      rounds: session.rounds.map(round => ({
        ...round,
        id: `${Date.now()}-${round.id}`
      }))
    };
  };

  const updateEventSlug = (slug: string) => {
    setEventSlug(slug);
    setTimeout(() => loadSessions(), 100);
  };

  const isAdminUser = () => {
    const adminEmails = ['jan.sramka+admin@gmail.com', 'jan.sramka@gmail.com', 'admin@oliwonder.com'];
    return currentUser?.email && adminEmails.includes(currentUser.email);
  };

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('./utils/supabase/client');
      await supabase.auth.signOut();
    } catch (error) {
      errorLog('Error signing out:', error);
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setAccessToken('');
    
    // Reset session load tracking
    lastSessionLoadPathRef.current = '';
    isLoadingSessionsRef.current = false;
    isInitializingAuthRef.current = false;

    // Clear any stored state (Supabase session is already cleared by signOut())
    localStorage.removeItem('oliwonder_authenticated');
    localStorage.removeItem('oliwonder_current_user');
    localStorage.removeItem('oliwonder_reset_access_token');
    localStorage.removeItem('oliwonder_reset_token_timestamp');

    // If on event page (/:slug) or participant page (/p/:token), stay on the page
    // Otherwise, redirect to homepage
    const currentPath = window.location.pathname;
    const isEventPage = currentPath !== '/' && 
                        !currentPath.startsWith('/signin') && 
                        !currentPath.startsWith('/signup') && 
                        !currentPath.startsWith('/dashboard') && 
                        !currentPath.startsWith('/reset-password') &&
                        !currentPath.startsWith('/admin');
    
    if (!isEventPage) {
      navigate('/');
    }
    // If on event/participant page, just stay on current page (don't navigate)
  };

  // Initialize PWA features
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Register service worker
        const { registerServiceWorker, getPWACapabilities, isOnline } = await import('./utils/pwa');
        
        const registration = await registerServiceWorker();
        if (registration) {
          debugLog('✅ PWA: Service Worker registered successfully');
        } else {
          debugLog('⚠️ PWA: Service Worker not available');
        }

        // Log PWA capabilities
        const capabilities = getPWACapabilities();
        debugLog('PWA capabilities:', capabilities);

        // Check online status
        debugLog('Online status:', isOnline());
      } catch (error) {
        errorLog('PWA initialization error:', error);
      }
    };

    initializePWA();
  }, []);

  // Handle initial load and auth state
  useEffect(() => {
    const handleInitialLoad = async () => {
      // Prevent duplicate initialization
      if (isInitializingAuthRef.current) {
        debugLog('⏭️ Auth already initializing, skipping duplicate call');
        return;
      }
      
      isInitializingAuthRef.current = true;
      
      debugLog('=== APP INITIAL LOAD ===');
      debugLog('Path:', window.location.pathname);
      debugLog('IsAuthenticated:', isAuthenticated);
      debugLog('Current user:', currentUser?.email);

      try {
        const { supabase } = await import('./utils/supabase/client');

        // Get current session from Supabase (will auto-restore from localStorage if configured)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        debugLog('Supabase session check:', {
          hasSession: !!session,
          hasError: !!error,
          errorMessage: error?.message
        });

        if (session && !error) {
          debugLog('✅ Valid Supabase session found (auto-restored from storage)');

          // Store access token in state
          setAccessToken(session.access_token);

          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
              {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const result = await response.json();

              // Batch update auth state - FIXED: use result.profile not result.user
              updateAuthState(result.profile, session.access_token);

              debugLog('✅ Auto-signed in user, sessions will load via useEffect');
              
              // Auth check is complete
              setIsAuthLoading(false);
              
              // If on homepage, redirect to dashboard (sessions will load via useEffect)
              if (location.pathname === '/') {
                navigate('/dashboard', { replace: true });
              }
              // Note: sessions will be loaded automatically by the useEffect that watches location.pathname
              return;
            }
          } catch (error) {
            errorLog('Error fetching user profile:', error);
          }
        }

        // Set up auth state listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          debugLog('🔐 Auth state changed:', event);
          debugLog('Session user:', session?.user?.email);
          debugLog('Session access_token:', session?.access_token ? 'EXISTS' : 'NULL');

          if (event === 'PASSWORD_RECOVERY' && session) {
            debugLog('🔑 PASSWORD_RECOVERY event detected');
            debugLog('Saving access token to localStorage');
            localStorage.setItem('oliwonder_reset_access_token', session.access_token);
            localStorage.setItem('oliwonder_reset_token_timestamp', Date.now().toString());
            debugLog('Navigating to /reset-password');
            navigate('/reset-password');
          } else if (event === 'SIGNED_IN' && session) {
            // SIGNED_IN is handled by SignInFlow -> handleSignInComplete
            // Don't navigate here to avoid duplicate navigation
            debugLog('⏭️ SIGNED_IN event detected but ignoring (handled by handleSignInComplete)');
            return;
          } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setAccessToken('');
            // Supabase session is already cleared
            localStorage.removeItem('oliwonder_authenticated');
            localStorage.removeItem('oliwonder_current_user');
            navigate('/');
          }
        });

      } catch (error) {
        errorLog('Error in initial load:', error);
      } finally {
        // Auth check is complete - allow route guards to proceed
        setIsAuthLoading(false);
        isInitializingAuthRef.current = false;
      }
    };

    handleInitialLoad();
  }, []);

  // Reload sessions when navigating to rounds or dashboard, or when accessToken becomes available
  useEffect(() => {
    const isDashboardOrRounds = location.pathname === '/rounds' || location.pathname === '/dashboard';
    
    debugLog('📍 Session load check:', {
      pathname: location.pathname,
      isDashboardOrRounds,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      lastLoadPath: lastSessionLoadPathRef.current
    });
    
    if (isDashboardOrRounds && isAuthenticated && accessToken) {
      // Only load if we haven't already loaded for this path
      if (lastSessionLoadPathRef.current !== location.pathname) {
        debugLog(`✅ ${location.pathname} route with valid auth - loading sessions...`);
        lastSessionLoadPathRef.current = location.pathname;
        loadSessions();
      } else {
        debugLog(`⏭️ Sessions already loaded for ${location.pathname}, skipping`);
      }
    } else if (isDashboardOrRounds) {
      debugLog(`⏸️ ${location.pathname} route but missing requirements:`, {
        isAuthenticated,
        hasAccessToken: !!accessToken
      });
    }
  }, [location.pathname, accessToken, isAuthenticated]);

  const contextValue: AppContextType = {
    isAuthenticated,
    currentUser,
    accessToken,
    serviceType,
    eventSlug,
    sessions,
    isLoadingSessions,
    isAuthLoading,
    setIsAuthenticated,
    setCurrentUser,
    setAccessToken,
    setServiceType,
    setEventSlug,
    setSessions,
    loadSessions,
    addSession,
    updateSession,
    deleteSession,
    duplicateSession,
    updateEventSlug,
    isAdminUser,
    handleSignOut
  };

  const h = React.createElement;
  
  return (
    <AppContext.Provider value={contextValue}>
      <TimeProvider>
        <QueryProvider>
          {h(Routes, null,
            h(Route, { path: '/', element: h(HomepageRoute) }),
            h(Route, { path: '/signup', element: h(SignUpRoute) }),
            h(Route, { path: '/signin', element: h(SignInRoute) }),
            h(Route, { path: '/reset-password', element: h(ResetPasswordRoute) }),
            h(Route, { path: '/dashboard', element: h(ProtectedRoute, null, h(DashboardRoute)) }),
            h(Route, { path: '/rounds', element: h(ProtectedRoute, null, h(RoundsRoute)) }),
            h(Route, { path: '/rounds/new', element: h(ProtectedRoute, null, h(RoundFormPageRoute)) }),
            h(Route, { path: '/rounds/:id', element: h(ProtectedRoute, null, h(RoundFormPageRoute)) }),
            h(Route, { path: '/rounds/:id/:action', element: h(ProtectedRoute, null, h(RoundFormPageRoute)) }),
            h(Route, { path: '/account-settings', element: h(ProtectedRoute, null, h(AccountSettingsRoute)) }),
            h(Route, { path: '/event-page-settings', element: h(ProtectedRoute, null, h(EventPageSettingsRoute)) }),
            h(Route, { path: '/event-promo', element: h(ProtectedRoute, null, h(EventPromoPageRoute)) }),
            h(Route, { path: '/billing', element: h(ProtectedRoute, null, h(BillingSettingsRoute)) }),
            h(Route, { path: '/admin', element: h(AdminRoute, null, h(AdminDashboardRoute)) }),
            h(Route, { path: '/admin/theme', element: h(AdminRoute, null, h(AdminThemeRoute)) }),
            h(Route, { path: '/admin/ice-breakers', element: h(AdminRoute, null, h(AdminIceBreakersRoute)) }),
            h(Route, { path: '/admin/notification-texts', element: h(AdminRoute, null, h(AdminNotificationTextsRoute)) }),
            h(Route, { path: '/admin/gift-cards', element: h(AdminRoute, null, h(AdminGiftCardsRoute)) }),
            h(Route, { path: '/admin/blog', element: h(AdminRoute, null, h(AdminBlogRoute)) }),
            h(Route, { path: '/admin/organizers', element: h(AdminRoute, null, h(AdminOrganizersRoute)) }),
            h(Route, { path: '/admin/participants', element: h(AdminRoute, null, h(AdminParticipantsRoute)) }),
            h(Route, { path: '/admin/sessions', element: h(AdminRoute, null, h(AdminSessionsRoute)) }),
            h(Route, { path: '/admin/statuses-guide', element: h(AdminRoute, null, h(AdminStatusesGuideRoute)) }),
            h(Route, { path: '/admin/participant-flow', element: h(AdminRoute, null, h(AdminParticipantFlowRoute)) }),
            h(Route, { path: '/admin/parameters', element: h(AdminRoute, null, h(AdminParametersRoute)) }),
            h(Route, { path: '/admin/organizer-requests', element: h(AdminRoute, null, h(AdminOrganizerRequestsRoute)) }),
            h(Route, { path: '/verify', element: h(EmailVerification) }),
            h(Route, { path: '/p/:token', element: h(ParticipantDashboard) }),
            h(Route, { path: '/p/:token/match', element: h(MatchInfo) }),
            h(Route, { path: '/p/:token/match-partner', element: h(MatchPartner) }),
            h(Route, { path: '/p/:token/networking', element: h(MatchNetworking) }),
            h(Route, { path: '/p/:token/profile', element: h(ParticipantProfile) }),
            h(Route, { path: '/p/:token/r/:roundId', element: h(ParticipantRoundDetail) }),
            h(Route, { path: '/bootstrap-admin', element: h(BootstrapAdminRoute) }),
            h(Route, { path: '/blog', element: h(BlogListingPageRoute) }),
            h(Route, { path: '/blog/:slug', element: h(BlogDetailPageRoute) }),
            
            // User public pages (must be near end to avoid catching other routes)
            h(Route, { path: '/:slug', element: h(UserPublicPageRoute) }),
            h(Route, { path: '/:slug/:view', element: h(UserPublicPageRoute) }),
            
            // 404 catch-all (must be last)
            h(Route, { path: '*', element: h(NotFoundRoute) })
          )}
          <Toaster />
          {/* Bottom right tools */}
          <div className="fixed bottom-4 right-4 z-50">
            <TimeControl />
          </div>
        </QueryProvider>
      </TimeProvider>
    </AppContext.Provider>
  );
}