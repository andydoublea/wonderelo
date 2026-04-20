/**
 * Database Access Layer
 * PostgreSQL database access layer
 * Uses Supabase PostgREST client via getGlobalSupabaseClient()
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';

function db() {
  return getGlobalSupabaseClient();
}

export function getClient() {
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
    eventType: data.event_type,
    onboardingCompletedAt: data.onboarding_completed_at,
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
    eventType: data.event_type,
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
  eventType?: string;
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
      event_type: profile.eventType || null,
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
    onboardingCompletedAt: string;
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
  if (updates.onboardingCompletedAt !== undefined) dbUpdates.onboarding_completed_at = updates.onboardingCompletedAt;

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
    onboardingCompletedAt: data.onboarding_completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
  // Check active organizer profiles
  const { data, error } = await db()
    .from('organizer_profiles')
    .select('id')
    .eq('url_slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (data && !(excludeUserId && data.id === excludeUserId)) return false;

  // Check slug history (old slugs are reserved for redirects)
  const { data: historyData, error: historyError } = await db()
    .from('slug_history')
    .select('id, organizer_id')
    .eq('slug', slug)
    .maybeSingle();
  if (historyError) throw historyError;
  // If slug is in history, it's only available if it belongs to the same user
  if (historyData && !(excludeUserId && historyData.organizer_id === excludeUserId)) return false;

  return true;
}

// Record old slug in history when organizer changes their slug
export async function recordSlugHistory(organizerId: string, oldSlug: string): Promise<void> {
  const { error } = await db()
    .from('slug_history')
    .insert({ organizer_id: organizerId, slug: oldSlug });
  if (error) throw error;
}

// Get slug change count in the last N days (for rate limiting)
export async function getSlugChangeCount(organizerId: string, days: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await db()
    .from('slug_history')
    .select('id')
    .eq('organizer_id', organizerId)
    .gte('created_at', since.toISOString());
  if (error) throw error;
  return data?.length || 0;
}

// Look up current slug from an old slug in history (for redirects)
export async function getRedirectSlug(oldSlug: string): Promise<string | null> {
  const { data, error } = await db()
    .from('slug_history')
    .select('organizer_id')
    .eq('slug', oldSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Get the current slug for this organizer
  const { data: profile, error: profileError } = await db()
    .from('organizer_profiles')
    .select('url_slug')
    .eq('id', data.organizer_id)
    .maybeSingle();
  if (profileError) throw profileError;
  return profile?.url_slug || null;
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
    roundDuration: data.round_duration,
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
  // Batch fetch all rounds for all sessions in one query
  const sessionIds = (data || []).map(s => s.id);
  const roundsBySession = await getRoundsBySessionIds(sessionIds);
  return (data || []).map(s => ({
    ...mapSessionFromDb(s),
    rounds: roundsBySession[s.id] || []
  }));
}

export async function getAllSessions() {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const sessionIds = (data || []).map(s => s.id);
  const roundsBySession = await getRoundsBySessionIds(sessionIds);
  return (data || []).map(s => ({
    ...mapSessionFromDb(s),
    rounds: roundsBySession[s.id] || []
  }));
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
      const roundId = rounds[i].id && rounds[i].id.startsWith('round-') && rounds[i].id.length > 10
        ? rounds[i].id
        : `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i}`;
      await createRound({ ...rounds[i], id: roundId, sessionId: sessionData.id, sortOrder: i });
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

export async function getRoundsBySessionIds(sessionIds: string[]): Promise<Record<string, any[]>> {
  if (sessionIds.length === 0) return {};
  const { data, error } = await db()
    .from('rounds')
    .select('*')
    .in('session_id', sessionIds)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const grouped: Record<string, any[]> = {};
  for (const r of data || []) {
    if (!grouped[r.session_id]) grouped[r.session_id] = [];
    grouped[r.session_id].push(mapRoundFromDb(r));
  }
  return grouped;
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
    linkedinUrl: data.linkedin_url || null,
    instagramUrl: data.instagram_url || null,
    websiteUrl: data.website_url || null,
    otherSocial: data.other_social || null,
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
  linkedinUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  otherSocial: string | null;
}>) {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase().trim();
  if (updates.token !== undefined) dbUpdates.token = updates.token;
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.phoneCountry !== undefined) dbUpdates.phone_country = updates.phoneCountry;
  if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
  if (updates.instagramUrl !== undefined) dbUpdates.instagram_url = updates.instagramUrl;
  if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
  if (updates.otherSocial !== undefined) dbUpdates.other_social = updates.otherSocial;

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
    roundCompletedAt: data.round_completed_at,
    identificationNumber: data.identification_number,
    identificationOptions: data.identification_options,
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

export async function getRegistrationCountsByRounds(roundIds: string[]): Promise<Record<string, number>> {
  if (roundIds.length === 0) return {};
  const { data, error } = await db()
    .from('registrations')
    .select('round_id')
    .in('round_id', roundIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const reg of data || []) {
    counts[reg.round_id] = (counts[reg.round_id] || 0) + 1;
  }
  return counts;
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
        token: r.participants.token,
      };
    }
    return reg;
  });
}

export async function getRegistrationsForSession(sessionId: string) {
  const { data, error } = await db()
    .from('registrations')
    .select('participant_id, round_id, status')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data || [];
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
    if (extra.identificationNumber !== undefined) dbUpdates.identification_number = extra.identificationNumber;
    if (extra.identificationOptions !== undefined) dbUpdates.identification_options = extra.identificationOptions;
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

/**
 * Mark a registration as round-completed (sets round_completed_at timestamp).
 * Does NOT change the status — preserves the last active status.
 */
