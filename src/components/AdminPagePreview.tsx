import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Eye } from 'lucide-react';
import { ParticipantNav } from './ParticipantNav';
import { NetworkingSession, Round } from '../App';
import { RoundItem } from './RoundItem';
import { GeometricIdentification } from './GeometricIdentification';
import { Calendar, Clock, Users, MapPin, CheckCircle, AlertTriangle, MessageCircle, Share2, UserCheck } from 'lucide-react';

interface AdminPagePreviewProps {
  onBack: () => void;
}

// ============================================================
// Mock data generators
// ============================================================

const MOCK_PARTICIPANTS = [
  { id: 'p1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@example.com' },
  { id: 'p2', firstName: 'Marcus', lastName: 'Rivera', email: 'marcus@example.com' },
  { id: 'p3', firstName: 'Emma', lastName: 'Johansson', email: 'emma@example.com' },
  { id: 'p4', firstName: 'Tomáš', lastName: 'Novák', email: 'tomas@example.com' },
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
  | 'match-found'
  | 'match-no-match'
  | 'match-partner'
  | 'match-networking'
  | 'participant-profile'
  | 'session-registration'
  | 'session-success';

const PREVIEW_PAGES: { id: PreviewPage; label: string; description: string }[] = [
  { id: 'participant-dashboard', label: 'Dashboard', description: 'Participant\'s main dashboard with upcoming rounds' },
  { id: 'match-found', label: 'Match found', description: 'Participant has been matched — go to meeting point' },
  { id: 'match-no-match', label: 'No match', description: 'No match available for this round' },
  { id: 'match-partner', label: 'Partner check-in', description: 'Confirm meeting your match partner' },
  { id: 'match-networking', label: 'Networking', description: 'Active networking with ice breakers & contact sharing' },
  { id: 'participant-profile', label: 'Profile', description: 'Participant edits their profile' },
  { id: 'session-registration', label: 'Registration', description: 'Participant registers for a round' },
  { id: 'session-success', label: 'Round created', description: 'Organizer sees success after creating a round' },
];

// ============================================================
// Individual preview renderers
// ============================================================

function PreviewParticipantDashboard() {
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your rounds</h1>
            <p className="text-muted-foreground">Sarah Chen • sarah@example.com</p>
          </div>

          <div>
            <h2 className="mb-4">Upcoming rounds</h2>
            <div className="space-y-4">
              <Card className="transition-all hover:border-muted-foreground/20 max-w-md">
                <CardContent className="pt-4 pb-6 px-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="mb-2">Andyho konfera</h3>
                      <Badge variant="outline" className="mb-2">{mockSession.name}</Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No completed rounds yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMatchFound() {
  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <button className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</button>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="mb-8 text-2xl font-semibold text-primary">14:32</div>
        <h1 className="text-4xl font-bold mb-12">We have a match for you!</h1>
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
          <legend className="px-3 text-xl text-muted-foreground">Now go to</legend>
          <h2 className="text-5xl font-bold mb-4">Lobby Bar</h2>
          <div className="mt-4">
            <div className="mx-auto rounded-lg bg-muted w-full max-w-md h-48 flex items-center justify-center text-muted-foreground">
              <MapPin className="h-12 w-12" />
            </div>
          </div>
        </fieldset>
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
          <legend className="px-3 text-xl text-muted-foreground">Look for</legend>
          <h2 className="text-5xl font-bold">Marcus</h2>
        </fieldset>
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
          <legend className="px-3 text-xl text-muted-foreground">Have this image visible</legend>
          <div className="relative inline-block">
            <GeometricIdentification matchId="preview-match-1" className="rounded-lg shadow-lg max-w-md w-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <h3 className="text-6xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Sarah</h3>
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-foreground">42</span>
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
          <legend className="px-3 text-xl text-muted-foreground">To confirm meeting select</legend>
          <h2 className="text-3xl font-bold mb-8">Marcus's number</h2>
          <div className="flex items-center justify-center gap-6">
            {[17, 42, 63].map((n) => (
              <button key={n} className="w-24 h-24 rounded-full border-2 border-border bg-background hover:bg-accent transition-all flex items-center justify-center">
                <span className="text-4xl font-bold">{n}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <button className="text-muted-foreground hover:text-foreground underline">Back to dashboard</button>
      </div>
    </div>
  );
}

function PreviewNoMatch() {
  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <button className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</button>
        </div>
      </nav>
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-6">😳</div>
        <h1 className="text-2xl font-bold mb-4">No match this round</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find a match for you this time. Don't worry — you'll be included in the next round automatically.
        </p>
        <Button variant="outline">Back to dashboard</Button>
      </div>
    </div>
  );
}

function PreviewMatchPartner() {
  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <button className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</button>
        </div>
      </nav>
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Find your partner</h1>
        <p className="text-muted-foreground mb-8">Head to <strong>Lobby Bar</strong> and look for Marcus</p>

        <div className="mb-8">
          <GeometricIdentification matchId="preview-match-1" className="rounded-lg shadow-lg max-w-sm mx-auto w-full" />
          <div className="mt-4 text-sm text-muted-foreground">Show this image so Marcus can find you</div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">M</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">Marcus Rivera</div>
                  <div className="text-sm text-muted-foreground">Waiting for check-in...</div>
                </div>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">When you meet Marcus, both of you confirm the meeting</p>
      </div>
    </div>
  );
}

function PreviewNetworking() {
  const [shared, setShared] = useState<Record<string, boolean>>({});
  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <button className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</button>
        </div>
      </nav>
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-primary mb-2">18:42</div>
          <h1 className="text-2xl font-bold mb-1">Enjoy your conversation!</h1>
          <p className="text-muted-foreground">Round 1 • {mockSession.name}</p>
        </div>

        {/* Ice breakers */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Ice breakers</h3>
            </div>
            <div className="space-y-2">
              {MOCK_ICE_BREAKERS.map((q, i) => (
                <div key={i} className="text-sm p-2 rounded bg-muted/50">💬 {q}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact sharing */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Share your contact?</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">M</span>
                  </div>
                  <span className="font-medium">Marcus Rivera</span>
                </div>
                <Button
                  size="sm"
                  variant={shared['marcus'] ? 'default' : 'outline'}
                  onClick={() => setShared(s => ({ ...s, marcus: !s.marcus }))}
                >
                  {shared['marcus'] ? '✓ Shared' : 'Share'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button className="text-muted-foreground hover:text-foreground underline text-sm">Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

function PreviewProfile() {
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
        <h1 className="text-2xl font-bold mb-6">Your profile</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">First name</label>
            <input className="w-full border rounded-lg px-3 py-2 bg-background" defaultValue="Sarah" readOnly />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Last name</label>
            <input className="w-full border rounded-lg px-3 py-2 bg-background" defaultValue="Chen" readOnly />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input className="w-full border rounded-lg px-3 py-2 bg-background" defaultValue="sarah@example.com" readOnly />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <div className="flex gap-2">
              <select className="border rounded-lg px-2 py-2 bg-background w-24">
                <option>+421</option>
              </select>
              <input className="flex-1 border rounded-lg px-3 py-2 bg-background" defaultValue="912 345 678" readOnly />
            </div>
          </div>
          <Button className="w-full">Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function PreviewRegistration() {
  return (
    <div className="min-h-[600px] bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <button className="text-xl font-semibold text-primary wonderelo-logo">Wonderelo</button>
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Tech Meetup Prague</h1>
          <p className="text-muted-foreground">Andyho konfera</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Choose your rounds</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <input type="checkbox" className="w-4 h-4" defaultChecked />
                <div className="flex-1">
                  <div className="font-medium">Round 1</div>
                  <div className="text-sm text-muted-foreground">{mockRound.startTime} • {mockRound.duration} min</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <input type="checkbox" className="w-4 h-4" />
                <div className="flex-1">
                  <div className="font-medium">Round 2</div>
                  <div className="text-sm text-muted-foreground">16:00 • 20 min</div>
                </div>
              </label>
            </div>
            <Button className="w-full mt-6">Register</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreviewSessionSuccess() {
  return (
    <div className="min-h-[600px] bg-background">
      <div className="pt-8 text-center space-y-8 px-6">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold">Round created successfully!</h2>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{mockSession.name}</h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(mockSession.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-1"><Users className="h-4 w-4" /> Groups of {mockSession.groupSize}</div>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {mockSession.roundDuration} min</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Share your event with participants</h3>
                <p className="text-sm text-muted-foreground">Your round is live! Promote it to get participants registered.</p>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Your event page URL</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm break-all">https://wonderelo.com/andyconf</code>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full">Copy URL</Button>
                <Button variant="outline" className="w-full">Download QR code</Button>
                <Button variant="outline" className="w-full">Open Promo Slide</Button>
              </div>
              <div className="text-center">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground underline">How to promote your event →</a>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button variant="outline">← Back to rounds</Button>
      </div>
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
      case 'match-found': return <PreviewMatchFound />;
      case 'match-no-match': return <PreviewNoMatch />;
      case 'match-partner': return <PreviewMatchPartner />;
      case 'match-networking': return <PreviewNetworking />;
      case 'participant-profile': return <PreviewProfile />;
      case 'session-registration': return <PreviewRegistration />;
      case 'session-success': return <PreviewSessionSuccess />;
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PREVIEW_PAGES.map((page) => (
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
        {renderPreview()}
      </div>
    </div>
  );
}
