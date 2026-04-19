import { useState, lazy, Suspense, ComponentType } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Eye, Mail, Phone, Copy, BookUser } from 'lucide-react';
import { ParticipantNav } from './ParticipantNav';
import { NetworkingSession, Round } from '../App';
import { RoundItem } from './RoundItem';
import { GeometricIdentification } from './GeometricIdentification';
import { Calendar, Clock, Users, MapPin, CheckCircle } from 'lucide-react';

// Types only — stripped at compile time, don't trigger runtime module loads.
import type { MatchData } from './MatchInfo';
import type { MatchPartnerData, Partner as MatchPartnerPartner } from './MatchPartner';
import type { NetworkingData } from './MatchNetworking';
import type { RoundDetail } from './ParticipantRoundDetail';
import type { Contact } from './AddressBook';
import type { ParticipantProfileFormData } from '../pages/ParticipantProfile';
import type { Registration, SessionWithRounds } from './ParticipantDashboard';
import type { Subscription, Invoice, CreditTransaction, BillingDetails } from './BillingSettings';
import type { RoundRule } from './RoundRulesDialog';

// Lazy-loaded views — each page's view (+ its deps) is only fetched when you actually
// click on that preview tab. Keeps Page Preview fast to open and refresh.
function lazyNamed<Name extends string>(
  loader: () => Promise<Record<Name, ComponentType<any>>>,
  name: Name,
): ComponentType<any> {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}
const MatchInfoMatchedView = lazyNamed(() => import('./MatchInfo'), 'MatchInfoMatchedView');
const MatchInfoNoMatchView = lazyNamed(() => import('./MatchInfo'), 'MatchInfoNoMatchView');
const MatchPartnerView = lazyNamed(() => import('./MatchPartner'), 'MatchPartnerView');
const MatchNetworkingView = lazyNamed(() => import('./MatchNetworking'), 'MatchNetworkingView');
const ContactSharingPartnerFeedbackView = lazyNamed(() => import('./ContactSharing'), 'ContactSharingPartnerFeedbackView');
const ContactSharingWondereloFeedbackView = lazyNamed(() => import('./ContactSharing'), 'ContactSharingWondereloFeedbackView');
const DashboardView = lazyNamed(() => import('./Dashboard'), 'DashboardView');
const AccountSettingsView = lazyNamed(() => import('./AccountSettings'), 'AccountSettingsView');
const EventPageSettingsView = lazyNamed(() => import('./EventPageSettings'), 'EventPageSettingsView');
const EventPromoPageView = lazyNamed(() => import('./EventPromoPage'), 'EventPromoPageView');
const RoundFormPageView = lazyNamed(() => import('./RoundFormPage'), 'RoundFormPageView');
const SignInFlowView = lazyNamed(() => import('./SignInFlow'), 'SignInFlowView');
const SignUpFlowView = lazyNamed(() => import('./SignUpFlow'), 'SignUpFlowView');
const ResetPasswordFlowView = lazyNamed(() => import('./ResetPasswordFlow'), 'ResetPasswordFlowView');
const EmailVerificationView = lazyNamed(() => import('./EmailVerification'), 'EmailVerificationView');
const EmailVerificationWaitingView = lazyNamed(() => import('./EmailVerificationWaiting'), 'EmailVerificationWaitingView');
const MissedRoundView = lazyNamed(() => import('./MissedRound'), 'MissedRoundView');
const RegistrationSuccessView = lazyNamed(() => import('./RegistrationSuccess'), 'RegistrationSuccessView');
const SessionSuccessView = lazyNamed(() => import('./SessionSuccessPage'), 'SessionSuccessView');
const ParticipantRoundDetailView = lazyNamed(() => import('./ParticipantRoundDetail'), 'ParticipantRoundDetailView');
const AddressBookView = lazyNamed(() => import('./AddressBook'), 'AddressBookView');
const ParticipantProfileView = lazyNamed(() => import('../pages/ParticipantProfile'), 'ParticipantProfileView');
const ParticipantDashboardView = lazyNamed(() => import('./ParticipantDashboard'), 'ParticipantDashboardView');
const HomepageView = lazyNamed(() => import('./Homepage'), 'HomepageView');
const UserPublicPageView = lazyNamed(() => import('./UserPublicPage'), 'UserPublicPageView');
const BillingSettingsView = lazyNamed(() => import('./BillingSettings'), 'BillingSettingsView');
const SessionRegistrationSelectRoundsView = lazyNamed(() => import('./SessionRegistration'), 'SessionRegistrationSelectRoundsView');

interface AdminPagePreviewProps {
  onBack: () => void;
}

// Simple Wonderelo header for previews (static, no click handlers)
function PreviewHeader() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <span className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</span>
      </div>
    </nav>
  );
}

// ============================================================
// Mock data generators
// ============================================================

const MOCK_PARTICIPANTS = [
  { id: 'p1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@example.com', phone: '+421 912 345 678' },
  { id: 'p2', firstName: 'Marcus', lastName: 'Rivera', email: 'marcus@example.com', phone: '+421 903 456 789' },
  { id: 'p3', firstName: 'Emma', lastName: 'Johansson', email: 'emma@example.com' },
  { id: 'p4', firstName: 'Tomáš', lastName: 'Novák', email: 'tomas@example.com', phone: '+421 917 890 123' },
];

const MOCK_ICE_BREAKERS = [
  'What\'s the most interesting project you\'re working on right now?',
  'If you could have dinner with anyone, living or dead, who would it be?',
  'What\'s one skill you\'d love to learn this year?',
];

const now = new Date();
const in30min = new Date(now.getTime() + 30 * 60000);
const in15min = new Date(now.getTime() + 15 * 60000);
const in20min = new Date(now.getTime() + 20 * 60000);