export async function setRoundCompletedAt(
  participantId: string,
  sessionId: string,
  roundId: string
) {
  const { error } = await db()
    .from('registrations')
    .update({
      round_completed_at: new Date().toISOString(),
      last_status_update: new Date().toISOString(),
    })
    .eq('participant_id', participantId)
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .is('round_completed_at', null); // Only set once
  if (error) throw error;
}

// Generate a random identification number (1-99) and 3 options (1 correct + 2 wrong, shuffled)
export function generateIdentificationData(): { number: number; options: number[] } {
  const correctNumber = Math.floor(Math.random() * 99) + 1;
  return { number: correctNumber, options: generateOptionsForNumber(correctNumber) };
}

export function generateOptionsForNumber(correctNumber: number): number[] {
  const options = new Set<number>([correctNumber]);
  while (options.size < 3) {
    const num = Math.floor(Math.random() * 99) + 1;
    options.add(num);
  }
  // Shuffle
  return [...options].sort(() => Math.random() - 0.5);
}

// Valid participant status transitions (from → allowed to values)
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'registered': ['confirmed', 'unconfirmed', 'cancelled'],
  'confirmed': ['matched', 'no-match', 'cancelled'],
  'matched': ['checked-in', 'missed'],
  'checked-in': ['met'],
  // Terminal statuses — no transitions out
  'met': [],
  'unconfirmed': [],
  'no-match': [],
  'missed': [],
  'cancelled': [],
};

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
    phone: r.participants?.phone,
    phoneCountry: r.participants?.phone_country,
    linkedinUrl: r.participants?.linkedin_url,
    instagramUrl: r.participants?.instagram_url,
    websiteUrl: r.participants?.website_url,
    otherSocial: r.participants?.other_social,
    team: r.team,
    topics: r.topics,
    identificationNumber: r.identification_number,
    identificationOptions: r.identification_options,
  }));
}

/**
 * Get ALL match-participant pairs for an entire session in ONE query.
 * Replaces N+1 pattern of getMatchesForSession() + loop of getMatchParticipants().
 * Returns a Map<matchId, participantId[]> for building meeting history.
 */
export async function getMatchParticipantsBatch(sessionId: string): Promise<Map<string, string[]>> {
  // No status filter — we need ALL participants who were ever matched (including cancelled/completed)
  // to build accurate meeting history and prevent re-matching people who already met.
  const { data, error } = await db()
    .from('registrations')
    .select('match_id, participant_id')
    .eq('session_id', sessionId)
    .not('match_id', 'is', null);
  if (error) throw error;

  const map = new Map<string, string[]>();
  for (const row of (data || [])) {
    const matchId = row.match_id;
    if (!map.has(matchId)) {
      map.set(matchId, []);
    }
    map.get(matchId)!.push(row.participant_id);
  }
  return map;
}

/**
 * Bulk update registration status for multiple participants in a single round.
 * Used by matching to avoid N individual UPDATE queries.
 */
export async function bulkUpdateRegistrationStatusByRound(
  sessionId: string,
  roundId: string,
  fromStatus: string,
  toStatus: string,
  extra?: Record<string, any>
) {
  const dbUpdates: Record<string, any> = {
    status: toStatus,
    last_status_update: new Date().toISOString(),
  };
  if (extra) {
    if (extra.unconfirmedReason !== undefined) dbUpdates.unconfirmed_reason = extra.unconfirmedReason;
    if (extra.noMatchReason !== undefined) dbUpdates.no_match_reason = extra.noMatchReason;
  }

  const { error } = await db()
    .from('registrations')
    .update(dbUpdates)
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .eq('status', fromStatus);
  if (error) throw error;
}

