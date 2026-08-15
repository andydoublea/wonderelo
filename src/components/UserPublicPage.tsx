import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

import { debugLog, errorLog } from '../utils/debug';
import { APP_VERSION } from '../utils/version';
import { getParametersOrDefault } from '../utils/systemParameters';
import { isSessionLiveOnEventPage } from '../utils/sessionStatus';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2 } from 'lucide-react';
import { SessionRegistration } from './SessionRegistration';
import { EmailVerification } from './EmailVerification';
import { NetworkingSession } from '../App';
import { C } from './redesign/organizerAtoms';
import { StatePlaceholder, Skeleton as StateSkeleton, SkeletonRow, Spinner, StateButton, RefreshIcon, Italic } from './redesign/StatePlaceholder';

// Helper function to validate email
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface UserPublicPageProps {
  userSlug: string;
  onBack?: () => void;
  isPreview?: boolean;
}

export interface UserProfile {
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

export interface UserPublicPageViewProps {
  userSlug: string;
  userProfile: UserProfile;
  availableSessions: NetworkingSession[];
  participantToken: string | null;
  participantProfile: any;
  registeredRoundIds: string[];
  registeredRoundsMap: Map<string, string>;
  registeredRoundsPerSession: Map<string, Set<string>>;
  registeredRoundSelections: Map<string, { team?: string; topic?: string; topics?: string[] }>;
  participantStatusMap: Map<string, string>;
  registrationStep: 'select-rounds' | 'auth-choice' | 'meeting-points' | 'email-verification-waiting' | 'confirmation';
  magicLinkDialogOpen: boolean;
  magicLinkEmail: string;
  isSendingMagicLink: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onMagicLinkDialogOpenChange: (open: boolean) => void;
  onMagicLinkEmailChange: (email: string) => void;
  onSendMagicLink: () => void;
  onRegistrationStepChange: (step: 'select-rounds' | 'auth-choice' | 'meeting-points' | 'email-verification-waiting' | 'confirmation') => void;
}

export function UserPublicPageView({
  userSlug,
  userProfile,
  availableSessions,
  participantToken,
  participantProfile,
  registeredRoundIds,
  registeredRoundsMap,
  registeredRoundsPerSession,
  registeredRoundSelections,
  participantStatusMap,
  registrationStep,
  magicLinkDialogOpen,
  magicLinkEmail,
  isSendingMagicLink,
  onNavigate,
  onLogout,
  onMagicLinkDialogOpenChange,
  onMagicLinkEmailChange,
  onSendMagicLink,
  onRegistrationStepChange,
}: UserPublicPageViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // "How rounds work" bottom-sheet (Claude Design v07 · Event Page.html data-modal="howit").
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const firstName = participantProfile?.firstName || '';
  // Banner shows the EVENT name only (never the organizer/person name).
  const eventName = userProfile?.eventName || '';
  const initials = String(firstName ? firstName[0] : (participantProfile?.email?.[0] || 'A')).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  // Close the "How rounds work" sheet on Escape.
  useEffect(() => {
    if (!howItWorksOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setHowItWorksOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [howItWorksOpen]);

  // Steps mirror the Participant Dashboard "How rounds work" block (v07 handoff).
  const howSteps = [
    { n: '01', img: '/how-it-works-3.png', title: 'Confirm attendance', desc: "You'll get an SMS 5 minutes before each round. Tap to confirm you're joining." },
    { n: '02', img: '/meeting-bar.png', title: 'Go to meeting point', desc: "We'll reveal your spot the moment matching runs — head there once you know where to go." },
    { n: '03', img: '/how-it-works-4.png', title: 'Find your match', desc: "At the spot, your phone shows a unique image — same as your match's, with a different number. Confirm by entering your partner's number." },
    { n: '04', img: '/how-it-works-5.png', title: 'Exchange contacts', desc: 'After the round, you can choose to exchange contacts — sharing only happens if both of you agree.' },
  ];

  const registration = (
    <SessionRegistration
      sessions={availableSessions}
      userSlug={userSlug}
      eventName={userProfile?.eventName || ''}
      registeredRoundIds={registeredRoundIds}
      registeredRoundsMap={registeredRoundsMap}
      registeredRoundsPerSession={registeredRoundsPerSession}
      registeredRoundSelections={registeredRoundSelections}
      participantProfile={participantProfile}
      participantToken={participantToken}
      participantStatusMap={participantStatusMap}
      onStepChange={onRegistrationStepChange}
      noWrapper
    />
  );

  return (
    <div className={`wonderelo ev-page${participantToken ? ' is-signed-in' : ''}`}>
      <div className="ev-shell">

        <nav className="ev-nav">
          <a className="ev-brand" tabIndex={0} onClick={() => onNavigate('/')}>
            <span className="mark"><span className="inner" /></span>
            <span className="word">wond<em>e</em>relo</span>
          </a>

          {!participantToken ? (
            <button className="ev-nav-cta ev-nav-guest" type="button" onClick={() => onMagicLinkDialogOpenChange(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Manage my rounds
            </button>
          ) : (
            <>
              <div
                className={`ev-nav-cta ev-nav-trigger${menuOpen ? ' is-open' : ''}`}
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              >
                <span className="av-mini">{initials}</span>
                <span>{firstName || 'Me'}</span>
                <svg className="ev-nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div className={`ev-nav-menu${menuOpen ? ' is-open' : ''}`} role="menu" onClick={(e) => e.stopPropagation()}>
                <button className="ev-nav-menu-item" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onNavigate(`/p/${participantToken}`); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                  Dashboard
                </button>
                <button className="ev-nav-menu-item" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onNavigate(`/p/${participantToken}/profile`); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                  Profile
                </button>
                <button className="ev-nav-menu-item" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onNavigate(`/p/${participantToken}/address-book`); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="12" cy="10" r="2"/><path d="M9 15.5a3 3 0 0 1 6 0"/></svg>
                  Address book
                </button>
                <button className="ev-nav-menu-item" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onNavigate('/'); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>
                  Wonderelo home
                </button>
                <div className="ev-nav-menu-divider" />
                <button className="ev-nav-menu-item is-danger" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </nav>

        {registrationStep === 'select-rounds' && (
          <section className="ev-org">
            <div className="av" aria-label="Organizer photo">
              {userProfile?.profileImageUrl
                ? <img src={userProfile.profileImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span className="lbl">photo</span>}
            </div>
            <div className="ev-event-name">{eventName}</div>
            <button className="ev-how-link" type="button" onClick={() => setHowItWorksOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              How rounds work
            </button>
          </section>
        )}

        {registrationStep === 'select-rounds' && (
          <h1 className="ev-title">
            <span className="name">{firstName}, </span>when can we <span className="w-italic">mix</span> you in?
          </h1>
        )}

        {registration}
      </div>

      <Dialog open={magicLinkDialogOpen} onOpenChange={onMagicLinkDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access your registrations</DialogTitle>
            <DialogDescription>
              Enter your email to receive a magic link to manage your registered rounds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="magic-link-email-view">Email</Label>
              <Input
                id="magic-link-email-view"
                type="email"
                placeholder="your.email@example.com"
                value={magicLinkEmail}
                onChange={(e) => onMagicLinkEmailChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSendMagicLink();
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
                onMagicLinkDialogOpenChange(false);
                onMagicLinkEmailChange('');
              }}
              disabled={isSendingMagicLink}
            >
              Cancel
            </Button>
            <Button
              onClick={onSendMagicLink}
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

      {/* How rounds work — bottom-sheet (Claude Design v07 · Event Page.html data-modal="howit").
          Mirrors the Participant Dashboard "How rounds work" block; reuses .pd-howit-* styling. */}
      <div className={`ev-modal-backdrop${howItWorksOpen ? ' is-open' : ''}`} onClick={() => setHowItWorksOpen(false)} />
      <aside className={`ev-modal${howItWorksOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="How rounds work">
        <div className="ev-modal-handle" />
        <header className="ev-modal-head">
          <div>
            <div className="title">How rounds <em>work</em></div>
            <div className="sub">Four quick steps — from the reminder to your match, to swapping contacts after.</div>
          </div>
          <button className="ev-modal-close" type="button" onClick={() => setHowItWorksOpen(false)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </header>
        <div className="ev-modal-body">
          <ol className="pd-howit-list">
            {howSteps.map((s, i) => (
              <li className="pd-howit-step" data-step={String(i + 1)} key={s.n}>
                <span className="pd-howit-num"><img src={s.img} alt="" onError={(e) => { (e.currentTarget.style.display = 'none'); }} /></span>
                <div className="pd-howit-text">
                  <span className="pd-howit-title"><span className="pd-howit-step-num">{s.n}</span>{s.title}</span>
                  <span className="pd-howit-desc">{s.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>

    </div>
  );
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
  const [registeredRoundSelections, setRegisteredRoundSelections] = useState<Map<string, { team?: string; topic?: string; topics?: string[] }>>(new Map());
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
    // Note: fetchSystemParameters() is already called by AppRouter on mount
    // No need to duplicate it here — getParametersOrDefault() uses the cached value

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
      
      const url = `${apiBaseUrl}/public/user/${userSlug}`;
      debugLog('Request URL:', url);
      debugLog('API Base URL:', apiBaseUrl);
      debugLog('Public Anon Key:', publicAnonKey ? 'Present' : 'Missing');

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
        `${apiBaseUrl}/p/${token}`,
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
        const roundSelections: Map<string, { team?: string; topic?: string; topics?: string[] }> = new Map();
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

              // Preserve the participant's stored group/topic choices so a revisited
              // registered round restores its selected chips + within-group match note.
              const topics = Array.isArray(round.topics) ? round.topics : undefined;
              if (round.team || (topics && topics.length)) {
                roundSelections.set(round.roundId, {
                  team: round.team ?? undefined,
                  topic: topics?.[0],
                  topics,
                });
              }
            }
          });
        }

        debugLog('📝 Registered round IDs:', roundIds);
        setRegisteredRoundIds(roundIds);
        setRegisteredRoundsMap(roundsMap);
        setRegisteredRoundsPerSession(roundsPerSession);
        setRegisteredRoundSelections(roundSelections);
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

  // Single source of truth: shared with the Dashboard's "Published" bucket so the
  // organizer-facing counts mirror what participants actually see here.
  const availableForRegistration = sessions.filter(isSessionLiveOnEventPage);
  
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
        `${apiBaseUrl}/debug/test-verification-email`,
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
        `${apiBaseUrl}/debug/test-sms`,
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
        `${apiBaseUrl}/participant/send-magic-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: magicLinkEmail,
            userSlug,
            appUrl: window.location.origin
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

  // Event-page async states (Claude Design v07 · Event Page.html `.ev-pagestate`).
  // The brand nav stays mounted; the hero/rounds + sticky CTA bar are replaced by
  // one centred panel. The sticky bar lives inside the main view below, so it is
  // never mounted in any of these states.
  const evStateShell = (content: React.ReactNode) => (
    <div className={`wonderelo ev-page${participantToken ? ' is-signed-in' : ''}`}>
      <div className="ev-shell">
        <nav className="ev-nav">
          <a className="ev-brand" tabIndex={0} onClick={() => navigate('/')}>
            <span className="mark"><span className="inner" /></span>
            <span className="word">wond<em>e</em>relo</span>
          </a>
        </nav>
        <div style={{ padding: '30px 0 46px' }}>{content}</div>
      </div>
    </div>
  );

  if (error) {
    // Bad / expired link (unknown slug, no registrations) → not-found; anything else → error.
    if (error === 'User not found') {
      return evStateShell(
        <StatePlaceholder
          glyphSize={78}
          glyph={<svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
          eyebrow="Nothing here"
          title={<>This event <Italic>link</Italic> doesn't work</>}
          body="The link may have expired, or the organizer hasn't opened registration yet. Double-check the link you were given."
          actions={<StateButton variant="ghost" onClick={() => navigate('/')}>Go to Wonderelo</StateButton>}
        />
      );
    }
    return evStateShell(
      <StatePlaceholder
        variant="error"
        glyphSize={78}
        glyph={<svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        eyebrow="Something went wrong"
        title={<>We couldn't load <Italic>this event</Italic></>}
        body="This is on us. Give it a moment and try again — the event itself is fine."
        actions={<>
          <StateButton variant="primary" leadingIcon={<RefreshIcon />} onClick={() => window.location.reload()}>Try again</StateButton>
          <StateButton variant="ghost" href="mailto:hello@wonderelo.com">Contact the organizer</StateButton>
        </>}
      />
    );
  }

  if (!userProfile) {
    debugLog('🟡 RENDERING SKELETON - Waiting for userProfile to load');
    // Loading (Claude Design v07 · Event Page.html `.ev-pagestate.is-loading`):
    // skeleton hero + 2 round rows + "Loading the event…". Sticky CTA not mounted.
    return evStateShell(
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <StateSkeleton height={216} radius={24} style={{ marginBottom: 18 }} />
        <SkeletonRow />
        <SkeletonRow style={{ marginTop: 10 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, fontSize: 13.5, color: C.ink, opacity: 0.62 }}>
          <Spinner /> Loading the event…
        </div>
      </div>
    );
  }

  if (view === 'verify') {
    return <EmailVerification userSlug={userSlug} />;
  }

  debugLog('🟢 RENDERING REGISTRATION FORM - Default view with SessionRegistration');
  return (
    <UserPublicPageView
      userSlug={userSlug}
      userProfile={userProfile}
      availableSessions={availableForRegistration}
      participantToken={participantToken}
      participantProfile={participantProfile}
      registeredRoundIds={registeredRoundIds}
      registeredRoundsMap={registeredRoundsMap}
      registeredRoundsPerSession={registeredRoundsPerSession}
      registeredRoundSelections={registeredRoundSelections}
      participantStatusMap={participantStatusMap}
      registrationStep={registrationStep}
      magicLinkDialogOpen={magicLinkDialogOpen}
      magicLinkEmail={magicLinkEmail}
      isSendingMagicLink={isSendingMagicLink}
      onNavigate={(path) => navigate(path)}
      onLogout={() => {
        localStorage.removeItem('participant_token');
        setParticipantToken(null);
        setParticipantProfile(null);
        toast.success('Logged out successfully');
        navigate('/');
      }}
      onMagicLinkDialogOpenChange={setMagicLinkDialogOpen}
      onMagicLinkEmailChange={setMagicLinkEmail}
      onSendMagicLink={handleSendMagicLink}
      onRegistrationStepChange={setRegistrationStep}
    />
  );
}