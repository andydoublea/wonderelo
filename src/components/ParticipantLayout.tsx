import { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { ParticipantNav } from './ParticipantNav';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { debugLog } from '../utils/debug';
import { ReactNode } from 'react';

interface ParticipantLayoutProps {
  participantToken?: string;
  onLogout?: () => void;
  firstName?: string;
  lastName?: string;
  children?: ReactNode;
}

export function ParticipantLayout({ participantToken, onLogout, firstName, lastName, children }: ParticipantLayoutProps) {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [joinCode, setJoinCode] = useState('');

  debugLog('✅ ParticipantLayout rendering - Build time: 2024-11-03 16:00');

  const currentToken = participantToken || token;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.removeItem('participant_token');
      navigate('/');
    }
  };

  const handleJoinRound = () => {
    if (joinCode.trim()) {
      const cleanCode = joinCode.trim().toLowerCase();
      navigate(`/${cleanCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ParticipantNav
        participantToken={currentToken}
        firstName={firstName}
        lastName={lastName}
        onLogoClick={() => {
          // Navigate to participant dashboard (not homepage to avoid flash)
          if (currentToken) {
            navigate(`/p/${currentToken}`);
          }
        }}
        onHomeClick={() => {
          // Allow participant to browse homepage without auto-redirect
          debugLog('🔵 Logo clicked - setting allow_participant_browsing flag');
          sessionStorage.setItem('allow_participant_browsing', 'true');
          debugLog('🔵 Flag set, navigating to homepage');
          navigate('/');
        }}
        onDashboardClick={() => {
          if (currentToken) {
            navigate(`/p/${currentToken}`);
          }
        }}
        onProfileClick={() => {
          if (currentToken) {
            navigate(`/p/${currentToken}/profile`);
          }
        }}
        onAddressBookClick={() => {
          if (currentToken) {
            navigate(`/p/${currentToken}/address-book`);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Join round bar */}
      <section className="py-3 px-6 border-b border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              To join a round
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground pointer-events-none z-10">#</span>
                <Input
                  type="text"
                  placeholder="enter code here"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinRound();
                  }}
                  className="pl-8 text-left h-8 w-40"
                />
              </div>
              <Button
                size="sm"
                disabled={!joinCode.trim()}
                className="h-8"
                onClick={handleJoinRound}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {children || <Outlet />}
      </div>
    </div>
  );
}