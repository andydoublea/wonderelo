/**
 * Database Access Layer
 * Replaces kv_wrapper.tsx with proper PostgreSQL table queries
 * Uses Supabase PostgREST client via getGlobalSupabaseClient()
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';

function db() {
  return getGlobalSupabaseClient();
}

// ============================================================
// ORGANIZER PROFILES
// ============================================================

export async function getOrganizerById(id: string) {
  const { data, error } = await db()
    .from('organizer_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  // Map DB column names to camelCase used by existing code
  if (!data) return null;
  return {
    userId: data.id,
    email: data.email,
    organizerName: data.organizer_name,
    urlSlug: data.url_slug,
    role: data.role,
    phone: data.phone,
    website: data.website,
    description: data.description,
    profileImageUrl: data.profile_image_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getOrganizerBySlug(slug: string) {
  const { data, error } = await db()
    .from('organizer_profiles')
    .select('*')
    .eq('url_slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.id,
    email: data.email,
    organizerName: data.organizer_name,
    urlSlug: data.url_slug,
    role: data.role,
    phone: data.phone,
    website: data.website,
    description: data.description,
    profileImageUrl: data.profile_image_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getOrganizerUserIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await db()
    .from('organizer_profiles')
    .select('id')
    .eq('url_slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function createOrganizerProfile(profile: {
  userId: string;
  email: string;
  organizerName: string;
  urlSlug: string;
  role?: string;
  phone?: string;
  website?: string;
  description?: string;
  profileImageUrl?: string;
}) {
  const { error } = await db()
    .from('organizer_profiles')
    .insert({
      id: profile.userId,
      email: profile.email,
      organizer_name: profile.organizerName,
      url_slug: profile.urlSlug,
      role: profile.role || 'organizer',
      phone: profile.phone || null,
      website: profile.website || null,
      description: profile.description || null,
      profile_image_url: profile.profileImageUrl || null,
    });
  if (error) throw error;
}

export async function updateOrganizerProfile(
  id: string,
  updates: Partial<{
    organizerName: string;
    urlSlug: string;
    role: string;
    phone: string;
    website: string;
    description: string;
    profileImageUrl: string;
  }>
) {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.organizerName !== undefined) dbUpdates.organizer_name = updates.organizerName;
  if (updates.urlSlug !== undefined) dbUpdates.url_slug = updates.urlSlug;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.website !== undefined) dbUpdates.website = updates.website;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl;

  const { data, error } = await db()
    .from('organizer_profiles')
    .update(dbUpdates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return {
    userId: data.id,
    email: data.email,
    organizerName: data.organizer_name,
    urlSlug: data.url_slug,
    role: data.role,
    phone: data.phone,
    website: data.website,
    description: data.description,
    profileImageUrl: data.profile_image_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
  const { data, error } = await db()
    .from('organizer_profiles')
    .select('id')
    .eq('url_slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return true;
  if (excludeUserId && data.id === excludeUserId) return true;
  return false;
}

// ============================================================
// ADMIN SETTINGS
// ============================================================

export async function getAdminSetting(key: string) {
  const { data, error } = await db()
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value || null;
}

export async function setAdminSetting(key: string, value: any) {
  const { error } = await db()
    .from('admin_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// ============================================================
// SESSIONS
// ============================================================

function mapSessionFromDb(data: any) {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    date: data.date,
    status: data.status,
    limitParticipants: data.limit_participants,
    maxParticipants: data.max_participants,
    groupSize: data.group_size,
    enableTeams: data.enable_teams,
    matchingType: data.matching_type,
    teams: data.teams,
    enableTopics: data.enable_topics,
    allowMultipleTopics: data.allow_multiple_topics,
    topics: data.topics,
    meetingPoints: data.meeting_points,
    iceBreakers: data.ice_breakers,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSessionById(sessionId: string) {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // Also fetch rounds
  const rounds = await getRoundsBySession(sessionId);
  return { ...mapSessionFromDb(data), rounds };
}

export async function getSessionsByUser(userId: string) {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Fetch rounds for each session
  const sessions = [];
  for (const s of data || []) {
    const rounds = await getRoundsBySession(s.id);
    sessions.push({ ...mapSessionFromDb(s), rounds });
  }
  return sessions;
}

export async function getAllSessions() {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const sessions = [];
  for (const s of data || []) {
    const rounds = await getRoundsBySession(s.id);
    sessions.push({ ...mapSessionFromDb(s), rounds });
  }
  return sessions;
}

export async function createSession(session: any) {
  const { rounds, ...sessionData } = session;
  const { error } = await db()
    .from('sessions')
    .insert({
      id: sessionData.id,
      user_id: sessionData.userId,
      name: sessionData.name,
      description: sessionData.description || null,
      date: sessionData.date || null,
      status: sessionData.status || 'draft',
      limit_participants: sessionData.limitParticipants || false,
      max_participants: sessionData.maxParticipants || 20,
      group_size: sessionData.groupSize || 2,
      enable_teams: sessionData.enableTeams || false,
      matching_type: sessionData.matchingType || 'across-teams',
      teams: sessionData.teams || [],
      enable_topics: sessionData.enableTopics || false,
      allow_multiple_topics: sessionData.allowMultipleTopics || false,
      topics: sessionData.topics || [],
      meeting_points: sessionData.meetingPoints || [],
      ice_breakers: sessionData.iceBreakers || [],
      created_at: sessionData.createdAt || new Date().toISOString(),
      updated_at: sessionData.updatedAt || new Date().toISOString(),
    });
  if (error) throw error;

  // Insert rounds if provided
  if (rounds && rounds.length > 0) {
    for (let i = 0; i < rounds.length; i++) {
      await createRound({ ...rounds[i], sessionId: sessionData.id, sortOrder: i });
    }
  }
}

export async function updateSession(sessionId: string, updates: any) {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.limitParticipants !== undefined) dbUpdates.limit_participants = updates.limitParticipants;
  if (updates.maxParticipants !== undefined) dbUpdates.max_participants = updates.maxParticipants;
  if (updates.groupSize !== undefined) dbUpdates.group_size = updates.groupSize;
  if (updates.enableTeams !== undefined) dbUpdates.enable_teams = updates.enableTeams;
  if (updates.matchingType !== undefined) dbUpdates.matching_type = updates.matchingType;
  if (updates.teams !== undefined) dbUpdates.teams = updates.teams;
  if (updates.enableTopics !== undefined) dbUpdates.enable_topics = updates.enableTopics;
  if (updates.allowMultipleTopics !== undefined) dbUpdates.allow_multiple_topics = updates.allowMultipleTopics;
  if (updates.topics !== undefined) dbUpdates.topics = updates.topics;
  if (updates.meetingPoints !== undefined) dbUpdates.meeting_points = updates.meetingPoints;
  if (updates.iceBreakers !== undefined) dbUpdates.ice_breakers = updates.iceBreakers;

  const { error } = await db()
    .from('sessions')
    .update(dbUpdates)
    .eq('id', sessionId);
  if (error) throw error;

  // If rounds are provided, sync them
  if (updates.rounds !== undefined) {
    await syncRounds(sessionId, updates.rounds);
  }
}

export async function deleteSession(sessionId: string) {
  const { error } = await db()
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw error;
}

// ============================================================
// ROUNDS
// ============================================================

function mapRoundFromDb(data: any) {
  return {
    id: data.id,
    sessionId: data.session_id,
    name: data.name,
    date: data.date,
    startTime: data.start_time,
    duration: data.duration,
    groupSize: data.group_size,
    meetingPoints: data.meeting_points,
    status: data.status,
    confirmationWindow: data.confirmation_window,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getRoundsBySession(sessionId: string) {
  const { data, error } = await db()
    .from('rounds')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRoundFromDb);
}

export async function getRoundById(roundId: string) {
  const { data, error } = await db()
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoundFromDb(data) : null;
}

export async function createRound(round: any) {
  const { error } = await db()
    .from('rounds')
    .insert({
      id: round.id,
      session_id: round.sessionId,
      name: round.name,
      date: round.date || null,
      start_time: round.startTime || null,
      duration: round.duration || 10,
      group_size: round.groupSize || 2,
      meeting_points: round.meetingPoints || [],
      status: round.status || 'scheduled',
      confirmation_window: round.confirmationWindow || 5,
      sort_order: round.sortOrder || 0,
    });
  if (error) throw error;
}

export async function updateRound(roundId: string, updates: any) {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
  if (updates.groupSize !== undefined) dbUpdates.group_size = updates.groupSize;
  if (updates.meetingPoints !== undefined) dbUpdates.meeting_points = updates.meetingPoints;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.confirmationWindow !== undefined) dbUpdates.confirmation_window = updates.confirmationWindow;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { error } = await db()
    .from('rounds')
    .update(dbUpdates)
    .eq('id', roundId);
  if (error) throw error;
}

async function syncRounds(sessionId: string, rounds: any[]) {
  // Get existing rounds
  const existing = await getRoundsBySession(sessionId);
  const existingIds = new Set(existing.map(r => r.id));
  const newIds = new Set(rounds.map(r => r.id));

  // Delete removed rounds
  for (const r of existing) {
    if (!newIds.has(r.id)) {
      await db().from('rounds').delete().eq('id', r.id);
    }
  }

  // Upsert rounds
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    if (existingIds.has(round.id)) {
      await updateRound(round.id, { ...round, sortOrder: i });
    } else {
      await createRound({ ...round, sessionId, sortOrder: i });
    }
  }
}

// ============================================================
// PARTICIPANTS
// ============================================================

function mapParticipantFromDb(data: any) {
  return {
    participantId: data.id,
    email: data.email,
    token: data.token,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    phoneCountry: data.phone_country,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getParticipantByToken(token: string) {
  const { data, error } = await db()
    .from('participants')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data ? mapParticipantFromDb(data) : null;
}

export async function getParticipantByEmail(email: string) {
  const { data, error } = await db()
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data ? mapParticipantFromDb(data) : null;
}

export async function getParticipantById(id: string) {
  const { data, error } = await db()
    .from('participants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapParticipantFromDb(data) : null;
}

export async function createParticipant(participant: {
  participantId: string;
  email: string;
  token: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneCountry?: string;
}) {
  const { error } = await db()
    .from('participants')
    .insert({
      id: participant.participantId,
      email: participant.email.toLowerCase().trim(),
      token: participant.token,
      first_name: participant.firstName || null,
      last_name: participant.lastName || null,
      phone: participant.phone || null,
      phone_country: participant.phoneCountry || '+421',
    });
  if (error) throw error;
}

export async function updateParticipant(id: string, updates: Partial<{
  email: string;
  token: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
}>) {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase().trim();
  if (updates.token !== undefined) dbUpdates.token = updates.token;
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.phoneCountry !== undefined) dbUpdates.phone_country = updates.phoneCountry;

  const { error } = await db()
    .from('participants')
    .update(dbUpdates)
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// REGISTRATIONS
// ============================================================

function mapRegistrationFromDb(data: any) {
  return {
    id: data.id,
    participantId: data.participant_id,
    sessionId: data.session_id,
    roundId: data.round_id,
    organizerId: data.organizer_id,
    status: data.status,
    team: data.team,
    topics: data.topics,
    meetingPoint: data.meeting_point,
    matchId: data.match_id,
    matchPartnerNames: data.match_partner_names,
    meetingPointId: data.meeting_point_id,
    registeredAt: data.registered_at,
    confirmedAt: data.confirmed_at,
    matchedAt: data.matched_at,
    checkedInAt: data.checked_in_at,
    metAt: data.met_at,
    lastStatusUpdate: data.last_status_update,
    notificationsEnabled: data.notifications_enabled,
    unconfirmedReason: data.unconfirmed_reason,
    noMatchReason: data.no_match_reason,
  };
}

export async function getRegistrationsByParticipant(participantId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('*')
    .eq('participant_id', participantId)
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRegistrationFromDb);
}

export async function getRegistrationsForRound(sessionId: string, roundId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('*, participants(*)')
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
  return (data || []).map(r => {
    const reg = mapRegistrationFromDb(r);
    if (r.participants) {
      return {
        ...reg,
        email: r.participants.email,
        firstName: r.participants.first_name,
        lastName: r.participants.last_name,
        phone: r.participants.phone,
      };
    }
    return reg;
  });
}

export async function getConfirmedForRound(sessionId: string, roundId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('*, participants(*)')
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .eq('status', 'confirmed');
  if (error) throw error;
  return (data || []).map(r => {
    const reg = mapRegistrationFromDb(r);
    if (r.participants) {
      return {
        ...reg,
        email: r.participants.email,
        firstName: r.participants.first_name,
        lastName: r.participants.last_name,
        phone: r.participants.phone,
      };
    }
    return reg;
  });
}

export async function getRegistration(participantId: string, sessionId: string, roundId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('*')
    .eq('participant_id', participantId)
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRegistrationFromDb(data) : null;
}

export async function createRegistration(reg: any) {
  const { error } = await db()
    .from('registrations')
    .insert({
      participant_id: reg.participantId,
      session_id: reg.sessionId,
      round_id: reg.roundId,
      organizer_id: reg.organizerId,
      status: reg.status || 'registered',
      team: reg.team || null,
      topics: reg.topics || [],
      meeting_point: reg.meetingPoint || null,
      notifications_enabled: reg.notificationsEnabled !== false,
      registered_at: reg.registeredAt || new Date().toISOString(),
    });
  if (error) throw error;
}

export async function updateRegistrationStatus(
  participantId: string,
  sessionId: string,
  roundId: string,
  status: string,
  extra?: Record<string, any>
) {
  const dbUpdates: Record<string, any> = {
    status,
    last_status_update: new Date().toISOString(),
  };
  if (extra) {
    if (extra.matchId !== undefined) dbUpdates.match_id = extra.matchId;
    if (extra.matchPartnerNames !== undefined) dbUpdates.match_partner_names = extra.matchPartnerNames;
    if (extra.meetingPointId !== undefined) dbUpdates.meeting_point_id = extra.meetingPointId;
    if (extra.meetingPoint !== undefined) dbUpdates.meeting_point = extra.meetingPoint;
    if (extra.confirmedAt !== undefined) dbUpdates.confirmed_at = extra.confirmedAt;
    if (extra.matchedAt !== undefined) dbUpdates.matched_at = extra.matchedAt;
    if (extra.checkedInAt !== undefined) dbUpdates.checked_in_at = extra.checkedInAt;
    if (extra.metAt !== undefined) dbUpdates.met_at = extra.metAt;
    if (extra.noMatchReason !== undefined) dbUpdates.no_match_reason = extra.noMatchReason;
    if (extra.unconfirmedReason !== undefined) dbUpdates.unconfirmed_reason = extra.unconfirmedReason;
    if (extra.team !== undefined) dbUpdates.team = extra.team;
    if (extra.topics !== undefined) dbUpdates.topics = extra.topics;
    if (extra.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = extra.notificationsEnabled;
  }

  const { error } = await db()
    .from('registrations')
    .update(dbUpdates)
    .eq('participant_id', participantId)
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
}

export async function deleteRegistration(participantId: string, sessionId: string, roundId: string) {
  const { error } = await db()
    .from('registrations')
    .delete()
    .eq('participant_id', participantId)
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
}

// ============================================================
// MATCHES
// ============================================================

export async function getMatchById(matchId: string) {
  const { data, error } = await db()
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();
  if (error) throw error;
  return data ? {
    matchId: data.id,
    sessionId: data.session_id,
    roundId: data.round_id,
    meetingPoint: data.meeting_point,
    createdAt: data.created_at,
  } : null;
}

export async function getMatchesByRound(sessionId: string, roundId: string) {
  const { data, error } = await db()
    .from('matches')
    .select('*')
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
  return (data || []).map(m => ({
    matchId: m.id,
    sessionId: m.session_id,
    roundId: m.round_id,
    meetingPoint: m.meeting_point,
    createdAt: m.created_at,
  }));
}

export async function getMatchesForSession(sessionId: string) {
  const { data, error } = await db()
    .from('matches')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return (data || []).map(m => ({
    matchId: m.id,
    sessionId: m.session_id,
    roundId: m.round_id,
    meetingPoint: m.meeting_point,
    createdAt: m.created_at,
  }));
}

export async function createMatch(match: {
  matchId: string;
  sessionId: string;
  roundId: string;
  meetingPoint?: string;
}) {
  const { error } = await db()
    .from('matches')
    .insert({
      id: match.matchId,
      session_id: match.sessionId,
      round_id: match.roundId,
      meeting_point: match.meetingPoint || null,
    });
  if (error) throw error;
}

// Get participants in a match (via registrations)
export async function getMatchParticipants(matchId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('*, participants(*)')
    .eq('match_id', matchId);
  if (error) throw error;
  return (data || []).map(r => ({
    participantId: r.participant_id,
    firstName: r.participants?.first_name,
    lastName: r.participants?.last_name,
    email: r.participants?.email,
    team: r.team,
    topics: r.topics,
  }));
}

// ============================================================
// MATCHING LOCKS
// ============================================================

export async function getMatchingLock(sessionId: string, roundId: string) {
  const { data, error } = await db()
    .from('matching_locks')
    .select('*')
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .maybeSingle();
  if (error) throw error;
  return data ? {
    sessionId: data.session_id,
    roundId: data.round_id,
    completedAt: data.completed_at,
    matchCount: data.match_count,
    unmatchedCount: data.unmatched_count,
    soloParticipant: data.solo_participant,
  } : null;
}

export async function setMatchingLock(lock: {
  sessionId: string;
  roundId: string;
  matchCount: number;
  unmatchedCount: number;
  soloParticipant?: boolean;
}) {
  const { error } = await db()
    .from('matching_locks')
    .upsert({
      session_id: lock.sessionId,
      round_id: lock.roundId,
      completed_at: new Date().toISOString(),
      match_count: lock.matchCount,
      unmatched_count: lock.unmatchedCount,
      solo_participant: lock.soloParticipant || false,
    });
  if (error) throw error;
}

// ============================================================
// CONTACT SHARING
// ============================================================

export async function getContactSharing(matchId: string, participantId: string) {
  const { data, error } = await db()
    .from('contact_sharing')
    .select('preferences')
    .eq('match_id', matchId)
    .eq('participant_id', participantId)
    .maybeSingle();
  if (error) throw error;
  return data?.preferences || null;
}

export async function setContactSharing(matchId: string, participantId: string, preferences: any) {
  const { error } = await db()
    .from('contact_sharing')
    .upsert({
      match_id: matchId,
      participant_id: participantId,
      preferences,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// ============================================================
// DASHBOARD (OPTIMIZED JOINED QUERIES)
// ============================================================

export async function getParticipantDashboardData(token: string) {
  // Get participant by token
  const participant = await getParticipantByToken(token);
  if (!participant) return null;

  // Get all registrations with session, round, and organizer data
  const { data, error } = await db()
    .from('registrations')
    .select(`
      *,
      sessions!inner(id, name, date, status, user_id, meeting_points, teams, topics, enable_teams, enable_topics),
      rounds!inner(id, name, date, start_time, duration, group_size, meeting_points, status),
      organizer_profiles!inner(id, organizer_name, url_slug, profile_image_url)
    `)
    .eq('participant_id', participant.participantId)
    .order('registered_at', { ascending: false });

  if (error) throw error;

  const registrations = (data || []).map(r => ({
    ...mapRegistrationFromDb(r),
    sessionName: r.sessions?.name,
    sessionDate: r.sessions?.date,
    sessionStatus: r.sessions?.status,
    roundName: r.rounds?.name,
    roundDate: r.rounds?.date,
    startTime: r.rounds?.start_time,
    duration: r.rounds?.duration,
    roundStatus: r.rounds?.status,
    organizerName: r.organizer_profiles?.organizer_name,
    organizerUrlSlug: r.organizer_profiles?.url_slug,
  }));

  return { participant, registrations };
}
