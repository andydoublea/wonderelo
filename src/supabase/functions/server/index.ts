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
import { registerCrmRoutes } from './route-crm.ts';
import { registerI18nRoutes } from './route-i18n.ts';
import { getScenarioList, runScenario } from './e2e-scenarios.ts';

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
      urlSlug: userProfile?.urlSlug,
      onboardingCompletedAt: userProfile?.onboardingCompletedAt,
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
            await consumeEventCredit(user.id, sessionId, capacityResult.currentTier, newSession.name);
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
            const sessionName = body.name || existingSession.name;
            await consumeEventCredit(user.id, sessionId, capacityResult.currentTier, sessionName);
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
    if (['confirmed', 'matched', 'checked-in', 'met'].includes(registration.status)) {
      console.log(`✅ Round already in status "${registration.status}", returning success (idempotent)`);
      return c.json({
        success: true,
        status: registration.status,
        confirmedAt: registration.confirmedAt || registration.lastStatusUpdate,
        message: 'Attendance already confirmed'
      });
    }

    // Only 'registered' status can be confirmed (reject 'unconfirmed', 'no-match', 'missed', 'cancelled')
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
      const roundStartTime = parseRoundStartTime(session.date, round.startTime);
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

    // If already confirmed or later status, just return success (idempotent)
    if (['confirmed', 'matched', 'checked-in', 'met'].includes(registration.status)) {
      debugLog(`✅ Round already in status "${registration.status}", returning success (idempotent)`);
      return c.json({
        success: true,
        status: registration.status,
        confirmedAt: registration.confirmedAt || registration.lastStatusUpdate,
        message: 'Attendance already confirmed'
      });
    }

    // Only 'registered' status can be confirmed (reject terminal statuses)
    if (registration.status !== 'registered') {
      debugLog(`⚠️ Cannot confirm: current status is "${registration.status}"`);
      return c.json({
        error: 'Cannot confirm',
        message: `Round status is "${registration.status}". Only "registered" rounds can be confirmed.`,
        currentStatus: registration.status
      }, 400);
    }

    // Validate confirmation window — reject if round already started
    const session = await db.getSessionById(sessionId);
    const round = session?.rounds?.find((r: any) => r.id === roundId);
    if (round && session?.date && round.startTime) {
      const roundStartTime = parseRoundStartTime(session.date, round.startTime);
      const now = getCurrentTime(c);
      if (now > roundStartTime) {
        debugLog('❌ Confirmation window closed - round already started');
        return c.json({
          error: 'Confirmation window closed',
          message: 'The round has already started. You can no longer confirm attendance.',
          currentStatus: registration.status
        }, 400);
      }
    }

    const now = new Date().toISOString();

    await db.updateRegistrationStatus(participantId, sessionId, roundId, 'confirmed', {
      confirmedAt: now,
    });

    debugLog(`✅ Confirmed attendance for round ${roundId}`);

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

