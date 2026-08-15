import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, CheckCircle, BookUser } from 'lucide-react';
import { ParticipantLayout } from './ParticipantLayout';
import { RoundItem } from './RoundItem';
import { ServiceType, NetworkingSession, Round } from '../App';
import { MeetingPointsDialog } from './MeetingPointsDialog';
import { RoundRulesDialog, RoundRule } from './RoundRulesDialog';
import { ParticipantStatusBadge } from '../utils/statusBadge';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import confetti from 'canvas-confetti';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { debugLog, errorLog } from '../utils/debug';
import { useTime } from '../contexts/TimeContext';
import { PdNav } from './redesign/PdNav';
import { FlipClock } from './redesign/FlipClock';
import { matchNote } from './redesign/EventSessionsView';
import { C } from './redesign/organizerAtoms';
import { StatePlaceholder, Skeleton, SkeletonRow, Spinner, StateButton, RefreshIcon, Italic } from './redesign/StatePlaceholder';

export interface Registration {
  roundId: string;
  sessionId: string;
  sessionName: string;
  roundName: string;
  organizerId?: string;
  organizerName: string;
  eventName?: string;
  organizerUrlSlug: string;
  status: string;
  currentStatus?: string;
  startTime: string;
  duration: number;
  date: string;
  registeredAt: string;
  notificationsEnabled: boolean;
  sessionDate?: string;
  roundStartTime?: string;
  roundDuration?: number;
  roundParticipantId?: string; // Round-specific participant ID
  // Match details (present when participant is matched)
  matchId?: string;
  matchPartnerIds?: string[];
  matchPartnerNames?: string[];
  meetingPointId?: string;
  identificationImageUrl?: string;
}

