/**
 * REGISTRATION ENDPOINT - /register-participant
 * Handles participant registration for networking sessions
 */

import { Context } from 'npm:hono';
import * as kv from './kv_wrapper.tsx';
import { debugLog, errorLog } from './debug.tsx';

export async function registerParticipant(c: Context) {
  try {
    const body = await c.req.json();
    console.log('🟢 REGISTER PARTICIPANT CALLED');
    console.log('📝 Body:', JSON.stringify(body, null, 2));
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
    
    console.log('👤 Participant:', { email, firstName, lastName, hasPhone: !!phone });
    
    if (!email || !firstName || !lastName) {
      console.log('❌ Missing participant fields');
      return c.json({ error: 'Missing required participant fields (email, firstName, or lastName)' }, 400);
    }
    
    console.log('🔍 Getting organizer from slug:', userSlug);
    // Get organizer's userId from slug
    const userId = await kv.get(`slug_mapping:${userSlug}`);
    console.log('📦 Organizer userId:', userId);
    if (!userId) {
      console.log('❌ Organizer not found');
      return c.json({ error: 'Organizer not found' }, 404);
    }
    
    console.log('🔍 Getting organizer profile...');
    // Get organizer profile for names
    const organizerProfile = await kv.get(`user_profile:${userId}`);
    console.log('📦 Organizer profile:', organizerProfile ? 'FOUND' : 'NOT FOUND');
    const organizerName = organizerProfile?.organizerName || 'Organizer';
    const organizerUrlSlug = organizerProfile?.urlSlug || userSlug;
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if participant already exists by email
    let participantId: string;
    let token: string;
    let isNewParticipant = false;
    
    const existingParticipant = await kv.get(`participant_email:${normalizedEmail}`);
    
    if (existingParticipant && existingParticipant.participantId) {
      // Existing participant
      participantId = existingParticipant.participantId;
      token = existingParticipant.token;
      debugLog('✅ Found existing participant:', participantId);
      
      // Update participant data
      const participantData = await kv.get(`participant:${participantId}`);
      if (participantData) {
        await kv.set(`participant:${participantId}`, {
          ...participantData,
          firstName,
          lastName,
          phone,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Also update participant profile
      const participantProfile = await kv.get(`participant_profile:${participantId}`);
      await kv.set(`participant_profile:${participantId}`, {
        ...(participantProfile || {}),
        participantId,
        email: normalizedEmail,
        firstName,
        lastName,
        phone,
        phoneCountry: participant.phoneCountry || participantProfile?.phoneCountry || '+421',
        updatedAt: new Date().toISOString()
      });
    } else {
      // New participant - create ID and token
      participantId = `participant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      token = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      isNewParticipant = true;
      debugLog('🆕 Creating new participant:', participantId);
      
      // Create participant record
      await kv.set(`participant:${participantId}`, {
        participantId,
        email: normalizedEmail,
        firstName,
        lastName,
        phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Create participant profile (for dashboard)
      await kv.set(`participant_profile:${participantId}`, {
        participantId,
        email: normalizedEmail,
        firstName,
        lastName,
        phone,
        phoneCountry: participant.phoneCountry || '+421',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Create email mapping
      await kv.set(`participant_email:${normalizedEmail}`, {
        participantId,
        token,
        email: normalizedEmail
      });
      
      // Create token mapping
      await kv.set(`participant_token:${token}`, {
        participantId,
        token,
        email: normalizedEmail,
        createdAt: new Date().toISOString()
      });
    }
    
    // Get existing registrations
    const existingRegistrations = await kv.get(`participant_registrations:${participantId}`) || [];
    
    // Process each selected session
    const newRegistrations = [];
    let alreadyRegisteredCount = 0;
    
    for (const sessionData of sessions) {
      const { sessionId, rounds } = sessionData;
      
      // Get session data from KV
      const session = await kv.get(`user_sessions:${userId}:${sessionId}`);
      if (!session) {
        debugLog(`⚠️ Session ${sessionId} not found`);
        continue;
      }
      
      // Process each round
      for (const roundData of (rounds || [])) {
        const { roundId, selectedTeam, selectedTopic, selectedTopics, selectedMeetingPoint } = roundData;
        
        // Check if already registered for this round
        const alreadyRegistered = existingRegistrations.some(
          (r: any) => r.sessionId === sessionId && r.roundId === roundId
        );
        
        if (alreadyRegistered) {
          alreadyRegisteredCount++;
          debugLog(`ℹ️ Already registered for session ${sessionId}, round ${roundId}`);
          continue;
        }
        
        // Get round details from session
        const round = session.rounds?.find((r: any) => r.id === roundId);
        
        // Create registration with all required fields
        const registration = {
          participantId,
          sessionId,
          roundId,
          sessionName: session.name,
          roundName: round?.name || roundId,
          organizerId: userId,
          organizerName: organizerName,
          organizerUrlSlug: organizerUrlSlug,
          date: round?.date || session.date,
          startTime: round?.startTime,
          duration: round?.duration,
          status: 'registered',
          team: selectedTeam,
          topics: selectedTopics || [],
          meetingPoint: selectedMeetingPoint,
          registeredAt: new Date().toISOString(),
          lastStatusUpdate: new Date().toISOString()
        };
        
        newRegistrations.push(registration);
        
        // Also create participant entry for the round
        await kv.set(`participant:${sessionId}:${roundId}:${participantId}`, {
          participantId,
          email: normalizedEmail,
          firstName,
          lastName,
          phone,
          team: selectedTeam,
          topics: selectedTopics || [],
          meetingPoint: selectedMeetingPoint,
          status: 'registered',
          registeredAt: new Date().toISOString()
        });
      }
    }
    
    // Save updated registrations
    if (newRegistrations.length > 0) {
      const updatedRegistrations = [...existingRegistrations, ...newRegistrations];
      await kv.set(`participant_registrations:${participantId}`, updatedRegistrations);
      console.log(`✅ Saved ${newRegistrations.length} new registrations`);
      debugLog(`✅ Added ${newRegistrations.length} new registrations`);
    }
    
    // Determine response - count total rounds from sessions array
    const totalRequestedRounds = sessions.reduce((sum: number, s: any) => sum + (s.rounds?.length || 0), 0);
    const allAlreadyRegistered = alreadyRegisteredCount === totalRequestedRounds && newRegistrations.length === 0;
    
    // Determine if email verification is needed
    // NEW participants need verification, EXISTING participants with token do NOT
    const requiresVerification = isNewParticipant;
    
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
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    errorLog('Error in register-participant:', error);
    return c.json({ 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}