/**
 * Bulk update registration status for specific participant IDs in a round.
 */
export async function bulkUpdateRegistrationStatusByIds(
  participantIds: string[],
  sessionId: string,
  roundId: string,
  status: string,
  extra?: Record<string, any>
) {
  if (participantIds.length === 0) return;

  const dbUpdates: Record<string, any> = {
    status,
    last_status_update: new Date().toISOString(),
  };
  if (extra) {
    if (extra.noMatchReason !== undefined) dbUpdates.no_match_reason = extra.noMatchReason;
    if (extra.matchedAt !== undefined) dbUpdates.matched_at = extra.matchedAt;
  }

  const { error } = await db()
    .from('registrations')
    .update(dbUpdates)
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .in('participant_id', participantIds);
  if (error) throw error;
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

/**
 * Atomically try to acquire matching lock. Returns true if acquired, false if already exists.
 * Uses INSERT with ON CONFLICT to prevent race conditions.
 * match_count = -1 means "in progress" (not yet completed).
 */
export async function tryAcquireMatchingLock(sessionId: string, roundId: string): Promise<boolean> {
  const { error } = await db()
    .from('matching_locks')
    .insert({
      session_id: sessionId,
      round_id: roundId,
      completed_at: new Date().toISOString(),
      match_count: -1,
      unmatched_count: 0,
      solo_participant: false,
    });
  // If insert fails due to unique constraint (23505), lock already exists
  if (error) {
    if (error.code === '23505') return false; // duplicate key = already locked
    throw error;
  }
  return true;
}

export async function updateMatchingLock(sessionId: string, roundId: string, update: {
  matchCount: number;
  unmatchedCount: number;
  soloParticipant?: boolean;
}) {
  const { error } = await db()
    .from('matching_locks')
    .update({
      completed_at: new Date().toISOString(),
      match_count: update.matchCount,
      unmatched_count: update.unmatchedCount,
      solo_participant: update.soloParticipant || false,
    })
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
}

/**
 * Delete matching lock to allow re-running matching (used when previous run found 0 matches)
 */
export async function deleteMatchingLock(sessionId: string, roundId: string) {
  const { error } = await db()
    .from('matching_locks')
    .delete()
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  if (error) throw error;
}

/** @deprecated Use tryAcquireMatchingLock + updateMatchingLock instead */
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

export async function getAllContactSharingForMatch(matchId: string) {
  const { data, error } = await db()
    .from('contact_sharing')
    .select('participant_id, preferences, updated_at, email_sent_at')
    .eq('match_id', matchId);
  if (error) throw error;
  return (data || []).map(row => ({
    participantId: row.participant_id,
    preferences: row.preferences,
    updatedAt: row.updated_at,
    emailSentAt: row.email_sent_at,
  }));
}

export async function markContactSharingEmailSent(matchId: string, participantId: string) {
  const { error } = await db()
    .from('contact_sharing')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .eq('participant_id', participantId);
  if (error) throw error;
}

// ============================================================
// DASHBOARD (OPTIMIZED JOINED QUERIES)
// ============================================================
// All Participants (admin)
// ============================================================

export async function getAllParticipants() {
  const { data, error } = await db()
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapParticipantFromDb);
}

