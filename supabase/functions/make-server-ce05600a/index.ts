/**
 * Wonderelo Backend - MINIMAL WORKING VERSION
 * VERSION: 7.2.1-ultra-safe-logging
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { getGlobalSupabaseClient } from './global-supabase.tsx';
import * as db from './db.ts';
import { errorLog, debugLog } from './debug.tsx';
import { getParticipantDashboard, updateSessionStatusBasedOnRounds } from './participant-dashboard.tsx';
import { getCurrentTime, parseRoundStartTime } from './time-helpers.tsx';
import { registerParticipant } from './route-registration.tsx';
import { registerParticipantRoutes } from './route-participants.tsx';
import { sendEmail, buildRegistrationEmail, buildMagicLinkEmail, buildLeadMagnetEmail, buildWelcomeEmail, buildOnboardingEmail1_CreateRound, buildOnboardingEmail2_CustomizeUrl, buildOnboardingEmail3_PublishRound, buildOnboardingEmail4_FirstParticipant } from './email.tsx';
import { createMatchesForRound } from './matching.tsx';
import { sendSms, renderSmsTemplate } from './sms.tsx';
import { registerStripeRoutes, checkCapacity, consumeEventCredit, refundEventCredit } from './route-stripe.tsx';

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
  const available = await db.isSlugAvailable(slug);
  return c.json({ available });
});

// Check email
app.get('/make-server-ce05600a/check-email/:email', async (c) => {
  const email = c.req.param('email');
  const normalizedEmail = email.toLowerCase().trim();
  const { data: existingUser } = await getSupabase().auth.admin.listUsers();
  const emailExists = existingUser?.users.some(u => u.email?.toLowerCase() === normalizedEmail);
  return c.json({ available: !emailExists });
});

// Save registration draft (progressive save)
app.post('/make-server-ce05600a/registration-draft', async (c) => {
  try {
    const body = await c.req.json();
    const { email, currentStep, formData } = body;
    if (!email) return c.json({ error: 'Email required' }, 400);
    await db.upsertRegistrationDraft({ email, currentStep, formData });
    return c.json({ success: true });
  } catch (error) {
    errorLog('Error saving registration draft:', error);
    return c.json({ error: 'Failed to save draft' }, 500);
  }
});

// Load registration draft
app.get('/make-server-ce05600a/registration-draft/:email', async (c) => {
  try {
    const email = decodeURIComponent(c.req.param('email'));
    const draft = await db.getRegistrationDraft(email);
    return c.json({ draft });
  } catch (error) {
    errorLog('Error loading registration draft:', error);
    return c.json({ error: 'Failed to load draft' }, 500);
  }
});

// Sign up
app.post('/make-server-ce05600a/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, organizerName, urlSlug: requestedSlug, eventType, eventTypeOther } = body;

    const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return c.json({ error: authError?.message || 'Failed to create user' }, 400);
    }

    const userId = authData.user.id;

    // Always generate a random URL slug for new registrations
    // This motivates the organizer to customize their URL later
    let finalSlug = Math.random().toString(36).substring(2, 10);

    // Ensure slug uniqueness by checking DB and appending random suffix if taken
    let slugAttempt = finalSlug;
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.getOrganizerBySlug(slugAttempt);
      if (!existing) break;
      slugAttempt = `${finalSlug}${Math.random().toString(36).substring(2, 6)}`;
      attempts++;
    }
    finalSlug = slugAttempt;

    // Combine eventType: if "other" was selected, use the custom description
    const resolvedEventType = eventType === 'other' && eventTypeOther ? `other: ${eventTypeOther}` : eventType;

    await db.createOrganizerProfile({ userId, email, organizerName, urlSlug: finalSlug, eventType: resolvedEventType });

    // Delete registration draft (non-blocking)
    db.deleteRegistrationDraft(email).catch(() => {});

    // Send welcome email (non-blocking)
    const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';
    const dashboardUrl = `${appUrl}/dashboard`;
    const eventPageUrl = finalSlug ? `${appUrl}/${finalSlug}` : undefined;
    const welcomeEmail = buildWelcomeEmail({
      firstName: organizerName?.split(' ')[0] || 'there',
      dashboardUrl,
      eventPageUrl,
    });
    sendEmail({ to: email, subject: welcomeEmail.subject, html: welcomeEmail.html })
      .then(result => {
        if (result.success) {
          console.log('✅ Welcome email sent to', email);
        } else {
          console.log('⚠️ Welcome email failed:', result.error);
        }
      })
      .catch(err => console.log('⚠️ Welcome email error:', err));

    // Auto-create sample draft session (awaited to ensure it exists when user reaches dashboard)
    const firstName = organizerName?.split(' ')[0] || 'My';
    const sampleSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const sampleDate = nextWeek.toISOString().split('T')[0];
    try {
      await db.createSession({
        id: sampleSessionId,
        userId,
        name: `${firstName}'s First Networking`,
        description: 'This is a sample round to help you explore Wonderelo. Feel free to edit or delete it.',
        date: sampleDate,
        status: 'draft',
        limitParticipants: false,
        maxParticipants: 10,
        groupSize: 2,
        enableTeams: false,
        enableTopics: false,
        meetingPoints: ['Table 1', 'Table 2', 'Table 3'],
        iceBreakers: ['What do you do?', 'What brought you here today?', 'What\'s the most interesting project you\'re working on?'],
        rounds: [
          { id: `round-sample-1-${Date.now()}`, startTime: '10:00', duration: 5, name: 'Round 1' },
          { id: `round-sample-2-${Date.now()}`, startTime: '10:10', duration: 5, name: 'Round 2' },
          { id: `round-sample-3-${Date.now()}`, startTime: '10:20', duration: 5, name: 'Round 3' },
        ],
      });
      console.log('✅ Sample session created for', email);
    } catch (err) {
      console.log('⚠️ Sample session creation error:', err);
    }

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
      urlSlug: finalSlug
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
    
    const userProfile = await db.getOrganizerById(data.user.id);

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
    
    const userProfile = await db.getOrganizerById(user.id);

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
    
    const sessions = await db.getSessionsByUser(user.id);

    // Auto-complete sessions whose rounds have all ended
    const now = getCurrentTime(c);
    for (const session of sessions) {
      const originalStatus = session.status;
      updateSessionStatusBasedOnRounds(session, now);
      if (session.status === 'completed' && originalStatus !== 'completed') {
        try {
          await db.updateSession(session.id, { status: 'completed' });
          debugLog(`Session ${session.id} auto-completed via sessions list (was: ${originalStatus})`);
        } catch (error) {
          errorLog(`Failed to auto-complete session ${session.id}:`, error);
        }
      }
    }

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
    
    // ── Capacity check when publishing/scheduling ──
    if (newSession.status === 'published' || newSession.status === 'scheduled') {
      const maxParticipants = newSession.maxParticipants || 10;
      try {
        const capacityResult = await checkCapacity(user.id, maxParticipants);
        if (!capacityResult.allowed) {
          debugLog(`❌ Capacity limit for publish: ${capacityResult.reason}`);
          return c.json({
            error: 'capacity_exceeded',
            message: capacityResult.reason,
            suggestion: capacityResult.suggestion,
            currentTier: capacityResult.currentTier,
          }, 403);
        }
        // Consume credit for non-subscription organizers (subscription = no credits needed)
        if (capacityResult.currentTier !== 'free') {
          const subscription = await db.getSubscription(user.id);
          if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
            await consumeEventCredit(user.id, sessionId);
            debugLog('💳 Event credit consumed for session:', sessionId);
          }
        }
      } catch (capErr) {
        debugLog('⚠️ Capacity check failed, allowing publish:', capErr);
      }
    }

    // Save session
    await db.createSession(newSession);

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
    
    const existingSession = await db.getSessionById(sessionId);

    if (!existingSession || existingSession.userId !== user.id) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const oldStatus = existingSession.status;
    const newStatus = body.status;
    const isBecomingLive = (newStatus === 'published' || newStatus === 'scheduled') && oldStatus !== 'published' && oldStatus !== 'scheduled';
    const isBecomingDraft = newStatus === 'draft' && (oldStatus === 'published' || oldStatus === 'scheduled');

    // ── Capacity check when transitioning to published/scheduled ──
    if (isBecomingLive) {
      const maxParticipants = body.maxParticipants || existingSession.maxParticipants || 10;
      try {
        const capacityResult = await checkCapacity(user.id, maxParticipants);
        if (!capacityResult.allowed) {
          debugLog(`❌ Capacity limit for publish: ${capacityResult.reason}`);
          return c.json({
            error: 'capacity_exceeded',
            message: capacityResult.reason,
            suggestion: capacityResult.suggestion,
            currentTier: capacityResult.currentTier,
          }, 403);
        }
        // Consume credit for non-subscription organizers
        if (capacityResult.currentTier !== 'free') {
          const subscription = await db.getSubscription(user.id);
          if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
            await consumeEventCredit(user.id, sessionId);
            debugLog('💳 Event credit consumed for session:', sessionId);
          }
        }
      } catch (capErr) {
        debugLog('⚠️ Capacity check failed, allowing publish:', capErr);
      }
    }

    // ── Refund credit when unpublishing (draft) with 0 registrations ──
    if (isBecomingDraft) {
      try {
        const regs = await db.getRegistrationsForSession(sessionId);
        if (regs.length === 0) {
          await refundEventCredit(user.id, sessionId);
          debugLog('💳 Credit refunded for unpublished session:', sessionId);
        }
      } catch (refundErr) {
        debugLog('⚠️ Credit refund failed (non-blocking):', refundErr);
      }
    }

    await db.updateSession(sessionId, body);
    const updatedSession = await db.getSessionById(sessionId);

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

    // Refund credit if session was published/scheduled and has 0 registrations
    try {
      const session = await db.getSessionById(sessionId);
      if (session && (session.status === 'published' || session.status === 'scheduled')) {
        const regs = await db.getRegistrationsForSession(sessionId);
        if (regs.length === 0) {
          await refundEventCredit(user.id, sessionId);
          debugLog('💳 Credit refunded for deleted session:', sessionId);
        }
      }
    } catch (refundErr) {
      debugLog('⚠️ Credit refund on delete failed (non-blocking):', refundErr);
    }

    await db.deleteSession(sessionId);

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
    const profile = await db.getOrganizerBySlug(slug);

    if (!profile) {
      // Check slug history for redirect
      const currentSlug = await db.getRedirectSlug(slug);
      if (currentSlug) {
        return c.json({ redirect: true, newSlug: currentSlug }, 301);
      }
      return c.json({ error: 'Organizer not found' }, 404);
    }

    const userId = profile.userId;

    // Get user's sessions (only published ones for public page)
    const allSessions = await db.getSessionsByUser(userId);
    const publishedSessions = allSessions.filter((s: any) => s.status === 'published');

    // Fetch registration counts per round for all published sessions
    const roundIds = publishedSessions.flatMap((s: any) => (s.rounds || []).map((r: any) => r.id));
    let registrationCounts: Record<string, number> = {};
    if (roundIds.length > 0) {
      try {
        registrationCounts = await db.getRegistrationCountsByRounds(roundIds);
      } catch (e) {
        // Non-critical, continue without counts
      }
    }

    // Attach registeredCount to each round
    const sessionsWithCounts = publishedSessions.map((s: any) => ({
      ...s,
      rounds: (s.rounds || []).map((r: any) => ({
        ...r,
        registeredCount: registrationCounts[r.id] || 0
      }))
    }));

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
      sessions: sessionsWithCounts
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
      console.log('⚠️ Could not parse JSON body:', parseError);
      sessionId = c.req.query('sessionId');
    }

    console.log('SessionId:', sessionId);

    if (!sessionId) {
      console.log('❌ Missing sessionId');
      return c.json({ error: 'sessionId is required' }, 400);
    }

    debugLog('🎯 CONFIRM ATTENDANCE', { token, roundId, sessionId });

    const participant = await db.getParticipantByToken(token);
    console.log('📦 Participant lookup:', participant ? 'FOUND' : 'NOT FOUND');
    if (!participant) {
      console.log('❌ Invalid token');
      return c.json({ error: 'Invalid token' }, 404);
    }

    // Get specific registration
    const registration = await db.getRegistration(participant.participantId, sessionId, roundId);

    if (!registration) {
      console.log('❌ Registration not found');
      return c.json({ error: 'Registration not found' }, 404);
    }

    console.log('📋 Current registration status:', registration.status);

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

    // Only 'registered' status can be confirmed (reject 'unconfirmed', 'no-match', etc.)
    if (registration.status !== 'registered') {
      console.log('❌ Cannot confirm - status not allowed:', registration.status);
      return c.json({
        error: 'Cannot confirm',
        message: `Round status is "${registration.status}". Cannot confirm this round.`,
        currentStatus: registration.status
      }, 400);
    }

    // Validate confirmation window — reject if round already started
    const session = await db.getSessionById(sessionId);
    const round = session?.rounds?.find((r: any) => r.id === roundId);
    if (round && session?.date && round.startTime) {
      const roundStartTime = new Date(`${session.date}T${round.startTime}:00`);
      const now = getCurrentTime(c);
      if (now > roundStartTime) {
        console.log('❌ Confirmation window closed - round already started');
        return c.json({
          error: 'Confirmation window closed',
          message: 'The round has already started. You can no longer confirm attendance.',
          currentStatus: registration.status
        }, 400);
      }
    }

    const now = new Date().toISOString();

    await db.updateRegistrationStatus(participant.participantId, sessionId, roundId, 'confirmed', {
      confirmedAt: now,
    });

    console.log(`✅ Confirmed attendance for round ${roundId}`);
    debugLog(`✅ Confirmed attendance for round ${roundId}`);

    return c.json({
      success: true,
      status: 'confirmed',
      confirmedAt: now
    });

  } catch (error) {
    console.error('💥 ERROR in confirm attendance:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
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

    // Get specific registration
    const registration = await db.getRegistration(participantId, sessionId, roundId);

    if (!registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    // Allow confirmation if status is 'registered', 'confirmed', 'matched', or 'completed'
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

    const now = new Date().toISOString();

    await db.updateRegistrationStatus(participantId, sessionId, roundId, 'confirmed', {
      confirmedAt: now,
    });

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

// Auto-trigger matching for a round at T-0
app.post('/make-server-ce05600a/rounds/:roundId/auto-match', async (c) => {
  try {
    const roundId = c.req.param('roundId');
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId || !roundId) {
      return c.json({ error: 'sessionId and roundId are required' }, 400);
    }

    debugLog('🎯 AUTO-MATCH triggered', { sessionId, roundId });

    const result = await createMatchesForRound(sessionId, roundId);

    if (result.message === 'Matching already completed') {
      return c.json({
        success: true,
        alreadyCompleted: true,
        message: 'Matching already completed'
      });
    }

    return c.json({
      success: true,
      alreadyCompleted: false,
      matchCount: result.matches?.length || 0,
      message: result.message || 'Matching completed'
    });

  } catch (error) {
    errorLog('Error in auto-match:', error);
    return c.json({
      error: 'Failed to run matching',
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
    const { email, userSlug, continueRegistration, appUrl: clientAppUrl } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('🔗 MAGIC LINK REQUEST for:', normalizedEmail);

    // Look up participant by email
    const participant = await db.getParticipantByEmail(normalizedEmail);
    if (!participant) {
      return c.json({ error: 'No account found with this email' }, 404);
    }

    const { participantId, token } = participant;
    const firstName = participant.firstName || '';

    // Build magic link URL — prefer client-provided appUrl, then env var, then default
    const appUrl = clientAppUrl || Deno.env.get('APP_URL') || 'https://wonderelo.com';
    const baseUrl = userSlug
      ? `${appUrl}/${userSlug}`
      : appUrl;
    const magicLink = `${appUrl}/p/${token}`;

    // Get event name from organizer profile if userSlug is provided
    let eventName = '';
    if (userSlug) {
      const orgProfile = await db.getOrganizerBySlug(userSlug);
      eventName = orgProfile?.organizerName || '';
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
    const parameters = await db.getAdminSetting('system_parameters');

    if (!parameters) {
      // Return defaults - ALL parameters
      return c.json({
        confirmationWindowMinutes: 5,
        safetyWindowMinutes: 6,
        walkingTimeMinutes: 3,
        findingTimeMinutes: 1,
        networkingDurationMinutes: 15,
        notificationEarlyMinutes: 10,
        notificationEarlyEnabled: true,
        notificationLateMinutes: 5,
        notificationLateEnabled: true,
        minimalGapBetweenRounds: 10,
        minimalRoundDuration: 5,
        maximalRoundDuration: 240,
        minimalTimeToFirstRound: 10,
        fireThreshold1: 5,
        fireThreshold2: 10,
        fireThreshold3: 15,
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
      findingTimeMinutes: 1,
      networkingDurationMinutes: 15,
      notificationEarlyMinutes: 10,
      notificationEarlyEnabled: true,
      notificationLateMinutes: 5,
      notificationLateEnabled: true,
      minimalGapBetweenRounds: 10,
      minimalRoundDuration: 5,
      maximalRoundDuration: 240,
      minimalTimeToFirstRound: 10,
      fireThreshold1: 5,
      fireThreshold2: 10,
      fireThreshold3: 15,
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
    const parameters = await db.getAdminSetting('system_parameters');

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
    const iceBreakers = await db.getAdminSetting('ice_breakers');
    
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
    
    const currentProfile = await db.getOrganizerById(user.id);

    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // If URL slug changed, check availability and rate limit
    const slugIsChanging = urlSlug && urlSlug !== currentProfile.urlSlug;
    if (slugIsChanging) {
      // Rate limit: max 3 slug changes per 30 days
      const recentChanges = await db.getSlugChangeCount(user.id, 30);
      if (recentChanges >= 3) {
        return c.json({ error: 'You can only change your URL slug 3 times per 30 days' }, 429);
      }

      const slugAvailable = await db.isSlugAvailable(urlSlug, user.id);
      if (!slugAvailable) {
        return c.json({ error: 'URL slug already taken' }, 400);
      }

      // Record old slug in history for redirects
      await db.recordSlugHistory(user.id, currentProfile.urlSlug);
    }

    const updatedProfile = await db.updateOrganizerProfile(user.id, {
      organizerName: organizerName || currentProfile.organizerName,
      urlSlug: urlSlug || currentProfile.urlSlug,
      phone: phone !== undefined ? phone : currentProfile.phone,
      website: website !== undefined ? website : currentProfile.website,
      description: description !== undefined ? description : currentProfile.description,
      profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : currentProfile.profileImageUrl,
    });

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
    
    // Save parameters
    await db.setAdminSetting('system_parameters', parameters);
    
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
    
    const parameters = await db.getAdminSetting('system_parameters');

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
    const allSessions = await db.getAllSessions();
    
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

// ============================================
// SMS NOTIFICATIONS
// ============================================

// Send SMS to a single participant
app.post('/make-server-ce05600a/send-sms', async (c) => {
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
    const { to, message, templateKey, variables } = body;

    if (!to) {
      return c.json({ error: 'Phone number (to) is required' }, 400);
    }

    let smsBody = message;

    // If templateKey is provided, load template and render it
    if (templateKey && !message) {
      const texts = await db.getAdminSetting('notification_texts');
      const template = texts?.[templateKey];
      if (!template) {
        return c.json({ error: `Template "${templateKey}" not found` }, 404);
      }
      smsBody = renderSmsTemplate(template, variables || {});
    }

    if (!smsBody) {
      return c.json({ error: 'Message or templateKey is required' }, 400);
    }

    console.log('📱 SEND SMS');
    console.log('  To:', to);
    console.log('  Body:', smsBody.substring(0, 80) + (smsBody.length > 80 ? '...' : ''));

    const result = await sendSms({ to, body: smsBody });

    if (result.success) {
      return c.json({ success: true, message: 'SMS sent', sid: result.sid });
    } else if (result.devMode) {
      return c.json({ success: true, message: 'SMS skipped (no Twilio credentials)', devMode: true });
    } else {
      return c.json({ success: false, error: result.error }, 500);
    }

  } catch (error) {
    console.error('💥 ERROR in send-sms:', error);
    return c.json({
      error: 'Failed to send SMS',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Send SMS to multiple participants (bulk)
app.post('/make-server-ce05600a/send-bulk-sms', async (c) => {
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
    const { recipients, templateKey, variables: globalVariables } = body;

    // recipients: Array<{ phone: string, variables?: Record<string, string> }>
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return c.json({ error: 'recipients array is required' }, 400);
    }

    // Load template
    const texts = await db.getAdminSetting('notification_texts');
    const template = texts?.[templateKey];
    if (!templateKey || !template) {
      return c.json({ error: `Template "${templateKey}" not found` }, 404);
    }

    console.log(`📱 BULK SMS: Sending to ${recipients.length} recipients using template "${templateKey}"`);

    const results: Array<{ phone: string; success: boolean; sid?: string; error?: string }> = [];

    for (const recipient of recipients) {
      if (!recipient.phone) {
        results.push({ phone: '', success: false, error: 'No phone number' });
        continue;
      }

      // Merge global variables with per-recipient variables
      const mergedVariables = { ...globalVariables, ...recipient.variables };
      const smsBody = renderSmsTemplate(template, mergedVariables);

      const result = await sendSms({ to: recipient.phone, body: smsBody });
      results.push({
        phone: recipient.phone,
        success: result.success,
        sid: result.sid,
        error: result.error,
      });
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📱 BULK SMS DONE: ${sent} sent, ${failed} failed`);

    return c.json({
      success: true,
      total: recipients.length,
      sent,
      failed,
      results,
    });

  } catch (error) {
    console.error('💥 ERROR in send-bulk-sms:', error);
    return c.json({
      error: 'Failed to send bulk SMS',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Admin: Get notification texts (SMS & email templates)
app.get('/make-server-ce05600a/admin/notification-texts', async (c) => {
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

    const texts = await db.getAdminSetting('notification_texts');

    return c.json({
      success: true,
      texts: texts || {}
    });

  } catch (error) {
    errorLog('Error fetching notification texts:', error);
    return c.json({ error: 'Failed to fetch notification texts' }, 500);
  }
});

// Admin: Update notification texts (SMS & email templates)
app.put('/make-server-ce05600a/admin/notification-texts', async (c) => {
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
    const { texts } = body;

    if (!texts) {
      return c.json({ error: 'texts object is required' }, 400);
    }

    await db.setAdminSetting('notification_texts', texts);

    debugLog('✅ Notification texts updated by user:', user.id);

    return c.json({
      success: true,
      texts
    });

  } catch (error) {
    errorLog('Error updating notification texts:', error);
    return c.json({ error: 'Failed to update notification texts' }, 500);
  }
});

// ============================================
// ADMIN: User Management
// ============================================

// Admin: Get all users (organizers)
app.get('/make-server-ce05600a/admin/users', async (c) => {
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

    // Get all auth users
    const { data: authUsers, error: listError } = await getSupabase().auth.admin.listUsers();

    if (listError) {
      return c.json({ error: 'Failed to list users' }, 500);
    }

    // Get all organizer profiles from DB
    const supabase = getGlobalSupabaseClient();
    const { data: profiles } = await supabase
      .from('organizer_profiles')
      .select('*');

    const profileMap = new Map();
    for (const p of (profiles || [])) {
      profileMap.set(p.id, p);
    }

    // Merge auth users with profiles
    const users = (authUsers?.users || []).map((authUser: any) => {
      const profile = profileMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.organizer_name || 'Not set',
        urlSlug: profile?.url_slug || 'Not set',
        phone: profile?.phone || '',
        website: profile?.website || '',
        role: profile?.role || 'organizer',
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at,
        emailConfirmed: !!authUser.email_confirmed_at,
        serviceType: '',
        userRole: profile?.role || 'organizer',
        companySize: '',
        discoverySource: '',
      };
    });

    return c.json({ success: true, users });

  } catch (error) {
    errorLog('Error fetching admin users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Admin: Get stats
app.get('/make-server-ce05600a/admin/stats', async (c) => {
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

    const supabase = getGlobalSupabaseClient();

    // Count organizers
    const { count: organizerCount } = await supabase
      .from('organizer_profiles')
      .select('*', { count: 'exact', head: true });

    // Count sessions
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    // Count participants
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    // Count registrations
    const { count: registrationCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    return c.json({
      success: true,
      stats: {
        totalOrganizers: organizerCount || 0,
        totalSessions: sessionCount || 0,
        totalParticipants: participantCount || 0,
        totalRegistrations: registrationCount || 0,
      }
    });

  } catch (error) {
    errorLog('Error fetching admin stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Admin: Registration funnel data
app.get('/make-server-ce05600a/admin/registration-funnel', async (c) => {
  try {
    const supabase = db.getClient();

    // Get all registration drafts (incomplete registrations)
    const { data: drafts, error: draftsError } = await supabase
      .from('registration_drafts')
      .select('*')
      .order('updated_at', { ascending: false });

    // Get total completed organizers
    const { count: totalCompleted } = await supabase
      .from('organizer_profiles')
      .select('*', { count: 'exact', head: true });

    // Build funnel steps from drafts
    const stepCounts: Record<number, number> = {};
    const incompleteDrafts: any[] = [];

    if (drafts) {
      for (const draft of drafts) {
        const step = draft.current_step || 1;
        // Count all drafts at each step (they passed through earlier steps)
        for (let s = 1; s <= step; s++) {
          stepCounts[s] = (stepCounts[s] || 0) + 1;
        }
        incompleteDrafts.push({
          email: draft.email,
          currentStep: draft.current_step,
          formData: draft.form_data,
          updatedAt: draft.updated_at,
        });
      }
    }

    // Add completed count to all steps
    const completed = totalCompleted || 0;
    for (let s = 1; s <= 3; s++) {
      stepCounts[s] = (stepCounts[s] || 0) + completed;
    }

    const funnelSteps = Object.entries(stepCounts)
      .map(([step, count]) => ({ step: parseInt(step), label: `Step ${step}`, count }))
      .sort((a, b) => a.step - b.step);

    return c.json({ funnelSteps, incompleteDrafts, totalCompleted: completed });
  } catch (error) {
    errorLog('Error fetching registration funnel:', error);
    return c.json({ error: 'Failed to fetch funnel data' }, 500);
  }
});

// Admin: Delete user
app.delete('/make-server-ce05600a/admin/users/:userId', async (c) => {
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

    const userId = c.req.param('userId');

    // Delete from auth
    const { error: deleteError } = await getSupabase().auth.admin.deleteUser(userId);

    if (deleteError) {
      return c.json({ error: 'Failed to delete user: ' + deleteError.message }, 500);
    }

    // Delete profile
    const supabase = getGlobalSupabaseClient();
    await supabase.from('organizer_profiles').delete().eq('id', userId);

    return c.json({ success: true, message: 'User deleted' });

  } catch (error) {
    errorLog('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Admin: Update user
app.put('/make-server-ce05600a/admin/users/:userId', async (c) => {
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

    const userId = c.req.param('userId');
    const body = await c.req.json();

    // Update profile
    await db.updateOrganizerProfile(userId, {
      organizerName: body.name || body.organizerName,
      urlSlug: body.urlSlug,
      phone: body.phone,
      website: body.website,
    });

    return c.json({ success: true, message: 'User updated' });

  } catch (error) {
    errorLog('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ============================================================
// Admin: Participant management
// ============================================================

app.get('/make-server-ce05600a/admin/participants', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const participants = await db.getAllParticipants();

    // Get registration counts for each participant
    const enriched = [];
    for (const p of participants) {
      const regs = await db.getRegistrationsByParticipant(p.participantId);
      const sessionNames = [...new Set(regs.map((r: any) => r.sessionId))];
      enriched.push({
        id: p.participantId,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email,
        phone: p.phone || '',
        events: [],
        sessionIds: sessionNames,
        totalRegistrations: regs.length,
        createdAt: p.createdAt,
      });
    }

    return c.json({ participants: enriched });
  } catch (error) {
    errorLog('Error listing participants:', error);
    return c.json({ error: 'Failed to list participants' }, 500);
  }
});

app.get('/make-server-ce05600a/admin/participants/:participantId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const participantId = c.req.param('participantId');
    const result = await db.getParticipantWithRegistrations(participantId);

    if (!result) {
      return c.json({ error: 'Participant not found' }, 404);
    }

    const registrations = result.registrations.map((r: any) => ({
      registrationId: r.id,
      sessionId: r.sessionId,
      sessionName: r.sessionName || 'Unknown',
      sessionStatus: r.sessionStatus || 'unknown',
      roundId: r.roundId,
      roundName: r.roundName || 'Unknown',
      roundStatus: r.roundStatus || 'unknown',
      organizerName: r.organizerName || 'Unknown',
      organizerUrlSlug: r.organizerUrlSlug || '',
      status: r.status,
      date: r.roundDate || r.sessionDate,
      startTime: r.startTime,
      duration: r.duration,
      registeredAt: r.registeredAt,
      matchedWith: [],
    }));

    return c.json({
      participant: {
        id: result.participant.participantId,
        firstName: result.participant.firstName,
        lastName: result.participant.lastName,
        email: result.participant.email,
        phone: result.participant.phone,
        token: result.participant.token,
        createdAt: result.participant.createdAt,
      },
      registrations,
    });
  } catch (error) {
    errorLog('Error getting participant detail:', error);
    return c.json({ error: 'Failed to get participant' }, 500);
  }
});

app.get('/make-server-ce05600a/admin/participants/:participantId/audit-log', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const participantId = c.req.param('participantId');
    const auditLog = await db.getParticipantAuditLog(participantId);

    return c.json({ auditLog });
  } catch (error) {
    errorLog('Error getting audit log:', error);
    return c.json({ error: 'Failed to get audit log' }, 500);
  }
});

app.delete('/make-server-ce05600a/admin/participants/:participantId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const participantId = c.req.param('participantId');
    await db.deleteParticipant(participantId);

    return c.json({ success: true, message: 'Participant deleted' });
  } catch (error) {
    errorLog('Error deleting participant:', error);
    return c.json({ error: 'Failed to delete participant' }, 500);
  }
});

app.delete('/make-server-ce05600a/admin/participants/:participantId/registrations/:roundId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const participantId = c.req.param('participantId');
    const roundId = c.req.param('roundId');

    // Find the registration to get sessionId
    const regs = await db.getRegistrationsByParticipant(participantId);
    const reg = regs.find((r: any) => r.roundId === roundId);
    if (!reg) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    await db.deleteRegistration(participantId, reg.sessionId, roundId);

    return c.json({ success: true, message: 'Registration deleted' });
  } catch (error) {
    errorLog('Error deleting registration:', error);
    return c.json({ error: 'Failed to delete registration' }, 500);
  }
});

// ============================================================
// Admin: Ice breakers
// ============================================================

app.get('/make-server-ce05600a/admin/ice-breakers', async (c) => {
  try {
    const iceBreakers = await db.getAdminSetting('ice_breakers');
    return c.json({ iceBreakers: iceBreakers || [] });
  } catch (error) {
    errorLog('Error fetching ice breakers:', error);
    return c.json({ error: 'Failed to fetch ice breakers' }, 500);
  }
});

app.put('/make-server-ce05600a/admin/ice-breakers', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const body = await c.req.json();
    await db.setAdminSetting('ice_breakers', body.iceBreakers || body);
    return c.json({ success: true });
  } catch (error) {
    errorLog('Error updating ice breakers:', error);
    return c.json({ error: 'Failed to update ice breakers' }, 500);
  }
});

// ============================================================
// Admin: Gift cards
// ============================================================

app.get('/make-server-ce05600a/admin/gift-cards/list', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const cards = await db.getAllGiftCards();
    return c.json({ giftCards: cards });
  } catch (error) {
    errorLog('Error listing gift cards:', error);
    return c.json({ error: 'Failed to list gift cards' }, 500);
  }
});

app.post('/make-server-ce05600a/admin/gift-cards/create', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const body = await c.req.json();
    const cards = await db.getAllGiftCards();

    const newCard = {
      code: body.code,
      description: body.description || '',
      credits: body.credits || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null,
    };

    cards.push(newCard);
    await db.saveGiftCards(cards);

    return c.json({ success: true, giftCard: newCard });
  } catch (error) {
    errorLog('Error creating gift card:', error);
    return c.json({ error: 'Failed to create gift card' }, 500);
  }
});

app.put('/make-server-ce05600a/admin/gift-cards/:code/toggle', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const code = c.req.param('code');
    const cards = await db.getAllGiftCards();
    const card = cards.find((card: any) => card.code === code);

    if (!card) {
      return c.json({ error: 'Gift card not found' }, 404);
    }

    card.isActive = !card.isActive;
    await db.saveGiftCards(cards);

    return c.json({ success: true, giftCard: card });
  } catch (error) {
    errorLog('Error toggling gift card:', error);
    return c.json({ error: 'Failed to toggle gift card' }, 500);
  }
});

app.delete('/make-server-ce05600a/admin/gift-cards/:code', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const code = c.req.param('code');
    const cards = await db.getAllGiftCards();
    const filtered = cards.filter((card: any) => card.code !== code);

    if (filtered.length === cards.length) {
      return c.json({ error: 'Gift card not found' }, 404);
    }

    await db.saveGiftCards(filtered);

    return c.json({ success: true });
  } catch (error) {
    errorLog('Error deleting gift card:', error);
    return c.json({ error: 'Failed to delete gift card' }, 500);
  }
});

// ============================================================
// Admin: Default round rules
// ============================================================

app.get('/make-server-ce05600a/admin/default-round-rules', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const rules = await db.getDefaultRoundRules();
    return c.json({ rules: rules || {} });
  } catch (error) {
    errorLog('Error fetching default round rules:', error);
    return c.json({ error: 'Failed to fetch round rules' }, 500);
  }
});

app.post('/make-server-ce05600a/admin/default-round-rules', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const body = await c.req.json();
    await db.saveDefaultRoundRules(body.rules || body);

    return c.json({ success: true });
  } catch (error) {
    errorLog('Error saving default round rules:', error);
    return c.json({ error: 'Failed to save round rules' }, 500);
  }
});

// ============================================================
// Admin: Billing management (subscriptions & credits without Stripe)
// ============================================================

// GET billing info for a user
app.get('/make-server-ce05600a/admin/users/:userId/billing', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const userId = c.req.param('userId');
    const subscription = await db.getSubscription(userId);
    const credits = await db.getCredits(userId);
    const transactions = await db.getCreditTransactions(userId);

    return c.json({
      success: true,
      subscription: subscription || null,
      credits,
      transactions,
    });
  } catch (error) {
    errorLog('Error fetching billing info:', error);
    return c.json({ error: 'Failed to fetch billing info' }, 500);
  }
});

// Grant or update subscription
app.post('/make-server-ce05600a/admin/users/:userId/subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { capacityTier, status, plan } = body;

    const validTiers = ['50', '200', '500', '1000', '5000'];
    if (!validTiers.includes(capacityTier)) {
      return c.json({ error: 'Invalid capacity tier. Must be one of: 50, 200, 500, 1000, 5000' }, 400);
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await db.upsertSubscription(userId, {
      stripeCustomerId: 'admin_granted',
      stripeSubscriptionId: `admin_${Date.now()}`,
      capacityTier,
      status: status || 'active',
      plan: plan || 'premium',
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    });

    debugLog('💳 Admin granted subscription:', { userId, capacityTier });
    return c.json({ success: true, message: `Subscription granted: tier ${capacityTier}` });
  } catch (error) {
    errorLog('Error granting subscription:', error);
    return c.json({ error: 'Failed to grant subscription' }, 500);
  }
});

// Cancel subscription
app.delete('/make-server-ce05600a/admin/users/:userId/subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const userId = c.req.param('userId');
    await db.updateSubscription(userId, {
      status: 'cancelled',
      cancelAtPeriodEnd: false,
    });

    debugLog('💳 Admin cancelled subscription:', userId);
    return c.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    errorLog('Error cancelling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// Add credits
app.post('/make-server-ce05600a/admin/users/:userId/credits', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { amount, capacityTier } = body;

    const validTiers = ['50', '200', '500', '1000', '5000'];
    if (!validTiers.includes(capacityTier)) {
      return c.json({ error: 'Invalid capacity tier' }, 400);
    }
    if (!amount || amount < 1 || amount > 100) {
      return c.json({ error: 'Amount must be between 1 and 100' }, 400);
    }

    await db.addCredits(userId, amount, {
      type: 'purchase',
      capacityTier,
      description: `Admin granted ${amount} credit(s) at tier ${capacityTier}`,
    });

    debugLog('💳 Admin added credits:', { userId, amount, capacityTier });
    return c.json({ success: true, message: `Added ${amount} credits at tier ${capacityTier}` });
  } catch (error) {
    errorLog('Error adding credits:', error);
    return c.json({ error: 'Failed to add credits' }, 500);
  }
});

// Reset credits to zero
app.post('/make-server-ce05600a/admin/users/:userId/credits/reset', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const userId = c.req.param('userId');
    const credits = await db.getCredits(userId);

    if (credits.balance > 0) {
      await db.addCredits(userId, -credits.balance, {
        type: 'refund',
        description: 'Admin reset credits to zero',
      });
    }

    debugLog('💳 Admin reset credits:', userId);
    return c.json({ success: true, message: 'Credits reset to zero' });
  } catch (error) {
    errorLog('Error resetting credits:', error);
    return c.json({ error: 'Failed to reset credits' }, 500);
  }
});

// ============================================================
// Public: Analytics Events
// ============================================================

app.post('/make-server-ce05600a/events', async (c) => {
  try {
    const body = await c.req.json();
    const events = body.events || [];

    if (events.length === 0) {
      return c.json({ success: true, received: 0 });
    }

    // Store events in event_logs admin setting (append to existing)
    const existing = await db.getAdminSetting('event_logs') || [];
    // Keep last 5000 events to avoid unbounded growth
    const combined = [...existing, ...events].slice(-5000);
    await db.setAdminSetting('event_logs', combined);

    debugLog(`[Events] Received ${events.length} analytics events`);
    return c.json({ success: true, received: events.length });
  } catch (error) {
    errorLog('Error saving analytics events:', error);
    return c.json({ success: true, received: 0 }); // Don't fail client on analytics errors
  }
});

// ============================================================
// Public: Blog (read-only)
// ============================================================

app.get('/make-server-ce05600a/blog/posts', async (c) => {
  try {
    const posts = await db.getAllBlogPosts();
    // Only return published posts for public view
    const published = posts.filter((p: any) => p.status === 'published');
    return c.json({ posts: published });
  } catch (error) {
    errorLog('Error listing public blog posts:', error);
    return c.json({ error: 'Failed to list blog posts' }, 500);
  }
});

app.get('/make-server-ce05600a/blog/posts/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const posts = await db.getAllBlogPosts();
    const post = posts.find((p: any) => p.slug === slug && p.status === 'published');
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    return c.json({ post });
  } catch (error) {
    errorLog('Error fetching blog post:', error);
    return c.json({ error: 'Failed to fetch blog post' }, 500);
  }
});

// ============================================================
// Admin: Blog management
// ============================================================

app.get('/make-server-ce05600a/admin/blog/posts', async (c) => {
  try {
    const posts = await db.getAllBlogPosts();
    return c.json({ posts });
  } catch (error) {
    errorLog('Error listing blog posts:', error);
    return c.json({ error: 'Failed to list blog posts' }, 500);
  }
});

app.post('/make-server-ce05600a/admin/blog/posts', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const body = await c.req.json();
    const posts = await db.getAllBlogPosts();

    const newPost = {
      id: `post-${Date.now()}`,
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || '',
      author: body.author || 'Admin',
      status: body.status || 'draft',
      tags: body.tags || [],
      coverImage: body.coverImage || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts.push(newPost);
    await db.saveBlogPosts(posts);

    return c.json({ success: true, post: newPost });
  } catch (error) {
    errorLog('Error creating blog post:', error);
    return c.json({ error: 'Failed to create blog post' }, 500);
  }
});

app.put('/make-server-ce05600a/admin/blog/posts/:postId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const postId = c.req.param('postId');
    const body = await c.req.json();
    const posts = await db.getAllBlogPosts();
    const index = posts.findIndex((p: any) => p.id === postId);

    if (index === -1) {
      return c.json({ error: 'Post not found' }, 404);
    }

    posts[index] = { ...posts[index], ...body, updatedAt: new Date().toISOString() };
    await db.saveBlogPosts(posts);

    return c.json({ success: true, post: posts[index] });
  } catch (error) {
    errorLog('Error updating blog post:', error);
    return c.json({ error: 'Failed to update blog post' }, 500);
  }
});

app.delete('/make-server-ce05600a/admin/blog/posts/:postId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const postId = c.req.param('postId');
    const posts = await db.getAllBlogPosts();
    const filtered = posts.filter((p: any) => p.id !== postId);

    if (filtered.length === posts.length) {
      return c.json({ error: 'Post not found' }, 404);
    }

    await db.saveBlogPosts(filtered);

    return c.json({ success: true });
  } catch (error) {
    errorLog('Error deleting blog post:', error);
    return c.json({ error: 'Failed to delete blog post' }, 500);
  }
});

// ============================================================
// Theme management
// ============================================================

// Admin: Get theme settings
app.get('/make-server-ce05600a/admin/theme', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const theme = await db.getAdminSetting('theme');
    return c.json({ theme: theme || null });
  } catch (error) {
    errorLog('Error getting theme:', error);
    return c.json({ error: 'Failed to get theme' }, 500);
  }
});

// Admin: Save theme settings (colors + visual style)
app.post('/make-server-ce05600a/admin/theme', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { theme } = body;

    if (!theme) {
      return c.json({ error: 'Theme data required' }, 400);
    }

    await db.setAdminSetting('theme', theme);
    return c.json({ success: true });
  } catch (error) {
    errorLog('Error saving theme:', error);
    return c.json({ error: 'Failed to save theme' }, 500);
  }
});

// Public: Lead magnet submission (no auth required)
app.post('/make-server-ce05600a/public/lead-magnet', async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, eventType, participantCount } = body;

    if (!email || !name) {
      return c.json({ error: 'Email and name are required' }, 400);
    }

    // Save to DB
    const submission = await db.createLeadMagnetSubmission({
      email,
      name,
      eventType,
      participantCount,
    });

    // Send ebook email
    const ebookUrl = 'https://wonderelo.com/guide'; // Placeholder URL for the ebook
    const emailContent = buildLeadMagnetEmail({ name, ebookUrl });
    await sendEmail({ to: email, ...emailContent });

    debugLog('Lead magnet submission saved:', email);
    return c.json({ success: true, id: submission.id });
  } catch (error) {
    errorLog('Error saving lead magnet submission:', error);
    return c.json({ error: 'Failed to save submission' }, 500);
  }
});

// Admin: Get lead magnet submissions
app.get('/make-server-ce05600a/admin/leads', async (c) => {
  try {
    const submissions = await db.getLeadMagnetSubmissions();
    return c.json({ submissions });
  } catch (error) {
    errorLog('Error getting lead submissions:', error);
    return c.json({ error: 'Failed to get submissions' }, 500);
  }
});

// Public: Get theme for event pages (no auth required)
app.get('/make-server-ce05600a/public/theme', async (c) => {
  try {
    const theme = await db.getAdminSetting('theme');
    return c.json({ theme: theme || null });
  } catch (error) {
    errorLog('Error getting public theme:', error);
    return c.json({ error: 'Failed to get theme' }, 500);
  }
});

// ============================================
// CRON: Automatic round reminders (SMS)
// ============================================

app.post('/make-server-ce05600a/cron/send-round-reminders', async (c) => {
  try {
    // Auth: verify cron secret
    const cronSecret = c.req.header('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = new Date();
    const WINDOW_MINUTES = 7; // 7-min window for cron jitter reliability
    const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60000);

    // Get all scheduled rounds with published sessions that haven't had reminders sent
    const candidateRounds = await db.getRoundsNeedingReminder();

    // Filter by time window: round starts between now and now+7min
    const roundsToNotify = candidateRounds.filter((r: any) => {
      if (!r.date || !r.startTime) return false;
      const roundStartUtc = parseRoundStartTime(r.date, r.startTime);
      return roundStartUtc >= now && roundStartUtc <= windowEnd;
    });

    if (roundsToNotify.length === 0) {
      return c.json({ success: true, message: 'No rounds need reminders', roundsChecked: candidateRounds.length });
    }

    // Load SMS template
    const texts = await db.getAdminSetting('notification_texts');
    const template = texts?.smsRoundStartingSoon;
    if (!template) {
      console.log('⚠️ No smsRoundStartingSoon template configured');
      return c.json({ success: false, error: 'SMS template not configured' }, 500);
    }

    let totalSmsSent = 0;
    let totalSmsFailed = 0;
    const roundResults: any[] = [];

    for (const round of roundsToNotify) {
      const roundStartUtc = parseRoundStartTime(round.date, round.startTime);
      const minutesUntilStart = Math.round((roundStartUtc.getTime() - now.getTime()) / 60000);

      // Get registrations for this round (confirmed + registered with notifications enabled)
      const registrations = await db.getRegistrationsForRound(round.sessionId, round.id);
      const eligibleRegs = registrations.filter((reg: any) =>
        ['registered', 'confirmed'].includes(reg.status) &&
        reg.notificationsEnabled !== false &&
        reg.phone
      );

      let sent = 0;
      let failed = 0;

      // Determine location from round meeting points or session meeting points
      const meetingPoints = round.meetingPoints?.length > 0
        ? round.meetingPoints
        : round.sessionMeetingPoints || [];
      const location = meetingPoints.length > 0
        ? (meetingPoints[0]?.name || meetingPoints[0] || '')
        : '';

      for (const reg of eligibleRegs) {
        const smsBody = renderSmsTemplate(template, {
          sessionName: round.sessionName || round.name || '',
          minutes: String(minutesUntilStart),
          location,
          firstName: reg.firstName || '',
          name: `${reg.firstName || ''} ${reg.lastName || ''}`.trim(),
          time: round.startTime || '',
          date: round.date || '',
        });

        const result = await sendSms({ to: reg.phone, body: smsBody });
        if (result.success) {
          sent++;
        } else {
          failed++;
          console.error(`❌ SMS failed for ${reg.phone}: ${result.error}`);
        }
      }

      // Mark round as reminded (idempotent)
      await db.markRoundReminderSent(round.id);

      totalSmsSent += sent;
      totalSmsFailed += failed;
      roundResults.push({
        roundId: round.id,
        roundName: round.name,
        sessionName: round.sessionName,
        startsIn: `${minutesUntilStart}min`,
        eligibleParticipants: eligibleRegs.length,
        smsSent: sent,
        smsFailed: failed,
      });
    }

    console.log(`📱 CRON ROUND REMINDERS: ${roundsToNotify.length} rounds, ${totalSmsSent} SMS sent, ${totalSmsFailed} failed`);

    return c.json({
      success: true,
      roundsProcessed: roundsToNotify.length,
      totalSmsSent,
      totalSmsFailed,
      rounds: roundResults,
    });

  } catch (error) {
    console.error('💥 CRON send-round-reminders error:', error);
    const details = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    return c.json({
      error: 'Failed to send round reminders',
      details,
    }, 500);
  }
});

// ============================================================
// CRON: Onboarding email sequence
// ============================================================
// Call this periodically (e.g., every hour via Supabase CRON or external scheduler)
// It checks all organizers and sends context-appropriate onboarding emails

app.post('/make-server-ce05600a/cron/onboarding-emails', async (c) => {
  try {
    const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';

    // Get all organizer profiles
    const supabase = getGlobalSupabaseClient();
    const { data: profiles, error: profilesError } = await supabase
      .from('organizer_profiles')
      .select('*');

    if (profilesError || !profiles) {
      return c.json({ error: 'Failed to fetch organizer profiles' }, 500);
    }

    // Get sent onboarding emails tracking
    const sentEmails: Record<string, string[]> = await db.getAdminSetting('onboarding_emails_sent') || {};

    const results: any[] = [];
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const profile of profiles) {
      const userId = profile.id || profile.user_id;
      const email = profile.email;
      const firstName = (profile.organizer_name || 'there').split(' ')[0];
      const urlSlug = profile.url_slug || '';
      const createdAt = new Date(profile.created_at).getTime();
      const dashboardUrl = `${appUrl}/dashboard`;
      const eventPageUrl = urlSlug ? `${appUrl}/${urlSlug}` : '';

      // Get organizer's sent emails list
      const sent = sentEmails[userId] || [];

      // Get organizer's sessions
      const sessions = await db.getSessionsByUser(userId);
      const hasSessions = sessions.length > 0;
      const hasPublishedSession = sessions.some((s: any) => s.status === 'published');
      const draftSession = sessions.find((s: any) => s.status === 'draft');

      // Check if URL slug looks auto-generated (contains random chars)
      const isAutoSlug = urlSlug.match(/^[a-z0-9]{8,}$/) || urlSlug === '';

      // Count total participants across all sessions
      let totalParticipants = 0;
      for (const session of sessions) {
        const rounds = session.rounds || [];
        for (const round of rounds) {
          totalParticipants += (round.participants || []).length;
        }
      }

      // Email 1: Create your first round (1+ day after signup, no sessions created)
      if (!sent.includes('onboarding_1') && !hasSessions && (now - createdAt) > ONE_DAY) {
        const emailContent = buildOnboardingEmail1_CreateRound({ firstName, dashboardUrl });
        const result = await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
        sent.push('onboarding_1');
        results.push({ userId, email: 'onboarding_1', sent: result.success });
      }

      // Email 2: Customize URL (2+ days after signup, URL still auto-generated)
      else if (!sent.includes('onboarding_2') && isAutoSlug && (now - createdAt) > 2 * ONE_DAY) {
        const emailContent = buildOnboardingEmail2_CustomizeUrl({ firstName, dashboardUrl, currentUrl: eventPageUrl || `${appUrl}/${urlSlug}` });
        const result = await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
        sent.push('onboarding_2');
        results.push({ userId, email: 'onboarding_2', sent: result.success });
      }

      // Email 3: Publish your round (has draft session, no published, 1+ day after creation)
      else if (!sent.includes('onboarding_3') && draftSession && !hasPublishedSession && (now - createdAt) > ONE_DAY) {
        const emailContent = buildOnboardingEmail3_PublishRound({ firstName, dashboardUrl, sessionName: draftSession.name || 'your round' });
        const result = await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
        sent.push('onboarding_3');
        results.push({ userId, email: 'onboarding_3', sent: result.success });
      }

      // Update tracking
      sentEmails[userId] = sent;
    }

    // Save updated tracking
    await db.setAdminSetting('onboarding_emails_sent', sentEmails);

    debugLog(`[Onboarding CRON] Processed ${profiles.length} organizers, sent ${results.length} emails`);
    return c.json({
      processed: profiles.length,
      emailsSent: results.length,
      details: results
    });

  } catch (error) {
    errorLog('CRON onboarding-emails error:', error);
    return c.json({ error: 'Failed to process onboarding emails' }, 500);
  }
});

// Register participant routes
registerParticipantRoutes(app, getCurrentTime);

// Register Stripe payment routes
registerStripeRoutes(app);

Deno.serve(app.fetch);