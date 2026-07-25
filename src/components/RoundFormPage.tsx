import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { SessionForm } from './SessionForm';
import { debugLog } from '../utils/debug';
import { C, PageShell, PageHead, Italic } from './redesign/organizerAtoms';
import { NetworkingSession } from '../App';

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface RoundFormPageViewProps {
  isEditing: boolean;
  isDuplicating: boolean;
  initialData: NetworkingSession | Omit<NetworkingSession, 'id'> | null;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  userSlug?: string;
  onSave: (sessionData: Omit<NetworkingSession, 'id'>) => Promise<void> | void;
  onCancel: () => void;
}

export function RoundFormPageView({
  isEditing,
  isDuplicating,
  initialData,
  userEmail,
  organizerName,
  profileImageUrl,
  userSlug,
  onSave,
  onCancel,
}: RoundFormPageViewProps) {
  const eyebrow = isEditing ? 'Edit round' : isDuplicating ? 'Duplicate round' : 'New round';
  const titleVerb = isEditing ? 'Edit' : isDuplicating ? 'Duplicate' : 'Create';
  // `.wonderelo` marks the redesigned brand surface. No OrgNav here: the route
  // (AppRouter → RoundFormPageRoute) already renders AuthenticatedNav + Footer,
  // so PageShell runs with nav={false} footer={false} to avoid a double chrome.
  return (
    <div className="wonderelo">
      <PageShell nav={false} footer={false} bg={C.paper}>
        <PageHead eyebrow={eyebrow} title={<>{titleVerb} a <Italic>round</Italic></>} />
        <SessionForm
          initialData={initialData}
          onSubmit={onSave}
          onCancel={onCancel}
          userEmail={userEmail}
          organizerName={organizerName}
          profileImageUrl={profileImageUrl}
          userSlug={userSlug}
          isDuplicate={isDuplicating}
        />
      </PageShell>
    </div>
  );
}

interface RoundFormPageProps {
  sessions: NetworkingSession[];
  isLoadingSessions?: boolean;
  onAddSession: (session: Omit<NetworkingSession, 'id'>) => Promise<NetworkingSession>;
  onUpdateSession: (id: string, updates: Partial<NetworkingSession>) => void;
  onDuplicateSession: (session: NetworkingSession) => Omit<NetworkingSession, 'id'>;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  userSlug?: string;
}

export function RoundFormPage({
  sessions,
  isLoadingSessions = false,
  onAddSession,
  onUpdateSession,
  onDuplicateSession,
  userEmail,
  organizerName,
  profileImageUrl,
  userSlug
}: RoundFormPageProps) {
  const navigate = useNavigate();
  const { id, action } = useParams<{ id?: string; action?: string }>();
  const [initialData, setInitialData] = useState<NetworkingSession | Omit<NetworkingSession, 'id'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for sessions to load before trying to find the session
    if (isLoadingSessions) {
      setIsLoading(true);
      return;
    }

    // If editing, find the session
    if (id && id !== 'new') {
      const session = sessions.find(s => s.id === id);
      if (session) {
        // Check if duplicating
        if (action === 'duplicate') {
          setInitialData(onDuplicateSession(session));
        } else {
          setInitialData(session);
        }
      } else {
        // Session not found, redirect to rounds
        debugLog(`Session with id ${id} not found. Available sessions:`, sessions.map(s => ({ id: s.id, name: s.name })));
        navigate('/rounds');
        return;
      }
    }
    setIsLoading(false);
  }, [id, action, sessions, isLoadingSessions, navigate, onDuplicateSession]);

  const handleSave = async (sessionData: Omit<NetworkingSession, 'id'>) => {
    if (id && id !== 'new' && action !== 'duplicate' && initialData && 'id' in initialData) {
      // Updating existing session
      await onUpdateSession(initialData.id, sessionData);
      navigate(`/rounds?highlight=${initialData.id}`);
    } else {
      // Creating new session or duplicating
      // Pre-store session data in sessionStorage BEFORE calling addSession
      // so success page is guaranteed to show even if addSession returns undefined
      const tempSession = { ...sessionData, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() };
      sessionStorage.setItem('wonderelo_success_session', JSON.stringify(tempSession));
      console.log('🚀 [RoundFormPage] Pre-stored session in sessionStorage:', tempSession.name);

      try {
        const newSession = await onAddSession(sessionData);
        console.log('🚀 [RoundFormPage] addSession returned:', newSession ? `${newSession.name} (id: ${newSession.id})` : 'UNDEFINED');
        // Update with real session data from backend (has real ID)
        if (newSession) {
          sessionStorage.setItem('wonderelo_success_session', JSON.stringify(newSession));
        }
      } catch (err) {
        console.error('🚀 [RoundFormPage] addSession FAILED:', err);
        // addSession failed — remove sessionStorage so success page doesn't show
        sessionStorage.removeItem('wonderelo_success_session');
        throw err; // re-throw so SessionForm can handle it
      }
      console.log('🚀 [RoundFormPage] Navigating to /rounds. sessionStorage has:', sessionStorage.getItem('wonderelo_success_session') ? 'YES' : 'NO');
      navigate('/rounds');
    }
  };

  const handleCancel = () => {
    navigate('/rounds');
  };

  if (isLoading) {
    return (
      <div className="wonderelo">
        <PageShell nav={false} footer={false} bg={C.paper}>
          <p style={{ fontFamily: C.fontBody, fontSize: 15, color: C.ink, opacity: .7, padding: '40px 0' }}>Loading…</p>
        </PageShell>
      </div>
    );
  }

  const isEditing = !!(id && id !== 'new' && action !== 'duplicate');
  const isDuplicating = action === 'duplicate';

  return (
    <RoundFormPageView
      isEditing={isEditing}
      isDuplicating={isDuplicating}
      initialData={initialData}
      userEmail={userEmail}
      organizerName={organizerName}
      profileImageUrl={profileImageUrl}
      userSlug={userSlug}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}