export async function getParticipantWithRegistrations(participantId: string) {
  const participant = await getParticipantById(participantId);
  if (!participant) return null;

  const { data, error } = await db()
    .from('registrations')
    .select(`
      *,
      sessions!inner(id, name, date, status),
      rounds!inner(id, name, date, start_time, duration, status),
      organizer_profiles!inner(id, organizer_name, url_slug)
    `)
    .eq('participant_id', participantId)
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

export async function deleteParticipant(participantId: string) {
  // Delete registrations first (FK constraint)
  const { error: regError } = await db()
    .from('registrations')
    .delete()
    .eq('participant_id', participantId);
  if (regError) throw regError;

  // Delete contact sharing
  const { error: csError } = await db()
    .from('contact_sharing')
    .delete()
    .eq('participant_id', participantId);
  if (csError) throw csError;

  // Delete audit log
  const { error: auditError } = await db()
    .from('participant_audit_log')
    .delete()
    .eq('participant_id', participantId);
  if (auditError) throw auditError;

  // Delete participant
  const { error } = await db()
    .from('participants')
    .delete()
    .eq('id', participantId);
  if (error) throw error;
}

export async function getParticipantAuditLog(participantId: string) {
  const { data, error } = await db()
    .from('participant_audit_log')
    .select('*')
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(entry => ({
    participantId: entry.participant_id,
    action: entry.action,
    details: entry.details,
    timestamp: entry.created_at,
  }));
}

// ============================================================
// Gift Cards
// ============================================================

export async function getAllGiftCards() {
  const cards = await getAdminSetting('gift_cards');
  return cards || [];
}

export async function saveGiftCards(cards: any[]) {
  await setAdminSetting('gift_cards', cards);
}

// ============================================================
// Blog Posts
// ============================================================

export async function getAllBlogPosts() {
  const posts = await getAdminSetting('blog_posts');
  return posts || [];
}

export async function saveBlogPosts(posts: any[]) {
  await setAdminSetting('blog_posts', posts);
}

// ============================================================
// Default Round Rules
// ============================================================

export async function getDefaultRoundRules() {
  const rules = await getAdminSetting('default_round_rules');
  return rules || null;
}

export async function saveDefaultRoundRules(rules: any) {
  await setAdminSetting('default_round_rules', rules);
}

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

// ============================================================
// ROUND REMINDERS (SMS)
// ============================================================

/**
 * Get rounds that need SMS reminders sent.
 * Returns scheduled rounds (with published sessions) where:
 *  - reminder_sms_sent_at IS NULL
 *  - status = 'scheduled'
 *  - date and start_time are set
 * Filtering by time window is done in application code using parseRoundStartTime().
 */
export async function getRoundsNeedingReminder() {
  const { data, error } = await db()
    .from('rounds')
    .select('*, sessions!rounds_session_id_fkey(id, name, date, status, user_id, meeting_points)')
    .is('reminder_sms_sent_at', null)
    .eq('status', 'scheduled')
    .eq('sessions.status', 'published')
    .not('date', 'is', null)
    .not('start_time', 'is', null);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...mapRoundFromDb(r),
    sessionName: r.sessions?.name,
    sessionDate: r.sessions?.date,
    sessionStatus: r.sessions?.status,
    sessionUserId: r.sessions?.user_id,
    sessionMeetingPoints: r.sessions?.meeting_points,
  }));
}

/**
 * Mark a round's SMS reminder as sent (idempotent deduplication).
 */
export async function markRoundReminderSent(roundId: string) {
  const { error } = await db()
    .from('rounds')
    .update({ reminder_sms_sent_at: new Date().toISOString() })
    .eq('id', roundId);
  if (error) throw error;
}

// ============================================================
// LEAD MAGNET SUBMISSIONS
// ============================================================