// Participant unregister/cancel from a round
app.post('/make-server-ce05600a/p/:token/unregister/:roundId', async (c) => {
  try {
    const token = c.req.param('token');
    const roundId = c.req.param('roundId');

    // Get sessionId from query or body
    let sessionId = c.req.query('sessionId');
    if (!sessionId) {
      try {
        const body = await c.req.json();
        sessionId = body.sessionId;
      } catch {
        // No body, that's fine if we got it from query
      }
    }

    debugLog('🚫 UNREGISTER REQUEST', { token: token?.substring(0, 20) + '...', roundId, sessionId });

    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }

    const participant = await db.getParticipantByToken(token);
    if (!participant) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    // Get specific registration
    const registration = await db.getRegistration(participant.participantId, sessionId, roundId);

    if (!registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    // Only allow cancellation from 'registered' or 'confirmed' (before matching)
    const cancellableStatuses = ['registered', 'confirmed'];
    if (!cancellableStatuses.includes(registration.status)) {
      debugLog(`⚠️ Cannot cancel: current status is "${registration.status}"`);
      return c.json({
        error: 'Cannot unregister',
        message: `Cannot unregister when status is "${registration.status}". You can only unregister before matching starts.`,
        currentStatus: registration.status
      }, 400);
    }

    await db.updateRegistrationStatus(participant.participantId, sessionId, roundId, 'cancelled');

    debugLog(`✅ Participant cancelled registration for round ${roundId}`);

    return c.json({
      success: true,
      status: 'cancelled',
      message: 'Successfully unregistered from round'
    });

  } catch (error) {
    errorLog('Error unregistering from round:', error);
    return c.json({
      error: 'Failed to unregister',
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
        contactSharingDelayMinutes: 5,
        timePickerIntervalMinutes: 5,
        notificationEarlyMinutes: 10,
        notificationEarlyEnabled: true,
        notificationLateMinutes: 5,
        notificationLateEnabled: true,
        smsRoundEndedEnabled: true,
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
      contactSharingDelayMinutes: 5,
      timePickerIntervalMinutes: 5,
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
    const { organizerName, urlSlug, phone, website, description, profileImageUrl, onboardingCompletedAt } = body;

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
      onboardingCompletedAt: onboardingCompletedAt !== undefined ? onboardingCompletedAt : currentProfile.onboardingCompletedAt,
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

// Admin: Update user role (admin/organizer)
app.put('/make-server-ce05600a/admin/users/:userId/role', async (c) => {
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

    // Verify requesting user is admin
    const requestingProfile = await db.getOrganizerById(user.id);
    if (!requestingProfile || requestingProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const newRole = body.role;

    if (!['admin', 'organizer'].includes(newRole)) {
      return c.json({ error: 'Invalid role. Must be "admin" or "organizer"' }, 400);
    }

    // Prevent removing your own admin role
    if (userId === user.id && newRole !== 'admin') {
      return c.json({ error: 'Cannot remove your own admin role' }, 400);
    }

    await db.updateOrganizerProfile(userId, { role: newRole });

    return c.json({ success: true, message: `User role updated to ${newRole}` });

  } catch (error) {
    errorLog('Error updating user role:', error);
    return c.json({ error: 'Failed to update user role' }, 500);
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

    // Check for duplicate code
    if (cards.some((c: any) => c.code === body.code)) {
      return c.json({ error: 'A gift card with this code already exists' }, 400);
    }

    const newCard = {
      id: crypto.randomUUID(),
      code: body.code,
      discountType: body.discountType || 'absolute', // 'absolute' | 'percentage'
      discountValue: body.discountValue || 0,
      applicableTo: body.applicableTo || 'single_event', // 'single_event' | 'monthly_subscription' | 'yearly_subscription'
      validFrom: body.validFrom || new Date().toISOString().split('T')[0],
      validUntil: body.validUntil || '',
      maxUses: body.maxUses || undefined,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      createdAt: new Date().toISOString(),
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
// Gift card: Validate (public, requires auth)
// ============================================================

app.post('/make-server-ce05600a/validate-gift-card', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const body = await c.req.json();
    const { code } = body;
    if (!code) {
      return c.json({ error: 'Gift card code is required' }, 400);
    }

    const cards = await db.getAllGiftCards();
    const card = cards.find((c: any) => c.code === code.toUpperCase().trim());

    if (!card) {
      return c.json({ error: 'Invalid gift card code' }, 404);
    }

    if (!card.isActive) {
      return c.json({ error: 'This gift card is no longer active' }, 400);
    }

    // Check expiration
    if (card.validUntil && new Date(card.validUntil) < new Date()) {
      return c.json({ error: 'This gift card has expired' }, 400);
    }

    // Check if not yet valid
    if (card.validFrom && new Date(card.validFrom) > new Date()) {
      return c.json({ error: 'This gift card is not yet valid' }, 400);
    }

    // Check max uses
    if (card.maxUses && (card.usedCount || 0) >= card.maxUses) {
      return c.json({ error: 'This gift card has reached its maximum uses' }, 400);
    }

    // Check if user already used this card
    const usedBy = card.usedBy || [];
    if (usedBy.some((u: any) => u.organizerId === user.id)) {
      return c.json({ error: 'You have already used this gift card' }, 400);
    }

    // Return gift card info (don't redeem yet — that happens at checkout)
    return c.json({
      valid: true,
      giftCard: {
        code: card.code,
        discountType: card.discountType,
        discountValue: card.discountValue,
        applicableTo: card.applicableTo,
      },
    });
  } catch (error) {
    errorLog('Error validating gift card:', error);
    return c.json({ error: 'Failed to validate gift card' }, 500);
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
    const creditsList = await db.getCredits(userId);

    for (const credit of creditsList) {
      if (credit.balance > 0) {
        await db.addCredits(userId, -credit.balance, {
          type: 'refund',
          capacityTier: credit.capacityTier,
          description: 'Admin reset credits to zero',
        });
      }
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

/**
 * Send the "round just ended" SMS to all eligible participants in a round.
 * Shared between the cron fallback and the client-triggered endpoint.
 * Per-registration deduplication prevents duplicate sends.
 *
 * Returns counts + per-recipient results.
 */
async function sendRoundEndedSmsForRound(round: any, endedTemplate: string, appUrl: string) {
  const registrations = await db.getRegistrationsForRound(round.sessionId, round.id);
  const eligibleRegs = registrations.filter((reg: any) =>
    ['matched', 'checked-in', 'met'].includes(reg.status) &&
    reg.notificationsEnabled !== false &&
    reg.phone &&
    !reg.endReminderSmsSentAt
  );
  let sent = 0;
  let failed = 0;
  for (const reg of eligibleRegs) {
    const link = reg.token ? `${appUrl}/p/${reg.token}/contact-sharing?from=sms-ended` : appUrl;
    const smsBody = renderSmsTemplate(endedTemplate, {
      sessionName: round.sessionName || round.name || '',
      firstName: reg.firstName || '',
      name: `${reg.firstName || ''} ${reg.lastName || ''}`.trim(),
      time: round.startTime || '',
      date: round.date || '',
      link,
    });
    const to = composeE164(reg.phone, reg.phoneCountry);
    if (!to) {
      failed++;
      console.error(`❌ Cannot compose phone for ${reg.participantId}: phone=${reg.phone} country=${reg.phoneCountry}`);
      continue;
    }
    const result = await sendSms({ to, body: smsBody });
    if (result.success) {
      sent++;
      try {
        await db.markRegistrationEndReminderSent(reg.participantId, round.sessionId, round.id);
      } catch (e) {
        console.error(`⚠️ Failed to mark reg end reminder for ${reg.participantId}: ${e}`);
      }
    } else {
      failed++;
      console.error(`❌ SMS ended failed for ${to}: ${result.error}`);
    }
  }
  return { eligibleCount: eligibleRegs.length, sent, failed };
}

/**
 * Build an E.164 phone number from separate country-code + local number fields.
 * Matches the behaviour of the Confirm Attendance button: needs reg.phone
 * populated at all, and reg.phoneCountry (e.g. "+421") to prepend. If the
 * phone already starts with "+" it's used as-is.
 */
function composeE164(phone: string | undefined, phoneCountry: string | undefined): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return '+' + clean.slice(2);
  const prefix = (phoneCountry || '').trim();
  if (!prefix) return null;
  // If phone starts with 0 (local format), strip the 0 before prefixing.
  const local = clean.startsWith('0') ? clean.slice(1) : clean;
  const normalizedPrefix = prefix.startsWith('+') ? prefix : '+' + prefix;
  return `${normalizedPrefix}${local}`;
}

app.post('/make-server-ce05600a/cron/send-round-reminders', async (c) => {
  try {
    // Auth: verify cron secret
    const cronSecret = c.req.header('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = new Date();

    // Target-time-based scheduling: each SMS has a computed target send time
    // derived from round_start / round_end. The cron fires SMS only on the
    // tick where `target_send_time` fell within the last CRON_INTERVAL_MINUTES
    // (the cron granularity). Per-registration deduplication means any missed
    // tick is picked up on the next one, still only once per participant.
    //
    //   Starting-soon target = round_start - confirmationWindowMinutes
    //     (exact moment the Confirm Attendance button appears)
    //   Round-ended  target = round_start + duration
    //     (exact moment the networking countdown hits 0)
    //
    // Catch-up window: sized to match cron cadence. pg_cron runs every 5s
    // on staging for sub-minute precision; 20s window (= 5s cadence + 15s
    // slack) is plenty to catch a tick even under moderate network jitter,
    // while short enough that the row-level claim race is tiny.
    //
    // A query-string override (?catchupMs=...) exists for tests / one-off
    // backfills so we can run a wide-window sweep without redeploying.
    const sysParams = (await db.getAdminSetting('system_parameters')) || {};
    const confirmationWindowMinutes = Number(sysParams.confirmationWindowMinutes) || 5;
    const smsRoundEndedEnabled = sysParams.smsRoundEndedEnabled !== false; // default true
    const overrideMs = Number(c.req.query('catchupMs')) || 0;
    const catchupMs = overrideMs > 0 ? overrideMs : 20_000;

    // Get all candidate rounds (scheduled + published session)
    const candidateRounds = await db.getRoundsNeedingReminder();

    // Split into two sets: starting-soon (target in the last catch-up window)
    // and just-ended (same).
    const startingSoon = candidateRounds.filter((r: any) => {
      if (!r.date || !r.startTime) return false;
      const roundStartUtc = parseRoundStartTime(r.date, r.startTime);
      const targetSendUtc = new Date(roundStartUtc.getTime() - confirmationWindowMinutes * 60000);
      // Fire when: target_send_time <= now < target_send_time + catchup
      const elapsed = now.getTime() - targetSendUtc.getTime();
      return elapsed >= 0 && elapsed < catchupMs;
    });
    const justEnded = smsRoundEndedEnabled
      ? candidateRounds.filter((r: any) => {
          if (!r.date || !r.startTime) return false;
          const duration = Number(r.duration) || 0;
          if (duration <= 0) return false;
          const roundStartUtc = parseRoundStartTime(r.date, r.startTime);
          const targetSendUtc = new Date(roundStartUtc.getTime() + duration * 60000);
          const elapsed = now.getTime() - targetSendUtc.getTime();
          return elapsed >= 0 && elapsed < catchupMs;
        })
      : [];

    if (startingSoon.length === 0 && justEnded.length === 0) {
      return c.json({
        success: true,
        message: 'No rounds need reminders',
        roundsChecked: candidateRounds.length,
        window: { confirmationWindowMinutes, catchupMs, smsRoundEndedEnabled },
      });
    }

    // Load SMS templates
    const texts = (await db.getAdminSetting('notification_texts')) || {};
    const startingTemplate = texts.smsRoundStartingSoon;
    const endedTemplate = texts.smsRoundEnded;

    let totalSmsSent = 0;
    let totalSmsFailed = 0;
    const roundResults: any[] = [];
    const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';

    // ---- Starting-soon pass ----
    if (startingSoon.length > 0 && startingTemplate) {
      for (const round of startingSoon) {
        const roundStartUtc = parseRoundStartTime(round.date, round.startTime);
        const minutesUntilStart = Math.max(0, Math.round((roundStartUtc.getTime() - now.getTime()) / 60000));

        const registrations = await db.getRegistrationsForRound(round.sessionId, round.id);
        const eligibleRegs = registrations.filter((reg: any) =>
          ['registered', 'confirmed'].includes(reg.status) &&
          reg.notificationsEnabled !== false &&
          reg.phone &&
          !reg.reminderSmsSentAt
        );
        if (eligibleRegs.length === 0) continue;

        const meetingPoints = round.meetingPoints?.length > 0 ? round.meetingPoints : round.sessionMeetingPoints || [];
        const location = meetingPoints.length > 0 ? (meetingPoints[0]?.name || meetingPoints[0] || '') : '';

        let sent = 0;
        let failed = 0;
        for (const reg of eligibleRegs) {
          const link = reg.token ? `${appUrl}/p/${reg.token}?from=sms-reminder` : appUrl;
          const smsBody = renderSmsTemplate(startingTemplate, {
            sessionName: round.sessionName || round.name || '',
            minutes: String(minutesUntilStart),
            location,
            firstName: reg.firstName || '',
            name: `${reg.firstName || ''} ${reg.lastName || ''}`.trim(),
            time: round.startTime || '',
            date: round.date || '',
            link,
          });
          const to = composeE164(reg.phone, reg.phoneCountry);
          if (!to) {
            failed++;
            console.error(`❌ Cannot compose phone for ${reg.participantId}: phone=${reg.phone} country=${reg.phoneCountry}`);
            continue;
          }
          const result = await sendSms({ to, body: smsBody });
          if (result.success) {
            sent++;
            try {
              await db.markRegistrationReminderSent(reg.participantId, round.sessionId, round.id);
            } catch (e) {
              console.error(`⚠️ Failed to mark reg starting reminder for ${reg.participantId}: ${e}`);
            }
          } else {
            failed++;
            console.error(`❌ SMS starting failed for ${to}: ${result.error}`);
          }
        }
        totalSmsSent += sent;
        totalSmsFailed += failed;
        roundResults.push({
          kind: 'starting-soon',
          roundId: round.id,
          roundName: round.name,
          sessionName: round.sessionName,
          startsIn: `${minutesUntilStart}min`,
          eligibleParticipants: eligibleRegs.length,
          smsSent: sent,
          smsFailed: failed,
        });
      }
    } else if (startingSoon.length > 0 && !startingTemplate) {
      console.log('⚠️ No smsRoundStartingSoon template configured — skipping starting-soon pass');
    }

    // ---- Round-ended pass (fallback for clients that didn't trigger /notify-ended) ----
    if (justEnded.length > 0 && endedTemplate) {
      for (const round of justEnded) {
        const r = await sendRoundEndedSmsForRound(round, endedTemplate, appUrl);
        if (r.eligibleCount === 0) continue;
        totalSmsSent += r.sent;
        totalSmsFailed += r.failed;
        roundResults.push({
          kind: 'just-ended',
          roundId: round.id,
          roundName: round.name,
          sessionName: round.sessionName,
          eligibleParticipants: r.eligibleCount,
          smsSent: r.sent,
          smsFailed: r.failed,
        });
      }
    } else if (justEnded.length > 0 && !endedTemplate) {
      console.log('⚠️ No smsRoundEnded template configured — skipping round-ended pass');
    }

    console.log(`📱 CRON ROUND REMINDERS: ${startingSoon.length} starting-soon + ${justEnded.length} just-ended rounds, ${totalSmsSent} SMS sent, ${totalSmsFailed} failed`);

    return c.json({
      success: true,
      startingSoonRounds: startingSoon.length,
      justEndedRounds: justEnded.length,
      totalSmsSent,
      totalSmsFailed,
      rounds: roundResults,
      window: { startWindowMinutes, endedLookbackMinutes, smsRoundEndedEnabled },
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

// ============================================================
// ACCESS PASSWORDS (public + admin)
// ============================================================

// Public: validate access password (no auth required)
app.post('/make-server-ce05600a/validate-access-password', async (c) => {
  try {
    const body = await c.req.json();
    const { password } = body;

    if (!password) {
      return c.json({ valid: false }, 400);
    }

    const match = await db.validateAccessPassword(password.trim());

    if (!match) {
      return c.json({ valid: false });
    }

    const userAgent = c.req.header('User-Agent') || null;
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null;

    await db.logPasswordAccess(match.id, userAgent, ipAddress);

    return c.json({
      valid: true,
      personName: match.person_name,
      passwordId: match.id,
    });
  } catch (error) {
    errorLog('Error validating access password:', error);
    return c.json({ error: 'Validation failed' }, 500);
  }
});

// Admin: list all access passwords
app.get('/make-server-ce05600a/admin/access-passwords', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const passwords = await db.getAllAccessPasswords();
    return c.json({ passwords });
  } catch (error) {
    errorLog('Error listing access passwords:', error);
    return c.json({ error: 'Failed to list access passwords' }, 500);
  }
});

// Admin: create access password
app.post('/make-server-ce05600a/admin/access-passwords', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const body = await c.req.json();
    if (!body.personName || !body.password) {
      return c.json({ error: 'Person name and password are required' }, 400);
    }

    const result = await db.createAccessPassword(body.personName.trim(), body.password.trim());
    return c.json({ success: true, password: result });
  } catch (error) {
    errorLog('Error creating access password:', error);
    return c.json({ error: 'Failed to create access password' }, 500);
  }
});

// Admin: toggle access password active/inactive
app.put('/make-server-ce05600a/admin/access-passwords/:id/toggle', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const id = c.req.param('id');
    const result = await db.toggleAccessPassword(id);
    return c.json({ success: true, isActive: result.is_active });
  } catch (error) {
    errorLog('Error toggling access password:', error);
    return c.json({ error: 'Failed to toggle access password' }, 500);
  }
});

// Admin: delete access password
app.delete('/make-server-ce05600a/admin/access-passwords/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const id = c.req.param('id');
    await db.deleteAccessPassword(id);
    return c.json({ success: true });
  } catch (error) {
    errorLog('Error deleting access password:', error);
    return c.json({ error: 'Failed to delete access password' }, 500);
  }
});

// Admin: view access password logs
app.get('/make-server-ce05600a/admin/access-passwords/:id/logs', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const id = c.req.param('id');
    const logs = await db.getAccessPasswordLogs(id);
    return c.json({ logs });
  } catch (error) {
    errorLog('Error fetching access password logs:', error);
    return c.json({ error: 'Failed to fetch access logs' }, 500);
  }
});

// ============================================================
// E2E TEST: Scenario-based matching flow tests
// ============================================================

// List available test scenarios
app.get('/make-server-ce05600a/test/e2e-scenarios', async (c) => {
  return c.json({ scenarios: getScenarioList() });
});

// Run a specific scenario (or all)
app.post('/make-server-ce05600a/test/e2e-matching', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const scenarioId = body.scenario || 'basic-2';
    const supabase = getSupabase();

    // Derive API base URL for HTTP-level tests
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const apiBaseUrl = `${supabaseUrl}/functions/v1/make-server-ce05600a`;
    const anonKey = c.req.header('Authorization')?.replace('Bearer ', '') || '';

    // Run all scenarios if requested
    if (scenarioId === 'all') {
      const scenarios = getScenarioList();
      const results = [];
      for (const s of scenarios) {
        const result = await runScenario(s.id, supabase, apiBaseUrl, anonKey);
        results.push(result);
      }
      const passed = results.filter(r => r.success).length;
      return c.json({ success: passed === results.length, passed, total: results.length, results });
    }

    // Run single scenario
    const result = await runScenario(scenarioId, supabase, apiBaseUrl, anonKey);
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Legacy: keep old inline endpoint structure for backward compat (remove later)
app.post('/make-server-ce05600a/test/e2e-matching-legacy', async (c) => {
  const startTime = Date.now();
  const steps: any[] = [];
  const step = (name: string, fn: () => Promise<any>) => {
    const t0 = Date.now();
    return fn().then(result => {
      steps.push({ step: name, ok: true, ...result, ms: Date.now() - t0 });
      return result;
    }).catch(err => {
      steps.push({ step: name, ok: false, error: String(err?.message || err), ms: Date.now() - t0 });
      throw err;
    });
  };

  try {
    const body = await c.req.json();
    const participants = body.participants || [
      { firstName: 'Anna', lastName: 'Prvá' },
      { firstName: 'Boris', lastName: 'Druhý' },
    ];
    const groupSize = body.groupSize || 2;

    // Get organizer userId (use first admin profile)
    const supabase = getSupabase();
    const { data: profiles } = await supabase.from('organizer_profiles').select('id, url_slug').limit(1);
    const organizerId = profiles?.[0]?.id;
    const organizerSlug = profiles?.[0]?.url_slug || 'test';
    if (!organizerId) throw new Error('No organizer profile found');

    // 1. Create session with round starting in the past (already past T-0)
    // We bypass matching time check by calling createMatchesForRound directly,
    // so the round time doesn't matter. Set it to midnight to avoid any issues.
    const now = new Date();
    const roundDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const roundStartTime = '00:00'; // Midnight — guaranteed to be in the past

    const sessionId = `test-e2e-${Date.now()}`;
    const roundId = `round-e2e-${Date.now()}`;

    await step('create_session', async () => {
      await db.createSession({
        id: sessionId,
        userId: organizerId,
        name: `E2E Test ${now.toISOString().substring(11, 16)}`,
        date: roundDate,
        status: 'published',
        groupSize,
        maxParticipants: 50,
        meetingPoints: ['Lobby', 'Table 1'],
        iceBreakers: ['What do you do?'],
        rounds: [{ id: roundId, startTime: roundStartTime, duration: 10, name: 'Test Round' }],
        registrationStart: new Date(now.getTime() - 3600000).toISOString(),
      });
      return { sessionId, roundId, roundStartTime: `${roundStartTime} CET`, roundDate };
    });

    // 2. Register participants
    const tokens: string[] = [];
    const participantIds: string[] = [];
    for (const p of participants) {
      await step(`register_${p.firstName}`, async () => {
        const pid = `participant-e2e-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const token = `e2e-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const email = `e2e-${Date.now()}-${Math.random().toString(36).substring(5)}@test.com`;

        await db.createParticipant({
          participantId: pid,
          email,
          token,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: '',
          phoneCountry: '+421',
        });

        await db.createRegistration({
          participantId: pid,
          sessionId,
          roundId,
          organizerId,
          status: 'registered',
        });

        tokens.push(token);
        participantIds.push(pid);
        return { name: `${p.firstName} ${p.lastName}`, token, participantId: pid };
      });
    }

    // 3. Confirm all participants (bypass time check — write directly)
    for (let i = 0; i < participants.length; i++) {
      await step(`confirm_${participants[i].firstName}`, async () => {
        await db.updateRegistrationStatus(participantIds[i], sessionId, roundId, 'confirmed', {
          confirmedAt: new Date().toISOString(),
        });
        return { name: `${participants[i].firstName} ${participants[i].lastName}`, status: 'confirmed' };
      });
    }

    // 4. Pre-check: verify registrations before matching
    await step('pre_check', async () => {
      const regs = await db.getRegistrationsForRound(sessionId, roundId);
      const session = await db.getSessionById(sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);
      return {
        totalRegs: regs.length,
        statuses: regs.map((r: any) => r.status),
        sessionFound: !!session,
        roundFound: !!round,
        roundDate: session?.date,
        roundStartTime: round?.startTime,
        groupSize: round?.groupSize || session?.groupSize || 2,
      };
    });

    // 5. Run matching
    await step('matching', async () => {
      const result = await createMatchesForRound(sessionId, roundId);
      return {
        matchCount: result.matchCount ?? 0,
        unmatchedCount: result.unmatchedCount ?? 0,
        message: result.message || '',
        matchingSuccess: result.success,
        error: result.error,
        details: typeof result.details === 'object' ? JSON.stringify(result.details) : result.details,
        matches: result.matches?.map((m: any) => ({
          matchId: m.matchId,
          participantIds: m.participantIds,
          meetingPoint: m.meetingPoint,
        })),
      };
    });

    // 5. Verify each participant's match
    for (let i = 0; i < participants.length; i++) {
      await step(`verify_${participants[i].firstName}`, async () => {
        const regs = await db.getRegistrationsByParticipant(participantIds[i]);
        const reg = regs.find((r: any) => r.roundId === roundId);
        if (!reg) return { status: 'no_registration' };

        if (reg.matchId) {
          const matchParticipants = await db.getMatchParticipants(reg.matchId);
          const partners = matchParticipants
            .filter((mp: any) => mp.participantId !== participantIds[i])
            .map((mp: any) => `${mp.firstName} ${mp.lastName}`);
          return {
            status: reg.status,
            matchId: reg.matchId,
            partnerNames: partners,
            identificationNumber: reg.identificationNumber,
            meetingPoint: reg.meetingPointId || reg.meetingPoint,
          };
        }
        return { status: reg.status, noMatchReason: reg.noMatchReason };
      });
    }

    // 6. Cleanup — delete test data
    await step('cleanup', async () => {
      // Delete registrations, matches, matching_locks, participants, session
      for (const pid of participantIds) {
        await supabase.from('registrations').delete().eq('participant_id', pid);
        await supabase.from('participants').delete().eq('id', pid);
      }
      await supabase.from('matching_locks').delete().eq('session_id', sessionId);
      await supabase.from('matches').delete().eq('session_id', sessionId);
      await supabase.from('sessions').delete().eq('id', sessionId);
      return { cleaned: true };
    });

    return c.json({ success: true, steps, totalMs: Date.now() - startTime });

  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
      totalMs: Date.now() - startTime,
    }, 500);
  }
});

// Register participant routes
registerParticipantRoutes(app, getCurrentTime);

// Register Stripe payment routes
registerStripeRoutes(app);

// Register CRM routes
registerCrmRoutes(app);

// Register i18n routes
registerI18nRoutes(app);

Deno.serve(app.fetch);