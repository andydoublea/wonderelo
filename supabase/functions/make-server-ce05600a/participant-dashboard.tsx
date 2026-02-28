import * as db from './db.ts';
import { errorLog, debugLog } from './debug.tsx';
import { createMatchesForRound } from './matching.tsx';

// ==========================================
// VERSION: 8.0.0 - PostgreSQL migration
// ==========================================

// Helper function to get system parameters with defaults
async function getSystemParameters() {
  try {
    const parameters = await db.getAdminSetting('system_parameters');

    if (!parameters) {
      return {
        confirmationWindowMinutes: 5,
        safetyWindowMinutes: 6,
        walkingTimeMinutes: 3,
        notificationEarlyMinutes: 10,
        notificationEarlyEnabled: true,
        notificationLateMinutes: 5,
        notificationLateEnabled: true,
        minimalGapBetweenRounds: 10,
        minimalRoundDuration: 5,
        maximalRoundDuration: 240,
        minimalTimeToFirstRound: 10,
        defaultRoundDuration: 10,
        defaultGapBetweenRounds: 10,
        defaultNumberOfRounds: 1,
        defaultMaxParticipants: 20,
        defaultGroupSize: 2,
      };
    }

    return parameters;
  } catch (error) {
    errorLog('Error getting system parameters:', error);
    return {
      confirmationWindowMinutes: 5,
      safetyWindowMinutes: 6,
      walkingTimeMinutes: 3,
      notificationEarlyMinutes: 10,
      notificationEarlyEnabled: true,
      notificationLateMinutes: 5,
      notificationLateEnabled: true,
      minimalGapBetweenRounds: 10,
      minimalRoundDuration: 5,
      maximalRoundDuration: 240,
      minimalTimeToFirstRound: 10,
      defaultRoundDuration: 10,
      defaultGapBetweenRounds: 10,
      defaultNumberOfRounds: 1,
      defaultMaxParticipants: 20,
      defaultGroupSize: 2,
    };
  }
}

// ADMIN: Preview mode helper functions
function isPreviewToken(token: string): boolean {
  return token.startsWith('PREVIEW_');
}

function getPreviewScenario(token: string): string {
  return token.replace('PREVIEW_', '');
}

function getPreviewMockData(scenario: string) {
  const now = new Date();
  let roundStartTime: string;
  let status: string;

  if (scenario === 'no-match' || scenario === 'waiting-match') {
    const futureTime = new Date(now.getTime() + 30 * 60000);
    roundStartTime = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
    status = scenario === 'waiting-match' ? 'waiting-for-match' : 'confirmed';
  } else if (scenario.includes('matched') || scenario.includes('walking') || scenario.includes('checked-in') || scenario === 'met-confirmed') {
    const futureTime = new Date(now.getTime() + 10 * 60000);
    roundStartTime = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;

    if (scenario.includes('matched') && !scenario.includes('walking') && !scenario.includes('checked')) {
      status = 'matched';
    } else if (scenario.includes('walking')) {
      status = 'walking-to-meeting-point';
    } else if (scenario.includes('checked-in')) {
      status = 'waiting-for-meet-confirmation';
    } else if (scenario === 'met-confirmed') {
      status = 'met';
    } else {
      status = 'matched';
    }
  } else {
    const futureTime = new Date(now.getTime() + 20 * 60000);
    roundStartTime = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
    status = 'confirmed';
  }

  const mockSession = {
    id: 'preview-session-1',
    userId: 'preview-organizer-1',
    name: 'Summer Tech Conference 2026',
    description: 'Annual networking event for tech professionals',
    date: new Date().toISOString().split('T')[0],
    status: 'published',
    rounds: [
      {
        id: 'preview-round-1',
        name: 'Networking Round 1',
        startTime: roundStartTime,
        duration: 15,
        date: new Date().toISOString().split('T')[0],
        status: 'scheduled',
        meetingPoints: ['Main entrance', 'Coffee corner', 'Conference room A'],
        confirmationWindow: 5
      }
    ]
  };

  const mockRegistration = {
    sessionId: 'preview-session-1',
    roundId: 'preview-round-1',
    sessionName: 'Summer Tech Conference 2026',
    roundName: 'Networking Round 1',
    organizerId: 'preview-organizer-1',
    organizerName: 'TechOrg Events',
    organizerUrlSlug: 'techorg',
    status: status,
    startTime: roundStartTime,
    duration: 15,
    date: new Date().toISOString().split('T')[0],
    registeredAt: new Date().toISOString(),
    notificationsEnabled: true,
    confirmedAt: status !== 'registered' ? new Date().toISOString() : undefined
  };

  return {
    session: mockSession,
    registration: mockRegistration
  };
}

