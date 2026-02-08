// Preview mode mock data for admin participant preview tool

export function isPreviewToken(token: string): boolean {
  return token.startsWith('PREVIEW_');
}

export function getPreviewScenario(token: string): string {
  // Extract scenario from token: PREVIEW_scenario-id
  return token.replace('PREVIEW_', '');
}

export function getPreviewMatchData(scenario: string) {
  const mockMatches: Record<string, any> = {
    'no-match': null,
    'waiting-match': null,
    'matched-1v1': {
      id: 'match-1',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2'],
      meetingPointId: 'Main entrance',
      identificationImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
      checkIns: [],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Petra', lastName: 'Horváthová', email: 'petra.horvathova@example.com' }
      ]
    },
    'matched-group-3': {
      id: 'match-2',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2', 'participant-3'],
      meetingPointId: 'Coffee corner',
      identificationImage: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&h=400&fit=crop',
      checkIns: [],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Anna', lastName: 'Slobodová', email: 'anna.slobodova@example.com' },
        { id: 'participant-3', firstName: 'Tomáš', lastName: 'Dvořák', email: 'tomas.dvorak@example.com' }
      ]
    },
    'matched-group-4': {
      id: 'match-3',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2', 'participant-3', 'participant-4'],
      meetingPointId: 'Conference room A',
      identificationImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
      checkIns: [],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Michal', lastName: 'Varga', email: 'michal.varga@example.com' },
        { id: 'participant-3', firstName: 'Eva', lastName: 'Baláž', email: 'eva.balaz@example.com' },
        { id: 'participant-4', firstName: 'Peter', lastName: 'Tóth', email: 'peter.toth@example.com' }
      ]
    },
    'walking-to-meeting': {
      id: 'match-4',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2'],
      meetingPointId: 'Reception desk',
      identificationImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop',
      checkIns: [],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Filip', lastName: 'Šimko', email: 'filip.simko@example.com' }
      ]
    },
    'partially-checked-in': {
      id: 'match-5',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2', 'participant-3'],
      meetingPointId: 'Main lobby',
      identificationImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=400&fit=crop',
      checkIns: [
        { participantId: 'participant-2', checkedInAt: new Date(Date.now() - 120000).toISOString() }
      ],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Marek', lastName: 'Bednár', email: 'marek.bednar@example.com' },
        { id: 'participant-3', firstName: 'Simona', lastName: 'Krajčová', email: 'simona.krajcova@example.com' }
      ]
    },
    'all-checked-in': {
      id: 'match-6',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2', 'participant-3'],
      meetingPointId: 'Cafeteria',
      identificationImage: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=400&fit=crop',
      checkIns: [
        { participantId: 'preview-participant-1', checkedInAt: new Date(Date.now() - 300000).toISOString() },
        { participantId: 'participant-2', checkedInAt: new Date(Date.now() - 240000).toISOString() },
        { participantId: 'participant-3', checkedInAt: new Date(Date.now() - 180000).toISOString() }
      ],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Nikola', lastName: 'Szabó', email: 'nikola.szabo@example.com' },
        { id: 'participant-3', firstName: 'Matúš', lastName: 'Lukáč', email: 'matus.lukac@example.com' }
      ]
    },
    'met-confirmed': {
      id: 'match-7',
      roundId: 'preview-round-1',
      participantIds: ['preview-participant-1', 'participant-2'],
      meetingPointId: 'Terrace',
      identificationImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=400&fit=crop',
      checkIns: [
        { participantId: 'preview-participant-1', checkedInAt: new Date(Date.now() - 1800000).toISOString() },
        { participantId: 'participant-2', checkedInAt: new Date(Date.now() - 1740000).toISOString() }
      ],
      participants: [
        { id: 'preview-participant-1', firstName: 'Preview', lastName: 'User', email: 'preview@example.com' },
        { id: 'participant-2', firstName: 'Jakub', lastName: 'Čech', email: 'jakub.cech@example.com' }
      ]
    }
  };

  const mockMatch = mockMatches[scenario] || mockMatches['matched-1v1'];
  
  if (!mockMatch) {
    return null;
  }

  return {
    ...mockMatch,
    meetingPoint: mockMatch.meetingPointId
  };
}