export async function createLeadMagnetSubmission(data: {
  email: string;
  name: string;
  eventType?: string;
  participantCount?: string;
}) {
  const { data: result, error } = await db()
    .from('lead_magnet_submissions')
    .insert({
      email: data.email,
      name: data.name,
      event_type: data.eventType || null,
      participant_count: data.participantCount || null,
    })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getLeadMagnetSubmissions() {
  const { data, error } = await db()
    .from('lead_magnet_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================================
// SUBSCRIPTIONS (Stripe)
// ============================================================

export async function getSubscription(userId: string) {
  const { data, error } = await db()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.user_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    capacityTier: data.capacity_tier,
    status: data.status,
    plan: data.plan,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const { data, error } = await db()
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.user_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    capacityTier: data.capacity_tier,
    status: data.status,
    plan: data.plan,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

export async function upsertSubscription(userId: string, sub: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  capacityTier: string;
  status: string;
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}) {
  const { error } = await db()
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: sub.stripeCustomerId,
      stripe_subscription_id: sub.stripeSubscriptionId,
      capacity_tier: sub.capacityTier,
      status: sub.status,
      plan: sub.plan,
      current_period_end: sub.currentPeriodEnd || null,
      cancel_at_period_end: sub.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function updateSubscription(userId: string, updates: {
  status?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  capacityTier?: string;
}) {
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
  if (updates.currentPeriodEnd !== undefined) updateData.current_period_end = updates.currentPeriodEnd;
  if (updates.capacityTier !== undefined) updateData.capacity_tier = updates.capacityTier;

  const { error } = await db()
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId);
  if (error) throw error;
}

// ============================================================
// CREDITS (Single Event Payments)
// ============================================================

export async function getCredits(userId: string): Promise<{ balance: number; capacityTier: string }[]> {
  const { data, error } = await db()
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .gt('balance', 0);
  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map((row: any) => ({
    balance: row.balance || 0,
    capacityTier: row.capacity_tier || '50',
  }));
}

export async function addCredits(userId: string, amount: number, metadata: {
  type: string;
  capacityTier?: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  sessionId?: string;
  description?: string;
}) {
  // Update or create credits balance for this specific capacity tier
  const tier = metadata.capacityTier || '50';

  // Get existing balance for this specific tier
  const { data: existingRow } = await db()
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .eq('capacity_tier', tier)
    .maybeSingle();

  const currentBalance = existingRow?.balance || 0;
  const newBalance = currentBalance + amount;

  const { error: upsertError } = await db()
    .from('credits')
    .upsert({
      user_id: userId,
      balance: newBalance,
      capacity_tier: tier,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,capacity_tier' });
  if (upsertError) throw upsertError;

  // Record transaction
  const { error: txError } = await db()
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type: metadata.type,
      capacity_tier: tier,
      stripe_session_id: metadata.stripeSessionId || null,
      stripe_customer_id: metadata.stripeCustomerId || null,
      session_id: metadata.sessionId || null,
      description: metadata.description || null,
      created_at: new Date().toISOString(),
    });
  if (txError) throw txError;
}

export async function deductCredit(userId: string, amount: number, metadata: {
  type: string;
  capacityTier?: string;
  sessionId?: string;
  description?: string;
}) {
  await addCredits(userId, -amount, metadata);
}

export async function getCreditTransactions(userId: string) {
  const { data, error } = await db()
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    amount: t.amount,
    type: t.type,
    capacityTier: t.capacity_tier,
    sessionId: t.session_id,
    description: t.description,
    createdAt: t.created_at,
  }));
}

// ============================================================
// Registration Drafts (progressive save during organizer signup)
// ============================================================

export async function upsertRegistrationDraft(draft: {
  email: string;
  currentStep: number;
  formData: Record<string, any>;
}) {
  const { error } = await db()
    .from('registration_drafts')
    .upsert({
      email: draft.email,
      current_step: draft.currentStep,
      form_data: draft.formData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });
  if (error) throw error;
}

export async function getRegistrationDraft(email: string) {
  const { data, error } = await db()
    .from('registration_drafts')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    email: data.email,
    currentStep: data.current_step,
    formData: data.form_data,
    updatedAt: data.updated_at,
  };
}

export async function deleteRegistrationDraft(email: string) {
  const { error } = await db()
    .from('registration_drafts')
    .delete()
    .eq('email', email);
  if (error) throw error;
}

// ============================================================
// ACCESS PASSWORDS
// ============================================================

export async function validateAccessPassword(password: string) {
  const { data, error } = await db()
    .from('access_passwords')
    .select('id, person_name, is_active')
    .eq('password', password)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function logPasswordAccess(passwordId: string, userAgent: string | null, ipAddress: string | null) {
  const { error: logError } = await db()
    .from('access_password_logs')
    .insert({
      password_id: passwordId,
      user_agent: userAgent,
      ip_address: ipAddress,
    });
  if (logError) throw logError;

  // Atomic increment via PG function
  const { error: rpcError } = await db().rpc('increment_access_count', { pwd_id: passwordId });
  if (rpcError) throw rpcError;
}

export async function getAllAccessPasswords() {
  const { data, error } = await db()
    .from('access_passwords')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    personName: p.person_name,
    password: p.password,
    isActive: p.is_active,
    accessCount: p.access_count,
    lastAccessedAt: p.last_accessed_at,
    createdAt: p.created_at,
  }));
}

export async function createAccessPassword(personName: string, password: string) {
  const { data, error } = await db()
    .from('access_passwords')
    .insert({ person_name: personName, password })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleAccessPassword(id: string) {
  const { data: current, error: getError } = await db()
    .from('access_passwords')
    .select('is_active')
    .eq('id', id)
    .single();
  if (getError) throw getError;

  const { data, error } = await db()
    .from('access_passwords')
    .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccessPassword(id: string) {
  const { error } = await db()
    .from('access_passwords')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getAccessPasswordLogs(passwordId: string) {
  const { data, error } = await db()
    .from('access_password_logs')
    .select('*')
    .eq('password_id', passwordId)
    .order('accessed_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map((l: any) => ({
    id: l.id,
    accessedAt: l.accessed_at,
    userAgent: l.user_agent,
    ipAddress: l.ip_address,
  }));
}