const mockSession: NetworkingSession = {
  id: 'preview-session',
  name: 'Tech Meetup Prague',
  description: 'Monthly networking for tech professionals',
  date: now.toISOString().split('T')[0],
  organizerId: 'preview-org',
  rounds: [],
  status: 'published',
  createdAt: now.toISOString(),
  enableTeams: false,
  enableTopics: false,
  allowMultipleTopics: false,
  teams: [],
  topics: [],
  meetingPoints: [
    { id: 'mp1', name: 'Lobby Bar', identificationImage: '' },
    { id: 'mp2', name: 'Rooftop Terrace', identificationImage: '' },
  ],
  serviceType: 'one-time' as const,
  tZeroMinutes: 15,
  sessionDuration: 20,
  roundDuration: 20,
  groupSize: 2,
  limitParticipants: false,
  maxParticipants: 50,
};

const mockRound: Round = {
  id: 'preview-round',
  name: 'Round 1',
  date: mockSession.date,
  startTime: `${String(in30min.getHours()).padStart(2, '0')}:${String(in30min.getMinutes()).padStart(2, '0')}`,
  duration: 20,
  tZeroMinutes: 15,
  status: 'published',
  createdAt: now.toISOString(),
  maxGroupSize: 2,
  allowOverflowMatching: true,
};
mockSession.rounds = [mockRound];

// ============================================================
// Preview page definitions
// ============================================================

type PreviewPage =
  | 'participant-dashboard'
  | 'address-book'
  | 'meeting-point'
  | 'match-no-match'
  | 'match-partner'
  | 'match-networking'
  | 'contact-sharing'
  | 'wonderelo-feedback'
  | 'email-verification'
  | 'participant-profile'
  | 'session-registration'
  | 'session-success'
  | 'homepage'
  | 'public-event-page'
  | 'signin'
  | 'signup'
  | 'reset-password'
  | 'email-waiting'
  | 'registration-success'
  | 'missed-round'
  | 'round-detail'
  | 'organizer-dashboard'
  | 'account-settings'
  | 'event-page-settings'
  | 'event-promo'
  | 'round-form'
  | 'billing';

interface PreviewPageDef {
  id: PreviewPage;
  label: string;
  description: string;
}

interface PreviewCategory {
  name: string;
  pages: PreviewPageDef[];
}

const PREVIEW_CATEGORIES: PreviewCategory[] = [
  {
    name: 'Registration',
    pages: [
      { id: 'session-registration', label: 'Registration', description: 'Participant registers for a round' },
      { id: 'email-waiting', label: 'Email waiting', description: 'Waiting for email verification link click' },
      { id: 'email-verification', label: 'Email verification', description: 'Email verification landing page' },
      { id: 'registration-success', label: 'Registration success', description: 'Organizer finished signup' },
      { id: 'participant-profile', label: 'Profile', description: 'Participant edits their profile' },
    ],
  },
  {
    name: 'Dashboard',
    pages: [
      { id: 'participant-dashboard', label: 'Dashboard', description: 'Participant\'s main dashboard with upcoming rounds' },
      { id: 'round-detail', label: 'Round detail', description: 'Detail page for a single registered round' },
      { id: 'address-book', label: 'Address Book', description: 'Contacts shared after networking rounds' },
    ],
  },
  {
    name: 'Matching flow',
    pages: [
      { id: 'meeting-point', label: 'Meeting point', description: 'Participant has been matched — go to meeting point' },
      { id: 'match-no-match', label: 'No match', description: 'No match available for this round' },
      { id: 'match-partner', label: 'Find each other', description: 'Confirm meeting your match partner' },
      { id: 'match-networking', label: 'Networking', description: 'Active networking with ice breakers' },
      { id: 'contact-sharing', label: 'Contact sharing', description: 'Exchange contacts after networking' },
      { id: 'wonderelo-feedback', label: 'Wonderelo feedback', description: 'Rate the Wonderelo experience' },
      { id: 'missed-round', label: 'Missed round', description: 'Participant missed their round' },
    ],
  },
  {
    name: 'Organizer',
    pages: [
      { id: 'organizer-dashboard', label: 'Dashboard (organizer)', description: 'Organizer\'s main dashboard with sessions and rounds' },
      { id: 'account-settings', label: 'Account settings', description: 'Organizer edits their name, email, and password' },
      { id: 'event-page-settings', label: 'Event page settings', description: 'Organizer edits event page URL, name, and profile image' },
      { id: 'event-promo', label: 'Promo slide', description: 'Full-screen promo slide with QR code' },
      { id: 'round-form', label: 'Round form', description: 'Organizer creates or edits a networking round' },
      { id: 'session-success', label: 'Round created', description: 'Organizer sees success after creating a round' },
      { id: 'billing', label: 'Billing', description: 'Organizer manages subscription, credits, and invoices' },
    ],
  },
  {
    name: 'Public',
    pages: [
      { id: 'homepage', label: 'Homepage', description: 'Marketing homepage at /' },
      { id: 'public-event-page', label: 'Public event page', description: 'Organizer\'s public event page at /:slug' },
    ],
  },
  {
    name: 'Auth',
    pages: [
      { id: 'signin', label: 'Sign in', description: 'Sign in flow (participant + organizer tabs)' },
      { id: 'signup', label: 'Sign up', description: 'Organizer sign up (multi-step)' },
      { id: 'reset-password', label: 'Reset password', description: 'Set a new password via reset link' },
    ],
  },
];

// Flat list for lookup
const PREVIEW_PAGES = PREVIEW_CATEGORIES.flatMap(c => c.pages);

// ============================================================
// Individual preview renderers
// ============================================================

