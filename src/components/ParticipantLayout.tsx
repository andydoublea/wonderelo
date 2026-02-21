import { Outlet, useNavigate, useParams } from 'react-router';
import { ParticipantNav } from './ParticipantNav';
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
  
  debugLog('✅ ParticipantLayout rendering - Build time: 2024-11-03 16:00');

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.removeItem('participant_token');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ParticipantNav
        participantToken={participantToken || token}
        firstName={firstName}
        lastName={lastName}
        onLogoClick={() => {
          // Navigate to homepage
          navigate('/');
        }}
        onHomeClick={() => {
          // Allow participant to browse homepage without auto-redirect
          debugLog('🔵 Logo clicked - setting allow_participant_browsing flag');
          sessionStorage.setItem('allow_participant_browsing', 'true');
          debugLog('🔵 Flag set, navigating to homepage');
          navigate('/');
        }}
        onDashboardClick={() => {
          // Navigate to participant dashboard
          const currentToken = participantToken || token;
          if (currentToken) {
            navigate(`/p/${currentToken}`);
          }
        }}
        onProfileClick={() => {
          // Navigate to participant profile page
          const currentToken = participantToken || token;
          if (currentToken) {
            navigate(`/p/${currentToken}/profile`);
          }
        }}
        onAddressBookClick={() => {
          const currentToken = participantToken || token;
          if (currentToken) {
            navigate(`/p/${currentToken}/address-book`);
          }
        }}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {children || <Outlet />}
      </div>
    </div>
  );
}