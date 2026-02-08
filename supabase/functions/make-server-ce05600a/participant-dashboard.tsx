import * as kv from './kv_wrapper.tsx';
import { errorLog, debugLog } from './debug.tsx';
import { createMatchesForRound } from './matching.tsx';

// ==========================================
// VERSION: 6.32.1 - Triple-layer protection
// DEPLOYED: 2026-02-06 18:30 CET
// ==========================================

// Helper function to get system parameters with defaults
async function getSystemParameters() {
  try {
    const parameters = await kv.get('admin:system_parameters');
    
    // Return defaults if not found
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
    // Return defaults on error
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
  // Extract scenario from token: PREVIEW_scenario-id
  return token.replace('PREVIEW_', '');
}

function getPreviewMockData(scenario: string) {
  // Calculate times based on scenario
  const now = new Date();
  let roundStartTime: string;
  let status: string;
  
  // Determine status and time based on scenario
  if (scenario === 'no-match' || scenario === 'waiting-match') {
    // Round starts in 30 minutes (confirmation window already passed)
    const futureTime = new Date(now.getTime() + 30 * 60000);
    roundStartTime = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
    status = scenario === 'waiting-match' ? 'waiting-for-match' : 'confirmed';
  } else if (scenario.includes('matched') || scenario.includes('walking') || scenario.includes('checked-in') || scenario === 'met-confirmed') {
    // Round starts in 10 minutes (currently matched)
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
    // Default: round starts in 20 minutes
    const futureTime = new Date(now.getTime() + 20 * 60000);
    roundStartTime = `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
    status = 'confirmed';
  }
  
  // Mock data based on scenario
  const mockSession = {
    id: 'preview-session-1',
    userId: 'preview-organizer-1',
    name: 'Summer Tech Conference 2026',
    description: 'Annual networking event for tech professionals',
    date: new Date().toISOString().split('T')[0], // Today
    status: 'published',
    rounds: [
      {
        id: 'preview-round-1',
        name: 'Networking Round 1',
        startTime: roundStartTime,
        duration: 15,
        date: new Date().toISOString().split('T')[0], // Today
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

// Helper function to parse round start time (imported from index.tsx)
function parseRoundStartTime(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const CET_OFFSET_HOURS = 1;
  return new Date(Date.UTC(year, month - 1, day, hours - CET_OFFSET_HOURS, minutes, 0, 0));
}

// Helper function to migrate old rounds without date field
function migrateRoundsDate(session: any): void {
  if (session && session.rounds && Array.isArray(session.rounds)) {
    session.rounds.forEach((round: any) => {
      if (!round.date && session.date) {
        round.date = session.date;
      }
    });
  }
}

// Helper function to dynamically update session status based on round times
function updateSessionStatusBasedOnRounds(session: any, now: Date = new Date()): void {
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

// OPTIMIZED: Get everything for participant dashboard in ONE request
export async function getParticipantDashboard(token: string, getCurrentTime: (c: any) => Date, c: any) {
  try {
    console.log('🟢 getParticipantDashboard called with token:', token?.substring(0, 20) + '...');
    
    if (!token) {
      console.log('❌ No token provided');
      return { error: 'Token required', status: 400 };
    }
    
    console.log('🔍 Checking if preview token...');
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
    
    console.log('🔍 Getting participant from token...');
    // Get participant from token
    const participant = await kv.get(`participant_token:${token}`);
    console.log('📦 Participant result:', participant ? 'FOUND' : 'NOT FOUND');
    
    if (!participant) {
      console.log('❌ Invalid token');
      return { error: 'Invalid token', status: 404 };
    }
    
    // Check if this is the current token for this participant's email
    const normalizedEmail = participant.email.toLowerCase().trim();
    
    // PARALLEL FETCH: Get profile, email check, and registrations all at once
    const [participantEmail, profile, registrations] = await Promise.all([
      kv.get(`participant_email:${normalizedEmail}`),
      kv.get(`participant_profile:${participant.participantId}`),
      kv.get(`participant_registrations:${participant.participantId}`)
    ]);
    
    if (participantEmail && participantEmail.token !== token) {
      // This is an old token, redirect to the correct one
      return {
        success: false,
        redirect: true,
        correctToken: participantEmail.token,
        message: 'This is an old token. Please use the correct token.'
      };
    }
    
    // Enrich registrations with current status
    const enrichedRegistrations = [];
    let needsUpdate = false;
    const participantUpdates: Array<{ sessionId: string; roundId: string; status: string }> = [];
    const regs = (registrations as any[]) || [];
    
    // Collect unique organizer IDs to batch fetch their profiles
    const organizerIds = new Set<string>();
    for (const reg of regs) {
      if (reg.organizerId) {
        organizerIds.add(reg.organizerId);
      }
    }
    
    // Batch fetch all organizer profiles
    const organizerProfiles = new Map<string, any>();
    for (const organizerId of organizerIds) {
      const organizerProfile = await kv.get(`user_profile:${organizerId}`);
      if (organizerProfile) {
        organizerProfiles.set(organizerId, organizerProfile);
      }
    }
    
    // Get system parameters for confirmation window calculation
    const systemParams = await getSystemParameters();
    
    // Process each registration and calculate dynamic status
    for (const reg of registrations as any[]) {
      // Initialize currentStatus to the status stored in KV
      let currentStatus = reg.status;
      let statusChanged = false;
      let shouldPersistChange = false;
      
      // MIGRATION FIX: Add roundParticipantId if missing (for old registrations)
      if (!reg.roundParticipantId) {
        reg.roundParticipantId = participant.participantId;
        needsUpdate = true;
      }
      
      if (reg.date && reg.startTime) {
        const now = getCurrentTime(c);
        const roundStartTime = parseRoundStartTime(reg.date, reg.startTime);
        const roundEndTime = new Date(roundStartTime.getTime() + (reg.duration || 10) * 60000);
        
        // PRIORITY 1: Check if round completed
        if (now >= roundEndTime) {
          if (!['completed', 'checked-in', 'unconfirmed', 'confirmed', 'matched', 'waiting-for-match', 'no-match', 'met', 'missed', 'left-alone', 'registered'].includes(reg.status)) {
            currentStatus = 'completed';
            statusChanged = true;
            shouldPersistChange = true;
            debugLog(`🔄 [${reg.roundName}] Status: \"${reg.status}\" → \"completed\" (round ended)`);
          }
        }
        // PRIORITY 2: Check if confirmation window expired
        // NOTE: Don't auto-change 'registered' to 'unconfirmed' here!
        // The matching algorithm will handle this at T-0
        // We only display 'registered' status in the frontend
        
        // PRIORITY 3: Trigger matching if round just started (T-0)
        // Check if we're within 2 minutes of round start AND status is 'confirmed'
        const twoMinutes = 2 * 60 * 1000;
        if (now >= roundStartTime && now < new Date(roundStartTime.getTime() + twoMinutes)) {
          if (reg.status === 'confirmed') {
            // Trigger matching asynchronously (don't block response)
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
      
      if (statusChanged && shouldPersistChange) {
        reg.status = currentStatus;
        needsUpdate = true;
        participantUpdates.push({ sessionId: reg.sessionId, roundId: reg.roundId, status: currentStatus });
      }
      
      // Get fresh organizer name from user_profile (always use current name)
      let freshOrganizerName = reg.organizerName; // Fallback to stored name
      if (reg.organizerId) {
        const organizerProfile = organizerProfiles.get(reg.organizerId);
        if (organizerProfile?.organizerName) {
          freshOrganizerName = organizerProfile.organizerName;
        }
      }
      
      // CRITICAL: Fetch match details from participant entry if status is matched/walking/etc
      let matchDetails = {};
      if (['matched', 'walking-to-meeting-point', 'waiting-for-meet-confirmation', 'met', 'checked-in'].includes(reg.status)) {
        debugLog(`   🔍 Status is \"${reg.status}\", fetching match details from participant entry...`);
        const participantKey = `participant:${reg.sessionId}:${reg.roundId}:${reg.roundParticipantId || participant.participantId}`;
        const participantEntry = await kv.get(participantKey);
        
        if (participantEntry && participantEntry.matchId) {
          debugLog(`   ✅ Found match details in participant entry:`, participantEntry.matchId);
          matchDetails = {
            matchId: participantEntry.matchId,
            matchPartnerIds: participantEntry.matchPartnerIds,
            matchPartnerNames: participantEntry.matchPartnerNames,
            meetingPointId: participantEntry.meetingPointId,
            identificationImageUrl: participantEntry.identificationImageUrl
          };
        } else if (reg.matchId) {
          debugLog(`   ✅ Using match details from registration:`, reg.matchId);
          matchDetails = {
            matchId: reg.matchId,
            matchPartnerIds: reg.matchPartnerIds,
            matchPartnerNames: reg.matchPartnerNames,
            meetingPointId: reg.meetingPointId,
            identificationImageUrl: reg.identificationImageUrl
          };
        } else {
          debugLog(`   ⚠️ No match details found in participant entry or registration`);
        }
      }
      
      // Build enriched registration - ONLY include status from reg.status (no currentStatus)
      const enrichedReg = {
        ...reg,
        organizerName: freshOrganizerName, // Override with fresh name from user_profile
        // CRITICAL: Keep original status from KV, don't overwrite with currentStatus
        // Frontend will calculate display status locally based on time
        sessionDate: reg.date,
        roundStartTime: reg.startTime,
        roundDuration: reg.duration,
        // Include match details (merged from participant entry and registration)
        ...matchDetails
      };
      
      // DEBUG: Log what we're returning
      debugLog(`   🔍 ENRICHED REG STATUS: \"${enrichedReg.status}\"`);
      
      enrichedRegistrations.push(enrichedReg);
    }
    
    // Get unique session IDs and organizer IDs
    const sessionOrganizerPairs = [...new Map(
      enrichedRegistrations.map((r: any) => [r.sessionId, r.organizerId])
    ).entries()];
    
    // PARALLEL FETCH: Get all sessions at once
    const sessionPromises = sessionOrganizerPairs.map(async ([sessionId, organizerId]) => {
      // Try user_sessions first, fallback to old sessions key
      let session = await kv.get(`user_sessions:${organizerId}:${sessionId}`);
      if (!session) {
        session = await kv.get(`session:${sessionId}`);
      }
      
      if (session) {
        // Migrate round dates if needed
        migrateRoundsDate(session);
        // Update session status based on rounds
        updateSessionStatusBasedOnRounds(session, getCurrentTime(c));
      }
      
      return session;
    });
    
    const sessions = (await Promise.all(sessionPromises)).filter(s => s !== null);
    
    // Get fresh organizerName from user_profile (always use current name from organizer's profile)
    const firstOrganizerId = sessionOrganizerPairs[0]?.[1];
    let organizerName = 'Organizer'; // Default fallback
    let organizerSlug = '';
    
    if (firstOrganizerId) {
      const organizerProfile = organizerProfiles.get(firstOrganizerId);
      if (organizerProfile) {
        organizerName = organizerProfile.organizerName || 'Organizer';
        organizerSlug = organizerProfile.urlSlug || '';
      }
    }
    
    // Update statuses in database if needed (async, don't block response)
    if (needsUpdate) {
      (async () => {
        try {
          // CRITICAL: Re-read from KV before writing to avoid race conditions with /confirm endpoint
          const currentRegs = await kv.get(`participant_registrations:${participant.participantId}`) || [];
          
          // Merge changes: only update fields that we calculated, preserve other fields (like confirmedAt)
          const mergedRegs = currentRegs.map((currentReg: any) => {
            const calculatedReg = regs.find((r: any) => 
              r.sessionId === currentReg.sessionId && r.roundId === currentReg.roundId
            );
            
            if (calculatedReg && calculatedReg.status !== currentReg.status) {
              // 🛡️ TRIPLE-LAYER PROTECTION: Never overwrite user-initiated or terminal statuses
              
              // LAYER 1: Blacklist - NEVER overwrite these statuses (user-initiated or terminal)
              const protectedStatuses = [
                'confirmed',           // User clicked "Confirm attendance"
                'matched',            // Matching algorithm assigned a match
                'walking-to-meeting-point', // User is walking
                'waiting-for-meet-confirmation', // User checked in
                'met',                // User confirmed meeting partner
                'checked-in',         // User checked in at meeting point
                'no-match',           // System determined no match (terminal)
                'missed',             // User missed the round (terminal)
                'left-alone'          // Partner didn't show up (terminal)
              ];
              
              if (protectedStatuses.includes(currentReg.status)) {
                debugLog(`🛡️ [PROTECTED] Skipping status update for round ${currentReg.roundId}: current="${currentReg.status}" is protected from background updates`);
                return currentReg; // Keep current status unchanged
              }
              
              // LAYER 2: Timestamp check - If confirmedAt exists, this is a confirmed registration
              if (currentReg.confirmedAt) {
                debugLog(`🛡️ [PROTECTED] Skipping status update for round ${currentReg.roundId}: has confirmedAt timestamp (${currentReg.confirmedAt})`);
                return currentReg; // Keep current status unchanged
              }
              
              // LAYER 3: Whitelist - Only allow background updates to calculated statuses
              const allowedCalculatedStatuses = [
                'completed',     // Round has ended (time-based calculation)
                'unconfirmed'    // Confirmation window expired (time-based calculation)
              ];
              
              if (!allowedCalculatedStatuses.includes(calculatedReg.status)) {
                debugLog(`🛡️ [PROTECTED] Skipping status update for round ${currentReg.roundId}: calculatedStatus="${calculatedReg.status}" is not an allowed background update`);
                return currentReg; // Keep current status unchanged
              }
              
              // ✅ SAFE TO UPDATE: Only time-based calculated statuses (completed, unconfirmed)
              debugLog(`✅ [BACKGROUND UPDATE] Updating round ${currentReg.roundId}: "${currentReg.status}" → "${calculatedReg.status}"`);
              return {
                ...currentReg,
                status: calculatedReg.status,
                // Only update roundParticipantId if it was missing
                roundParticipantId: currentReg.roundParticipantId || calculatedReg.roundParticipantId
              };
            }
            
            return currentReg;
          });
          
          await kv.set(`participant_registrations:${participant.participantId}`, mergedRegs);
          
          const updatePromises = participantUpdates.map(async ({ sessionId, roundId, status }) => {
            // CRITICAL: Use roundParticipantId from registration, NOT participantId!
            // Find the registration to get the correct roundParticipantId
            const reg = regs.find((r: any) => r.sessionId === sessionId && r.roundId === roundId);
            const roundParticipantId = reg?.roundParticipantId;
            
            if (!roundParticipantId) {
              errorLog(`⚠️ No roundParticipantId found for session ${sessionId}, round ${roundId}, cannot update participant entry`);
              return;
            }
            
            const participantKey = `participant:${sessionId}:${roundId}:${roundParticipantId}`;
            const participantData = await kv.get(participantKey);
            if (participantData) {
              await kv.set(participantKey, {
                ...participantData,
                status
              });
              debugLog(`✅ Updated participant entry ${participantKey} to status "${status}"`);
            } else {
              errorLog(`⚠️ Participant entry not found: ${participantKey}`);
            }
          });
          
          await Promise.all(updatePromises);
        } catch (error) {
          errorLog('Error updating participant statuses (background):', error);
        }
      })();
    }
    
    return {
      success: true,
      participantId: participant.participantId,
      email: participant.email,
      phone: profile?.phone || '',
      phoneCountry: profile?.phoneCountry || '+421',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      registrations: enrichedRegistrations,
      sessions,
      organizerName,
      organizerSlug
    };
    
  } catch (error) {
    console.error('💥 ERROR in getParticipantDashboard:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    errorLog('Error fetching participant dashboard:', error);
    return { 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : String(error),
      status: 500
    };
  }
}