function PreviewParticipantDashboard() {
  const noop = () => {};
  // Build a past session (completed round) with mock data
  const pastRoundDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const pastSession: NetworkingSession = {
    ...mockSession,
    id: 'preview-past-session',
    name: 'Startup Mixer',
    date: pastRoundDate,
    rounds: [
      {
        id: 'past-round-1',
        name: 'Round 1',
        date: pastRoundDate,
        startTime: '18:00',
        duration: 20,
        tZeroMinutes: 15,
        status: 'completed',
        createdAt: new Date().toISOString(),
        maxGroupSize: 2,
        allowOverflowMatching: true,
      } as Round,
    ],
  };

  const upcomingSessions: SessionWithRounds[] = [
    {
      session: mockPublishedSession,
      registeredRoundIds: new Set([mockRound.id]),
      registrationStatusMap: new Map([[mockRound.id, 'registered']]),
    },
  ];

  const pastSessions: SessionWithRounds[] = [
    {
      session: pastSession,
      registeredRoundIds: new Set(['past-round-1']),
      registrationStatusMap: new Map([['past-round-1', 'met']]),
    },
  ];

  const registrations: Registration[] = [
    {
      roundId: mockRound.id,
      sessionId: mockPublishedSession.id,
      sessionName: mockPublishedSession.name,
      roundName: mockRound.name,
      organizerName: 'Andyho konfera',
      organizerUrlSlug: 'andyconf',
      status: 'registered',
      currentStatus: 'registered',
      startTime: mockRound.startTime,
      duration: mockRound.duration,
      date: mockPublishedSession.date,
      registeredAt: new Date().toISOString(),
      notificationsEnabled: false,
    },
    {
      roundId: 'past-round-1',
      sessionId: pastSession.id,
      sessionName: pastSession.name,
      roundName: 'Round 1',
      organizerName: 'Andyho konfera',
      organizerUrlSlug: 'andyconf',
      status: 'met',
      currentStatus: 'met',
      startTime: '18:00',
      duration: 20,
      date: pastRoundDate,
      registeredAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      notificationsEnabled: false,
    },
  ];

  const sharedContactsByRound = new Map<string, { firstName: string; lastName: string }[]>([
    ['past-round-1', [{ firstName: 'Marcus', lastName: 'Rivera' }]],
  ]);

  return (
    <div className="min-h-[600px] bg-background">
      <ParticipantDashboardView
        firstName="Sarah"
        lastName="Chen"
        upcomingSessions={upcomingSessions}
        pastSessions={pastSessions}
        registrations={registrations}
        sharedContactsByRound={sharedContactsByRound}
        roundSelections={new Map()}
        participantId="preview-participant"
        globalNextUpcomingRoundId={null}
        hasFreshData={true}
        lastConfirmTimestamp={0}
        token="preview-token"
        showMeetingPoints={false}
        selectedSessionForDialog={null}
        showRoundRules={false}
        roundRules={[]}
        showUnregisterDialog={false}
        pendingUnregister={null}
        showDebug={false}
        debugLogs={[]}
        onAddMoreRoundsNavigate={noop}
        onAddressBookNavigate={noop}
        onSetShowMeetingPoints={noop}
        onSetShowRoundRules={noop}
        onSetShowUnregisterDialog={noop}
        onCancelUnregister={noop}
        onConfirmUnregister={noop}
        onRoundToggle={noop}
        onConfirmAttendance={noop}
        onConfirmationWindowExpired={noop}
        onClearDebugLogs={noop}
        generateRoundTimeDisplay={(startTime, duration) => {
          if (!startTime) return 'To be set';
          const [h, m] = startTime.split(':').map(Number);
          const endM = (h * 60 + m + duration) % (24 * 60);
          const eh = Math.floor(endM / 60);
          const em = endM % 60;
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${pad(h)}:${pad(m)} - ${pad(eh)}:${pad(em)}`;
        }}
        isRoundCompleted={(_s, round) => round.status === 'completed'}
      />
    </div>
  );
}

// Legacy static mock — no longer used but kept for reference.
function _PreviewParticipantDashboardLegacy() {
  return (
    <div className="min-h-[600px] bg-background">
      <ParticipantNav
        participantToken="preview-token"
        firstName="Sarah"
        lastName="Chen"
        onLogoClick={() => {}}
        onHomeClick={() => {}}
        onDashboardClick={() => {}}
        onProfileClick={() => {}}
        onLogout={() => {}}
      />
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your rounds</h1>
            <p className="text-muted-foreground">Sarah Chen • sarah@example.com</p>
          </div>

          <div>
            <h2 className="mb-4">Upcoming rounds</h2>
            <div className="space-y-4">
              <Card className="transition-all hover:border-muted-foreground/20">
                <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-left">Andyho konfera</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{mockSession.name}</Badge>
                        <span className="text-xs text-muted-foreground">#andyconf</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(mockSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {mockSession.roundDuration} min
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Round 1</Badge>
                      <span className="text-sm text-muted-foreground">{mockRound.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                      <CheckCircle className="h-4 w-4" />
                      Registered — waiting for match
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="mb-4">Completed rounds</h2>
            <div className="space-y-4">
              <Card className="transition-all hover:border-muted-foreground/20 opacity-60">
                <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-left">Andyho konfera</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Startup Mixer</Badge>
                        <span className="text-xs text-muted-foreground">#andyconf</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Round 1</span>
                        <Badge variant="secondary" className="text-xs">Done</Badge>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <BookUser className="h-3 w-3" />
                        Marcus Rivera
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// These previews now render the EXACT same view components used by the live pages.
// When you change the design of MatchInfo/MatchPartner/etc., the preview updates automatically.

function PreviewMeetingPoint() {
  const mockMatchData: MatchData = {
    matchId: 'preview-match-1',
    meetingPointName: 'Lobby Bar',
    meetingPointType: 'physical',
    meetingPointImageUrl: '',
    participants: [
      { id: 'p1', firstName: 'Sarah', lastName: 'Chen' },
      { id: 'p2', firstName: 'Marcus', lastName: 'Rivera' },
    ],
  };
  const noop = () => {};
  return (
    <MatchInfoMatchedView
      matchData={mockMatchData}
      countdown={<div className="text-2xl font-semibold text-primary">14:32</div>}
      isSubmitting={false}
      onImHere={noop}
      onBackToDashboard={noop}
    />
  );
}

function PreviewNoMatch() {
  return <MatchInfoNoMatchView onBackToDashboard={() => {}} onBackToEventPage={() => {}} />;
}

function PreviewMatchPartner() {
  const mockData: MatchPartnerData = {
    matchId: 'preview-match-1',
    myIdentificationNumber: '42',
    myName: 'Sarah',
    findingDeadline: new Date(Date.now() + 5 * 60000).toISOString(),
    partners: [
      {
        id: 'p2',
        firstName: 'Marcus',
        lastName: 'Rivera',
        isCheckedIn: false,
        identificationNumber: '17',
        identificationOptions: [17, 42, 63],
      },
    ],
  };
  const getOptions = (p: MatchPartnerPartner) => p.identificationOptions;
  return (
    <MatchPartnerView
      matchData={mockData}
      countdown={<div className="text-2xl font-semibold text-primary">04:23</div>}
      isSubmitting={false}
      wrongGuessPartnerId={null}
      getOptionsForPartner={getOptions}
      onNumberSelect={() => {}}
      onBackToDashboard={() => {}}
    />
  );
}

function PreviewNetworking() {
  const mockData: NetworkingData = {
    matchId: 'preview-match-1',
    roundName: 'Round 1',
    networkingEndTime: new Date(Date.now() + 15 * 60000).toISOString(),
    partners: [
      { id: 'p2', firstName: 'Marcus', lastName: 'Rivera' },
    ],
    iceBreakers: MOCK_ICE_BREAKERS,
  };
  return (
    <MatchNetworkingView
      networkingData={mockData}
      countdown={<div className="text-2xl font-semibold text-primary">18:42</div>}
      onBackToDashboard={() => {}}
    />
  );
}

function PreviewContactSharing() {
  const [contactSharing, setContactSharing] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string[]>>({});
  const [customFeedback, setCustomFeedback] = useState<Record<string, string>>({});
  const partner = MOCK_PARTICIPANTS[1];
  return (
    <ContactSharingPartnerFeedbackView
      partners={[{ id: partner.id, firstName: partner.firstName, lastName: partner.lastName, email: partner.email }]}
      feedback={feedback}
      customFeedback={customFeedback}
      contactSharing={contactSharing}
      onFeedbackToggle={(partnerId, feedbackId) => {
        setFeedback(prev => {
          const current = prev[partnerId] || [];
          const updated = current.includes(feedbackId)
            ? current.filter(f => f !== feedbackId)
            : [...current, feedbackId];
          return { ...prev, [partnerId]: updated };
        });
      }}
      onCustomFeedbackChange={(partnerId, text) =>
        setCustomFeedback(prev => ({ ...prev, [partnerId]: text }))
      }
      onContactToggle={(partnerId) =>
        setContactSharing(prev => ({ ...prev, [partnerId]: !prev[partnerId] }))
      }
      onNext={() => {}}
    />
  );
}

function PreviewWondereloFeedback() {
  const [wondereloRating, setWondereloRating] = useState<string | null>(null);
  const [wondereloFeedback, setWondereloFeedback] = useState('');
  return (
    <ContactSharingWondereloFeedbackView
      wondereloRating={wondereloRating}
      wondereloFeedback={wondereloFeedback}
      isSubmitting={false}
      onRatingChange={setWondereloRating}
      onFeedbackChange={setWondereloFeedback}
      onSave={() => {}}
      onBack={() => {}}
    />
  );
}

function PreviewEmailVerification() {
  return (
    <EmailVerificationView
      status="success"
      message="Email verified successfully! Your registration is now complete."
      onGoToRounds={() => {}}
      onReturnHome={() => {}}
    />
  );
}

function PreviewEmailWaiting() {
  return (
    <EmailVerificationWaitingView
      email="sarah@gmail.com"
      emailProvider={{ name: 'Open Gmail', url: 'https://mail.google.com' }}
      onOpenProvider={() => {}}
    />
  );
}

function PreviewRegistrationSuccess() {
  return (
    <RegistrationSuccessView
      registrationData={{
        email: 'sarah@example.com',
        customUrl: 'sarahs-events',
        howDidYouHear: 'Friend',
        role: 'Community manager',
        companySize: '10-50',
      }}
      serviceType="event"
      onContinue={() => {}}
    />
  );
}

function PreviewMissedRound() {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  return (
    <MissedRoundView
      roundName="Round 1 - Tech Meetup Prague"
      feedback={feedback}
      isSubmitting={false}
      isSubmitted={isSubmitted}
      onFeedbackChange={setFeedback}
      onSubmitFeedback={() => setIsSubmitted(true)}
      onBackToDashboard={() => {}}
    />
  );
}

function PreviewRoundDetail() {
  const mockRoundDetail: RoundDetail = {
    registration: { notificationsEnabled: false },
    session: {
      id: 's1',
      name: 'Tech Meetup Prague',
      date: mockSession.date,
      location: 'Impact Hub Bratislava',
      meetingPoints: [
        { name: 'Lobby Bar' },
        { name: 'Rooftop Terrace' },
      ],
    },
    round: {
      id: 'r1',
      name: 'Round 1',
      startTime: mockRound.startTime,
      duration: 20,
      groupSize: 2,
      iceBreakers: MOCK_ICE_BREAKERS,
      date: mockSession.date,
    },
    organizer: {
      name: 'Andyho konfera',
      urlSlug: 'andyconf',
    },
  };
  return (
    <ParticipantRoundDetailView
      roundDetail={mockRoundDetail}
      isUpcoming={true}
      isInProgress={false}
      isCompleted={false}
      countdown="2h 14m 32s"
      formattedDateTime={new Date(`${mockSession.date}T${mockRound.startTime}:00`).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })}
      notificationsEnabled={false}
      onBack={() => {}}
      onEnableNotifications={() => {}}
    />
  );
}

function PreviewProfile() {
  const [formData, setFormData] = useState<ParticipantProfileFormData>({
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah@example.com',
    phone: '912 345 678',
    phoneCountry: '+421',
    linkedinUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    otherSocial: '',
  });
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <div className="px-6 py-8">
        <ParticipantProfileView
          formData={formData}
          error=""
          success=""
          saving={false}
          hasChanges={false}
          phoneCountryOpen={phoneCountryOpen}
          onPhoneCountryOpenChange={setPhoneCountryOpen}
          onFieldChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          onSave={(e) => e.preventDefault()}
          onCancel={() => {}}
          onBack={() => {}}
        />
      </div>
    </div>
  );
}

function PreviewRegistration() {
  // Build a mock session with 2 rounds for a realistic preview
  const previewRound1: Round = {
    ...mockRound,
    id: 'preview-round-1',
    name: 'Round 1',
  };
  const previewRound2: Round = {
    ...mockRound,
    id: 'preview-round-2',
    name: 'Round 2',
    startTime: `${String(in30min.getHours()).padStart(2, '0')}:${String(in30min.getMinutes()).padStart(2, '0')}`,
  };
  const previewSession: NetworkingSession = {
    ...mockSession,
    id: 'preview-session-reg',
    rounds: [previewRound1, previewRound2],
  };

  const [selectedRounds, setSelectedRounds] = useState<Map<string, Set<string>>>(new Map());
  const [roundSelections] = useState<Map<string, { team?: string; topic?: string; topics?: string[] }>>(new Map());
  const [selectedSessions, setSelectedSessions] = useState<Array<{
    sessionId: string;
    sessionName: string;
    date: string;
    startTime: string;
    endTime: string;
    rounds: Array<{ roundId: string; roundName: string; startTime: string; duration: number }>;
  }>>([]);
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [meetingPointsFilterSessionId, setMeetingPointsFilterSessionId] = useState<string | null>(null);
  const [showRoundRules, setShowRoundRules] = useState(false);

  const roundRules: RoundRule[] = [
    { headline: 'Be on time', text: 'Arrive a few minutes before your round starts.' },
    { headline: 'Meet new people', text: 'You will be matched with a different partner each round.' },
  ];

  const handleRoundSelect = (session: NetworkingSession, roundId: string) => {
    const next = new Map(selectedRounds);
    const set = new Set(next.get(session.id) || []);
    if (set.has(roundId)) {
      set.delete(roundId);
    } else {
      set.add(roundId);
    }
    next.set(session.id, set);
    setSelectedRounds(next);

    const round = session.rounds.find(r => r.id === roundId);
    if (!round) return;
    const nextSessions = [...selectedSessions];
    let entry = nextSessions.find(s => s.sessionId === session.id);
    if (!entry) {
      entry = {
        sessionId: session.id,
        sessionName: session.name,
        date: session.date,
        startTime: round.startTime,
        endTime: round.startTime,
        rounds: [],
      };
      nextSessions.push(entry);
    }
    const existing = entry.rounds.findIndex(r => r.roundId === roundId);
    if (existing >= 0) {
      entry.rounds.splice(existing, 1);
    } else {
      entry.rounds.push({ roundId, roundName: round.name, startTime: round.startTime, duration: round.duration });
    }
    setSelectedSessions(nextSessions.filter(s => s.rounds.length > 0));
  };

  const generateRoundTimeDisplay = (startTime: string, duration: number): string => {
    if (!startTime || startTime === 'To be set' || startTime === 'TBD') return 'To be set';
    const [h, m] = startTime.split(':').map(Number);
    const endTotal = h * 60 + m + duration;
    const eh = Math.floor(endTotal / 60);
    const em = endTotal % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)} - ${pad(eh)}:${pad(em)}`;
  };

  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <span className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</span>
        </div>
      </nav>
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">Andyho konfera</h1>
          <p className="text-muted-foreground">Tech Meetup Prague</p>
        </div>

        <SessionRegistrationSelectRoundsView
          availableSessions={[previewSession]}
          sessions={[previewSession]}
          selectedSessions={selectedSessions}
          selectedRounds={selectedRounds}
          roundSelections={roundSelections}
          registeredRoundsPerSession={new Map()}
          participantStatusMap={new Map()}
          globalNextUpcomingRoundId={null}
          participantProfile={undefined}
          participantToken={null}
          showMeetingPoints={showMeetingPoints}
          meetingPointsFilterSessionId={meetingPointsFilterSessionId}
          showRoundRules={showRoundRules}
          roundRules={roundRules}
          noWrapper={true}
          isRoundRegisterable={() => true}
          generateRoundTimeDisplay={generateRoundTimeDisplay}
          onShowMeetingPoints={(sessionId) => {
            setMeetingPointsFilterSessionId(sessionId);
            setShowMeetingPoints(true);
          }}
          onCloseMeetingPoints={(open) => {
            setShowMeetingPoints(open);
            if (!open) setMeetingPointsFilterSessionId(null);
          }}
          onShowRoundRules={setShowRoundRules}
          onRoundSelect={handleRoundSelect}
          onTeamSelect={() => {}}
          onTopicSelect={() => {}}
          onMultipleTopicsSelect={() => {}}
          onUnregister={() => {}}
          onConfirmAttendance={() => {}}
          onContinue={() => {}}
        />
      </div>
    </div>
  );
}

function PreviewSessionSuccess() {
  return (
    <div className="min-h-[600px] bg-background">
      <SessionSuccessView
        session={mockSession}
        eventUrl="https://wonderelo.com/andyconf"
        presenterSlideUrl="https://wonderelo.com/promo/andyconf"
        blogPostUrl="https://wonderelo.com/blog/how-to-promote-event"
        copied={false}
        onCopyUrl={() => {}}
        onDownloadQR={() => {}}
        onOpenPresenterSlide={() => {}}
        onBack={() => {}}
      />
    </div>
  );
}

function PreviewAddressBook() {
  const mockContacts: Contact[] = [
    {
      id: 'c1',
      firstName: 'Marcus',
      lastName: 'Rivera',
      email: 'marcus@example.com',
      phone: '+421 903 456 789',
      organizerName: 'Andyho konfera',
      organizerSlug: 'andyconf',
      sessionName: 'Tech Meetup Prague',
      roundName: 'Round 1',
      sessionDate: new Date().toISOString(),
      acquiredAt: new Date().toISOString(),
      allPartners: [],
    },
    {
      id: 'c2',
      firstName: 'Emma',
      lastName: 'Johansson',
      email: 'emma@example.com',
      organizerName: 'Andyho konfera',
      organizerSlug: 'andyconf',
      sessionName: 'Tech Meetup Prague',
      roundName: 'Round 2',
      sessionDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      acquiredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      allPartners: [
        { firstName: 'Emma', lastName: 'Johansson' },
        { firstName: 'Tomáš', lastName: 'Novák' },
      ],
    },
  ];

  return (
    <AddressBookView
      contacts={mockContacts}
      isLoading={false}
      error={null}
      copiedId={null}
      onBack={() => {}}
      onDownloadVCard={() => {}}
      onCopyEmail={() => {}}
      onCopyPhone={() => {}}
    />
  );
}

function PreviewSignIn() {
  const [activeTab, setActiveTab] = useState<'participant' | 'organizer'>('participant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');
  return (
    <SignInFlowView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      email={email}
      password={password}
      showPassword={showPassword}
      isLoading={false}
      error=""
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onToggleShowPassword={() => setShowPassword(v => !v)}
      onSubmit={(e) => e?.preventDefault()}
      onForgotPassword={() => {}}
      participantEmail={participantEmail}
      participantLoading={false}
      participantError=""
      onParticipantEmailChange={setParticipantEmail}
      onParticipantSubmit={(e) => e.preventDefault()}
      onBack={() => {}}
      onSwitchToSignUp={() => {}}
      isFormValid={!!email && !!password}
    />
  );
}

function PreviewSignUp() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [discoverySource, setDiscoverySource] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventTypeOther, setEventTypeOther] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [userRole, setUserRole] = useState('');

  const stepTitles = ['Create your account', 'How did you hear about us?', 'About your organization'];
  const stepDescriptions = [
    'Get started with your Wonderelo account',
    'Help us understand how you discovered Wonderelo',
    'Tell us about your organization and role',
  ];

  return (
    <SignUpFlowView
      currentStep={step}
      totalSteps={3}
      email={email}
      password={password}
      organizerName={organizerName}
      showPassword={showPassword}
      emailCheckStatus={email ? 'available' : 'idle'}
      discoverySource={discoverySource}
      eventType={eventType}
      eventTypeOther={eventTypeOther}
      companySize={companySize}
      userRole={userRole}
      error=""
      isLoading={false}
      isStepValid={true}
      stepTitle={stepTitles[step - 1]}
      stepDescription={stepDescriptions[step - 1]}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onOrganizerNameChange={setOrganizerName}
      onToggleShowPassword={() => setShowPassword(v => !v)}
      onDiscoverySourceChange={setDiscoverySource}
      onEventTypeChange={setEventType}
      onEventTypeOtherChange={setEventTypeOther}
      onCompanySizeChange={setCompanySize}
      onUserRoleChange={setUserRole}
      onNext={() => setStep(s => Math.min(3, s + 1))}
      onPrev={() => setStep(s => Math.max(1, s - 1))}
      onSubmit={() => {}}
      onBack={() => {}}
    />
  );
}

function PreviewResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <ResetPasswordFlowView
      password={password}
      confirmPassword={confirmPassword}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isLoading={false}
      error=""
      success={false}
      passwordError=""
      isFormValid={password.length >= 6 && password === confirmPassword}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onToggleShowPassword={() => setShowPassword(v => !v)}
      onToggleShowConfirmPassword={() => setShowConfirmPassword(v => !v)}
      onSubmit={(e) => e.preventDefault()}
      onBack={() => {}}
      onComplete={() => {}}
    />
  );
}

function PreviewHomepage() {
  const noop = () => {};
  const [participantCode, setParticipantCode] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadEventType, setLeadEventType] = useState('');
  const [leadParticipantCount, setLeadParticipantCount] = useState('');
  return (
    <HomepageView
      onGetStarted={noop}
      onSignIn={noop}
      onNavigate={noop}
      participantCode={participantCode}
      onParticipantCodeChange={setParticipantCode}
      onParticipantJoin={noop}
      leadName={leadName}
      leadEmail={leadEmail}
      leadEventType={leadEventType}
      leadParticipantCount={leadParticipantCount}
      leadSubmitting={false}
      leadSubmitted={false}
      onLeadNameChange={setLeadName}
      onLeadEmailChange={setLeadEmail}
      onLeadEventTypeChange={setLeadEventType}
      onLeadParticipantCountChange={setLeadParticipantCount}
      onLeadSubmit={(e) => e.preventDefault()}
      testimonialApi={undefined}
      testimonialCurrent={0}
      testimonialCount={0}
      onSetTestimonialApi={noop}
      blogApi={undefined}
      blogCurrent={0}
      blogCount={0}
      onSetBlogApi={noop}
    />
  );
}

