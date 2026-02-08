/**
 * Wonderelo Backend - MINIMAL WORKING VERSION
 * VERSION: 7.2.1-ultra-safe-logging
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { getGlobalSupabaseClient } from './global-supabase.tsx';
import * as kv from './kv_wrapper.tsx';
import { errorLog, debugLog } from './debug.tsx';
import { getParticipantDashboard } from './participant-dashboard.tsx';
import { getCurrentTime } from './time-helpers.tsx';
import { registerParticipant } from './route-registration.tsx';
import { registerParticipantRoutes } from './route-participants.tsx';
import { sendEmail, buildRegistrationEmail, buildMagicLinkEmail } from './email.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Get Supabase client (singleton)
function getSupabase() {
  return getGlobalSupabaseClient();
}

// ============================================
// CRITICAL ROUTES
// ============================================

// Health check
app.get('/make-server-ce05600a/test', async (c) => {
  return c.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    version: '7.2.1-ultra-safe-logging'
  });
});

// Check slug
app.get('/make-server-ce05600a/check-slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const existingMapping = await kv.get(`slug_mapping:${slug}`);
  return c.json({ available: !existingMapping });
});

// Check email
app.get('/make-server-ce05600a/check-email/:email', async (c) => {
  const email = c.req.param('email');
  const normalizedEmail = email.toLowerCase().trim();
  const { data: existingUser } = await getSupabase().auth.admin.listUsers();
  const emailExists = existingUser?.users.some(u => u.email?.toLowerCase() === normalizedEmail);
  return c.json({ available: !emailExists });
});

// Sign up
app.post('/make-server-ce05600a/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, organizerName, urlSlug } = body;
    
    const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError || !authData.user) {
      return c.json({ error: authError?.message || 'Failed to create user' }, 400);
    }
    
    const userId = authData.user.id;
    
    await kv.set(`user_profile:${userId}`, {
      userId,
      email,
      organizerName,
      urlSlug,
      role: 'organizer',
      createdAt: new Date().toISOString()
    });
    
    await kv.set(`slug_mapping:${urlSlug}`, userId);
    
    const { data: signInData, error: signInError } = await getSupabase().auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError || !signInData.session) {
      return c.json({ error: 'User created but failed to sign in' }, 500);
    }
    
    return c.json({
      success: true,
      user: authData.user,
      accessToken: signInData.session.access_token,
      urlSlug
    });
    
  } catch (error) {
    errorLog('Error in signup:', error);
    return c.json({ error: 'Failed to sign up' }, 500);
  }
});

// Sign in
app.post('/make-server-ce05600a/signin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.session) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const userProfile = await kv.get(`user_profile:${data.user.id}`);
    
    return c.json({
      success: true,
      user: data.user,
      accessToken: data.session.access_token,
      urlSlug: userProfile?.urlSlug
    });
    
  } catch (error) {
    errorLog('Error in signin:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Get profile
app.get('/make-server-ce05600a/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const userProfile = await kv.get(`user_profile:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    return c.json({
      success: true,
      profile: userProfile
    });
    
  } catch (error) {
    errorLog('Error getting profile:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Get sessions
app.get('/make-server-ce05600a/sessions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const sessions = await kv.getByPrefix(`user_sessions:${user.id}:`);
    
    return c.json({ success: true, sessions });
    
  } catch (error) {
    errorLog('Error getting sessions:', error);
    return c.json({ error: 'Failed to get sessions' }, 500);
  }
});

// Create session (POST)
app.post('/make-server-ce05600a/sessions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const body = await c.req.json();
    const sessionData = body;
    
    // Generate session ID if not provided
    const sessionId = sessionData.id || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Add metadata
    const newSession = {
      ...sessionData,
      id: sessionId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save session
    await kv.set(`user_sessions:${user.id}:${sessionId}`, newSession);
    
    debugLog('✅ Created session:', sessionId);
    
    return c.json({
      success: true,
      session: newSession
    });
    
  } catch (error) {
    errorLog('Error creating session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// Update session (PUT)
app.put('/make-server-ce05600a/sessions/:sessionId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    
    const existingSession = await kv.get(`user_sessions:${user.id}:${sessionId}`);
    
    if (!existingSession) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const updatedSession = {
      ...existingSession,
      ...body,
      id: sessionId,
      userId: user.id,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`user_sessions:${user.id}:${sessionId}`, updatedSession);
    
    debugLog('✅ Updated session:', sessionId);
    
    return c.json({
      success: true,
      session: updatedSession
    });
    
  } catch (error) {
    errorLog('Error updating session:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

// Delete session (DELETE)
app.delete('/make-server-ce05600a/sessions/:sessionId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    
    await kv.del(`user_sessions:${user.id}:${sessionId}`);
    
    debugLog('✅ Deleted session:', sessionId);
    
    return c.json({
      success: true,
      message: 'Session deleted'
    });
    
  } catch (error) {
    errorLog('Error deleting session:', error);
    return c.json({ error: 'Failed to delete session' }, 500);
  }
});

// Public: Get organizer by slug (with sessions)
app.get('/make-server-ce05600a/public/user/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const userId = await kv.get(`slug_mapping:${slug}`);
    
    if (!userId) {
      return c.json({ error: 'Organizer not found' }, 404);
    }
    
    const profile = await kv.get(`user_profile:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Get user's sessions (only published ones for public page)
    const allSessions = await kv.getByPrefix(`user_sessions:${userId}:`);
    const publishedSessions = allSessions.filter((s: any) => s.status === 'published');
    
    return c.json({
      success: true,
      user: {
        organizerName: profile.organizerName,
        urlSlug: profile.urlSlug,
        profileImageUrl: profile.profileImageUrl,
        website: profile.website,
        description: profile.description,
        email: profile.email,
        id: userId
      },
      sessions: publishedSessions
    });
  } catch (error) {
    errorLog('Error fetching public user data:', error);
    return c.json({ error: 'Failed to fetch user data' }, 500);
  }
});

// NOTE: /p/:token/dashboard is handled by registerParticipantRoutes below

// Participant confirm attendance (robust version with empty body handling)
app.post('/make-server-ce05600a/p/:token/confirm/:roundId', async (c) => {
  try {
    const token = c.req.param('token');
    const roundId = c.req.param('roundId');
    
    console.log('🎯 CONFIRM ATTENDANCE REQUEST');
    console.log('Token:', token?.substring(0, 20) + '...');
    console.log('RoundId:', roundId);
    
    // Try to parse body, but handle empty body gracefully
    let sessionId;
    try {
      const body = await c.req.json();
      sessionId = body.sessionId;
    } catch (parseError) {
      // Body might be empty or invalid - try to get sessionId from query or URL
      console.log('⚠️ Could not parse JSON body:', parseError);
      sessionId = c.req.query('sessionId');
    }
    
    console.log('SessionId:', sessionId);
    
    if (!sessionId) {
      console.log('❌ Missing sessionId');
      return c.json({ error: 'sessionId is required' }, 400);
    }
    
    debugLog('🎯 CONFIRM ATTENDANCE', { token, roundId, sessionId });
    
    const participant = await kv.get(`participant_token:${token}`);
    console.log('📦 Participant lookup:', participant ? 'FOUND' : 'NOT FOUND');
    if (!participant) {
      console.log('❌ Invalid token');
      return c.json({ error: 'Invalid token' }, 404);
    }
    
    const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
    console.log('📦 Registrations count:', registrations.length);
    
    const regIndex = registrations.findIndex((r: any) => 
      r.sessionId === sessionId && r.roundId === roundId
    );
    
    console.log('🔍 Registration index:', regIndex);
    
    if (regIndex === -1) {
      console.log('❌ Registration not found');
      console.log('Looking for:', { sessionId, roundId });
      console.log('Available registrations:', registrations.map((r: any) => ({ 
        sessionId: r.sessionId, 
        roundId: r.roundId,
        status: r.status 
      })));
      return c.json({ error: 'Registration not found' }, 404);
    }
    
    const registration = registrations[regIndex];
    console.log('📋 Current registration status:', registration.status);
    
    // ✅ VERIFICATION: Allow confirmation if status is 'registered', 'confirmed', 'matched', or 'completed'
    // This makes the operation idempotent and handles race conditions with auto-matching
    const allowedStatuses = ['registered', 'confirmed', 'matched', 'completed', 'unconfirmed'];
    if (!allowedStatuses.includes(registration.status)) {
      console.log('❌ Cannot confirm - status not allowed');
      return c.json({ 
        error: 'Cannot confirm',
        message: `Round status is "${registration.status}". Cannot confirm this round.`,
        currentStatus: registration.status
      }, 400);
    }
    
    // If already confirmed or later status, just return success (idempotent)
    if (['confirmed', 'matched', 'completed'].includes(registration.status)) {
      console.log(`✅ Round already in status "${registration.status}", returning success (idempotent)`);
      return c.json({
        success: true,
        status: registration.status,
        confirmedAt: registration.confirmedAt || registration.lastStatusUpdate,
        message: 'Attendance already confirmed'
      });
    }
    
    const now = new Date().toISOString();
    registrations[regIndex] = {
      ...registration,
      status: 'confirmed',
      confirmedAt: now,
      lastStatusUpdate: now
    };
    
    await kv.set(`participant_registrations:${participant.participantId}`, registrations);
    console.log('✅ Updated participant_registrations');
    
    const roundParticipantId = registration.roundParticipantId || participant.participantId;
    const participantKey = `participant:${sessionId}:${roundId}:${roundParticipantId}`;
    console.log('🔑 Participant key:', participantKey);
    
    const participantEntry = await kv.get(participantKey);
    console.log('📦 Participant entry:', participantEntry ? 'FOUND' : 'NOT FOUND');
    
    if (participantEntry) {
      await kv.set(participantKey, {
        ...participantEntry,
        status: 'confirmed',
        confirmedAt: now
      });
      console.log('✅ Updated participant entry');
    }
    
    console.log(`✅ Confirmed attendance for round ${roundId}`);
    debugLog(`✅ Confirmed attendance for round ${roundId}`);
    
    return c.json({
      success: true,
      status: 'confirmed',
      confirmedAt: now
    });
    
  } catch (error) {
    console.error('💥 ERROR in confirm attendance:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    errorLog('Error confirming attendance:', error);
    return c.json({ 
      error: 'Failed to confirm attendance',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Register participant
app.post('/make-server-ce05600a/register-participant', registerParticipant);

// Participant confirm attendance via participantId (legacy endpoint for ParticipantConfirmation component)
app.post('/make-server-ce05600a/rounds/:roundId/confirm/:participantId', async (c) => {
  try {
    const roundId = c.req.param('roundId');
    const participantId = c.req.param('participantId');
    const body = await c.req.json();
    const { sessionId } = body;
    
    debugLog('🎯 CONFIRM ATTENDANCE (via participantId)', { participantId, roundId, sessionId });
    
    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }
    
    // Get participant registrations
    const registrations = await kv.get(`participant_registrations:${participantId}`) || [];
    
    const regIndex = registrations.findIndex((r: any) => 
      r.sessionId === sessionId && r.roundId === roundId
    );
    
    if (regIndex === -1) {
      return c.json({ error: 'Registration not found' }, 404);
    }
    
    const registration = registrations[regIndex];
    
    // ✅ VERIFICATION: Allow confirmation if status is 'registered', 'confirmed', 'matched', or 'completed'
    // This makes the operation idempotent and handles race conditions with auto-matching
    const allowedStatuses = ['registered', 'confirmed', 'matched', 'completed', 'unconfirmed'];
    if (!allowedStatuses.includes(registration.status)) {
      debugLog(`⚠️ Cannot confirm: current status is "${registration.status}" (allowed: ${allowedStatuses.join(', ')})`);
      return c.json({ 
        error: 'Cannot confirm',
        message: `Round status is "${registration.status}". Only "registered" rounds can be confirmed.`,
        currentStatus: registration.status
      }, 400);
    }
    
    // If already confirmed or later status, just return success (idempotent)
    if (['confirmed', 'matched', 'completed'].includes(registration.status)) {
      debugLog(`✅ Round already in status "${registration.status}", returning success (idempotent)`);
      return c.json({
        success: true,
        status: registration.status,
        confirmedAt: registration.confirmedAt || registration.lastStatusUpdate,
        message: 'Attendance already confirmed'
      });
    }
    
    // 🔥 CRITICAL: Set confirmedAt timestamp to mark this as user-initiated confirmation
    const now = new Date().toISOString();
    registrations[regIndex] = {
      ...registration,
      status: 'confirmed',
      confirmedAt: now,
      lastStatusUpdate: now
    };
    
    await kv.set(`participant_registrations:${participantId}`, registrations);
    
    // Update participant entry in round
    const roundParticipantId = registration.roundParticipantId || participantId;
    const participantKey = `participant:${sessionId}:${roundId}:${roundParticipantId}`;
    const participantEntry = await kv.get(participantKey);
    
    if (participantEntry) {
      await kv.set(participantKey, {
        ...participantEntry,
        status: 'confirmed',
        confirmedAt: now
      });
      debugLog(`✅ Updated participant entry: ${participantKey}`);
    }
    
    debugLog(`✅✅✅ VERIFICATION PASSED: Participant confirmed attendance for round ${roundId}`);
    
    return c.json({
      success: true,
      status: 'confirmed',
      confirmedAt: now,
      message: 'Attendance confirmed successfully'
    });
    
  } catch (error) {
    errorLog('Error confirming attendance (via participantId):', error);
    return c.json({ 
      error: 'Failed to confirm attendance',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Send registration confirmation email
app.post('/make-server-ce05600a/send-registration-email', async (c) => {
  try {
    const body = await c.req.json();
    const { email, firstName, lastName, sessions, eventUrl, myRoundsUrl, userSlug, eventName } = body;

    console.log('📧 SEND REGISTRATION EMAIL');
    console.log('  To:', email, '| Name:', firstName, lastName);

    const { subject, html } = buildRegistrationEmail({
      firstName: firstName || '',
      lastName: lastName || '',
      eventName: eventName || '',
      myRoundsUrl: myRoundsUrl || '',
      eventUrl: eventUrl || '',
      sessions: sessions || [],
    });

    const result = await sendEmail({ to: email, subject, html });

    if (result.success) {
      return c.json({ success: true, message: 'Email sent', emailId: result.id });
    } else if (result.devMode) {
      // No API key configured - return success so flow isn't blocked
      return c.json({ success: true, message: 'Email skipped (no RESEND_API_KEY)', devMode: true });
    } else {
      return c.json({ success: false, error: result.error }, 500);
    }

  } catch (error) {
    console.error('💥 ERROR in send-registration-email:', error);
    return c.json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Magic link for existing participants
app.post('/make-server-ce05600a/participant/send-magic-link', async (c) => {
  try {
    const body = await c.req.json();
    const { email, userSlug, continueRegistration } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('🔗 MAGIC LINK REQUEST for:', normalizedEmail);

    // Look up participant by email
    const emailMapping = await kv.get(`participant_email:${normalizedEmail}`);
    if (!emailMapping || !emailMapping.participantId) {
      return c.json({ error: 'No account found with this email' }, 404);
    }

    const { participantId, token } = emailMapping;

    // Get participant profile for name
    const profile = await kv.get(`participant_profile:${participantId}`);
    const firstName = profile?.firstName || '';

    // Build magic link URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // Extract the host for building the frontend URL
    // Magic link goes to the participant dashboard
    const baseUrl = userSlug
      ? `https://oliwonder.com/${userSlug}`  // Production
      : supabaseUrl;
    const magicLink = `https://oliwonder.com/p/${token}`;

    // Get event name from organizer profile if userSlug is provided
    let eventName = '';
    if (userSlug) {
      const slugMapping = await kv.get(`slug:${userSlug}`);
      if (slugMapping?.userId) {
        const orgProfile = await kv.get(`profile:${slugMapping.userId}`);
        eventName = orgProfile?.organizerName || '';
      }
    }

    const { subject, html } = buildMagicLinkEmail({
      firstName,
      magicLink,
      eventName,
    });

    const result = await sendEmail({ to: normalizedEmail, subject, html });

    if (result.success) {
      return c.json({ success: true, message: 'Magic link sent' });
    } else if (result.devMode) {
      // No API key - return the link directly for dev purposes
      return c.json({ success: true, message: 'Dev mode - no email sent', magicLink });
    } else {
      return c.json({ success: false, error: result.error }, 500);
    }

  } catch (error) {
    console.error('💥 ERROR in send-magic-link:', error);
    return c.json({
      error: 'Failed to send magic link',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Debug endpoints
app.get('/make-server-ce05600a/debug/env-check', async (c) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const allEnvKeys = Object.keys(Deno.env.toObject());
  
  return c.json({
    hasSupabaseUrl: !!url,
    hasSupabaseKey: !!key,
    urlLength: url?.length || 0,
    keyLength: key?.length || 0,
    urlValue: url,
    allEnvVarKeys: allEnvKeys,
    totalEnvVars: allEnvKeys.length,
    version: '7.2.1-ultra-safe-logging'
  });
});

app.get('/make-server-ce05600a/emergency-test', async (c) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  return c.json({
    envVarsPresent: {
      url: !!url,
      key: !!key
    },
    urlValue: url,
    canCreateClient: !!url && !!key,
    version: '7.2.1-ultra-safe-logging'
  });
});

// MISSING ENDPOINTS - Add these to fix 404 errors

// Get system parameters
app.get('/make-server-ce05600a/system-parameters', async (c) => {
  try {
    const parameters = await kv.get('admin:system_parameters');
    
    if (!parameters) {
      // Return defaults - ALL parameters
      return c.json({
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
        defaultLimitParticipants: false,
        defaultLimitGroups: false,
      });
    }
    
    return c.json(parameters);
  } catch (error) {
    errorLog('Error fetching system parameters:', error);
    // Return defaults on error - ALL parameters
    return c.json({
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
      defaultLimitParticipants: false,
      defaultLimitGroups: false,
    });
  }
});

// Get session defaults (for session form)
app.get('/make-server-ce05600a/session-defaults', async (c) => {
  try {
    const parameters = await kv.get('admin:system_parameters');
    
    // Extract session defaults from system parameters
    const defaults = {
      roundDuration: parameters?.defaultRoundDuration ?? 10,
      numberOfRounds: parameters?.defaultNumberOfRounds ?? 1,
      gapBetweenRounds: parameters?.defaultGapBetweenRounds ?? 10,
      maxParticipants: parameters?.defaultMaxParticipants ?? 20,
      groupSize: parameters?.defaultGroupSize ?? 2,
      limitParticipants: parameters?.defaultLimitParticipants ?? false,
      limitGroups: parameters?.defaultLimitGroups ?? false,
      minimalTimeToFirstRound: parameters?.minimalTimeToFirstRound ?? 10
    };
    
    return c.json(defaults);
  } catch (error) {
    errorLog('Error fetching session defaults:', error);
    // Return defaults on error
    return c.json({
      roundDuration: 10,
      numberOfRounds: 1,
      gapBetweenRounds: 10,
      maxParticipants: 20,
      groupSize: 2,
      limitParticipants: false,
      limitGroups: false,
      minimalTimeToFirstRound: 10
    });
  }
});

// Get ice breakers
app.get('/make-server-ce05600a/ice-breakers', async (c) => {
  try {
    const iceBreakers = await kv.get('admin:ice_breakers');
    
    if (!iceBreakers) {
      // Return default ice breakers
      return c.json({
        questions: [
          "What's your favorite hobby?",
          "If you could travel anywhere, where would you go?",
          "What's the best book you've read recently?",
          "What's your dream project?",
          "What motivates you the most?"
        ]
      });
    }
    
    return c.json(iceBreakers);
  } catch (error) {
    errorLog('Error fetching ice breakers:', error);
    // Return defaults on error
    return c.json({
      questions: [
        "What's your favorite hobby?",
        "If you could travel anywhere, where would you go?",
        "What's the best book you've read recently?",
        "What's your dream project?",
        "What motivates you the most?"
      ]
    });
  }
});

// Update profile (PUT)
app.put('/make-server-ce05600a/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const body = await c.req.json();
    const { organizerName, urlSlug, phone, website, description, profileImageUrl } = body;
    
    const currentProfile = await kv.get(`user_profile:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // If URL slug changed, update mapping
    if (urlSlug && urlSlug !== currentProfile.urlSlug) {
      const existingMapping = await kv.get(`slug_mapping:${urlSlug}`);
      if (existingMapping && existingMapping !== user.id) {
        return c.json({ error: 'URL slug already taken' }, 400);
      }
      
      await kv.del(`slug_mapping:${currentProfile.urlSlug}`);
      await kv.set(`slug_mapping:${urlSlug}`, user.id);
    }
    
    const updatedProfile = {
      ...currentProfile,
      organizerName: organizerName || currentProfile.organizerName,
      urlSlug: urlSlug || currentProfile.urlSlug,
      phone: phone !== undefined ? phone : currentProfile.phone,
      website: website !== undefined ? website : currentProfile.website,
      description: description !== undefined ? description : currentProfile.description,
      profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : currentProfile.profileImageUrl,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`user_profile:${user.id}`, updatedProfile);
    
    return c.json({
      success: true,
      profile: updatedProfile
    });
    
  } catch (error) {
    errorLog('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Admin: Update system parameters
app.put('/make-server-ce05600a/admin/parameters', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const body = await c.req.json();
    const { parameters } = body;
    
    if (!parameters) {
      return c.json({ error: 'Parameters required' }, 400);
    }
    
    // Save parameters to KV
    await kv.set('admin:system_parameters', parameters);
    
    debugLog('✅ System parameters updated by user:', user.id);
    
    return c.json({
      success: true,
      parameters
    });
    
  } catch (error) {
    errorLog('Error updating system parameters:', error);
    return c.json({ error: 'Failed to update parameters' }, 500);
  }
});

// Admin: Get system parameters
app.get('/make-server-ce05600a/admin/parameters', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const parameters = await kv.get('admin:system_parameters');
    
    // If no parameters saved, return empty object (frontend will merge with defaults)
    return c.json({
      success: true,
      parameters: parameters || {}
    });
    
  } catch (error) {
    errorLog('Error fetching admin parameters:', error);
    return c.json({ error: 'Failed to fetch parameters' }, 500);
  }
});

// Admin: Get all sessions (across all users)
app.get('/make-server-ce05600a/admin/sessions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Get ALL sessions from all users
    const allSessions = await kv.getByPrefix('user_sessions:');
    
    debugLog(`✅ Admin fetched ${allSessions.length} sessions`);
    
    return c.json({
      success: true,
      sessions: allSessions,
      totalSessions: allSessions.length
    });
    
  } catch (error) {
    errorLog('Error fetching admin sessions:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// Register participant routes
registerParticipantRoutes(app, getCurrentTime);

Deno.serve(app.fetch);