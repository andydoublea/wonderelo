import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { hasUpcomingRounds } from '../utils/sessionStatus';
import { debugLog, errorLog } from '../utils/debug';
import { APP_VERSION } from '../utils/version';
import { fetchSystemParameters } from '../utils/systemParameters';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Users, User, LogOut, LogIn, Calendar, Loader2, HelpCircle } from 'lucide-react';
import { OrganizerHeader } from './OrganizerHeader';
import { SessionRegistration } from './SessionRegistration';
import { EmailVerification } from './EmailVerification';
import { ParticipantNav } from './ParticipantNav';
import { NetworkingSession } from '../App';

// Helper function to validate email
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface UserPublicPageProps {
  userSlug: string;
  onBack?: () => void;
  isPreview?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  urlSlug: string;
  serviceType: string;
  userRole?: string;
  companySize?: string;
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
}

export function UserPublicPage({ userSlug, onBack, isPreview = false }: UserPublicPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<NetworkingSession[]>([]);
  const [error, setError] = useState('');
  const [view, setView] = useState<'registration' | 'verify'>('registration');
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testSmsDialogOpen, setTestSmsDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [howItWorksDialogOpen, setHowItWorksDialogOpen] = useState(false);
  const [registeredRoundIds, setRegisteredRoundIds] = useState<string[]>([]);
  const [registeredRoundsMap, setRegisteredRoundsMap] = useState<Map<string, string>>(new Map());
  const [registeredRoundsPerSession, setRegisteredRoundsPerSession] = useState<Map<string, Set<string>>>(new Map());
  const [participantProfile, setParticipantProfile] = useState<any>(() => {
    try {
      const token = localStorage.getItem('participant_token');
      if (token) {
        const cached = localStorage.getItem(`participant_profile_${token}`);
        if (cached) {
          const data = JSON.parse(cached);
          return {
            id: data.participantId,
            email: data.email,
            phone: data.phone,
            phoneCountry: data.phoneCountry,
            firstName: data.firstName,
            lastName: data.lastName
          };
        }
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return null;
  });
  const [participantStatusMap, setParticipantStatusMap] = useState<Map<string, string>>(new Map());
  const [registrationStep, setRegistrationStep] = useState<'select-rounds' | 'auth-choice' | 'meeting-points' | 'email-verification-waiting' | 'confirmation'>('select-rounds');

  const buildNumber = parseInt(APP_VERSION.replace('Build ', '')) + 2;
  const displayVersion = `Build ${buildNumber}`;

  useEffect(() => {
    (async () => {
      try {
        await fetchSystemParameters();
      } catch (err) {
        errorLog('Failed to load system parameters:', err);
      }
    })();
    
    const token = localStorage.getItem('participant_token');
    
    if (token) {
      debugLog('✅ Participant has token, allowing access to event page');
      setParticipantToken(token);
      
      fetchParticipantRegistrations(token).catch(err => {
        errorLog('Failed to fetch participant registrations:', err);
      });
    }
    
    fetchUserData();
    checkAccessToken();
    
    const pollInterval = setInterval(() => {
      debugLog('Auto-refreshing event page data...');
      fetchUserData();
      if (token) {
        fetchParticipantRegistrations(token).catch(err => {
          errorLog('Failed to fetch participant registrations:', err);
        });
      }
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [userSlug, location.pathname, location.search]);

  useEffect(() => {
    const displayName = userProfile?.eventName || userProfile?.organizerName;
    if (displayName) {
      document.title = `Wonderelo – ${displayName}`;
    } else {
      document.title = 'Wonderelo';
    }
  }, [userProfile]);

  const checkAccessToken = () => {
    const isVerifyPath = location.pathname.endsWith('/verify');
    
    if (isVerifyPath) {
      setView('verify');
      return;
    }
    
    setView('registration');
  };

  const fetchUserData = async () => {
    try {
      setError('');

      debugLog('=== USER EVENT PAGE DEBUG ===');
      debugLog('Fetching public user data for slug:', userSlug);
      debugLog('Current URL:', window.location.href);
      debugLog('Timestamp:', new Date().toISOString());
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/public/user/${userSlug}`;
      debugLog('Request URL:', url);
      debugLog('Project ID:', projectId);
      debugLog('Public Anon Key:', publicAnonKey ? 'Present' : 'Missing');

      try {
        debugLog('Testing server connectivity...');
        const testResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/test`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        debugLog('Test endpoint status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          debugLog('Server is accessible:', testData);
        } else {
          debugLog('Server test failed with status:', testResponse.status);
        }
      } catch (testError) {
        errorLog('Server connectivity test failed:', testError);
      }

      let response;
      try {
        response = await fetch(url,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (fetchError) {
        errorLog('Fetch failed - network error or CORS issue:', fetchError);
        errorLog('Fetch error details:', {
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        throw fetchError;
      }

      debugLog('Response status:', response.status);
      debugLog('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        debugLog('Full API response:', result);
        debugLog('User profile:', result.user);
        debugLog('Sessions found:', result.sessions?.length || 0);
        debugLog('Sessions data:', result.sessions);
        
        if (result.sessions && result.sessions.length > 0) {
          debugLog('📋 DETAILED SESSION INFO FROM BACKEND:');
          result.sessions.forEach((s: any, index: number) => {
            const now = new Date();
            const regStart = s.registrationStart ? new Date(s.registrationStart) : null;
            debugLog(`  Session ${index + 1}:`, {
              name: s.name,
              id: s.id,
              status: s.status,
              registrationStart: s.registrationStart,
              registrationStartParsed: regStart?.toISOString(),
              currentTime: now.toISOString(),
              isRegStartInPast: regStart ? now >= regStart : 'N/A',
              date: s.date,
              startTime: s.startTime,
              rounds: s.rounds?.length || 0
            });
          });
        } else {
          debugLog('⚠️ NO SESSIONS RETURNED FROM BACKEND');
          debugLog('Backend response sessions:', result.sessions);
        }
        
        setUserProfile(result.user);
        setSessions(result.sessions || []);
      } else if (response.status === 301) {
        // Slug was changed — redirect to the new slug
        const redirectData = await response.json();
        if (redirectData.redirect && redirectData.newSlug) {
          debugLog('🔀 Slug redirect: old slug', userSlug, '→ new slug', redirectData.newSlug);
          navigate(`/${redirectData.newSlug}`, { replace: true });
          return;
        }
        setError('User not found');
      } else if (response.status === 404) {
        const errorData = await response.json();
        debugLog('404 Error response:', errorData);
        if (userSlug.includes('.') || userSlug.includes('_page')) {
          debugLog('Invalid slug detected, redirecting to homepage...');
          navigate('/', { replace: true });
          return;
        }
        setError('User not found');
      } else {
        const errorData = await response.json();
        debugLog('Error response:', errorData);
        setError('Failed to load user data');
      }
    } catch (error) {
      errorLog('Error fetching user data:', error);
      setError('Network error');
    }
  };

  const fetchParticipantRegistrations = async (token: string) => {
    try {
      debugLog('🔍 Fetching participant registrations for token:', token.substring(0, 20));
      debugLog('🔍 Full token (for debugging):', token);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('✅ Participant data:', data);
        debugLog('✅ Participant ID:', data.participantId);
        debugLog('✅ Participant email:', data.email);
        debugLog('✅ firstName from backend:', data.firstName);
        debugLog('✅ lastName from backend:', data.lastName);
        debugLog('✅ phone from backend:', data.phone);
        debugLog('✅ phoneCountry from backend:', data.phoneCountry);
        debugLog('✅ Registered rounds count:', data.registrations?.length || 0);
        
        setParticipantProfile({
          id: data.participantId,
          email: data.email,
          phone: data.phone,
          phoneCountry: data.phoneCountry,
          firstName: data.firstName,
          lastName: data.lastName
        });
        
        debugLog('✅ participantProfile set to:', {
          id: data.participantId,
          email: data.email,
          phone: data.phone,
          phoneCountry: data.phoneCountry,
          firstName: data.firstName,
          lastName: data.lastName
        });
        
        const roundIds: string[] = [];
        const roundsMap: Map<string, string> = new Map();
        const roundsPerSession: Map<string, Set<string>> = new Map();
        const participantStatusMap: Map<string, string> = new Map();
        if (data.registrations && Array.isArray(data.registrations)) {
          data.registrations.forEach((round: any) => {
            if (round.roundId) {
              roundIds.push(round.roundId);
              roundsMap.set(round.roundId, round.status);
              debugLog('  📝 Round:', round.roundName, '| Status:', round.status, '| RoundId:', round.roundId);
              
              if (round.sessionId) {
                if (!roundsPerSession.has(round.sessionId)) {
                  roundsPerSession.set(round.sessionId, new Set());
                }
                roundsPerSession.get(round.sessionId)?.add(round.roundId);
              }
              
              if (round.status) {
                participantStatusMap.set(round.roundId, round.status);
              }
            }
          });
        }
        
        debugLog('📝 Registered round IDs:', roundIds);
        setRegisteredRoundIds(roundIds);
        setRegisteredRoundsMap(roundsMap);
        setRegisteredRoundsPerSession(roundsPerSession);
        setParticipantStatusMap(participantStatusMap);
      } else {
        debugLog('Failed to fetch participant registrations:', response.status);
        if (response.status === 404) {
          debugLog('⚠️ Token not found - participant may not have any registrations yet');
        }
      }
    } catch (error) {
      errorLog('Error fetching participant registrations:', error);
    }
  };

  const isRegistrationOpen = (session: NetworkingSession): boolean => {
    if (session.status !== 'published') {
      debugLog(`❌ Session "${session.name}" not published (status: ${session.status})`);
      return false;
    }
    
    const now = new Date();
    
    if (session.date && session.endTime) {
      const sessionEndTime = new Date(`${session.date}T${session.endTime}:00`);
      if (now >= sessionEndTime) {
        debugLog(`❌ Session "${session.name}" already ended (endTime: ${session.endTime})`);
        return false;
      }
    }
    
    if (!hasUpcomingRounds(session)) {
      debugLog(`❌ Session "${session.name}" has no upcoming rounds (all rounds started or finished)`);
      return false;
    }
    
    if (!session.registrationStart) {
      debugLog(`⚠️ Session "${session.name}" has no registrationStart - showing it anyway`);
      return true;
    }
    
    const registrationStartTime = new Date(session.registrationStart);
    
    const isOpen = now >= registrationStartTime;
    debugLog(`🕐 Session "${session.name}" registration check:`, {
      status: session.status,
      registrationStart: session.registrationStart,
      now: now.toISOString(),
      registrationStartTime: registrationStartTime.toISOString(),
      isOpen
    });
    
    return isOpen;
  };
  
  const availableForRegistration = sessions.filter(s => 
    s.status === 'published' && 
    isRegistrationOpen(s)
  );
  
  debugLog('📊 AVAILABLE SESSIONS FOR REGISTRATION:', {
    totalSessions: sessions.length,
    publishedSessions: sessions.filter(s => s.status === 'published').length,
    availableForRegistration: availableForRegistration.length,
    allSessionsStatuses: sessions.map(s => ({ name: s.name, status: s.status, registrationStart: s.registrationStart }))
  });
  
  debugLog('🎨 RENDER DECISION:', {
    hasError: !!error,
    hasUserProfile: !!userProfile,
    availableSessionsCount: availableForRegistration.length,
    willRenderEmptyState: userProfile && availableForRegistration.length === 0,
    willRenderSkeleton: !userProfile,
    willRenderRegistration: userProfile && availableForRegistration.length > 0
  });

  const handleSendTestEmail = async () => {
    if (!testEmail || !validateEmail(testEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setIsSendingTestEmail(true);
      
      debugLog('🧪 Sending test verification email to:', testEmail);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/test-verification-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        }
      );

      debugLog('Test email response status:', response.status);
      const data = await response.json();
      debugLog('Test email response data:', data);

      if (response.ok && data.success) {
        toast.success('Test verification email sent! Check your inbox (or andy.double.a@gmail.com if in testing mode)');
        setTestEmailDialogOpen(false);
        setTestEmail('');
      } else {
        toast.error(data.error || data.message || 'Failed to send test email');
        debugLog('Test email error details:', data.details);
      }
    } catch (error) {
      errorLog('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhoneNumber || !testPhoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setIsSendingTestSms(true);
      
      debugLog('🧪 Sending test SMS to:', testPhoneNumber);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/test-sms`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: testPhoneNumber }),
        }
      );

      debugLog('Test SMS response status:', response.status);
      const data = await response.json();
      debugLog('Test SMS response data:', data);

      if (response.ok && data.success) {
        toast.success(`Test SMS sent! Message SID: ${data.messageSid}`);
        setTestSmsDialogOpen(false);
        setTestPhoneNumber('');
      } else {
        toast.error(data.error || 'Failed to send test SMS');
        debugLog('Test SMS error details:', data.details);
      }
    } catch (error) {
      errorLog('Error sending test SMS:', error);
      toast.error('Failed to send test SMS');
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!magicLinkEmail || !validateEmail(magicLinkEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setIsSendingMagicLink(true);
      
      debugLog('Sending magic link request for:', magicLinkEmail);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/send-magic-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: magicLinkEmail,
            userSlug
          }),
        }
      );

      debugLog('Magic link response status:', response.status);
      const data = await response.json();
      debugLog('Magic link response data:', data);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('No registrations found for this email');
        } else {
          toast.error(data.error || 'Failed to send magic link');
        }
        return;
      }

      if (data.magicLink) {
        debugLog('Magic link:', data.magicLink);
        toast.success('Magic link (dev mode - check console)', {
          description: 'In production, this will be sent via email',
          duration: 5000
        });
        setTimeout(() => {
          window.location.href = data.magicLink;
        }, 1500);
      } else {
        toast.success('Check your email for the magic link!', {
          description: 'We sent you a secure link to access your registrations'
        });
      }
      
      setMagicLinkDialogOpen(false);
      setMagicLinkEmail('');
    } catch (error) {
      errorLog('Error sending magic link:', error);
      toast.error('Failed to send magic link');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2">User not found</h2>
            <p className="text-muted-foreground mb-6">
              {error === 'User not found' 
                ? `No user found with the URL slug "${userSlug}"`
                : error
              }
            </p>
            <Button onClick={() => navigate('/')}>
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile && availableForRegistration.length === 0) {
    debugLog('🔴 RENDERING EMPTY STATE - No sessions available');
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {participantToken ? (
          <ParticipantNav
            participantToken={participantToken}
            firstName={participantProfile?.firstName}
            lastName={participantProfile?.lastName}
            onLogoClick={() => navigate('/')}
            onHomeClick={() => navigate('/')}
            onDashboardClick={() => navigate(`/p/${participantToken}`)}
            onProfileClick={() => navigate(`/p/${participantToken}/profile`)}
            onLogout={() => {
              localStorage.removeItem('participant_token');
              setParticipantToken(null);
              setParticipantProfile(null);
              toast.success('Logged out successfully');
              navigate('/');
            }}
          />
        ) : (
          <nav className="border-b border-border">
            <div className="container mx-auto max-w-4xl px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 
                  className="text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => navigate('/')}
                >
                  Wonderelo
                </h2>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => setMagicLinkDialogOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Manage my rounds
                  </Button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
          <OrganizerHeader 
            profileImageUrl={userProfile?.profileImageUrl}
            eventName={userProfile?.eventName}
            organizerName={userProfile?.organizerName}
            variant="boxed"
          />

          <div className="mb-8">

          </div>

          <div className="text-center py-12 flex-1">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No rounds available</h3>
            <p className="text-muted-foreground">
              Please check back later
            </p>
          </div>

          <Dialog open={magicLinkDialogOpen} onOpenChange={setMagicLinkDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Access your registrations</DialogTitle>
                <DialogDescription>
                  Enter your email to receive a magic link to manage your registered rounds.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-link-email-empty-state">Email</Label>
                  <Input
                    id="magic-link-email-empty-state"
                    type="email"
                    placeholder="your.email@example.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMagicLink();
                      }
                    }}
                    disabled={isSendingMagicLink}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a secure link to access your registrations.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMagicLinkDialogOpen(false);
                    setMagicLinkEmail('');
                  }}
                  disabled={isSendingMagicLink}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMagicLink}
                  disabled={isSendingMagicLink || !magicLinkEmail}
                >
                  {isSendingMagicLink ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-12 pt-8 border-t text-center">
            <div className="text-sm text-muted-foreground">
              <p>
                Powered by{' '}
                <a 
                  href="https://wonderelo.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium hover:text-foreground transition-colors"
                >
                  Wonderelo
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    debugLog('🟡 RENDERING SKELETON - Waiting for userProfile to load');
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {participantToken ? (
          <ParticipantNav
            participantToken={participantToken}
            firstName={participantProfile?.firstName}
            lastName={participantProfile?.lastName}
            onLogoClick={() => navigate('/')}
            onHomeClick={() => navigate('/')}
            onDashboardClick={() => navigate(`/p/${participantToken}`)}
            onProfileClick={() => navigate(`/p/${participantToken}/profile`)}
            onLogout={() => {
              localStorage.removeItem('participant_token');
              setParticipantToken(null);
              setParticipantProfile(null);
              toast.success('Logged out successfully');
              navigate('/');
            }}
          />
        ) : (
          <nav className="border-b border-border">
            <div className="container mx-auto max-w-4xl px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 
                  className="text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => navigate('/')}
                >
                  Wonderelo
                </h2>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => setMagicLinkDialogOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Manage my rounds
                  </Button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="h-20 w-20 rounded-full mb-4" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>

          <div className="mb-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto" />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pr-4 pb-6 pl-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex items-center gap-4 mt-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="mt-12 pt-8 border-t text-center">
            <div className="text-sm text-muted-foreground">
              <p>
                Powered by{' '}
                <a 
                  href="https://wonderelo.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium hover:text-foreground transition-colors"
                >
                  Wonderelo
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'verify') {
    return <EmailVerification userSlug={userSlug} />;
  }

  debugLog('🟢 RENDERING REGISTRATION FORM - Default view with SessionRegistration');
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {participantToken ? (
        <ParticipantNav
          participantToken={participantToken}
          firstName={participantProfile?.firstName}
          lastName={participantProfile?.lastName}
          onLogoClick={() => navigate('/')}
          onHomeClick={() => navigate('/')}
          onDashboardClick={() => navigate(`/p/${participantToken}`)}
          onProfileClick={() => navigate(`/p/${participantToken}/profile`)}
          onLogout={() => {
            localStorage.removeItem('participant_token');
            setParticipantToken(null);
            setParticipantProfile(null);
            toast.success('Logged out successfully');
            navigate('/');
          }}
        />
      ) : (
        <nav className="border-b border-border">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 
                className="text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/')}
              >
                Wonderelo
              </h2>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => setMagicLinkDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Manage my rounds
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
        <div className="max-w-md mx-auto w-full space-y-4">
          <OrganizerHeader 
            profileImageUrl={userProfile?.profileImageUrl}
            eventName={userProfile?.eventName}
            organizerName={userProfile?.organizerName}
            variant="boxed"
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => setHowItWorksDialogOpen(true)}
              className="flex items-center gap-1 text-sm text-foreground underline hover:text-primary mx-auto"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              How it works
            </button>
          </div>

          {registrationStep === 'select-rounds' && (
            <div className="text-center pt-4">
              <h1 className="text-3xl font-bold">When can we mix you in?</h1>
            </div>
          )}

          <SessionRegistration 
            sessions={availableForRegistration}
            userSlug={userSlug}
            eventName={userProfile?.eventName || userProfile?.organizerName || ''}
            registeredRoundIds={registeredRoundIds}
            registeredRoundsMap={registeredRoundsMap}
            registeredRoundsPerSession={registeredRoundsPerSession}
            participantProfile={participantProfile}
            participantToken={participantToken}
            participantStatusMap={participantStatusMap}
            onStepChange={setRegistrationStep}
          />
        </div>

        <div className="mt-12 pt-8 border-t text-center">
          <div className="text-sm text-muted-foreground">
            <p>
              Powered by{' '}
              <a 
                href="https://wonderelo.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
              >
                Wonderelo
              </a>
            </p>
          </div>
        </div>
      </div>

      <Dialog open={magicLinkDialogOpen} onOpenChange={setMagicLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access your registrations</DialogTitle>
            <DialogDescription>
              Enter your email to receive a magic link to manage your registered rounds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="magic-link-email-main">Email</Label>
              <Input
                id="magic-link-email-main"
                type="email"
                placeholder="your.email@example.com"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMagicLink();
                  }
                }}
                disabled={isSendingMagicLink}
              />
              <p className="text-xs text-muted-foreground">
                We'll send you a secure link to access your registrations.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMagicLinkDialogOpen(false);
                setMagicLinkEmail('');
              }}
              disabled={isSendingMagicLink}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMagicLink}
              disabled={isSendingMagicLink || !magicLinkEmail}
            >
              {isSendingMagicLink ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send magic link'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={howItWorksDialogOpen} onOpenChange={setHowItWorksDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How it works
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Register to rounds</p>
                <p className="text-sm text-muted-foreground">Choose times when you are available to meet and give us your contacts</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Confirm attendance</p>
                <p className="text-sm text-muted-foreground">You will get a reminder 5 minutes before the round to confirm you are in. Stay close to meeting points.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Meet someone new</p>
                <p className="text-sm text-muted-foreground">We will pick a match for you with a meeting place. You have 3 minutes to meeting with your match – confirm it by scanning your match's QR code.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Decide whether to go on</p>
                <p className="text-sm text-muted-foreground">If both parties decide to exchange contacts, Wonderelo will send it to you 30 minutes after the meeting.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}