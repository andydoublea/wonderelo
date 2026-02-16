/**
 * REGISTRATION ENDPOINT - /register-participant
 * Handles participant registration for networking sessions
 */

import { Context } from 'npm:hono';
import * as db from './db.ts';
import { debugLog, errorLog } from './debug.tsx';
import { sendEmail, buildRegistrationEmail } from './email.tsx';

export async function registerParticipant(c: Context) {
  try {
    const body = await c.req.json();
    console.log('🟢 REGISTER PARTICIPANT CALLED');
    debugLog('📝 Register participant request:', body);

    // Extract from nested structure
    const {
      userSlug,
      participant,
      sessions,
      existingToken
    } = body;

    console.log('🔍 Extracted:', { userSlug, hasParticipant: !!participant, hasSessions: !!sessions, sessionsCount: sessions?.length });

    // Validate required fields
    if (!participant || !sessions || !userSlug) {
      console.log('❌ Missing required fields');
      return c.json({ error: 'Missing required fields (participant, sessions, or userSlug)' }, 400);
    }

    const { email, firstName, lastName, phone } = participant;

    if (!email || !firstName || !lastName) {
      console.log('❌ Missing participant fields');
      return c.json({ error: 'Missing required participant fields (email, firstName, or lastName)' }, 400);
    }

    console.log('🔍 Getting organizer from slug:', userSlug);
    // Get organizer's userId from slug
    const organizerProfile = await db.getOrganizerBySlug(userSlug);
    if (!organizerProfile) {
      console.log('❌ Organizer not found');
      return c.json({ error: 'Organizer not found' }, 404);
    }

    const userId = organizerProfile.userId;
    const organizerName = organizerProfile.organizerName || 'Organizer';
    const organizerUrlSlug = organizerProfile.urlSlug || userSlug;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if participant already exists by email
    let participantId: string;
    let token: string;
    let isNewParticipant = false;

    const existingParticipant = await db.getParticipantByEmail(normalizedEmail);

    if (existingParticipant) {
      // Existing participant
      participantId = existingParticipant.participantId;
      token = existingParticipant.token;
      debugLog('✅ Found existing participant:', participantId);

      // Update participant data
      await db.updateParticipant(participantId, {
        firstName,
        lastName,
        phone,
        phoneCountry: participant.phoneCountry || existingParticipant.phoneCountry || '+421',
      });
    } else {
      // New participant - create ID and token
      participantId = `participant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      token = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      isNewParticipant = true;
      debugLog('🆕 Creating new participant:', participantId);

      // Create participant record (single table replaces participant:, participant_profile:, participant_email:, participant_token:)
      await db.createParticipant({
        participantId,
        email: normalizedEmail,
        token,
        firstName,
        lastName,
        phone,
        phoneCountry: participant.phoneCountry || '+421',
      });
    }

    // Process each selected session
    const newRegistrations = [];
    let alreadyRegisteredCount = 0;

    for (const sessionData of sessions) {
      const { sessionId, rounds } = sessionData;

      // Get session data from DB
      const session = await db.getSessionById(sessionId);
      if (!session) {
        debugLog(`⚠️ Session ${sessionId} not found`);
        continue;
      }

      // Process each round
      for (const roundData of (rounds || [])) {
        const { roundId, selectedTeam, selectedTopic, selectedTopics, selectedMeetingPoint } = roundData;

        // Check if already registered for this round
        const existingReg = await db.getRegistration(participantId, sessionId, roundId);

        if (existingReg) {
          alreadyRegisteredCount++;
          debugLog(`ℹ️ Already registered for session ${sessionId}, round ${roundId}`);
          continue;
        }

        // Get round details from session
        const round = session.rounds?.find((r: any) => r.id === roundId);

        // Create registration in registrations table
        await db.createRegistration({
          participantId,
          sessionId,
          roundId,
          organizerId: userId,
          status: 'registered',
          team: selectedTeam,
          topics: selectedTopics || [],
          meetingPoint: selectedMeetingPoint,
        });

        newRegistrations.push({ sessionId, roundId });
      }
    }

    if (newRegistrations.length > 0) {
      console.log(`✅ Saved ${newRegistrations.length} new registrations`);
      debugLog(`✅ Added ${newRegistrations.length} new registrations`);
    }

    // Determine response - count total rounds from sessions array
    const totalRequestedRounds = sessions.reduce((sum: number, s: any) => sum + (s.rounds?.length || 0), 0);
    const allAlreadyRegistered = alreadyRegisteredCount === totalRequestedRounds && newRegistrations.length === 0;

    // Determine if email verification is needed
    const requiresVerification = isNewParticipant;

    // Send registration email for NEW participants (so they get a magic link to their dashboard)
    if (isNewParticipant && newRegistrations.length > 0) {
      try {
        const origin = c.req.header('Origin') || c.req.header('Referer')?.replace(/\/[^/]*$/, '') || 'https://wonderelo.com';
        const myRoundsUrl = `${origin}/p/${token}`;
        const eventUrl = `${origin}/${organizerUrlSlug}`;

        // Build sessions list for email
        const emailSessions = [];
        for (const sessionData of sessions) {
          const session = await db.getSessionById(sessionData.sessionId);
          if (session) {
            const roundNames = (sessionData.rounds || []).map((r: any) => {
              const round = session.rounds?.find((sr: any) => sr.id === r.roundId);
              return round?.name || round?.startTime || 'Round';
            });
            emailSessions.push({
              sessionName: session.name,
              rounds: roundNames.map((name: string) => ({ roundName: name })),
            });
          }
        }

        const { subject, html } = buildRegistrationEmail({
          firstName,
          lastName,
          eventName: organizerName,
          myRoundsUrl,
          eventUrl,
          sessions: emailSessions,
        });

        await sendEmail({ to: normalizedEmail, subject, html });
        debugLog(`📧 Registration email sent to ${normalizedEmail}`);
      } catch (emailError) {
        // Don't fail registration if email fails
        errorLog('Failed to send registration email:', emailError);
      }
    }

    console.log('🎉 Registration successful!');
    console.log('📊 Stats:', {
      token: token.substring(0, 20) + '...',
      participantId,
      isNewParticipant,
      requiresVerification,
      newRegistrationsCount: newRegistrations.length,
      alreadyRegisteredCount
    });

    return c.json({
      success: true,
      token,
      participantId,
      isNewParticipant,
      alreadyRegistered: allAlreadyRegistered,
      requiresVerification: requiresVerification,
      newRegistrationsCount: newRegistrations.length,
      alreadyRegisteredCount,
      participantData: {
        email: normalizedEmail,
        firstName,
        lastName,
        phone
      }
    });

  } catch (error) {
    console.error('💥 ERROR in register-participant:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    errorLog('Error in register-participant:', error);
    return c.json({
      error: 'Registration failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