function PreviewPublicEventPage() {
  const noop = () => {};
  const mockProfile = {
    id: 'preview-user',
    email: 'andy@example.com',
    urlSlug: 'andyconf',
    serviceType: 'event',
    organizerName: 'Andyho konfera',
    eventName: 'Andyho konfera',
    profileImageUrl: '',
  };
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [howItWorksDialogOpen, setHowItWorksDialogOpen] = useState(false);
  return (
    <UserPublicPageView
      userSlug="andyconf"
      userProfile={mockProfile}
      availableSessions={[mockPublishedSession]}
      participantToken={null}
      participantProfile={null}
      registeredRoundIds={[]}
      registeredRoundsMap={new Map()}
      registeredRoundsPerSession={new Map()}
      participantStatusMap={new Map()}
      registrationStep="select-rounds"
      magicLinkDialogOpen={magicLinkDialogOpen}
      magicLinkEmail={magicLinkEmail}
      isSendingMagicLink={false}
      howItWorksDialogOpen={howItWorksDialogOpen}
      onNavigate={noop}
      onLogout={noop}
      onMagicLinkDialogOpenChange={setMagicLinkDialogOpen}
      onMagicLinkEmailChange={setMagicLinkEmail}
      onSendMagicLink={noop}
      onHowItWorksDialogOpenChange={setHowItWorksDialogOpen}
      onRegistrationStepChange={noop}
    />
  );
}

