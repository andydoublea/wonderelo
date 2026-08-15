import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { NetworkingSession } from '../types';
import { SessionForm } from './SessionForm';
import { SessionDisplayCard } from './SessionDisplayCard';
import { SessionSuccessPage } from './SessionSuccessPage';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { errorLog } from '../utils/debug';
import { ServiceType } from '../App';
import { C, Btn, Italic } from './redesign/organizerAtoms';
import { hasRunningRounds, isRoundRunning } from '../utils/sessionStatus';
import { getParametersOrDefault } from '../utils/systemParameters';

/* ─────────────────────────────────────────────────────────────
   Redesign presentational atoms — ported from Claude Design v06
   (design/v06/project/pages/screen-dashboard-merged.jsx +
    screen-live-round.jsx). Inline styles from the brand `C` token
   object, exactly as the mocks do. Purely presentational — every
   handler / data source below is the original container logic.
   ───────────────────────────────────────────────────────────── */
const DIcon = ({ d, size = 16, sw = 2 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const DI = {
  copy:  '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  qr:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/>',
  ext:   '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  plus:  '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  pin:   '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  slide: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
};

// Rounds-list status filter pill (screen-dashboard-merged.jsx · Pill)
const StatusPill = ({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 16px', borderRadius: 999,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.fontBody,
    background: active ? C.purpleDeep : '#fff', color: active ? '#fff' : C.ink,
    border: `1.5px solid ${active ? C.purpleDeep : C.hairStrong}`, opacity: active ? 1 : .8,
  }}>
    {label}
    <span style={{ fontFamily: C.fontMono, fontSize: 11.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: active ? 'rgba(255,255,255,.2)' : 'rgba(76,25,77,.07)', color: active ? '#fff' : C.purpleDeep }}>{count}</span>
  </button>
);

// Live-round countdown ring (design/v08 · screen-dashboard-merged.jsx).
// Counts down to the END OF THE ROUND (round-wide — the one timing fact true for
// every group). Deliberately carries NO phase label: groups are matched at
// different moments, so one group can be networking while another still walks.
// start = session.date + round.startTime; total = walking + finding + duration.
function CountdownRing({ startMs, totalMs, size = 116 }: { startMs: number; totalMs: number; size?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(startMs + totalMs - now, 0);
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remaining / totalMs)) : 0;
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(76,25,77,.12)" strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.orange} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontFamily: C.fontMono, fontWeight: 700, fontSize: 22, color: C.purpleDeep, letterSpacing: '-.02em', lineHeight: 1 }}>{mm}:{ss}</span>
        <span style={{ fontFamily: C.fontBody, fontSize: 9, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: C.orange, textAlign: 'center', lineHeight: 1.3 }}>until<br />round ends</span>
      </div>
    </div>
  );
}

interface NetworkingDashboardProps {
  sessions: NetworkingSession[];
  isLoadingSessions: boolean;
  serviceType: ServiceType;
  eventSlug: string;
  userEmail?: string;
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
  onAddSession: (session: Omit<NetworkingSession, 'id'>) => Promise<void>;
  onUpdateSession: (id: string, updates: Partial<NetworkingSession>) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onDuplicateSession: (session: NetworkingSession) => Omit<NetworkingSession, 'id'>;
  onUpdateEventSlug: (slug: string) => void;
  onEditUrl?: () => void;
}

