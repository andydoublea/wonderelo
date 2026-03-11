import { useState } from 'react';
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

interface AdminPagePreviewProps {
  onBack: () => void;
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
  | 'participant-profile'
  | 'session-registration'
  | 'session-success';

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
      { id: 'participant-profile', label: 'Profile', description: 'Participant edits their profile' },
    ],
  },
  {
    name: 'Dashboard',
    pages: [
      { id: 'participant-dashboard', label: 'Dashboard', description: 'Participant\'s main dashboard with upcoming rounds' },
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
    ],
  },
  {
    name: 'Organizer',
    pages: [
      { id: 'session-success', label: 'Round created', description: 'Organizer sees success after creating a round' },
    ],
  },
];

// Flat list for lookup
const PREVIEW_PAGES = PREVIEW_CATEGORIES.flatMap(c => c.pages);

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

function PreviewMeetingPoint() {
  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-32">
        <div className="mb-8 text-2xl font-semibold text-primary">14:32</div>
        <h1 className="text-4xl font-bold mb-12">We have a match for you!</h1>
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
          <legend className="px-3 text-xl text-muted-foreground">Now go to</legend>
          <h2 className="text-4xl font-bold mb-6">Lobby Bar</h2>
          <div className="mt-4">
            <div className="mx-auto rounded-lg bg-muted w-full max-w-md h-48 flex items-center justify-center text-muted-foreground">
              <MapPin className="h-12 w-12" />
            </div>
          </div>
        </fieldset>
        <button className="text-muted-foreground hover:text-foreground underline">Back to dashboard</button>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-10">
        <div className="max-w-md mx-auto">
          <Button size="lg" className="w-full">
            <MapPin className="h-5 w-5 mr-2" />
            I am here
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewNoMatch() {
  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="text-6xl mb-6">😳</div>
        <h1 className="text-4xl font-bold mb-4">No match found</h1>
        <p className="text-lg text-muted-foreground mb-12">
          No one else registered for this round.
        </p>
        <h2 className="text-2xl font-bold mb-6">Try another round!</h2>
        <Button size="lg">Back to dashboard</Button>
      </div>
    </div>
  );
}