// Helper function to parse round start time
function parseRoundStartTime(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const CET_OFFSET_HOURS = 1;
  return new Date(Date.UTC(year, month - 1, day, hours - CET_OFFSET_HOURS, minutes, 0, 0));
}

// Helper function to dynamically update session status based on round times
export function updateSessionStatusBasedOnRounds(session: any, now: Date = new Date()): void {
  if (!session || !session.rounds || session.rounds.length === 0) {
    return;
  }

  if (session.status !== 'published' && session.status !== 'scheduled') {
    return;
  }

  const allRoundsCompleted = session.rounds.every((round: any) => {
    if (!round.date || !round.startTime) {
      return false;
    }

    const [year, month, day] = round.date.split('-').map(Number);
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const roundStart = new Date(Date.UTC(year, month - 1, day, hours - 1, minutes, 0, 0));
    const maxRoundEnd = new Date(roundStart.getTime() + (round.duration + 5) * 60000);
    return now >= maxRoundEnd;
  });

  if (allRoundsCompleted) {
    session.status = 'completed';
  }
}

// OPTIMIZED: Get everything for participant dashboard using SQL JOINs
export async function getParticipantDashboard(token: string, getCurrentTime: (c: any) => Date, c: any) {
  try {
    console.log('🟢 getParticipantDashboard called with token:', token?.substring(0, 20) + '...');

    if (!token) {
      return { error: 'Token required', status: 400 };
    }

    // Check if this is a preview token
    if (isPreviewToken(token)) {
      console.log('✅ Preview token detected');
      const scenario = getPreviewScenario(token);
      const mockData = getPreviewMockData(scenario);

      return {
        success: true,
        participantId: 'preview-participant-1',
        email: 'preview@example.com',
        phone: '',
        phoneCountry: '+421',
        firstName: 'Preview',
        lastName: 'Participant',
        registrations: [mockData.registration],
        sessions: [mockData.session],
        organizerName: 'TechOrg Events',
        organizerSlug: 'techorg'
      };
    }

    // Get participant from token (single query replaces participant_token + participant_email + participant_profile)
    const participant = await db.getParticipantByToken(token);

    if (!participant) {
      console.log('❌ Invalid token');
      return { error: 'Invalid token', status: 404 };
    }

    // Get all registrations with session, round, and organizer data in ONE JOINed query
    const dashboardData = await db.getParticipantDashboardData(token);

    if (!dashboardData) {
      return { error: 'Invalid token', status: 404 };
    }

    const registrations = dashboardData.registrations;

    // Get system parameters for confirmation window calculation
    const systemParams = await getSystemParameters();

    // Process each registration and calculate dynamic status
    const enrichedRegistrations = [];
    const statusUpdates: Array<{ participantId: string; sessionId: string; roundId: string; status: string }> = [];

    for (const reg of registrations) {
      let currentStatus = reg.status;
      let statusChanged = false;

      if (reg.roundDate && reg.startTime) {
        const now = getCurrentTime(c);
        const roundStartTime = parseRoundStartTime(reg.roundDate, reg.startTime);
        const roundEndTime = new Date(roundStartTime.getTime() + (reg.duration || 10) * 60000);

        // PRIORITY 1: Check if round completed
        if (now >= roundEndTime) {
          if (!['completed', 'checked-in', 'unconfirmed', 'confirmed', 'matched', 'waiting-for-match', 'no-match', 'met', 'missed', 'left-alone', 'registered'].includes(reg.status)) {
            currentStatus = 'completed';
            statusChanged = true;
            debugLog(`🔄 [${reg.roundName}] Status: "${reg.status}" → "completed" (round ended)`);
          }
        }

        // PRIORITY 3: Trigger matching if round just started (T-0)
        const twoMinutes = 2 * 60 * 1000;
        if (now >= roundStartTime && now < new Date(roundStartTime.getTime() + twoMinutes)) {
          if (reg.status === 'confirmed') {
            (async () => {
              try {
                debugLog(`🎯 [${reg.roundName}] Triggering matching at T-0...`);
                await createMatchesForRound(reg.sessionId, reg.roundId);
              } catch (error) {
                errorLog(`Error triggering matching for ${reg.roundId}:`, error);
              }
            })();
          }
        }
      }

      if (statusChanged) {
        // Only persist safe background status changes
        const allowedCalculatedStatuses = ['completed', 'unconfirmed'];
        const protectedStatuses = [
          'confirmed', 'matched', 'walking-to-meeting-point', 'waiting-for-meet-confirmation',
          'met', 'checked-in', 'no-match', 'missed', 'left-alone'
        ];

        if (allowedCalculatedStatuses.includes(currentStatus) && !protectedStatuses.includes(reg.status) && !reg.confirmedAt) {
          statusUpdates.push({ participantId: reg.participantId, sessionId: reg.sessionId, roundId: reg.roundId, status: currentStatus });
        }
      }

      // Build enriched registration
      const enrichedReg = {
        ...reg,
        sessionDate: reg.roundDate || reg.sessionDate,
        roundStartTime: reg.startTime,
        roundDuration: reg.duration,
        roundParticipantId: reg.participantId,
      };

      enrichedRegistrations.push(enrichedReg);
    }

    // Collect unique session IDs and fetch full session data
    const sessionIds = [...new Set(enrichedRegistrations.map((r: any) => r.sessionId))];
    const sessionPromises = sessionIds.map(async (sessionId) => {
      const session = await db.getSessionById(sessionId);
      if (session) {
        const originalStatus = session.status;
        updateSessionStatusBasedOnRounds(session, getCurrentTime(c));
        // Persist status change to DB if it was auto-completed
        if (session.status === 'completed' && originalStatus !== 'completed') {
          try {
            await db.updateSession(sessionId, { status: 'completed' });
            debugLog(`Session ${sessionId} auto-completed (was: ${originalStatus})`);
          } catch (error) {
            errorLog(`Failed to auto-complete session ${sessionId}:`, error);
          }
        }
      }
      return session;
    });
    const sessions = (await Promise.all(sessionPromises)).filter(s => s !== null);

    // Get organizer name from first registration
    const firstReg = enrichedRegistrations[0];
    const organizerName = firstReg?.organizerName || 'Organizer';
    const organizerSlug = firstReg?.organizerUrlSlug || '';

    // Apply background status updates asynchronously
    if (statusUpdates.length > 0) {
      (async () => {
        try {
          for (const update of statusUpdates) {
            await db.updateRegistrationStatus(update.participantId, update.sessionId, update.roundId, update.status);
            debugLog(`✅ [BACKGROUND UPDATE] Updated ${update.roundId}: → "${update.status}"`);
          }
        } catch (error) {
          errorLog('Error updating participant statuses (background):', error);
        }
      })();
    }

    return {
      success: true,
      participantId: participant.participantId,
      email: participant.email,
      phone: participant.phone || '',
      phoneCountry: participant.phoneCountry || '+421',
      firstName: participant.firstName || '',
      lastName: participant.lastName || '',
      registrations: enrichedRegistrations,
      sessions,
      organizerName,
      organizerSlug
    };

  } catch (error) {
    console.error('💥 ERROR in getParticipantDashboard:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    errorLog('Error fetching participant dashboard:', error);
    return {
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : String(error),
      status: 500
    };
  }
}
