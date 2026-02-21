import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { RoundItem } from './RoundItem';
import { Calendar, Clock, Users } from 'lucide-react';
import { NetworkingSession, Round } from '../App';
import { ParticipantNav } from './ParticipantNav';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { GeometricIdentification } from './GeometricIdentification';

interface MockParticipant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MockMatch {
  id: string;
  roundId: string;
  participantIds: string[];
  meetingPoint: string;
  identificationImage: string;
  checkIns: Array<{
    participantId: string;
    checkedInAt: string;
  }>;
  participants: MockParticipant[];
}

interface MockData {
  participantStatus: string;
  matchData: {
    match?: MockMatch;
  } | null;
}

interface ParticipantPreviewMockProps {
  mockData: MockData;
  scenarioName: string;
  view?: 'dashboard' | 'match-info'; // Add view prop
}

export function ParticipantPreviewMock({ mockData, scenarioName, view = 'dashboard' }: ParticipantPreviewMockProps) {
  const { participantStatus, matchData } = mockData;
  const match = matchData?.match;

  // Create mock session and round data that matches the real ParticipantDashboard structure
  const mockSession: NetworkingSession = {
    id: 'preview-session-1',
    name: 'Tech Conference 2026',
    description: 'Annual technology conference with networking opportunities',
    date: new Date().toISOString().split('T')[0],
    organizerId: 'preview-organizer',
    rounds: [],
    status: 'published',
    createdAt: new Date().toISOString(),
    enableTeams: false,
    enableTopics: false,
    allowMultipleTopics: false,
    teams: [],
    topics: [],
    meetingPoints: match ? [{
      id: 'meeting-point-1',
      name: match.meetingPoint,
      identificationImage: match.identificationImage
    }] : [],
    serviceType: 'one-time' as const,
    tZeroMinutes: 15,
    sessionDuration: 20,
    roundDuration: 20,
    groupSize: 4,
    limitParticipants: false,
    maxParticipants: 100
  };

  const now = new Date();
  const roundStart = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
  const roundStartTime = `${String(roundStart.getHours()).padStart(2, '0')}:${String(roundStart.getMinutes()).padStart(2, '0')}`;

  const mockRound: Round = {
    id: 'preview-round-1',
    name: 'Round 1',
    date: mockSession.date,
    startTime: roundStartTime,
    duration: 20,
    tZeroMinutes: 15,
    status: 'published',
    createdAt: new Date().toISOString(),
    maxGroupSize: 4,
    allowOverflowMatching: true
  };

  mockSession.rounds = [mockRound];

  const generateRoundTimeDisplay = (round: Round, session: NetworkingSession) => {
    if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') {
      return 'Time TBD';
    }
    return round.startTime;
  };

  // Extract match details if available
  const matchDetails = match ? {
    matchId: match.id,
    matchPartnerNames: match.participants
      .filter(p => p.id !== 'participant-1')
      .map(p => `${p.firstName} ${p.lastName}`),
    meetingPointId: 'meeting-point-1',
    identificationImageUrl: match.identificationImage
  } : undefined;

  // Render Match Info view
  if (view === 'match-info') {
    if (!match) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">No match data available for this scenario</p>
        </div>
      );
    }

    // Filter out current participant (participant-1) from the list
    const otherParticipants = match.participants.filter(p => p.id !== 'participant-1');
    
    // Get current participant for identification image overlay
    const currentParticipant = match.participants.find(p => p.id === 'participant-1');

    // Create a mock countdown time (30 minutes from now)
    const countdownTime = new Date(Date.now() + 30 * 60000).toISOString();

    return (
      <div className="min-h-screen bg-background">
        {/* Logo */}
        <nav className="border-b border-border">
          <div className="container mx-auto max-w-6xl px-6 py-4">
            <button className="text-xl font-semibold text-primary wonderelo-logo hover:opacity-80 transition-opacity">
              Wonderelo
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          {/* Countdown */}
          <div className="mb-8 text-2xl font-semibold text-primary">
            30:00
          </div>

          {/* We have a match for you! */}
          <h1 className="text-4xl font-bold mb-12">
            We have a match for you!
          </h1>

          {/* Now go to - in a bordered box */}
          <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
            <legend className="px-3 text-xl text-muted-foreground">
              Now go to
            </legend>
            <h2 className="text-5xl font-bold mb-6">
              {match.meetingPoint}
            </h2>
            
            {/* Meeting point photo */}
            <div className="mt-4">
              <img
                src="https://images.unsplash.com/photo-1758941807754-cfb0a25e26c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidWlsZGluZyUyMGVudHJhbmNlfGVufDF8fHx8MTc2OTg1ODQ3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt={match.meetingPoint}
                className="mx-auto rounded-lg shadow-lg max-w-md w-full object-cover"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </fieldset>

          {/* Look for - in a bordered box */}
          <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
            <legend className="px-3 text-xl text-muted-foreground">
              Look for
            </legend>
            <div className="space-y-3">
              {otherParticipants.map((participant) => (
                <h2 key={participant.id} className="text-5xl font-bold">
                  {participant.firstName}
                </h2>
              ))}
            </div>
          </fieldset>

          {/* Have this image visible - in a bordered box */}
          {currentParticipant && (
            <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
              <legend className="px-3 text-xl text-muted-foreground">
                Have this image visible
              </legend>
              <div className="relative inline-block">
                <GeometricIdentification 
                  matchId={match.id}
                  className="rounded-lg shadow-lg max-w-md w-full"
                />
                {/* Participant name and ID overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <h3 className="text-6xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {currentParticipant.firstName}
                  </h3>
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-foreground">
                      42
                    </span>
                  </div>
                </div>
              </div>
            </fieldset>
          )}

          {/* Confirmation sections - one for each participant */}
          {otherParticipants.map((participant, pIndex) => {
            // Generate mock numbers
            const mockIdNumber = 50 + pIndex * 10; // 50, 60, 70, etc.
            const mockNumbers = [mockIdNumber, mockIdNumber + 5, mockIdNumber - 5];
            
            return (
              <fieldset key={participant.id} className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
                <legend className="px-3 text-xl text-muted-foreground">
                  To confirm meeting select
                </legend>
                <h2 className="text-3xl font-bold mb-8">
                  {participant.firstName}'s number
                </h2>
                <div className="flex items-center justify-center gap-6">
                  {mockNumbers.map((number, index) => (
                    <button
                      key={index}
                      className="w-24 h-24 rounded-full border-2 border-border bg-background hover:bg-accent hover:border-foreground transition-all flex items-center justify-center"
                    >
                      <span className="text-4xl font-bold">{number}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}

          {/* Back to dashboard link */}
          <div>
            <button className="text-muted-foreground hover:text-foreground underline transition-colors">
              Back to dashboard
            </button>
          </div>

          {/* Debug Info */}
          <Card className="border-dashed mt-12 max-w-md mx-auto">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Preview Mode - {scenarioName}
                </h3>
                <div className="text-xs font-mono bg-muted p-3 rounded space-y-1 text-left">
                  <div><span className="text-muted-foreground">View:</span> <span className="font-semibold">Match Info Page</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{participantStatus}</span></div>
                  <div><span className="text-muted-foreground">Meeting Point:</span> {match.meetingPoint}</div>
                  <div><span className="text-muted-foreground">Participants:</span> {match.participants.length}</div>
                  <div><span className="text-muted-foreground">Other participants:</span> {otherParticipants.map(p => p.firstName).join(', ')}</div>
                  {currentParticipant && (
                    <div><span className="text-muted-foreground">Your name:</span> {currentParticipant.firstName}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render Dashboard view (default)
  return (
    <div className="min-h-screen bg-background">
      {/* Participant Navigation */}
      <ParticipantNav
        participantToken="preview-token"
        firstName="Preview"
        lastName="User"
        onLogoClick={() => {}}
        onHomeClick={() => {}}
        onDashboardClick={() => {}}
        onProfileClick={() => {}}
        onLogout={() => {}}
      />
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-1">Your rounds</h1>
            <p className="text-muted-foreground">
              Preview User • preview@wonderelo.com
            </p>
          </div>

          {/* Upcoming section */}
          <div>
            <h2 className="mb-4">Upcoming rounds</h2>
            <div className="space-y-4">
              <Card className="transition-all hover:border-muted-foreground/20 max-w-md">
                <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                  {/* Session header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="mb-2">Preview Organizer</h3>
                      <Badge variant="outline" className="mb-2">{mockSession.name}</Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(mockSession.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {mockSession.roundDuration} min rounds
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Users className="h-4 w-4" />
                    {mockSession.limitParticipants ? `Max ${mockSession.maxParticipants}` : 'Unlimited'} participants • Groups of {mockSession.groupSize}
                  </div>

                  {/* Rounds */}
                  <div className="mt-3">
                    <div className="space-y-2">
                      <RoundItem
                        key={mockRound.id}
                        round={mockRound}
                        session={mockSession}
                        isRegistered={true}
                        participantStatus={participantStatus}
                        participantId="preview-participant-1"
                        showUnregisterButton={false}
                        onUnregister={() => {}}
                        generateRoundTimeDisplay={generateRoundTimeDisplay}
                        isNextUpcoming={true}
                        onConfirmAttendance={() => {}}
                        onConfirmationWindowExpired={() => {}}
                        matchDetails={matchDetails}
                      />
                    </div>
                    
                    {/* Add more rounds button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                    >
                      + Add more rounds
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Debug Info */}
              <Card className="border-dashed max-w-md">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Preview Mode - {scenarioName}
                    </h3>
                    <div className="text-xs font-mono bg-muted p-3 rounded space-y-1">
                      <div><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{participantStatus}</span></div>
                      <div><span className="text-muted-foreground">Has Match:</span> {match ? 'Yes' : 'No'}</div>
                      {match && (
                        <>
                          <div><span className="text-muted-foreground">Participants:</span> {match.participants.length}</div>
                          <div><span className="text-muted-foreground">Checked In:</span> {match.checkIns.length} / {match.participants.length}</div>
                          <div><span className="text-muted-foreground">Meeting Point:</span> {match.meetingPoint}</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Completed section (empty in preview) */}
          <div>
            <h2 className="mb-4">Completed rounds</h2>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed rounds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}