function PreviewBilling() {
  const noop = () => {};
  const [invoicesTab, setInvoicesTab] = useState<'invoices' | 'credits'>('invoices');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState('billing@andyhoconfera.com');
  const [invoiceEmailEditing, setInvoiceEmailEditing] = useState(false);

  const mockSubscription: Subscription = {
    plan: 'premium',
    capacityTier: '50' as any,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    stripeCustomerId: 'cus_preview',
    stripeSubscriptionId: 'sub_preview',
    cancelAtPeriodEnd: false,
  };

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      type: 'subscription',
      amount: 2900,
      currency: 'eur',
      status: 'paid',
      date: new Date(Date.now() - 30 * 86400000).toISOString(),
      description: 'Monthly subscription',
      pdfUrl: '#',
      hostedUrl: null,
      number: 'INV-0001',
    },
    {
      id: 'inv_2',
      type: 'subscription',
      amount: 2900,
      currency: 'eur',
      status: 'paid',
      date: new Date(Date.now() - 60 * 86400000).toISOString(),
      description: 'Monthly subscription',
      pdfUrl: '#',
      hostedUrl: null,
      number: 'INV-0002',
    },
  ];

  const mockCreditTransactions: CreditTransaction[] = [
    {
      id: 1,
      amount: 10,
      type: 'purchase',
      capacityTier: 'tier_50',
      description: 'Credit pack',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const mockBillingDetails: BillingDetails = {
    name: 'Andy Double',
    email: 'billing@andyhoconfera.com',
    address: {
      line1: 'Main Street 1',
      line2: null,
      city: 'Bratislava',
      state: null,
      postalCode: '811 01',
      country: 'Slovakia',
    },
    taxIds: [{ type: 'eu_vat', value: 'SK1234567890' }],
  };

  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <BillingSettingsView
        loading={false}
        subscription={mockSubscription}
        credits={[{ balance: 100, capacityTier: '50' }]}
        creditTransactions={mockCreditTransactions}
        invoices={mockInvoices}
        invoicesLoading={false}
        billingDetails={mockBillingDetails}
        billingDetailsLoading={false}
        invoicesTab={invoicesTab}
        actionLoading={false}
        portalLoading={false}
        showCancelDialog={showCancelDialog}
        invoiceEmail={invoiceEmail}
        invoiceEmailEditing={invoiceEmailEditing}
        invoiceEmailSaving={false}
        accessToken="preview-token"
        onInvoicesTabChange={setInvoicesTab}
        onShowCancelDialog={setShowCancelDialog}
        onCancelSubscription={noop}
        onOpenBillingPortal={noop}
        onInvoiceEmailChange={setInvoiceEmail}
        onInvoiceEmailEditingChange={setInvoiceEmailEditing}
        onSaveInvoiceEmail={noop}
      />
    </div>
  );
}