export interface SessionWithRounds {
  session: NetworkingSession;
  registeredRoundIds: Set<string>;
  registrationStatusMap?: Map<string, string>; // roundId -> status
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// ============================================================

export interface ParticipantDashboardViewProps {
  firstName: string;
  lastName: string;
  upcomingSessions: SessionWithRounds[];
  pastSessions: SessionWithRounds[];
  registrations: Registration[];
  sharedContactsByRound: Map<string, { firstName: string; lastName: string }[]>;
  roundSelections: Map<string, { team?: string; topic?: string; topics?: string[] }>;
  participantId: string;
  globalNextUpcomingRoundId: string | null;
  hasFreshData: boolean;
  lastConfirmTimestamp: number;
  token?: string;
  // Dialog state
  showMeetingPoints: boolean;
  selectedSessionForDialog: NetworkingSession | null;
  showRoundRules: boolean;
  roundRules: RoundRule[];
  showUnregisterDialog: boolean;
  pendingUnregister: { session: NetworkingSession; round: Round; status?: string } | null;
  // Debug
  showDebug: boolean;
  debugLogs: string[];
  // Handlers
  onAddMoreRoundsNavigate: (slug: string) => void;
  onAddressBookNavigate: () => void;
  onDashboardNavigate?: () => void;
  onProfileNavigate?: () => void;
  onShowRoundNavigate?: () => void;
  onSetShowMeetingPoints: (open: boolean) => void;
  onSetShowRoundRules: (open: boolean) => void;
  onSetShowUnregisterDialog: (open: boolean) => void;
  onCancelUnregister: () => void;
  onConfirmUnregister: () => void;
  onRoundToggle: (session: NetworkingSession, round: Round, isCurrentlyRegistered: boolean, status?: string) => void;
  onToggleRoundTopic: (session: NetworkingSession, round: Round, topic: string) => void;
  onConfirmAttendance: (roundId: string) => void;
  onConfirmationWindowExpired: () => void;
  onClearDebugLogs: () => void;
  generateRoundTimeDisplay: (startTime: string, duration: number) => string;
  isRoundCompleted: (session: NetworkingSession, round: Round, roundStatus?: string) => boolean;
}

export function ParticipantDashboardView({
  firstName,
  lastName,
  upcomingSessions,
  pastSessions,
  registrations,
  sharedContactsByRound,
  roundSelections,
  participantId,
  globalNextUpcomingRoundId,
  hasFreshData,
  lastConfirmTimestamp,
  token,
  showMeetingPoints,
  selectedSessionForDialog,
  showRoundRules,
  roundRules,
  showUnregisterDialog,
  pendingUnregister,
  showDebug,
  debugLogs,
  onAddMoreRoundsNavigate,
  onAddressBookNavigate,
  onDashboardNavigate,
  onProfileNavigate,
  onShowRoundNavigate,
  onSetShowMeetingPoints,
  onSetShowRoundRules,
  onSetShowUnregisterDialog,
  onCancelUnregister,
  onConfirmUnregister,
  onRoundToggle,
  onToggleRoundTopic,
  onConfirmAttendance,
  onConfirmationWindowExpired,
  onClearDebugLogs,
  generateRoundTimeDisplay,
  isRoundCompleted: _isRoundCompleted,
}: ParticipantDashboardViewProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t); }, []);

  // Which round rows have their inline topic-prefs picker revealed (Edit → Done toggle).
  // Pure UI state, mirrors the design's `.is-editing` class on `.pd-round-prefs`.
  const [editingPrefs, setEditingPrefs] = useState<Set<string>>(new Set());
  const togglePrefsEditing = (roundId: string, on: boolean) =>
    setEditingPrefs((prev) => {
      const next = new Set(prev);
      if (on) next.add(roundId); else next.delete(roundId);
      return next;
    });
  // Topics the participant already chose for a round (stored on the registration record).
  const storedTopicsForRound = (roundId: string): string[] => {
    const reg = registrations.find((r) => r.roundId === roundId) as any;
    if (Array.isArray(reg?.topics) && reg.topics.length) return reg.topics;
    const sel = roundSelections.get(roundId);
    if (sel?.topics && sel.topics.length) return sel.topics;
    if (sel?.topic) return [sel.topic];
    return [];
  };

  const justRegistered = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('just-registered') === '1';

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMs = (round: any, session: any): number => {
    const [h, m] = String(round?.startTime || '0:0').split(':').map(Number);
    const d = new Date(round?.date || session?.date || Date.now());
    d.setHours(h || 0, m || 0, 0, 0);
    return d.getTime();
  };
  const fmtDayTime = (round: any, session: any): string => {
    const d = new Date(startMs(round, session));
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}, ${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
  };
  const fmtTime = (round: any, session: any): string => {
    const d = new Date(startMs(round, session));
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const fmtDate = (round: any, session: any): string => {
    const d = new Date(startMs(round, session));
    return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
  };

  // ── derive the hero (next upcoming) round + its timing state ──
  let hero: { session: NetworkingSession; round: Round; reg?: Registration; status?: string } | null = null;
  if (globalNextUpcomingRoundId) {
    const [sid, rid] = globalNextUpcomingRoundId.split(':');
    const sw = upcomingSessions.find((s) => s.session.id === sid);
    const round = sw?.session.rounds?.find((r) => r.id === rid);
    if (sw && round) {
      hero = {
        session: sw.session,
        round,
        reg: registrations.find((r) => r.roundId === rid && r.sessionId === sid),
        status: sw.registrationStatusMap?.get(rid),
      };
    }
  }

  // ── past tally (contacts / rounds / events) ──
  let pastContacts = 0;
  let pastRoundCount = 0;
  const pastEventIds = new Set<string>();
  pastSessions.forEach(({ session, registeredRoundIds }) => {
    registeredRoundIds.forEach((rid) => {
      pastRoundCount += 1;
      pastContacts += sharedContactsByRound.get(rid)?.length || 0;
    });
    if (registeredRoundIds.size > 0) pastEventIds.add(session.id);
  });

  // ── hero state + page variant ──
  let heroState: 'pre-confirm' | 'in-window' | 'confirmed' | 'live' | 'past' | 'empty' = 'empty';
  let secsLeft = 0;
  let heroHours = false;
  if (hero) {
    const start = startMs(hero.round, hero.session);
    const confWin = (hero.round.confirmationWindow ?? 5) * 60000;
    const end = start + (hero.round.duration || hero.session.roundDuration || 5) * 60000;
    if (now < start - confWin) { heroState = 'pre-confirm'; secsLeft = Math.floor((start - confWin - now) / 1000); heroHours = true; }
    else if (now < start) { heroState = hero.status === 'confirmed' ? 'confirmed' : 'in-window'; secsLeft = Math.floor((start - now) / 1000); }
    else if (now < end) { heroState = 'live'; secsLeft = Math.floor((end - now) / 1000); }
    else { heroState = 'pre-confirm'; secsLeft = 0; heroHours = true; }
  } else {
    heroState = (registrations.length > 0 || pastRoundCount > 0) ? 'past' : 'empty';
  }
  const variant = ({ 'pre-confirm': 'default', 'in-window': 'window', confirmed: 'confirmed', live: 'live', past: 'past-only', empty: 'empty' } as const)[heroState];

  const heroOrgReg = hero ? registrations.find((r) => r.sessionId === hero!.session.id) : undefined;
  const heroSel = hero ? (roundSelections.get(hero.round.id) || {}) : {};
  const heroMatchNote = hero ? matchNote(hero.session, heroSel.team) : null;

  // ── other upcoming rounds (grouped by session, excluding the hero round) ──
  const otherUpcoming = upcomingSessions
    .map(({ session, registeredRoundIds, registrationStatusMap }) => {
      const rounds = (session.rounds || []).filter((r) =>
        registeredRoundIds.has(r.id)
        && !_isRoundCompleted(session, r, registrationStatusMap?.get(r.id))
        && !(hero && r.id === hero.round.id));
      return { session, rounds, registrationStatusMap, org: registrations.find((r) => r.sessionId === session.id) };
    })
    .filter((e) => e.rounds.length > 0);

  const addSlug = heroOrgReg?.organizerUrlSlug
    || registrations.find((r) => r.organizerUrlSlug)?.organizerUrlSlug
    || '';

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://wonderelo.com';
  // Event name (bold primary) — used in the share copy, mirrors the design.
  const shareEventName = heroOrgReg?.eventName
    || registrations[0]?.eventName
    || hero?.session.name
    || registrations[0]?.sessionName
    || upcomingSessions[0]?.session.name
    || pastSessions[0]?.session.name
    || '';
  const doShare = (kind: string) => {
    const u = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareEventName
      ? `Join me at ${shareEventName} — networking that actually works.`
      : 'Networking that actually works — join me on Wonderelo.');
    if (kind === 'copy') { navigator.clipboard?.writeText(shareUrl).then(() => toast.success('Link copied')); return; }
    const urls: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?url=${u}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    };
    if (urls[kind]) window.open(urls[kind], '_blank', 'noopener');
  };

  const rules = (roundRules && roundRules.length > 0) ? roundRules : [
    { title: 'Initiate deep talks', description: 'Skip the weather talk — meaningful relationships emerge when you share views, values, and stories.' },
    { title: 'End round on time', description: 'It keeps you from getting stuck in one conversation and helps you reach your next round without delay.' },
    { title: 'Do not ask for contacts', description: "After the round you'll be asked if you want to exchange contacts — sharing happens only if both agree." },
  ];

  const HowSteps = [
    { n: '01', img: '/how-it-works-3.png', title: 'Confirm attendance', desc: "You'll get an SMS 5 minutes before each round. Tap to confirm you're joining." },
    { n: '02', img: '/meeting-bar.png', title: 'Go to meeting point', desc: "We'll reveal your spot the moment matching runs — head there once you know where to go." },
    { n: '03', img: '/how-it-works-4.png', title: 'Find your match', desc: "At the spot, your phone shows a unique image — same as your match's, with a different number. Confirm by entering your partner's number." },
    { n: '04', img: '/how-it-works-5.png', title: 'Exchange contacts', desc: 'After the round, you can choose to exchange contacts — sharing only happens if both of you agree.' },
  ];

  const avatarClass = (i: number) => (i % 3 === 0 ? 'pd-av is-orange' : i % 3 === 2 ? 'pd-av is-cream' : 'pd-av');
  const initialsOf = (c: { firstName: string; lastName: string }) => `${(c.firstName || '?')[0] || ''}${(c.lastName || '')[0] || ''}`.toUpperCase();
  // Design copy: "Pairs of 2" for a group size of 2, "Groups of N" otherwise.
  const groupLabel = (n: number) => (n === 2 ? 'Pairs of 2' : `Groups of ${n}`);
  const hasTopics = (s: NetworkingSession) => !!(s.enableTopics || (s.topics && s.topics.length > 0));
  // Message icon used by the "Topic" session-meta indicator.
  const TopicMeta = () => (
    <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Topic</span>
  );

  return (
    <div className={`wonderelo pd-page${justRegistered ? ' is-just-registered' : ''}`} data-variant={variant} data-hero-state={heroState}>
      <div className="pd-shell">
        <PdNav
          firstName={firstName}
          lastName={lastName}
          onBrandClick={() => token && onAddMoreRoundsNavigate('')}
          onDashboard={onDashboardNavigate}
          onProfile={onProfileNavigate}
          onAddressBook={onAddressBookNavigate}
          onHome={() => onAddMoreRoundsNavigate('')}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />

        <section className="pd-celebration">
          <span className="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Registered
          </span>
          <h2 className="title">{firstName}, <em>you're in!</em></h2>
        </section>

        <div className="pd-roundzone">
          <header className="pd-hero">
            {(variant === 'default' || variant === 'window' || variant === 'confirmed') && (
              <div className="pd-hero-headline">
                {variant === 'default' && <div data-headline-state="default"><span className="k">You're on the list</span><h1>{firstName}, soon, the <em>time will come!</em></h1></div>}
                {variant === 'window' && <div data-headline-state="window"><span className="k">Confirm your spot</span><h1>You're in, <em>{firstName}!</em></h1></div>}
                {variant === 'confirmed' && <div data-headline-state="confirmed"><span className="k">You're confirmed</span><h1>All set, {firstName} — your <em>match is brewing</em></h1></div>}
              </div>
            )}

            {hero && (
              <div className="pd-hero-greet">
                <div className="pd-hero-event">
                  <span className="name">{heroOrgReg?.eventName || hero.session.name}</span>
                  <span className="org">{hero.session.name}</span>
                </div>
                {heroState === 'pre-confirm' && <span className="pd-hero-state"><span className="dot" /> Upcoming</span>}
                {heroState === 'in-window' && <span className="pd-hero-state is-window"><span className="dot" /> Confirm now</span>}
                {heroState === 'confirmed' && <span className="pd-hero-state is-confirmed"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 9, height: 9 }}><polyline points="20 6 9 17 4 12"/></svg> Confirmed</span>}
                {heroState === 'live' && <span className="pd-hero-state is-live"><span className="dot" /> Live</span>}
              </div>
            )}

            {heroState === 'pre-confirm' && (
              <div data-hero-state="pre-confirm">
                <div className="pd-hero-eyebrow">Confirm attendance in</div>
                <div className="pd-hero-clock-wrap"><FlipClock seconds={secsLeft} hours={heroHours} /></div>
                <div className="pd-hero-context">Round starts <strong>{fmtDayTime(hero!.round, hero!.session)}</strong></div>
                <div className="pd-hero-sms-wrap"><div className="pd-hero-sms">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>You'll get an SMS reminder</span>
                </div></div>
              </div>
            )}

            {heroState === 'in-window' && (
              <div data-hero-state="in-window">
                <div className="pd-hero-eyebrow">Round starts in</div>
                <div className="pd-hero-clock-wrap"><FlipClock seconds={secsLeft} /></div>
                <div className="pd-hero-context">Lock your seat for <strong>{fmtDayTime(hero!.round, hero!.session)}</strong></div>
                <div style={{ textAlign: 'center' }}>
                  <button className="pd-hero-cta" type="button" onClick={() => onConfirmAttendance(hero!.round.id)}>Yes, I'll join this round</button>
                  <div className="pd-hero-decline"><button type="button" onClick={() => onRoundToggle(hero!.session, hero!.round, true, hero!.status)}>I can't make it</button></div>
                </div>
              </div>
            )}

            {heroState === 'confirmed' && (
              <div data-hero-state="confirmed">
                <div className="pd-hero-eyebrow">Round starts in</div>
                <div className="pd-hero-clock-wrap"><FlipClock seconds={secsLeft} /></div>
                <div className="pd-hero-context">Now wait for your meeting point</div>
              </div>
            )}

            {heroState === 'live' && (
              <div data-hero-state="live">
                <div className="pd-hero-eyebrow">Round ends in</div>
                <div className="pd-hero-clock-wrap"><FlipClock seconds={secsLeft} /></div>
                <div className="pd-hero-context">{hero?.session.meetingPoints?.[0]?.name ? <>You're at <strong>{hero.session.meetingPoints[0].name}</strong></> : 'Your round is live'}</div>
                <div style={{ textAlign: 'center' }}>
                  <button className="pd-hero-cta" type="button" onClick={onShowRoundNavigate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    Show your round
                  </button>
                </div>
              </div>
            )}

            {heroState === 'past' && (
              <div data-hero-state="past">
                <div className="pd-hero-eyebrow">All rounds wrapped</div>
                <div className="pd-hero-clock-wrap" style={{ flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>
                    {pastContacts} <span style={{ fontFamily: 'var(--w-font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 28, color: 'var(--w-orange-bright)', verticalAlign: 'middle' }}>{pastContacts === 1 ? 'contact' : 'contacts'}</span>
                  </div>
                </div>
                <div className="pd-hero-context">Across {pastRoundCount} {pastRoundCount === 1 ? 'round' : 'rounds'} at {pastEventIds.size} {pastEventIds.size === 1 ? 'event' : 'events'}</div>
              </div>
            )}

            {heroState === 'empty' && (
              <div data-hero-state="empty">
                <div className="pd-hero-eyebrow">Wondering what's next?</div>
                <div className="pd-hero-clock-wrap" style={{ flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 40, lineHeight: 1, letterSpacing: '-.03em', color: '#fff', textAlign: 'center', maxWidth: '18ch', textWrap: 'balance' }}>
                    One <em style={{ fontFamily: 'var(--w-font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--w-orange-bright)' }}>event code</em> away from your first round
                  </div>
                </div>
                <div className="pd-hero-context">Got an event code? Drop it below to register</div>
              </div>
            )}

            {hero && (
              <div className="pd-round-cancel pd-hero-cancel">
                <button type="button" onClick={() => onRoundToggle(hero!.session, hero!.round, true, hero!.status)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Cancel this round
                </button>
              </div>
            )}
          </header>

          {hero && (
            <section className="pd-rounddetails">
              <div className="pd-rd-prefs">
                <div className="pd-rd-head"><span className="pd-rd-title">Your <em>round</em></span></div>
                <div className="pd-hero-session-meta">
                  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {hero.round.duration || hero.session.roundDuration || 5} min round</span>
                  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {groupLabel(hero.session.groupSize || 2)}</span>
                </div>
                {(heroSel.topic || (heroSel.topics && heroSel.topics.length) || heroSel.team) && (
                  <div className="pd-rd-fields">
                    {(heroSel.topic || (heroSel.topics && heroSel.topics.length > 0)) && (
                      <div className="pd-expand-section" data-field="topic">
                        <div className="pd-expand-label">I want to <em>talk about</em></div>
                        <div className="pd-chips" role="group">
                          {(hero.session.topics || []).map((t: string) => {
                            const active = heroSel.topic === t || (heroSel.topics || []).includes(t);
                            return <button type="button" key={t} className={`pd-chip is-topic${active ? ' is-active' : ''}`}>{t}</button>;
                          })}
                        </div>
                      </div>
                    )}
                    {heroSel.team && (
                      <div className="pd-expand-section" data-field="group">
                        <div className="pd-expand-label">I belong to <em>the group</em></div>
                        <div className="pd-chips" role="radiogroup">
                          {(hero.session.teams || []).map((t: string) => (
                            <button type="button" key={t} className={`pd-chip is-group${heroSel.team === t ? ' is-active' : ''}`}>{t}</button>
                          ))}
                        </div>
                        {heroMatchNote && (
                          <div className="pd-match-note">
                            <svg className="icon" width="40" height="40" viewBox="0 0 40 40"><circle cx="11" cy="20" r="8.5" fill="none" stroke="#4b1d51" opacity=".5" strokeWidth="1.4" strokeDasharray="2 2.5"/><circle cx="29" cy="20" r="8.5" fill="none" stroke="#dd531c" strokeWidth="1.4" strokeDasharray="2 2.5"/><line x1="14" y1="20" x2="26" y2="20" stroke="#dd531c" strokeWidth="1.4"/><circle cx="11" cy="20" r="3.2" fill="#4b1d51"/><circle cx="29" cy="20" r="3.2" fill="#dd531c"/></svg>
                            <div className="body"><div className="eyebrow">{heroMatchNote.eyebrow}</div><div className="text">{heroMatchNote.text}</div></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(hero.session.meetingPoints && hero.session.meetingPoints.length > 0) && (
                <div className="pd-rd-box">
                  <div className="pd-rd-head"><span className="pd-rd-title">Meeting <em>points</em></span><span className="pd-rd-hint">Be near these before your round</span></div>
                  <div className="pd-mp"><div className="pd-mp-grid">
                    {hero.session.meetingPoints.map((mp: any, i: number) => (
                      <div className="pd-mp-grid-card" key={mp.id || i}>
                        <div className="pd-mp-grid-photo">
                          {mp.imageUrl && (!mp.type || mp.type === 'physical')
                            ? <img src={mp.imageUrl} alt={mp.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span className="lbl">photo</span>}
                        </div>
                        <div className="pd-mp-grid-name">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {mp.name}
                        </div>
                      </div>
                    ))}
                  </div></div>
                </div>
              )}

              <div className="pd-rd-box">
                <div className="pd-rd-head"><span className="pd-rd-title">Round <em>rules</em></span></div>
                <div className="pd-rules-inline">
                  {rules.map((r: any, i: number) => (
                    <div className="pd-rule-inline" key={i}><div><div className="t">{r.title}</div><div className="d">{r.description}</div></div></div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        <section className="pd-howit">
          <div className="pd-howit-head">How rounds work</div>
          <ol className="pd-howit-list">
            {HowSteps.map((s, i) => (
              <li className="pd-howit-step" data-step={String(i + 1)} key={s.n}>
                <span className="pd-howit-num"><img src={s.img} alt="" onError={(e) => { (e.currentTarget.style.display = 'none'); }} /></span>
                <div className="pd-howit-text">
                  <span className="pd-howit-title"><span className="pd-howit-step-num">{s.n}</span>{s.title}</span>
                  <span className="pd-howit-desc">{s.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pd-empty">
          <h3 className="pd-empty-headline" data-only="past-headline">Ready for next round?</h3>
          <form className="pd-empty-join" onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('code') as HTMLInputElement)?.value?.trim(); if (v) onAddMoreRoundsNavigate(v.toLowerCase().replace(/^#/, '')); }}>
            <div className="pd-empty-input-wrap">
              <span className="hash">#</span>
              <input name="code" type="text" placeholder="event code" maxLength={20} />
            </div>
            <button className="pd-empty-join-btn" type="submit">
              Join
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </form>
          <p className="pd-empty-hint">Codes look like <span className="chip">#summit26</span> &middot; ask your organizer</p>
        </section>

        <div data-section="upcoming">
          {otherUpcoming.length > 0 && <div className="pd-eyebrow"><span className="label">Other upcoming rounds</span></div>}
          {otherUpcoming.map(({ session, rounds, registrationStatusMap, org }) => (
            <article className="pd-event" key={session.id}>
              <div className="pd-event-head">
                <div className="pd-event-org" aria-hidden="true" />
                <div className="pd-event-meta">
                  <div className="pd-event-name">{org?.eventName || session.name}</div>
                  <div className="pd-event-org-name">{session.name}</div>
                  <div className="pd-session-meta">
                    <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {session.roundDuration || 5} min rounds</span>
                    <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {groupLabel(session.groupSize || 2)}</span>
                    {hasTopics(session) && <TopicMeta />}
                  </div>
                </div>
              </div>
              <div className="pd-rounds">
                {rounds.map((round) => {
                  const st = registrationStatusMap?.get(round.id);
                  const showPrefs = hasTopics(session);
                  const roundTopics = showPrefs ? storedTopicsForRound(round.id) : [];
                  const isEditing = editingPrefs.has(round.id);
                  return (
                    <div className="pd-round" key={round.id}>
                      <div className="pd-round-line">
                        <span className="pd-round-when"><span className="pd-round-time">{fmtTime(round, session)}</span><span className="pd-round-date">{fmtDate(round, session)}</span></span>
                        <span className="pd-round-spacer" />
                        <button className="pd-round-cancel-inline" type="button" onClick={() => onRoundToggle(session, round, true, st)}>Cancel</button>
                        <span className={`pd-status${st === 'confirmed' ? ' is-confirmed' : ' is-pending'}`}>{st === 'confirmed' ? 'Confirmed' : 'Registered'}</span>
                      </div>
                      {showPrefs && (
                        <div className="pd-round-expand">
                          <div className={`pd-round-prefs${isEditing ? ' is-editing' : ''}`}>
                            <div className="pd-round-prefs-summary">
                              <p className="pd-round-prefs-text">
                                You'll talk about <strong data-topic-summary>{roundTopics.length ? roundTopics.join(', ') : 'nothing in particular'}</strong>.<button className="pd-round-prefs-edit" type="button" onClick={() => togglePrefsEditing(round.id, true)}>Edit</button>
                              </p>
                            </div>
                            <div className="pd-round-prefs-picker">
                              <div className="pd-expand-section" data-field="topic">
                                <div className="pd-expand-label">I want to <em>talk about</em></div>
                                <div className="pd-chips" role="group">
                                  {(session.topics || []).map((t: string) => (
                                    <button type="button" key={t} className={`pd-chip is-topic${roundTopics.includes(t) ? ' is-active' : ''}`} onClick={() => onToggleRoundTopic(session, round, t)}>{t}</button>
                                  ))}
                                </div>
                              </div>
                              <button className="picker-done" type="button" onClick={() => togglePrefsEditing(round.id, false)}>Done</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
          {addSlug && (
            <div style={{ textAlign: 'center' }}>
              <button className="pd-add" type="button" onClick={() => onAddMoreRoundsNavigate(addSlug)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add more rounds
              </button>
            </div>
          )}
        </div>

        <section className="pd-share">
          <div className="pd-share-head"><div className="pd-share-title">Bring a friend?</div><div className="pd-share-sub">Spread the word — more people, more wondering.</div></div>
          <div className="pd-share-buttons">
            <button className="pd-share-btn" type="button" onClick={() => doShare('copy')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span className="lbl">Copy link</span></button>
            <button className="pd-share-btn" type="button" onClick={() => doShare('x')}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span className="lbl">X / Twitter</span></button>
            <button className="pd-share-btn" type="button" onClick={() => doShare('linkedin')}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg><span className="lbl">LinkedIn</span></button>
            <button className="pd-share-btn" type="button" onClick={() => doShare('facebook')}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg><span className="lbl">Facebook</span></button>
          </div>
        </section>

        <div data-section="past">
          {pastRoundCount > 0 && <div className="pd-eyebrow"><span className="label">Completed rounds</span><span className="count">{pastRoundCount} {pastRoundCount === 1 ? 'round' : 'rounds'} · {pastContacts} {pastContacts === 1 ? 'contact' : 'contacts'}</span></div>}
          {[...pastSessions].map(({ session, registeredRoundIds, registrationStatusMap }) => {
            const org = registrations.find((r) => r.sessionId === session.id);
            const rounds = (session.rounds || []).filter((r) => registeredRoundIds.has(r.id));
            if (rounds.length === 0) return null;
            return (
              <article className="pd-event" key={session.id}>
                <div className="pd-event-head">
                  <div className="pd-event-org" aria-hidden="true" />
                  <div className="pd-event-meta">
                    <div className="pd-event-name">{org?.eventName || session.name}</div>
                    <div className="pd-event-org-name">{session.name}</div>
                    <div className="pd-session-meta">
                      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {session.roundDuration || 5} min rounds</span>
                      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {groupLabel(session.groupSize || 2)}</span>
                      {hasTopics(session) && <TopicMeta />}
                    </div>
                  </div>
                </div>
                <div className="pd-rounds">
                  {rounds.map((round) => {
                    const st = registrationStatusMap?.get(round.id);
                    const contacts = sharedContactsByRound.get(round.id) || [];
                    const missed = st === 'no-show' || st === 'missed';
                    return (
                      <div className="pd-round is-past" key={round.id}>
                        <div className="pd-round-line">
                          <span className="pd-round-when"><span className="pd-round-time">{fmtTime(round, session)}</span><span className="pd-round-date">{fmtDate(round, session)}</span></span>
                          <span className="pd-round-spacer" />
                          {missed
                            ? <span className="pd-status is-missed">No show</span>
                            : <span className="pd-status is-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Completed</span>}
                        </div>
                        {!missed && contacts.length > 0 && (
                          <div className="pd-past-strip">
                            <div className="pd-avatars">
                              {contacts.slice(0, 3).map((c, i) => <span className={avatarClass(i)} key={i}>{initialsOf(c)}</span>)}
                              {contacts.length > 3 && <span className="pd-av-rest">+{contacts.length - 3}</span>}
                            </div>
                            <div className="pd-shared">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              <strong>{contacts.length}</strong> {contacts.length === 1 ? 'contact' : 'contacts'} exchanged
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <footer className="pd-footer">
          <a className="pd-brand"><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
          <p className="tagline">Break your bubble, meet new people</p>
          <p className="copy">© 2026 Wonderelo</p>
        </footer>
      </div>

      <AlertDialog open={showUnregisterDialog} onOpenChange={onSetShowUnregisterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this round?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUnregister && (<>You'll give up your spot for <span className="font-medium">{pendingUnregister.round?.name || 'this round'}</span>. You can register again later if spots remain.</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelUnregister}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmUnregister}>Cancel round</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ParticipantDashboard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Initialize from cached data for instant display
  const getCachedDashboard = () => {
    try {
      const cached = localStorage.getItem(`participant_dashboard_${token}`);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Convert arrays back to Sets and Maps
        const sessions = (data.sessions || []).map((s: any) => ({
          session: s.session,
          registeredRoundIds: new Set(s.registeredRoundIds || []),
          registrationStatusMap: new Map(s.registrationStatusMap || [])
        }));
        
        return {
          sessions,
          registrations: data.registrations || [],
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          participantId: data.participantId || '',
          hasCache: true
        };
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return {
      sessions: [],
      registrations: [],
      email: '',
      firstName: '',
      lastName: '',
      participantId: '',
      hasCache: false
    };
  };
  
  const cachedDashboard = getCachedDashboard();
  
  const [sessions, setSessions] = useState<SessionWithRounds[]>(cachedDashboard.sessions);
  const [isLoading, setIsLoading] = useState(!cachedDashboard.hasCache);
  const [isFetching, setIsFetching] = useState(false); // Track if fetch is in progress
  const [hasFreshData, setHasFreshData] = useState(false); // Tracks if we've received fresh API data (prevents confirm button flash)
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(cachedDashboard.email);
  const [firstName, setFirstName] = useState(cachedDashboard.firstName);
  const [lastName, setLastName] = useState(cachedDashboard.lastName);
  const [participantId, setParticipantId] = useState(cachedDashboard.participantId);
  const [registrations, setRegistrations] = useState<Registration[]>(cachedDashboard.registrations);
  
  // Track last optimistic update to prevent refetch from overwriting it
  const lastOptimisticUpdateRef = useRef<number>(0);

  // Track if user came from /match page — read once on mount, used by all redirect-prevention checks
  // This prevents race condition where T-0 useEffect cleans URL before status useEffect reads it
  const cameFromMatchRef = useRef<boolean>(
    new URLSearchParams(window.location.search).get('from') === 'match'
  );

  // Clean up ?from=match from URL on mount (once, without triggering re-render)
  useEffect(() => {
    if (cameFromMatchRef.current) {
      const url = new URL(window.location.href);
      url.searchParams.delete('from');
      window.history.replaceState({}, '', url.toString());
      debugLog('🧹 Cleaned ?from=match from URL');
    }
  }, []);

  // Debug state - capture server responses
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const showDebug = window.location.search.includes('debug=true');
  
  // Dialog states
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [showRoundRules, setShowRoundRules] = useState(false);
  const [selectedSessionForDialog, setSelectedSessionForDialog] = useState<NetworkingSession | null>(null);
  const [roundRules, setRoundRules] = useState<RoundRule[]>([]);
  
  // Unregister confirmation dialog
  const [showUnregisterDialog, setShowUnregisterDialog] = useState(false);
  const [pendingUnregister, setPendingUnregister] = useState<{ session: NetworkingSession; round: Round; status?: string } | null>(null);
  
  // Team and topic selections
  const [roundSelections, setRoundSelections] = useState<Map<string, { team?: string; topic?: string; topics?: string[] }>>(new Map());

  // Shared contacts per round (for completed rounds display)
  const [sharedContactsByRound, setSharedContactsByRound] = useState<Map<string, { firstName: string; lastName: string }[]>>(new Map());

  // Get current time from TimeContext
  const { getCurrentTime, simulatedTime } = useTime();
  
  // Helper to add simulated time parameter to URL (only when simulated time is active)
  const addSimulatedTimeParam = (url: string): string => {
    // Only add simulatedTime parameter if TimeControl is active
    if (simulatedTime !== null) {
      const currentTime = getCurrentTime();
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}simulatedTime=${currentTime.getTime()}`;
      // debugLog(`🕐 addSimulatedTimeParam: simulatedTime=${simulatedTime}, currentTime=${currentTime.toISOString()}, adding param: ${currentTime.getTime()}`);
      return finalUrl;
    }
    // Return URL unchanged if using real time
    // debugLog(`🕐 addSimulatedTimeParam: Using real time (simulatedTime=${simulatedTime})`);
    return url;
  };
  
  // Fire confetti when arriving from fresh registration
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      // Remove the param from URL to prevent re-firing on refresh
      searchParams.delete('registered');
      setSearchParams(searchParams, { replace: true });
      // Fire confetti
      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      toast.success("You're in! 🎉");
    }
  }, []);

  // State for globally next upcoming round (updates every second)
  const [globalNextUpcomingRoundId, setGlobalNextUpcomingRoundId] = useState<string | null>(null);
  
  // Helper function to check if a round is completed
  const isRoundCompleted = (session: NetworkingSession, round: Round, roundStatus?: string): boolean => {
    // If round has explicit status, use it
    if (round.status === 'completed') {
      return true;
    }
    
    // If participant has 'no-match' status, ALWAYS treat as completed
    // (matching already happened, participant was alone - round didn't occur)
    if (roundStatus === 'no-match') {
      return true;
    }
    
    // Check if round time has passed first
    if (!session.date || !round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') {
      return false;
    }
    
    try {
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
      roundStart.setHours(hours, minutes, 0, 0);
      
      // Add round duration to get end time
      const roundEnd = new Date(roundStart.getTime() + round.duration * 60000);
      const now = getCurrentTime();
      const roundHasPassed = roundEnd <= now;
      
      // If participant status is 'unconfirmed':
      // - If round has passed → treat as completed (no-show)
      // - If round is upcoming → treat as NOT completed (still can confirm)
      if (roundStatus === 'unconfirmed') {
        return roundHasPassed;
      }
      
      return roundHasPassed;
    } catch (error) {
      return false;
    }
  };
  
  // Update globalNextUpcomingRoundId every second
  useEffect(() => {
    const updateGlobalNextRound = (silent = true) => {
      const now = getCurrentTime();
      let earliestTime = Infinity;
      let nextRoundKey: string | null = null; // Format: "sessionId:roundId"
      
      for (const { session, registeredRoundIds, registrationStatusMap } of sessions) {
        if (!session.rounds || session.rounds.length === 0) continue;
        if (!session.date) continue;
        
        // Only process rounds that have at least one upcoming registered round
        const hasUpcomingRound = session.rounds.some(round => {
          const roundStatus = registrationStatusMap?.get(round.id);
          return registeredRoundIds.has(round.id) && !isRoundCompleted(session, round, roundStatus);
        });
        
        if (!hasUpcomingRound) continue;
        
        const registeredRounds = session.rounds.filter(round => {
          const isCompleted = isRoundCompleted(session, round);
          const isRegistered = registeredRoundIds.has(round.id);
          return !isCompleted && isRegistered;
        });
        
        for (const round of registeredRounds) {
          if (round.startTime && round.startTime !== 'To be set' && round.startTime !== 'TBD') {
            const [hours, minutes] = round.startTime.split(':').map(Number);
            const roundStart = new Date(round.date || session.date);
            roundStart.setHours(hours, minutes, 0, 0);
            
            // We want the earliest FUTURE round (after current time)
            if (roundStart.getTime() > now.getTime() && roundStart.getTime() < earliestTime) {
              earliestTime = roundStart.getTime();
              nextRoundKey = `${session.id}:${round.id}`;
            }
          }
        }
      }
      
      setGlobalNextUpcomingRoundId(nextRoundKey);
    };
    
    // Run once immediately (silently to avoid log spam)
    updateGlobalNextRound(true);
    
    // Only set up interval if simulated time is active (for testing)
    // In production with real time, the next round doesn't change every second
    if (!simulatedTime) {
      // No interval needed - next round is static until page refresh or action
      return;
    }
    
    // When testing with TimeControl, update every second (silently to avoid log spam)
    const interval = setInterval(() => updateGlobalNextRound(true), 1000);
    
    return () => clearInterval(interval);
  }, [sessions, getCurrentTime, simulatedTime]);

  // Proactive T-0 navigation: navigate to /match immediately when the next round starts
  useEffect(() => {
    // Skip auto-redirects if user just came back from /match page
    if (cameFromMatchRef.current) {
      debugLog('🚫 [T-0] Skipping redirect — user came back from /match');
      return;
    }

    if (!token || !globalNextUpcomingRoundId) return;

    // Find the round details
    const [sessionId, roundId] = globalNextUpcomingRoundId.split(':');
    const sessionData = sessions.find(s => s.session.id === sessionId);
    if (!sessionData) return;

    const round = sessionData.session.rounds?.find(r => r.id === roundId);
    if (!round || !round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') return;

    // Only trigger for confirmed registrations (participant said they'll attend)
    const regStatus = sessionData.registrationStatusMap?.get(roundId);
    if (regStatus !== 'confirmed') return;

    // Calculate time until T-0
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const roundStart = new Date(round.date || sessionData.session.date);
    roundStart.setHours(hours, minutes, 0, 0);

    const now = getCurrentTime();
    const msUntilStart = roundStart.getTime() - now.getTime();

    // If round already started (T-0 passed), navigate immediately
    if (msUntilStart <= 0) {
      // Check we haven't already redirected for this round
      const redirectKey = `t0_redirect_${token}_${roundId}`;
      if (localStorage.getItem(redirectKey) !== 'true') {
        localStorage.setItem(redirectKey, 'true');
        debugLog(`🚀 [T-0] Round ${roundId} has started! Navigating to /match immediately`);
        navigate(`/p/${token}/match-point`);
      }
      return;
    }

    // If round starts within 60 seconds, set a precise timer
    if (msUntilStart <= 60000) {
      const redirectKey = `t0_redirect_${token}_${roundId}`;
      if (localStorage.getItem(redirectKey) === 'true') return; // Already redirected

      debugLog(`⏳ [T-0] Round ${roundId} starts in ${Math.round(msUntilStart / 1000)}s, setting precise timer`);

      const timer = setTimeout(() => {
        if (localStorage.getItem(redirectKey) !== 'true') {
          localStorage.setItem(redirectKey, 'true');
          debugLog(`🚀 [T-0] Timer fired! Navigating to /match for round ${roundId}`);
          navigate(`/p/${token}/match-point`);
        }
      }, msUntilStart);

      return () => clearTimeout(timer);
    }

    // For rounds > 60s away, we'll check again on next render (globalNextUpcomingRoundId updates)
  }, [globalNextUpcomingRoundId, sessions, token, navigate, getCurrentTime]);

  // Version identifier for debugging
  useEffect(() => {
    // debugLog('🎯 ParticipantDashboard v6.3.0 (round-based sections) loaded - Build time: 2024-11-03 18:15');
  }, []);

  // Auto-redirect to match page when 'no-match' or 'matched' status is first detected
  useEffect(() => {
    if (!token || !registrations || registrations.length === 0) return;

    // Skip auto-redirects if user just came back from /match page
    if (cameFromMatchRef.current) {
      debugLog('🚫 [AUTO-REDIRECT] Skipping — user came back from /match');
      return;
    }

    // Check if any registration has 'no-match' status that hasn't been shown yet
    const noMatchRegistration = registrations.find((reg: any) => {
      if (reg.status !== 'no-match') return false;
      
      // Check if we already showed the /match page for this round
      const redirectKey = `no_match_shown_${token}_${reg.roundId}`;
      const alreadyShown = localStorage.getItem(redirectKey);
      
      if (alreadyShown === 'true') {
        debugLog(`🔍 [NO-MATCH] Round ${reg.roundId}: already shown, skipping redirect`);
        return false; // Already shown, don't redirect
      }
      
      debugLog(`🔍 [NO-MATCH] Round ${reg.roundId}: first time detection, will redirect`);
      return true; // First time - will redirect
    });
    
    if (noMatchRegistration) {
      // Save flag that we showed the /match page for this round
      const redirectKey = `no_match_shown_${token}_${noMatchRegistration.roundId}`;
      localStorage.setItem(redirectKey, 'true');
      
      debugLog('🔀 Redirecting to /match page (first time no-match detected)');
      navigate(`/p/${token}/match-point`);
      return;
    }
    
    // Check if any registration has 'matched' status that hasn't been shown yet
    const matchedRegistration = registrations.find((reg: any) => {
      if (reg.status !== 'matched') return false;
      
      // Check if we already showed the /match page for this round
      const redirectKey = `matched_shown_${token}_${reg.roundId}`;
      const alreadyShown = localStorage.getItem(redirectKey);
      
      if (alreadyShown === 'true') {
        debugLog(`🔍 [MATCHED] Round ${reg.roundId}: already shown, skipping redirect`);
        return false; // Already shown, don't redirect
      }
      
      debugLog(`🔍 [MATCHED] Round ${reg.roundId}: first time detection, will redirect`);
      return true; // First time - will redirect
    });
    
    if (matchedRegistration) {
      // Save flag that we showed the /match page for this round
      const redirectKey = `matched_shown_${token}_${matchedRegistration.roundId}`;
      localStorage.setItem(redirectKey, 'true');
      
      debugLog('🔀 Redirecting to /match page (first time matched detected)');
      navigate(`/p/${token}/match-point`);
    }
  }, [registrations, token, navigate]);

  useEffect(() => {
    if (token) {
      // Save token to localStorage so it persists across navigation
      localStorage.setItem('participant_token', token);
      debugLog('✅ Participant token saved to localStorage:', token);
      
      // Check if there's a continue parameter for registration flow
      const searchParams = new URLSearchParams(window.location.search);
      const continueUrl = searchParams.get('continue');
      
      if (continueUrl) {
        debugLog('🔗 Magic link has continue parameter, redirecting to:', continueUrl);
        // Redirect to the continue URL after a brief delay to ensure token is saved
        setTimeout(() => {
          navigate(continueUrl);
        }, 500);
        return;
      }
      
      fetchData();
    }
  }, [token]);

  // Refetch data when simulated time changes
  useEffect(() => {
    if (token && simulatedTime) {
      debugLog('⏰ Simulated time changed, refetching data...');
      fetchData();
    }
  }, [simulatedTime]);

  // Periodic refetch to catch status transitions
  useEffect(() => {
    if (!token) return;

    // Simple 5-second interval to catch all status transitions quickly
    const interval = setInterval(() => {
      if (document.hidden) {
        debugLog('⏰ Tab is hidden, skipping refetch');
        return;
      }
      
      // Skip refetch if there was a very recent optimistic update (within last 5 seconds)
      const timeSinceLastUpdate = Date.now() - lastOptimisticUpdateRef.current;
      if (timeSinceLastUpdate < 5000) {
        debugLog(`⏰ Skipping refetch - recent optimistic update (${Math.round(timeSinceLastUpdate/1000)}s ago, wait ${Math.round((5000-timeSinceLastUpdate)/1000)}s more)`);
        return;
      }
      
      debugLog('⏰ Periodic refetch (5s)...');
      fetchData();
    }, 5000); // 5 seconds - fast enough to catch matching

    return () => {
      clearInterval(interval);
    };
  }, [token]);
  
  // Refetch when tab becomes visible again (in case status changed while hidden)
  useEffect(() => {
    if (!token) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debugLog('👁️ Tab became visible, refetching data...');
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);

  const fetchData = async () => {
    // Debounce: Skip if already fetching
    if (isFetching) {
      return;
    }
    
    setIsFetching(true);
    
    // Track if this is a background refetch (we already have data)
    const isBackgroundRefetch = sessions.length > 0 || registrations.length > 0;
    
    try {
      // OPTIMIZATION: Use new dashboard endpoint - gets everything in ONE request
      const baseUrl = addSimulatedTimeParam(`${apiBaseUrl}/p/${token}/dashboard`);
      
      // Add cache busting parameter to ensure fresh data
      const separator = baseUrl.includes('?') ? '&' : '?';
      const url = `${baseUrl}${separator}_cb=${Date.now()}`;
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(
        url,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage = 'Failed to load participant data';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // Not JSON, use status code
          if (response.status === 404) {
            errorMessage = 'Invalid or expired participant link. Please use the latest link from your email.';
          } else {
            errorMessage = `Error ${response.status}: ${errorText}`;
          }
        }

        // If token is invalid (404), clear it from localStorage to prevent redirect loops
        if (response.status === 404) {
          localStorage.removeItem('participant_token');
          debugLog('🗑️ Cleared invalid participant_token from localStorage');
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Check if we need to redirect to correct token
      if (data.redirect && data.correctToken) {
        toast.info('Redirecting to updated link...');
        navigate(`/p/${data.correctToken}`, { replace: true });
        return;
      }
      
      // Set participant info
      setEmail(data.email);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setParticipantId(data.participantId || '');
      
      // Cache profile data in localStorage for instant display in other pages
      localStorage.setItem(`participant_profile_${token}`, JSON.stringify({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email,
        phone: data.phone || ''
      }));
      
      // Set registrations
      const regs = data.registrations || [];
      
      debugLog('🔍 [DASHBOARD] Backend returned registrations:', regs.map((r: any) => ({
        roundId: r.roundId,
        roundName: r.roundName,
        sessionId: r.sessionId,
        sessionName: r.sessionName,
        status: r.status
      })));
      
      debugLog('🔍 [DASHBOARD] FULL DATA:', JSON.stringify(data, null, 2));
      
      setRegistrations(regs);
      setHasFreshData(true);

      // Cache each registration with its session data for round detail pages
      regs.forEach((reg: Registration) => {
        const session = data.sessions?.find((s: any) => s.id === reg.sessionId);
        if (session) {
          const round = session.rounds?.find((r: any) => r.id === reg.roundId);
          if (round) {
            localStorage.setItem(`participant_round_${token}_${reg.roundId}`, JSON.stringify({
              registration: reg,
              session: {
                id: session.id,
                name: session.name,
                date: session.date,
                location: session.location,
                meetingPoints: session.meetingPoints
              },
              round: {
                id: round.id,
                name: round.name,
                startTime: round.startTime,
                duration: round.duration,
                groupSize: session.groupSize,
                iceBreakers: session.iceBreakers,
                date: round.date
              },
              organizer: {
                name: data.organizerName || 'Organizer',
                urlSlug: data.organizerSlug || ''
              }
            }));
          }
        }
      });
      
      // Process sessions
      const allSessions: SessionWithRounds[] = [];
      
      if (data.sessions && data.sessions.length > 0) {
        for (const session of data.sessions) {
          const registeredRoundIds = new Set(
            regs
              .filter((r: Registration) => r.sessionId === session.id)
              .map((r: Registration) => r.roundId)
          );
          
          // Build status map for each round
          const registrationStatusMap = new Map<string, string>();
          regs
            .filter((r: Registration) => r.sessionId === session.id)
            .forEach((r: Registration) => {
              registrationStatusMap.set(r.roundId, r.status);
            });
          
          allSessions.push({
            session,
            registeredRoundIds,
            registrationStatusMap
          });
        }
      }
      
      setSessions(allSessions);
      
      // Cache the entire dashboard data for instant display on next load
      // Convert Sets and Maps to arrays for JSON serialization
      const serializableSessions = allSessions.map(s => ({
        session: s.session,
        registeredRoundIds: Array.from(s.registeredRoundIds),
        registrationStatusMap: s.registrationStatusMap ? Array.from(s.registrationStatusMap.entries()) : []
      }));
      
      localStorage.setItem(`participant_dashboard_${token}`, JSON.stringify({
        sessions: serializableSessions,
        registrations: regs,
        email: data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        participantId: data.participantId || ''
      }));
      
      // Clear error state on successful fetch
      if (error) {
        setError(null);
      }
      
    } catch (error) {
      debugLog('[ParticipantDashboard] Error fetching data:', error);
      
      // If this is a background refetch (we already have data), don't show error screen
      // Just log and keep the existing data
      if (isBackgroundRefetch) {
        debugLog('⚠️ Background refetch failed, keeping existing data');
      } else {
        // This is the initial load - show error screen
        toast.error('Failed to load data');
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  // Fetch shared contacts for completed rounds display
  useEffect(() => {
    if (!token || sessions.length === 0) return;

    const fetchSharedContacts = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/participant/${token}/shared-contacts`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        if (!response.ok) return;
        const data = await response.json();
        const byRound = new Map<string, { firstName: string; lastName: string }[]>();
        for (const sc of data.sharedContacts || []) {
          if (!sc.roundId) continue;
          const existing = byRound.get(sc.roundId) || [];
          existing.push({ firstName: sc.partner.firstName, lastName: sc.partner.lastName });
          byRound.set(sc.roundId, existing);
        }
        setSharedContactsByRound(byRound);
      } catch (err) {
        debugLog('[Dashboard] Failed to fetch shared contacts:', err);
      }
    };

    fetchSharedContacts();
  }, [token, sessions.length]);

  const confirmUnregister = async () => {
    if (!pendingUnregister) return;
    
    const { round, session } = pendingUnregister;
    
    // Optimistic update - remove round from UI immediately
    setRegistrations(prev => prev.filter(reg => reg.roundId !== round.id));
    
    // Also update sessions to remove the round from registeredRoundIds
    setSessions(prev => prev.map(sessionWithRounds => {
      const updatedRegisteredRoundIds = new Set(sessionWithRounds.registeredRoundIds);
      updatedRegisteredRoundIds.delete(round.id);
      
      return {
        ...sessionWithRounds,
        registeredRoundIds: updatedRegisteredRoundIds
      };
    }));
    
    setShowUnregisterDialog(false);
    setPendingUnregister(null);
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/p/${token}/unregister/${round.id}?sessionId=${session.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        toast.success(`Unregistered from ${round.name}`);
        // No need to fetchData() since we already updated the UI optimistically
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unregister');
        // Revert optimistic update on error
        fetchData();
      }
    } catch (error) {
      debugLog('Error unregistering:', error);
      toast.error('Failed to unregister');
      // Revert optimistic update on error
      fetchData();
    }
  };

  const handleConfirmAttendance = async (roundId: string) => {
    try {
      debugLog('=== CONFIRM START ===');
      debugLog('Round ID:', roundId);
      debugLog('1. Current status:', registrations.find(r => r.roundId === roundId)?.status);
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      // Find the registration to get sessionId
      const registration = registrations.find(r => r.roundId === roundId);
      if (!registration) {
        toast.error('Registration not found');
        return;
      }
      
      const sessionId = registration.sessionId;
      debugLog('Session ID:', sessionId);
      
      // Check if already confirmed in localStorage (prevents double-confirm)
      const confirmKey = `confirmed_${token}_${roundId}`;
      const alreadyConfirmed = localStorage.getItem(confirmKey);
      
      if (alreadyConfirmed === 'true') {
        debugLog('⚠️ Already confirmed in localStorage, skipping');
        toast.info('You already confirmed attendance for this round');
        return;
      }
      
      // Mark as confirmed in localStorage BEFORE making the request
      localStorage.setItem(confirmKey, 'true');
      
      // Mark timestamp of optimistic update
      lastOptimisticUpdateRef.current = Date.now();
      
      // OPTIMISTIC UPDATE: Immediately update registrations to show 'confirmed' status
      setRegistrations(prev => {
        const updated = prev.map(reg => 
          reg.roundId === roundId 
            ? { ...reg, status: 'confirmed' }
            : reg
        );
        debugLog('2. After optimistic update:', updated.find(r => r.roundId === roundId)?.status);
        return updated;
      });
      
      // Also update sessions registration status map for immediate UI feedback
      setSessions(prev => {
        const updated = prev.map(sessionWithRounds => {
          const hasRound = Array.from(sessionWithRounds.registeredRoundIds || []).includes(roundId);
          
          if (hasRound) {
            const newStatusMap = new Map(sessionWithRounds.registrationStatusMap || new Map());
            newStatusMap.set(roundId, 'confirmed');
            return {
              ...sessionWithRounds,
              registrationStatusMap: newStatusMap
            };
          }
          return sessionWithRounds;
        });
        return updated;
      });
      
      debugLog('🚀 SENDING CONFIRM REQUEST');
      
      const response = await fetch(
        `${apiBaseUrl}/p/${token}/confirm/${roundId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        }
      );
      
      debugLog('📡 RECEIVED RESPONSE:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Server returned ' + response.status };
        }
        errorLog('❌ CONFIRM FAILED:', errorData);
        
        // Remove localStorage flag on error so user can try again
        localStorage.removeItem(confirmKey);
        
        // Revert optimistic update on error
        await fetchData();
        
        // Show detailed error message
        const errorMessage = errorData.message || errorData.error || response.statusText;
        const statusInfo = errorData.currentStatus ? ` (Current status: ${errorData.currentStatus})` : '';
        toast.error(`Failed to confirm: ${errorMessage}${statusInfo}`);
        return;
      }
      
      const data = await response.json();
      debugLog('✅ CONFIRM SUCCESS - Backend response:', data);
      debugLog('3. Backend says status:', data.status);
      
      // Update status based on what backend returned
      const backendStatus = data.status;
      
      // If backend returned matched/completed (race condition - matching already happened),
      // update the registration status immediately
      setRegistrations(prev => {
        const updated = prev.map(reg => 
          reg.roundId === roundId 
            ? { ...reg, status: backendStatus }
            : reg
        );
        debugLog('💾 Updated status from backend response:', backendStatus);
        return updated;
      });
      
      toast.success('Attendance confirmed! You will be matched at the start time.');

      // Reset optimistic guard so the next fetch isn't skipped
      lastOptimisticUpdateRef.current = 0;

      // Also refetch to get any other changes (like matchId, etc.)
      debugLog('🔄 Fetching full dashboard data...');
      await fetchData();
      
      debugLog('=== CONFIRM END ===');
      
    } catch (error) {
      errorLog('❌ EXCEPTION:', error);
      
      // Remove localStorage flag so user can try again
      const confirmKey = `confirmed_${token}_${roundId}`;
      localStorage.removeItem(confirmKey);
      
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert optimistic update on error
      await fetchData();
    }
  };

  // Stable callback for confirmation window expiry — avoids RoundItem useEffect re-runs
  const handleConfirmationWindowExpired = useCallback(() => {
    const timeSinceLastUpdate = Date.now() - lastOptimisticUpdateRef.current;
    if (timeSinceLastUpdate < 15000) {
      debugLog(`⏰ Confirmation window expired BUT skipping refetch - recent optimistic update (${timeSinceLastUpdate}ms ago)`);
      return;
    }
    debugLog('⏰ Confirmation window expired, refetching data...');
    fetchData();
  }, []);

  const handleRoundToggle = async (session: NetworkingSession, round: Round, isCurrentlyRegistered: boolean, currentStatus?: string) => {
    try {
      if (isCurrentlyRegistered) {
        // Show confirmation dialog before unregistering
        setPendingUnregister({ session, round, status: currentStatus });
        setShowUnregisterDialog(true);
        return;
      } else {
        // Register
        const roundSelectionData = roundSelections.get(round.id) || {};
        
        debugLog('');
        debugLog('🎯 ========================================');
        debugLog('🎯 FRONTEND: Attempting to register for round');
        debugLog('🎯 ========================================');
        debugLog('  Session ID:', session.id);
        debugLog('  Session Name:', session.name);
        debugLog('  Round ID:', round.id);
        debugLog('  Round Name:', round.name);
        debugLog('  Token:', token);
        debugLog('  Team:', roundSelectionData.team);
        debugLog('  Topic:', roundSelectionData.topic);
        debugLog('  Topics:', roundSelectionData.topics);
        debugLog('========================================');
        debugLog('');
        
        // Check required fields
        if (session.enableTeams && session.teams && session.teams.length > 0 && !roundSelectionData.team) {
          toast.error('Please select a group first');
          return;
        }
        
        if (session.enableTopics && session.topics && session.topics.length > 0) {
          if (session.allowMultipleTopics) {
            if (!roundSelectionData.topics || roundSelectionData.topics.length === 0) {
              toast.error('Please select at least one topic first');
              return;
            }
          } else {
            if (!roundSelectionData.topic) {
              toast.error('Please select a topic first');
              return;
            }
          }
        }
        
        debugLog('✅ All validations passed, sending request...');
        
        const requestBody = {
          sessionId: session.id,
          roundId: round.id,
          team: roundSelectionData.team,
          topic: roundSelectionData.topic,
          topics: roundSelectionData.topics,
        };
        
        debugLog('📤 Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(
          `${apiBaseUrl}/p/${token}/register`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );
        
        debugLog('📥 Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          debugLog('✅ Registration successful:', result);
          toast.success(`Registered for ${round.name}`);
          fetchData(); // Refresh data
        } else {
          const error = await response.json();
          errorLog('❌ Registration failed:', error);
          debugLog('  Status:', response.status);
          debugLog('  Error:', error.error);
          debugLog('  Details:', error.details);
          toast.error(error.error || 'Failed to register');
        }
      }
    } catch (error) {
      debugLog('Error toggling registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const handleTeamSelect = (roundId: string, team: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, team });
      return newMap;
    });
  };

  const handleTopicSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, topic });
      return newMap;
    });
  };

  const handleMultipleTopicsSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      const currentTopics = current.topics || [];
      
      let updatedTopics;
      if (currentTopics.includes(topic)) {
        updatedTopics = currentTopics.filter(t => t !== topic);
      } else {
        updatedTopics = [...currentTopics, topic];
      }
      
      newMap.set(roundId, { ...current, topics: updatedTopics });
      return newMap;
    });
  };

  // Toggle a chosen topic on an already-registered round (dashboard inline editor).
  // Respects the session's single vs multiple topic rule, optimistically updates
  // local state, then persists to the participant topics endpoint.
  const handleToggleRoundTopic = async (session: NetworkingSession, round: Round, topic: string) => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    // Current chosen topics for this round (registration is source of truth,
    // falling back to any pending local selection).
    const reg = registrations.find((r) => r.roundId === round.id && r.sessionId === session.id) as any;
    const current: string[] = (Array.isArray(reg?.topics) && reg.topics.length)
      ? reg.topics
      : (roundSelections.get(round.id)?.topics || []);

    const allowMultiple = (session as any).allowMultipleTopics === true;
    let next: string[];
    if (allowMultiple) {
      next = current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic];
    } else {
      // Single-topic: clicking the active chip clears it, otherwise replace.
      next = current.includes(topic) ? [] : [topic];
    }

    // Optimistic update — registrations (source of truth for the summary) + roundSelections.
    setRegistrations((prev) => prev.map((r) =>
      (r.roundId === round.id && r.sessionId === session.id)
        ? ({ ...r, topics: next } as Registration)
        : r
    ));
    setRoundSelections((prev) => {
      const newMap = new Map(prev);
      const cur = newMap.get(round.id) || {};
      newMap.set(round.id, { ...cur, topics: next });
      return newMap;
    });

    try {
      const response = await fetch(
        `${apiBaseUrl}/p/${token}/round/${round.id}/topics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topics: next, sessionId: session.id }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Failed to save topics');
        // Revert optimistic update on error
        fetchData();
      }
    } catch (error) {
      debugLog('Error saving round topics:', error);
      toast.error('Failed to save topics');
      fetchData();
    }
  };

  const generateRoundTimeDisplay = (startTime: string, duration: number) => {
    if (!startTime || startTime === 'To be set' || startTime === 'TBD') {
      return `To be set`;
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + duration;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    const formatTime = (hours: number, minutes: number) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const formattedStart = formatTime(startHours, startMinutes);
    const formattedEnd = formatTime(endHours, endMinutes);
    
    return `${formattedStart} - ${formattedEnd}`;
  };

  // Loading + error states (Claude Design v07 · Participant Dashboard.html `.pd-statewrap`).
  // Keep the nav + footer MOUNTED; render the state *instead of* the content region.
  if (isLoading || error) {
    return (
      <div className="pd-shell">
        <PdNav
          firstName={firstName}
          lastName={lastName}
          onBrandClick={() => navigate('/')}
          onDashboard={() => fetchData()}
          onProfile={() => token && navigate(`/p/${token}/profile`)}
          onAddressBook={() => token && navigate(`/p/${token}/address-book`)}
          onHome={() => navigate('/')}
        />
        <div className="pd-statewrap" style={{ padding: '4px 0 40px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Skeleton height={208} radius={24} style={{ marginBottom: 18 }} />
              <SkeletonRow />
              <SkeletonRow style={{ marginTop: 10 }} />
              <SkeletonRow style={{ marginTop: 10 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 22, fontSize: 13, color: C.ink, opacity: 0.6 }}>
                <Spinner /> Loading your rounds…
              </div>
            </div>
          ) : (
            <StatePlaceholder
              variant="error"
              glyphSize={74}
              glyph={<svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
              eyebrow="Something went wrong"
              title={<>We couldn't load <Italic>your rounds</Italic></>}
              body="This is on us — your registrations are safe. Try again in a moment."
              actions={<>
                <StateButton variant="primary" leadingIcon={<RefreshIcon />} onClick={() => fetchData()}>Try again</StateButton>
                <StateButton variant="ghost" href="mailto:hello@wonderelo.com">Contact support</StateButton>
              </>}
            />
          )}
        </div>
        <footer className="pd-footer">
          <a className="pd-brand" role="button" tabIndex={0} onClick={() => navigate('/')}><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
          <p className="tagline">Break your bubble, meet new people</p>
          <p className="copy">© 2026 Wonderelo</p>
        </footer>
      </div>
    );
  }

  // Filter sessions based on registered rounds
  debugLog('[Section filtering] Processing sessions:', sessions.length);
  debugLog('[Section filtering] All sessions:', sessions.map(s => ({
    name: s.session.name,
    id: s.session.id,
    status: s.session.status,
    date: s.session.date,
    roundCount: s.session.rounds?.length || 0,
    registeredRoundIds: Array.from(s.registeredRoundIds)
  })));
  
  const upcomingSessions = sessions.filter(({ session, registeredRoundIds, registrationStatusMap }) => {
    if (!session.rounds || session.rounds.length === 0) {
      debugLog(`[Section filtering] \"${session.name}\" - No rounds found`);
      return false;
    }
    
    // Check if any registered round is upcoming (not completed)
    const hasUpcomingRound = session.rounds.some(round => {
      const roundStatus = registrationStatusMap?.get(round.id);
      return registeredRoundIds.has(round.id) && !isRoundCompleted(session, round, roundStatus);
    });
    
    if (hasUpcomingRound) {
      debugLog(`[Section filtering] \"${session.name}\" → Upcoming section`);
    }
    
    return hasUpcomingRound;
  }).sort((a, b) => {
    // Sort by earliest upcoming round
    const getEarliestRoundTime = (sessionWithRounds: SessionWithRounds): number => {
      const { session, registeredRoundIds, registrationStatusMap } = sessionWithRounds;
      if (!session.date || !session.rounds) return Infinity;
      
      let earliestTime = Infinity;
      
      for (const round of session.rounds) {
        // Skip non-registered rounds
        if (!registeredRoundIds.has(round.id)) continue;
        
        // Skip completed rounds (including unconfirmed)
        const roundStatus = registrationStatusMap?.get(round.id);
        if (isRoundCompleted(session, round, roundStatus)) continue;
        
        // Skip rounds without time
        if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') continue;
        
        try {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
          roundStart.setHours(hours, minutes, 0, 0);
          const timestamp = roundStart.getTime();
          
          if (timestamp < earliestTime) {
            earliestTime = timestamp;
          }
        } catch (error) {
          // Skip rounds with invalid time format
          continue;
        }
      }
      
      return earliestTime;
    };
    
    const aTime = getEarliestRoundTime(a);
    const bTime = getEarliestRoundTime(b);
    
    // Sessions with earlier rounds come first
    return aTime - bTime;
  });

  const pastSessions = sessions.filter(({ session, registeredRoundIds, registrationStatusMap }) => {
    if (!session.rounds || session.rounds.length === 0) return false;
    
    // Check if any registered round is completed
    const hasCompletedRound = session.rounds.some(round => 
      registeredRoundIds.has(round.id) && isRoundCompleted(session, round)
    );
    
    if (hasCompletedRound) {
      debugLog(`[Section filtering] "${session.name}" → Completed section`);
    }
    
    return hasCompletedRound;
  });
  
  debugLog(`[Section filtering] Results: ${upcomingSessions.length} upcoming, ${pastSessions.length} completed`);



  // Get primary organizer (first upcoming or first past registration)
  const primaryRegistration = registrations.find(r => {
    const session = sessions.find(s => s.session.id === r.sessionId);
    if (!session) return false;
    const round = session.session.rounds?.find(rd => rd.id === r.roundId);
    if (!round) return false;
    return !isRoundCompleted(session.session, round);
  }) || registrations[0];

  return (
    <ParticipantDashboardView
      firstName={firstName}
      lastName={lastName}
      upcomingSessions={upcomingSessions}
      pastSessions={pastSessions}
      registrations={registrations}
      sharedContactsByRound={sharedContactsByRound}
      roundSelections={roundSelections}
      participantId={participantId}
      globalNextUpcomingRoundId={globalNextUpcomingRoundId}
      hasFreshData={hasFreshData}
      lastConfirmTimestamp={lastOptimisticUpdateRef.current}
      token={token}
      showMeetingPoints={showMeetingPoints}
      selectedSessionForDialog={selectedSessionForDialog}
      showRoundRules={showRoundRules}
      roundRules={roundRules}
      showUnregisterDialog={showUnregisterDialog}
      pendingUnregister={pendingUnregister}
      showDebug={showDebug}
      debugLogs={debugLogs}
      onAddMoreRoundsNavigate={(slug) => navigate(`/${slug}`)}
      onAddressBookNavigate={() => navigate(`/p/${token}/address-book`)}
      onDashboardNavigate={() => navigate(`/p/${token}`)}
      onProfileNavigate={() => navigate(`/p/${token}/profile`)}
      onShowRoundNavigate={() => navigate(`/p/${token}/match-point`)}
      onSetShowMeetingPoints={setShowMeetingPoints}
      onSetShowRoundRules={setShowRoundRules}
      onSetShowUnregisterDialog={setShowUnregisterDialog}
      onCancelUnregister={() => {
        setShowUnregisterDialog(false);
        setPendingUnregister(null);
      }}
      onConfirmUnregister={confirmUnregister}
      onRoundToggle={handleRoundToggle}
      onToggleRoundTopic={handleToggleRoundTopic}
      onConfirmAttendance={handleConfirmAttendance}
      onConfirmationWindowExpired={handleConfirmationWindowExpired}
      onClearDebugLogs={() => setDebugLogs([])}
      generateRoundTimeDisplay={generateRoundTimeDisplay}
      isRoundCompleted={isRoundCompleted}
    />
  );
}