export function NetworkingDashboard({
  sessions,
  isLoadingSessions,
  serviceType,
  eventSlug,
  userEmail,
  organizerName,
  eventName,
  profileImageUrl,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onDuplicateSession,
  onUpdateEventSlug,
  onEditUrl
}: NetworkingDashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<NetworkingSession | null>(null);
  // Initialize success page state from sessionStorage BEFORE first render
  // This avoids timing issues with sessions loading
  const [showSuccessPage, setShowSuccessPage] = useState(() => {
    const stored = sessionStorage.getItem('wonderelo_success_session');
    console.log('🎉 [NetworkingDashboard] useState init — sessionStorage:', stored ? `YES (${stored.substring(0, 50)}...)` : 'EMPTY');
    return !!stored;
  });
  const [lastCreatedSession, setLastCreatedSession] = useState<NetworkingSession | null>(() => {
    const stored = sessionStorage.getItem('wonderelo_success_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as NetworkingSession;
        sessionStorage.removeItem('wonderelo_success_session');
        console.log('🎉 [NetworkingDashboard] Parsed success session:', parsed?.name, 'id:', parsed?.id);
        return parsed;
      } catch (e) {
        console.error('🎉 [NetworkingDashboard] Failed to parse sessionStorage:', e);
        return null;
      }
    }
    return null;
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Aggregated per-status participant counts for the currently-live round.
  // Loaded lazily (see effect below) — null until the fetch resolves.
  const [liveCounts, setLiveCounts] = useState<{
    registered: number; confirmed: number; onway: number; met: number; noshow: number; nomatch: number;
  } | null>(null);
  // First-login "Welcome from the founder" modal — shown once per organizer,
  // gated purely by a localStorage flag (not any server/onboarding field).
  const [welcome, setWelcome] = useState(() => !localStorage.getItem('oliwonder_founder_welcome_seen'));
  const closeWelcome = () => {
    try { localStorage.setItem('oliwonder_founder_welcome_seen', '1'); } catch { /* ignore */ }
    setWelcome(false);
  };
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Check URL params for status filter and success page
  useEffect(() => {
    // Set filter status from URL parameter
    const status = searchParams.get('status');
    if (status && ['draft', 'scheduled', 'published', 'completed'].includes(status)) {
      setFilterStatus(status);
    }

    // Success page is now initialized from sessionStorage in useState (above)
    // No need to check here — it's already set before first render
  }, [searchParams, sessions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const handleAddSession = async (session: Omit<NetworkingSession, 'id'>) => {
    try {
      const newSession = await onAddSession(session);
      setShowSessionForm(false);
      setEditingSession(null);
      setLastCreatedSession(newSession as NetworkingSession);
      setShowSuccessPage(true);
    } catch (error) {
      errorLog('Error adding session:', error);
    }
  };

  const handleUpdateSession = async (id: string, updates: Partial<NetworkingSession>) => {
    try {
      await onUpdateSession(id, updates);
      setShowSessionForm(false);
      setEditingSession(null);
    } catch (error) {
      errorLog('Error updating session:', error);
    }
  };

  const handleDuplicateSession = async (session: NetworkingSession) => {
    try {
      const duplicated = onDuplicateSession(session);
      await onAddSession(duplicated);
      toast.success('Session duplicated successfully');
    } catch (error) {
      errorLog('Error duplicating session:', error);
      toast.error('Failed to duplicate session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    // The round card's AlertDialog already confirms deletion; no native confirm() here
    // (that produced a second, redundant browser prompt).
    try {
      await onDeleteSession(id);
    } catch (error) {
      errorLog('Error deleting session:', error);
    }
  };

  const handleBackFromSuccess = () => {
    setShowSuccessPage(false);
    setLastCreatedSession(null);
    // Don't navigate — we're already on /rounds. Just hide the success page via state.
  };

  const handleManageSession = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}/manage`);
  };

  const handleEditFromList = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}`);
  };

  // Filter and sort sessions
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (filterStatus !== 'all' && session.status !== filterStatus) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.name.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.location?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Default stable ordering — newest first (design shows no sort control).
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
      const aTime = a.rounds?.[0]?.startTime || '';
      const bTime = b.rounds?.[0]?.startTime || '';
      return bTime.localeCompare(aTime);
    }
    return dateB - dateA;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = sortedSessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Redesign render pieces (shared by the list + calendar views) ── */
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const eventUrl = `${origin}/${eventSlug}`;
  const eventLabel = (eventName || 'Your event').trim();
  const greetingName = (organizerName || '').trim().split(/\s+/)[0] || 'there';

  const openEventPage = () => window.open(`/${eventSlug}`, '_blank');
  const openPromo = () => navigate('/event-promo');
  const copyEventLink = () => {
    try {
      navigator.clipboard?.writeText(eventUrl);
      toast.success('Event link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Live-round detection — reuses the real session-status helpers.
  const liveSession = sessions.find(s => hasRunningRounds(s));
  const liveRound = liveSession?.rounds?.find(r => isRoundRunning(liveSession, r));

  // Aggregate the live round's per-participant statuses into the six breakdown
  // cells. Source: same endpoint SessionAdministration uses
  // (`/organizer/:slug/session/:id/participants` → { participants: [{ registrations:
  // [{ roundId, status }] }] }), filtered to the live round. Runs only while a
  // round is live; counts render as "—" until this resolves.
  const liveRoundId = liveRound?.id;
  const liveSessionId = liveSession?.id;
  useEffect(() => {
    if (!liveRoundId || !liveSessionId) { setLiveCounts(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { apiBaseUrl } = await import('../utils/supabase/info');
        const accessToken = localStorage.getItem('supabase_access_token');
        if (!accessToken) return;
        const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
        // Resolve the organizer's URL slug (the participants endpoint is slug-scoped).
        const profileRes = await fetch(`${apiBaseUrl}/profile`, { headers: auth });
        if (!profileRes.ok) return;
        const profile = await profileRes.json();
        const slug = profile.profile?.urlSlug;
        if (!slug) return;
        const res = await fetch(`${apiBaseUrl}/organizer/${slug}/session/${liveSessionId}/participants`, { headers: auth });
        if (!res.ok) return;
        const data = await res.json();
        const counts = { registered: 0, confirmed: 0, onway: 0, met: 0, noshow: 0, nomatch: 0 };
        for (const p of (data.participants || []) as Array<{ registrations?: Array<{ roundId?: string; status?: string }> }>) {
          for (const reg of p.registrations || []) {
            if (reg.roundId !== liveRoundId) continue;
            switch (reg.status) {
              case 'registered': counts.registered++; break;
              case 'confirmed': counts.confirmed++; break;
              case 'matched': case 'checked-in': counts.onway++; break;
              case 'met': counts.met++; break;
              case 'missed': counts.noshow++; break;
              case 'no-match': counts.nomatch++; break;
              default: break;
            }
          }
        }
        if (!cancelled) setLiveCounts(counts);
      } catch { /* leave counts null → cells show "—" */ }
    })();
    return () => { cancelled = true; };
  }, [liveRoundId, liveSessionId]);

  const statusCount = (st: NetworkingSession['status']) => sessions.filter(s => s.status === st).length;

  const hero = (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '34px 36px',
      background: 'radial-gradient(circle at 12% 0%, rgba(221,83,28,.30), transparent 55%), linear-gradient(135deg, ' + C.purpleDeep + ' 0%, ' + C.purple + ' 62%, #3a1442 100%)',
      boxShadow: '0 22px 44px rgba(75,29,81,.28)', marginBottom: 22,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orangeBright, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
        <span style={{ width: 22, height: 1, background: C.orangeBright }} />{eventLabel}
      </span>
      <h1 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: '#fff', lineHeight: 1.04 }}>
        Let&rsquo;s make your event <Italic color={C.orangeBright}>unforgettable,</Italic> {greetingName}!
      </h1>
      <p style={{ margin: '12px 0 22px', fontSize: 14.5, color: 'rgba(255,255,255,.72)', maxWidth: 460 }}>Share your event link so people can register for your rounds.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
          <span style={{ fontFamily: C.fontMono, fontSize: 14, color: '#fff' }}>{`wonderelo.com/${eventSlug}`}</span>
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <span onClick={copyEventLink} title="Copy link" style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><DIcon d={DI.copy} size={16} /></span>
            <span onClick={openPromo} title="Event QR" style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><DIcon d={DI.qr} size={16} /></span>
            {/* View event page — icon only, sits right after the QR icon (design/v07) */}
            <span onClick={openEventPage} title="View event page" style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><DIcon d={DI.ext} size={16} /></span>
          </span>
        </div>
        <span onClick={openPromo} title="Show this slide to your attendees" style={{ flexShrink: 0, alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 11, background: '#fff', color: C.purpleDeep, fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}><DIcon d={DI.slide} size={15} /> Slide</span>
      </div>
    </div>
  );

  // Live round monitor (design/v08 · screen-dashboard-merged.jsx). Shows what is
  // true for the WHOLE round: a countdown to the round's END + aggregated
  // participant counts. NO single phase label — each group is matched at its own
  // moment, so groups are in different phases at once. Timing is real (session
  // date + round start; window = walking + finding + duration). The six counts
  // come from `liveCounts` (fetched above); render "—" until they resolve.
  let liveMonitor: ReactNode = null;
  if (liveSession && liveRound) {
    const params = getParametersOrDefault();
    const startMs = new Date(`${liveRound.date || liveSession.date}T${liveRound.startTime}:00`).getTime();
    const totalMs = ((params.walkingTimeMinutes || 3) + (params.findingTimeMinutes || 1) + (liveRound.duration || 10)) * 60000;
    const roundIdx = liveSession.rounds.findIndex(r => r.id === liveRound.id);
    const totalRounds = liveSession.numberOfRounds || liveSession.rounds.length;
    const registeredFallback = liveRound.registeredCount ?? (liveSession as unknown as { participants?: unknown[] }).participants?.length ?? null;
    const endDate = new Date(startMs + totalMs);
    const endHHMM = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const dash = '—';
    const cells: Array<[string, string | number, string]> = [
      ['Registered', liveCounts ? liveCounts.registered : (registeredFallback ?? dash), 'rgba(75,29,81,.45)'],
      ['Confirmed',  liveCounts ? liveCounts.confirmed  : dash, C.purple],
      ['On the way', liveCounts ? liveCounts.onway      : dash, C.orange],
      ['Met',        liveCounts ? liveCounts.met        : dash, '#1f8a4d'],
      ['No-show',    liveCounts ? liveCounts.noshow     : dash, '#9a8478'],
      ['No match',   liveCounts ? liveCounts.nomatch    : dash, '#9a8478'],
    ];
    liveMonitor = (
      <div style={{
        marginBottom: 26, borderRadius: 20, padding: '24px 26px',
        border: '1px solid rgba(221,83,28,.30)', background: 'rgba(221,83,28,.05)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <CountdownRing startMs={startMs} totalMs={totalMs} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orange, fontSize: 10.5, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.orange, boxShadow: '0 0 0 4px rgba(221,83,28,.18)' }} />Live now
            </span>
            <h2 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 25, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1.1 }}>
              Round {roundIdx >= 0 ? roundIdx + 1 : 1} of {totalRounds}: <Italic color={C.orange}>{liveSession.name}</Italic>
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink, opacity: .68, maxWidth: 440 }}>
              Ends at {endHHMM}. Groups start at their own pace, so some are still walking while others are already talking.
            </p>
          </div>
          <span onClick={() => handleManageSession(liveSession)} style={{ display: 'inline-flex', flexShrink: 0, cursor: 'pointer' }}>
            <Btn variant="primary" trailingIcon={<DIcon d={DI.arrow} size={14} />}>Open live monitor</Btn>
          </span>
        </div>
        {/* Live participant breakdown — aggregated across all groups in this round */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: C.hair, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.hair}` }}>
          {cells.map(([label, value, dot], i) => (
            <div key={i} style={{ background: '#fff', padding: '14px 16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />{label}
              </span>
              <div style={{ marginTop: 6, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-.03em', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Shared toolbar — search + status filter pills (design has no sort / view controls).
  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
      <div style={{ width: 260, maxWidth: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', borderRadius: 999, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
        <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><DIcon d={DI.search} size={15} /></span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rounds…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 13.5, color: C.ink, minWidth: 0 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
        <StatusPill label="All" count={sessions.length} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
        <StatusPill label="Published" count={statusCount('published')} active={filterStatus === 'published'} onClick={() => setFilterStatus('published')} />
        <StatusPill label="Scheduled" count={statusCount('scheduled')} active={filterStatus === 'scheduled'} onClick={() => setFilterStatus('scheduled')} />
        <StatusPill label="Draft" count={statusCount('draft')} active={filterStatus === 'draft'} onClick={() => setFilterStatus('draft')} />
        <StatusPill label="Completed" count={statusCount('completed')} active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} />
      </div>
    </div>
  );

  const roundsHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 18 }}>
      <h2 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1 }}>Your <Italic color={C.orange}>rounds</Italic></h2>
      <span onClick={() => navigate('/rounds/new')} style={{ display: 'inline-flex', flexShrink: 0 }}>
        <Btn variant="primary" leadingIcon={<DIcon d={DI.plus} size={15} />}>Create round</Btn>
      </span>
    </div>
  );

  // Show success page after creating session
  if (showSuccessPage && lastCreatedSession) {
    return (
      <SessionSuccessPage
        session={lastCreatedSession}
        eventSlug={eventSlug}
        onBack={handleBackFromSuccess}
        onGoToDashboard={() => navigate('/dashboard')}
        onManageParticipants={() => handleManageSession(lastCreatedSession)}
      />
    );
  }

  // Show session form
  if (showSessionForm) {
    return (
      <SessionForm
        initialData={editingSession}
        onSubmit={(session) => {
          if (editingSession) {
            handleUpdateSession(editingSession.id, session);
          } else {
            handleAddSession(session);
          }
        }}
        onCancel={() => {
          setShowSessionForm(false);
          setEditingSession(null);
        }}
      />
    );
  }

  // ── Welcome-modal size config. `compact` fits the whole card on a 13" MacBook ──
  const compact = typeof window !== 'undefined' && (window.innerHeight < 820 || window.innerWidth < 560);
  const wz = compact
    ? { modalW: 468, photoH: 126, pad: '15px 30px 17px', h2: 20, body: 12.75, lh: 1.45, gap: 7, mtBody: 9,
        callPad: '10px 14px', callFs: 12.75, callMt: 11, avatar: 46, name: 19, role: 11, rowMt: 11,
        btnPad: '10px 18px', btnFs: 13.5, btnMt: 12, eyebrowFs: 9.5, lblFs: 20 }
    : { modalW: 540, photoH: 264, pad: '26px 36px 28px', h2: 29, body: 15, lh: 1.58, gap: 12, mtBody: 15,
        callPad: '15px 18px', callFs: 15, callMt: 16, avatar: 74, name: 27, role: 12.5, rowMt: 18,
        btnPad: '14px 20px', btnFs: 15, btnMt: 20, eyebrowFs: 11, lblFs: 26 };
  // Arrow tip tracks the founder's face as the crop height changes.
  const faceY = Math.round(-22 + 0.38 * wz.photoH);
  const arrowPath = `M${266 + 66} ${faceY + 60} C ${266 + 42} ${faceY + 36}, ${266 + 18} ${faceY + 14}, 266 ${faceY}`;
  const arrowHead = `M266 ${faceY} L 279 ${faceY + 3} M266 ${faceY} L 267 ${faceY + 13}`;

  const welcomeModal = welcome ? (
    <div onClick={closeWelcome} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(45,17,51,.55)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: wz.modalW, boxSizing: 'border-box', maxHeight: '92vh', overflow: 'auto', background: '#fff', borderRadius: 24, border: `1px solid ${C.hairStrong}`, boxShadow: '0 40px 100px rgba(45,17,51,.45)', position: 'relative' }}>
        <button onClick={closeWelcome} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, zIndex: 3, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.92)', color: C.purpleDeep, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}>
          <DIcon d="<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>" size={18} />
        </button>
        {/* Photo from the founder's 30th birthday party — the night Wonderelo began */}
        <div style={{ position: 'relative', borderRadius: '24px 24px 0 0', overflow: 'hidden', background: C.cream, height: wz.photoH }}>
          <img src="/Andy-birthday-30-Wonderelo.png" alt="Andy's 30th birthday party — the night Wonderelo began" style={{ display: 'block', width: '100%', height: wz.photoH, objectFit: 'cover', objectPosition: '50% 38%' }} />
          {/* "That's me!" founder annotation — hand label + drawn arrow to his face */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
            <svg viewBox={`0 0 540 ${wz.photoH}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.45))' }}>
              <path d={arrowPath} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d={arrowHead} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', left: '63%', top: `${faceY + 56}px`, fontFamily: C.fontHand, fontWeight: 700, fontSize: wz.lblFs, lineHeight: .92, color: '#fff', transform: 'rotate(-7deg)', whiteSpace: 'nowrap', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.55))' }}>That&rsquo;s me!</span>
          </div>
        </div>
        <div style={{ padding: wz.pad }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orange, fontSize: wz.eyebrowFs, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
            <span style={{ width: 22, height: 1, background: C.orange }} />Welcome from the founder
          </span>
          <h2 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: wz.h2, lineHeight: 1.08, letterSpacing: '-.03em', color: C.purpleDeep }}>
            How I made my birthday <Italic color={C.orange}>unforgettable</Italic>
          </h2>
          <div style={{ marginTop: wz.mtBody, display: 'flex', flexDirection: 'column', gap: wz.gap, fontSize: wz.body, lineHeight: wz.lh, color: C.ink, opacity: .85 }}>
            <p style={{ margin: 0 }}>On my thirtieth birthday, seventy-five guests packed the room — university friends, colleagues, people from every corner of my life — and most of them were locked in their own bubbles. I wanted them to leave as friends.</p>
            <p style={{ margin: 0 }}>So I&rsquo;d asked a friend to build an app that paired two random guests every few minutes and sent them off to meet for one drink. Ninety minutes later the room was full of friendships — many of them last till today — that never would have happened on their own.</p>
            <p style={{ margin: 0 }}>That night, it wasn&rsquo;t only my birthday we celebrated: <strong style={{ color: C.purpleDeep, fontWeight: 700 }}>Wonderelo</strong> was born too.</p>
          </div>
          <div style={{ marginTop: wz.callMt, padding: wz.callPad, borderRadius: 14, background: 'rgba(221,83,28,.06)', border: '1px solid rgba(221,83,28,.22)', fontSize: wz.callFs, lineHeight: 1.55, color: C.purpleDeep }}>
            Now it&rsquo;s your turn. I hope Wonderelo helps you bring your people together — and makes your event truly <Italic color={C.orange}>unforgettable</Italic>.
          </div>
          <div style={{ marginTop: wz.rowMt, display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/Andy-Abel-Wonderelo.jpg" alt="Andy Abel" style={{ width: wz.avatar, height: wz.avatar, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.hair}` }} />
            <div>
              <div style={{ fontFamily: C.fontHand, fontWeight: 700, fontSize: wz.name, color: C.purpleDeep, lineHeight: 1 }}>Andy Abel</div>
              <div style={{ marginTop: 3, fontSize: wz.role, color: C.ink, opacity: .6 }}>Founder of Wonderelo</div>
            </div>
          </div>
          <button onClick={closeWelcome} style={{ marginTop: wz.btnMt, width: '100%', padding: wz.btnPad, borderRadius: 12, border: 'none', background: C.orange, color: '#fff', fontFamily: C.fontBody, fontWeight: 700, fontSize: wz.btnFs, cursor: 'pointer', boxShadow: '0 8px 20px rgba(221,83,28,.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Let&rsquo;s make your event unforgettable <DIcon d={DI.arrow} size={16} />
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Main list view
  return (
    <div className="wonderelo" style={{ fontFamily: C.fontBody, color: C.ink }}>
      {welcomeModal}
      {hero}
      {liveMonitor}
      {roundsHeader}
      {toolbar}

      {/* Sessions list */}
      {isLoadingSessions ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 22, boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
              <div style={{ height: 22, width: '70%', borderRadius: 8, background: 'rgba(76,25,77,.10)', marginBottom: 16 }} />
              <div style={{ height: 12, width: '100%', borderRadius: 6, background: 'rgba(76,25,77,.07)', marginBottom: 9 }} />
              <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'rgba(76,25,77,.07)' }} />
            </div>
          ))}
        </div>
      ) : sortedSessions.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: '56px 24px', textAlign: 'center', boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
          <div style={{ color: 'rgba(75,29,81,.35)', display: 'inline-flex', marginBottom: 14 }}><DIcon d={DI.layers} size={42} /></div>
          <h3 style={{ margin: '0 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: C.purpleDeep }}>No rounds yet</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: C.ink, opacity: .65 }}>
            {searchQuery || filterStatus !== 'all'
              ? 'No rounds match your filters'
              : 'Get started by creating your first networking round'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <span onClick={() => navigate('/rounds/new')} style={{ display: 'inline-flex' }}>
              <Btn variant="primary" leadingIcon={<DIcon d={DI.plus} size={15} />}>Create your first round</Btn>
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {paginatedSessions.map((session, index) => (
            <SessionDisplayCard
              key={`${session.id}-${index}`}
              session={session}
              adminMode={true}
              onEdit={() => handleEditFromList(session)}
              onDelete={() => handleDeleteSession(session.id)}
              onDuplicate={() => handleDuplicateSession(session)}
              onUpdateStatus={(status) => onUpdateSession(session.id, { status })}
              onUpdateSession={onUpdateSession}
              onManage={() => handleManageSession(session)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: 13, color: C.ink, opacity: .6 }}>
            Showing {startIndex + 1}-{Math.min(endIndex, sortedSessions.length)} of {sortedSessions.length} rounds
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? .45 : 1 }}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsis =
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return <span key={page} style={{ padding: '0 6px', color: C.ink, opacity: .5 }}>…</span>;
                }
                if (!showPage) return null;

                const on = currentPage === page;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    style={{ minWidth: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13, fontWeight: 700, background: on ? C.purpleDeep : '#fff', color: on ? '#fff' : C.purpleDeep, border: `1.5px solid ${on ? C.purpleDeep : C.hairStrong}` }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? .45 : 1 }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}