// ============================================================
// Organizer previews (render real views with mock data)
// ============================================================

const mockPublishedSession: NetworkingSession = {
  ...mockSession,
  status: 'published',
};

function PreviewOrganizerDashboard() {
  const noop = () => {};
  const [checklistVisible, setChecklistVisible] = useState(false);
  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <DashboardView
          eventSlug="andyconf"
          publicUrl="https://wonderelo.com/andyconf"
          sessions={[mockPublishedSession, mockPublishedSession]}
          filteredSessions={[mockPublishedSession]}
          draftSessions={[]}
          scheduledSessions={[]}
          publishedSessions={[mockPublishedSession]}
          completedSessions={[]}
          isLoadingSessions={false}
          copied={false}
          downloadingQR={false}
          checklistVisible={checklistVisible}
          showTour={false}
          currentUser={{ organizerName: 'Andy', onboardingCompletedAt: new Date().toISOString() }}
          onCopyUrl={noop}
          onDownloadQR={noop}
          onNavigate={noop}
          onEditSession={noop}
          onDeleteSession={noop}
          onDuplicateSession={noop}
          onUpdateSession={noop}
          onManageSession={noop}
          onChecklistVisibilityChange={setChecklistVisible}
          onChecklistDismiss={noop}
          onTourComplete={noop}
        />
      </div>
    </div>
  );
}