function PreviewMatchPartner() {
  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold mb-12">Now, find each other!</h1>

        {/* Identification image */}
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
          <legend className="px-3 text-xl text-muted-foreground">
            Show this so Marcus can find you
          </legend>
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

        {/* Partner names */}
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
          <legend className="px-3 text-xl text-muted-foreground">Look for</legend>
          <h2 className="text-4xl font-bold">Marcus</h2>
        </fieldset>

        {/* Number confirmation */}
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
          <legend className="px-3 text-xl text-muted-foreground">To confirm meeting select</legend>
          <h2 className="text-3xl font-bold mb-8">Marcus's number</h2>
          <div className="flex items-center justify-center gap-6">
            {[17, 42, 63].map((n) => (
              <button key={n} className="w-24 h-24 rounded-full border-2 border-border bg-background hover:bg-accent hover:border-foreground transition-all flex items-center justify-center">
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

function PreviewNetworking() {
  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="mb-8 text-2xl font-semibold text-primary">18:42</div>

        <h1 className="text-4xl font-bold mb-4">
          Skip the weather talk and jump into deep topics!
        </h1>

        {/* Ice breakers */}
        <div className="mt-12">
          <p className="text-lg text-muted-foreground mb-6">Take them or leave them</p>
          <div className="space-y-4 text-left max-w-md mx-auto">
            {MOCK_ICE_BREAKERS.map((q, i) => (
              <div key={i} className="flex gap-3 p-4 border rounded-lg">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <button className="text-muted-foreground hover:text-foreground underline">Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

const MOCK_FEEDBACK_OPTIONS = [
  { id: 'nice-talk', label: 'Nice talk', icon: '💬' },
  { id: 'very-interesting', label: 'Very interesting person', icon: '✨' },
  { id: 'continue-chat', label: "I'd like to continue the chat", icon: '🔄' },
  { id: 'very-nice', label: "You're very nice", icon: '😊' },
  { id: 'not-my-type', label: 'Not quite my type', icon: '🤷' },
  { id: 'awkward', label: 'A bit awkward', icon: '😬' },
];

function PreviewContactSharing() {
  const [contactSharing, setContactSharing] = useState<Record<string, boolean>>({});
  const [selectedFeedback, setSelectedFeedback] = useState<Record<string, string[]>>({});
  const [wondereloRating, setWondereloRating] = useState<string | null>(null);
  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-12">
        <h1 className="text-4xl font-bold mb-4">How was your conversation?</h1>

        {/* Psychological insight */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 max-w-md mx-auto text-left">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Did you know?</span> Research shows we consistently underestimate how much others enjoyed talking to us. If you enjoyed the conversation, let the other person know — they probably feel the same way!
          </p>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          {[MOCK_PARTICIPANTS[1]].map((p) => (
            <div key={p.id} className="border-2 rounded-2xl overflow-hidden">
              {/* Partner header */}
              <div className="p-4 pb-3">
                <p className="text-xl font-bold text-left">{p.firstName} {p.lastName}</p>
              </div>

              {/* Feedback buttons */}
              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground mb-2 text-left">Send a quick reaction (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_FEEDBACK_OPTIONS.map((option) => {
                    const isSelected = (selectedFeedback[p.id] || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedFeedback(prev => {
                          const current = prev[p.id] || [];
                          const updated = current.includes(option.id)
                            ? current.filter(f => f !== option.id)
                            : [...current, option.id];
                          return { ...prev, [p.id]: updated };
                        })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border ${
                          isSelected
                            ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom feedback */}
              <div className="px-4 pb-3">
                <Textarea
                  placeholder="Write your own feedback (optional)"
                  className="text-sm resize-none h-16"
                  readOnly
                />
              </div>

              {/* Contact sharing toggle */}
              <div className="px-4 pb-4 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium">Share my contact</p>
                    <p className="text-xs text-muted-foreground">Both must agree to exchange contacts</p>
                  </div>
                  <Switch
                    checked={contactSharing[p.id] || false}
                    onCheckedChange={() => setContactSharing(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info box about feedback & contacts delivery */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 mt-8 max-w-md mx-auto text-left">
          <p className="text-sm text-muted-foreground">
            Feedback and contacts will be shared after 15 minutes.
          </p>
        </div>

        {/* Wonderelo feedback section */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4">How was your Wonderelo experience?</h2>

            <div className="flex justify-center gap-4 mb-4">
              {[
                { id: 'sad', emoji: '😞', label: 'Not great' },
                { id: 'neutral', emoji: '😐', label: 'Okay' },
                { id: 'happy', emoji: '😊', label: 'Great!' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setWondereloRating(wondereloRating === option.id ? null : option.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2 ${
                    wondereloRating === option.id
                      ? 'border-primary bg-primary/5 scale-110'
                      : 'border-transparent hover:bg-muted'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Tell us more (optional)"
              className="text-sm resize-none h-20"
              readOnly
            />
          </div>
        </div>

        {/* Finish button (not sticky) */}
        <div className="mt-8 max-w-md mx-auto">
          <Button size="lg" className="w-full">Finish</Button>
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

function PreviewAddressBook() {
  const mockContacts = [
    {
      id: 'c1',
      firstName: 'Marcus',
      lastName: 'Rivera',
      email: 'marcus@example.com',
      phone: '+421 903 456 789',
      organizerName: 'Andyho konfera',
      sessionName: 'Tech Meetup Prague',
      roundName: 'Round 1',
      sessionDate: new Date().toISOString(),
      allPartners: [],
    },
    {
      id: 'c2',
      firstName: 'Emma',
      lastName: 'Johansson',
      email: 'emma@example.com',
      organizerName: 'Andyho konfera',
      sessionName: 'Tech Meetup Prague',
      roundName: 'Round 2',
      sessionDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      allPartners: [
        { firstName: 'Emma', lastName: 'Johansson' },
        { firstName: 'Tomáš', lastName: 'Novák' },
      ],
    },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-[600px] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4 mb-1">Address Book</h1>
          <p className="text-sm text-muted-foreground">
            {mockContacts.length} contacts from your networking rounds
          </p>
        </div>

        <div className="space-y-3">
          {mockContacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-xl p-4 bg-card hover:border-muted-foreground/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold leading-tight">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[contact.organizerName, contact.sessionName, contact.roundName].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(contact.sessionDate)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-primary truncate flex-1">{contact.email}</span>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-primary flex-1">{contact.phone}</span>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {contact.allPartners && contact.allPartners.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                  Group: {contact.allPartners.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
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
      case 'address-book': return <PreviewAddressBook />;
      case 'meeting-point': return <PreviewMeetingPoint />;
      case 'match-no-match': return <PreviewNoMatch />;
      case 'match-partner': return <PreviewMatchPartner />;
      case 'match-networking': return <PreviewNetworking />;
      case 'contact-sharing': return <PreviewContactSharing />;
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
        {renderPreview()}
      </div>
    </div>
  );
}
