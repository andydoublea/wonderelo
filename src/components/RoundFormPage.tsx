import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { SessionForm } from './SessionForm';
import { debugLog } from '../utils/debug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { NetworkingSession } from '../App';

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
      const newSession = await onAddSession(sessionData);
      navigate(`/rounds?success=${newSession.id}`);
    }
  };

  const handleCancel = () => {
    navigate('/rounds');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isEditing = id && id !== 'new' && action !== 'duplicate';
  const isDuplicating = action === 'duplicate';

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit networking round' : isDuplicating ? 'Duplicate networking round' : 'Create new networking round'}
          </CardTitle>

        </CardHeader>
        <CardContent>
          <SessionForm
            initialData={initialData}
            onSubmit={handleSave}
            onCancel={handleCancel}
            userEmail={userEmail}
            organizerName={organizerName}
            profileImageUrl={profileImageUrl}
            userSlug={userSlug}
            isDuplicate={action === 'duplicate'}
          />
        </CardContent>
      </Card>
    </div>
  );
}