function PreviewAccountSettings() {
  const [organizerName, setOrganizerName] = useState('Andy');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const noop = () => {};
  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <AccountSettingsView
        userEmail="andy@example.com"
        organizerName={organizerName}
        isLoading={false}
        isSaving={false}
        isChangingPassword={false}
        isChangingEmail={false}
        showEmailChangeForm={showEmailChangeForm}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        newEmail={newEmail}
        emailChangePassword={emailChangePassword}
        onOrganizerNameChange={setOrganizerName}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onNewEmailChange={setNewEmail}
        onEmailChangePasswordChange={setEmailChangePassword}
        onToggleEmailChangeForm={() => setShowEmailChangeForm(v => !v)}
        onCancelEmailChange={() => { setShowEmailChangeForm(false); setNewEmail(''); setEmailChangePassword(''); }}
        onSave={noop}
        onPasswordChange={noop}
        onEmailChange={noop}
      />
    </div>
  );
}

function PreviewEventPageSettings() {
  const [eventName, setEventName] = useState('Andyho konfera');
  const [urlSlug, setUrlSlug] = useState('andyconf');
  const noop = () => {};
  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <EventPageSettingsView
        eventName={eventName}
        urlSlug={urlSlug}
        originalUrlSlug="andyconf"
        profileImageUrl=""
        previewImageUrl={null}
        isLoading={false}
        isSaving={false}
        isCheckingSlug={false}
        slugAvailable={true}
        slugError=""
        isUploadingImage={false}
        onEventNameChange={setEventName}
        onSlugChange={setUrlSlug}
        onImageUpload={noop}
        onOpenFilePicker={noop}
        onSave={noop}
      />
    </div>
  );
}

function PreviewEventPromo() {
  return (
    <EventPromoPageView
      eventSlug="andyconf"
      qrCodeUrl=""
      displayName="Andyho konfera"
      publishedSessions={[mockPublishedSession]}
      organizerName="Andy"
      eventName="Andyho konfera"
      profileImageUrl=""
      onBack={() => {}}
    />
  );
}

function PreviewRoundForm() {
  return (
    <div className="min-h-[600px] bg-background">
      <PreviewHeader />
      <RoundFormPageView
        isEditing={false}
        isDuplicating={false}
        initialData={null}
        userEmail="andy@example.com"
        organizerName="Andy"
        profileImageUrl=""
        userSlug="andyconf"
        onSave={async () => {}}
        onCancel={() => {}}
      />
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function AdminPagePreview({ onBack }: AdminPagePreviewProps) {
  const [activePage, setActivePage] = useState<PreviewPage>('participant-dashboard');

  const renderPreview = () => {
    switch (activePage) {
      case 'participant-dashboard': return <PreviewParticipantDashboard />;
      case 'address-book': return <PreviewAddressBook />;
      case 'meeting-point': return <PreviewMeetingPoint />;
      case 'match-no-match': return <PreviewNoMatch />;
      case 'match-partner': return <PreviewMatchPartner />;
      case 'match-networking': return <PreviewNetworking />;
      case 'contact-sharing': return <PreviewContactSharing />;
      case 'wonderelo-feedback': return <PreviewWondereloFeedback />;
      case 'email-verification': return <PreviewEmailVerification />;
      case 'email-waiting': return <PreviewEmailWaiting />;
      case 'registration-success': return <PreviewRegistrationSuccess />;
      case 'missed-round': return <PreviewMissedRound />;
      case 'round-detail': return <PreviewRoundDetail />;
      case 'participant-profile': return <PreviewProfile />;
      case 'session-registration': return <PreviewRegistration />;
      case 'session-success': return <PreviewSessionSuccess />;
      case 'homepage': return <PreviewHomepage />;
      case 'public-event-page': return <PreviewPublicEventPage />;
      case 'signin': return <PreviewSignIn />;
      case 'signup': return <PreviewSignUp />;
      case 'reset-password': return <PreviewResetPassword />;
      case 'organizer-dashboard': return <PreviewOrganizerDashboard />;
      case 'account-settings': return <PreviewAccountSettings />;
      case 'event-page-settings': return <PreviewEventPageSettings />;
      case 'event-promo': return <PreviewEventPromo />;
      case 'round-form': return <PreviewRoundForm />;
      case 'billing': return <PreviewBilling />;
    }
  };

  const currentPage = PREVIEW_PAGES.find(p => p.id === activePage)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-6 w-px bg-border shrink-0" />
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {PREVIEW_CATEGORIES.map((category, catIdx) => (
                <div key={category.name} className="flex items-center gap-1 shrink-0">
                  {catIdx > 0 && <div className="h-5 w-px bg-border mx-1 shrink-0" />}
                  <span className="text-xs text-muted-foreground font-medium px-1 shrink-0">{category.name}:</span>
                  {category.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setActivePage(page.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        activePage === page.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                      title={page.description}
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Page description bar */}
      <div className="bg-muted/30 border-b px-4 py-2">
        <div className="container mx-auto text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{currentPage.label}</span>
          <span className="mx-2">—</span>
          {currentPage.description}
        </div>
      </div>

      {/* Preview content */}
      <div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-16 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
              Loading preview…
            </div>
          }
        >
          {renderPreview()}
        </Suspense>
      </div>
    </div>
  );
}
