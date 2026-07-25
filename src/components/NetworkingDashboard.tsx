import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { NetworkingSession } from '../types';
import { SessionForm } from './SessionForm';
import { SessionDisplayCard } from './SessionDisplayCard';
import { CalendarView } from './CalendarView';
import { SessionSuccessPage } from './SessionSuccessPage';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Calendar, Users, Copy, Edit, LayoutGrid, Table as TableIcon, MoreVertical, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { debugLog, errorLog } from '../utils/debug';
import { ServiceType } from '../App';
import { C, Btn, Italic } from './redesign/organizerAtoms';
import { hasRunningRounds, isRoundRunning, getRoundStatus } from '../utils/sessionStatus';
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
};

// Session status badge palette (screen-dashboard-merged.jsx · STATUS)
const STATUS_STYLE: Record<string, { fg: string; bg: string; bd: string }> = {
  published: { fg: C.orange,  bg: 'rgba(221,83,28,.10)',  bd: 'rgba(221,83,28,.30)' },
  scheduled: { fg: C.purple,  bg: 'rgba(92,34,119,.10)',  bd: 'rgba(92,34,119,.28)' },
  draft:     { fg: '#9a8478', bg: 'rgba(154,132,120,.14)', bd: 'rgba(154,132,120,.34)' },
  completed: { fg: '#1f8a4d', bg: 'rgba(31,138,77,.10)',  bd: 'rgba(31,138,77,.28)' },
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

// Small brand-styled icon toggle for the view switch (grid / table / calendar)
const ViewToggle = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
    borderRadius: 11, cursor: 'pointer',
    background: active ? C.purpleDeep : '#fff', color: active ? '#fff' : C.purpleDeep,
    border: `1.5px solid ${active ? C.purpleDeep : C.hairStrong}`,
  }}>{children}</button>
);

// Live-round countdown ring (screen-live-round.jsx "highest-value addition").
// Driven ENTIRELY by real round timing: start = session.date + round.startTime,
// total window = walking + finding + networking minutes (system parameters).
const PHASE_LABEL: Record<string, string> = {
  walking: 'Walking to meeting points',
  finding: 'Finding your match',
  networking: 'Networking',
};
function CountdownRing({ startMs, totalMs, phase }: { startMs: number; totalMs: number; phase: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.min(Math.max(now - startMs, 0), totalMs);
  const remaining = Math.max(totalMs - elapsed, 0);
  const frac = totalMs > 0 ? remaining / totalMs : 0;
  const size = 168, stroke = 12, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const dash = circ * frac;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(76,25,77,.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.orange} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 34, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1 }}>
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </div>
        <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange, fontFamily: C.fontBody }}>
          {phase === 'networking' ? 'Networking' : phase === 'finding' ? 'Finding' : 'Walking'}
        </div>
      </div>
    </div>
  );
}

// A single tile in the live-monitor stat strip (one featured/orange card).
const StatTile = ({ label, value, featured }: { label: string; value: ReactNode; featured?: boolean }) => (
  <div style={{
    padding: '16px 18px', borderRadius: 14,
    background: featured ? C.orange : '#fff',
    border: `1px solid ${featured ? 'transparent' : C.hair}`,
    boxShadow: featured ? '0 8px 20px rgba(221,83,28,.22)' : 'none',
  }}>
    <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 26, letterSpacing: '-.03em', lineHeight: 1, color: featured ? '#fff' : C.purpleDeep }}>{value}</div>
    <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, letterSpacing: '.02em', color: featured ? 'rgba(255,255,255,.85)' : C.ink, opacity: featured ? 1 : .6 }}>{label}</div>
  </div>
);

interface NetworkingDashboardProps {
  sessions: NetworkingSession[];
  isLoadingSessions: boolean;
  serviceType: ServiceType;
  eventSlug: string;
  userEmail?: string;
  organizerName?: string;
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
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'status-asc' | 'status-desc'>('date-desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Check URL params for view, status filter, and success page
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'calendar') {
      setCurrentView('calendar');
    } else {
      setCurrentView('list');
    }

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
  }, [searchQuery, filterStatus, sortBy]);

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

  const handleEditSession = (session: NetworkingSession) => {
    setEditingSession(session);
    setShowSessionForm(true);
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
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await onDeleteSession(id);
      } catch (error) {
        errorLog('Error deleting session:', error);
      }
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

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    debugLog('Sorting with sortBy:', sortBy); // DEBUG
    switch (sortBy) {
      case 'date-asc': {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA === dateB) {
          // Sort by first round startTime if dates are equal
          const aTime = a.rounds?.[0]?.startTime || '';
          const bTime = b.rounds?.[0]?.startTime || '';
          return aTime.localeCompare(bTime);
        }
        return dateA - dateB;
      }
      case 'date-desc': {
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
      }
      case 'status-asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status-desc':
        return (b.status || '').localeCompare(a.status || '');
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  debugLog('Current sortBy state:', sortBy); // DEBUG
  debugLog('Sorted sessions count:', sortedSessions.length); // DEBUG
  debugLog('Sorted sessions order:', sortedSessions.map(s => ({ name: s.name, date: s.date }))); // DEBUG

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
  const eventLabel = (organizerName || 'Your event').trim();
  const greetingName = (organizerName || '').trim().split(/\s+/)[0] || 'there';

  const openEventPage = () => window.open(`/${eventSlug}`, '_blank');
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
        Let&rsquo;s make your event <Italic color={C.orangeBright}>unforgettable</Italic>, {greetingName}.
      </h1>
      <p style={{ margin: '12px 0 22px', fontSize: 14.5, color: 'rgba(255,255,255,.72)', maxWidth: 460 }}>Share your event link so people can register for your rounds.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
          <span style={{ fontFamily: C.fontMono, fontSize: 14, color: '#fff' }}>{`wonderelo.com/${eventSlug}`}</span>
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <span onClick={copyEventLink} title="Copy link" style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><DIcon d={DI.copy} size={16} /></span>
          </span>
        </div>
        <span onClick={openEventPage} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#fff', opacity: .9, cursor: 'pointer' }}>View event page <DIcon d={DI.ext} size={14} /></span>
        {onEditUrl && (
          <span onClick={onEditUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.9)', cursor: 'pointer' }}>Edit URL</span>
        )}
      </div>
    </div>
  );

  // Live round monitor — surfaced whenever a round is actually running.
  // Countdown ring is driven by real timing; the stat strip uses only data
  // available on the session/round. The full participant report lives in the
  // Manage view (SessionAdministration), reached via the CTA below.
  let liveMonitor: ReactNode = null;
  if (liveSession && liveRound) {
    const params = getParametersOrDefault();
    const startMs = new Date(`${liveRound.date || liveSession.date}T${liveRound.startTime}:00`).getTime();
    const totalMs = ((params.walkingTimeMinutes || 3) + (params.findingTimeMinutes || 1) + (liveRound.duration || 10)) * 60000;
    const phase = getRoundStatus(liveSession, liveRound);
    const roundIdx = liveSession.rounds.findIndex(r => r.id === liveRound.id);
    const registered = liveRound.registeredCount ?? (liveSession as unknown as { participants?: unknown[] }).participants?.length ?? 0;
    liveMonitor = (
      <div style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 20, boxShadow: '0 12px 30px rgba(75,29,81,.08)', marginBottom: 26 }}>
        <div style={{ height: 4, background: C.orange }} />
        <div style={{ padding: 26 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
              <CountdownRing startMs={startMs} totalMs={totalMs} phase={phase} />
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
                  <span style={{ width: 24, height: 1, background: C.orange }} />Live round monitor
                </span>
                <h2 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1.05 }}>
                  Round <Italic>report</Italic><span style={{ color: C.orange, fontWeight: 800, margin: '0 4px 0 1px' }}>:</span>{liveSession.name}
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink, opacity: .7 }}>{PHASE_LABEL[phase] || 'In progress'}</p>
              </div>
            </div>
            <span onClick={() => handleManageSession(liveSession)} style={{ display: 'inline-flex', flexShrink: 0 }}>
              <Btn variant="primary" trailingIcon={<DIcon d={DI.arrow} size={15} />}>Open live monitor</Btn>
            </span>
          </div>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatTile featured label="Current phase" value={phase === 'networking' ? 'Networking' : phase === 'finding' ? 'Finding' : 'Walking'} />
            <StatTile label="Live round" value={roundIdx >= 0 ? `Round ${roundIdx + 1}` : liveRound.name} />
            <StatTile label="Registered" value={registered} />
            <StatTile label="Rounds today" value={liveSession.numberOfRounds || liveSession.rounds.length} />
          </div>
        </div>
      </div>
    );
  }

  // Shared toolbar — search + status filter pills + sort + view toggles.
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill label="All" count={sessions.length} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
        <StatusPill label="Published" count={statusCount('published')} active={filterStatus === 'published'} onClick={() => setFilterStatus('published')} />
        <StatusPill label="Scheduled" count={statusCount('scheduled')} active={filterStatus === 'scheduled'} onClick={() => setFilterStatus('scheduled')} />
        <StatusPill label="Draft" count={statusCount('draft')} active={filterStatus === 'draft'} onClick={() => setFilterStatus('draft')} />
        <StatusPill label="Completed" count={statusCount('completed')} active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          style={{ padding: '9px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}`, fontFamily: C.fontBody, fontSize: 13, color: C.purpleDeep, fontWeight: 600, cursor: 'pointer' }}
        >
          <option value="date-desc">Date (newest first)</option>
          <option value="date-asc">Date (oldest first)</option>
          <option value="name-asc">Name (A → Z)</option>
          <option value="name-desc">Name (Z → A)</option>
          <option value="status-asc">Status (A → Z)</option>
          <option value="status-desc">Status (Z → A)</option>
        </select>
        <ViewToggle active={currentView === 'list' && viewMode === 'grid'} onClick={() => { setViewMode('grid'); setCurrentView('list'); }}><LayoutGrid className="h-4 w-4" /></ViewToggle>
        <ViewToggle active={currentView === 'list' && viewMode === 'table'} onClick={() => { setViewMode('table'); setCurrentView('list'); }}><TableIcon className="h-4 w-4" /></ViewToggle>
        <ViewToggle active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')}><Calendar className="h-4 w-4" /></ViewToggle>
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

  // Show different views
  if (currentView === 'calendar') {
    return (
      <div className="wonderelo" style={{ fontFamily: C.fontBody, color: C.ink }}>
        {hero}
        {liveMonitor}
        {roundsHeader}
        {toolbar}
        <CalendarView
          sessions={sortedSessions}
          onSessionClick={handleEditSession}
        />
      </div>
    );
  }

  // Main list view
  return (
    <div className="wonderelo" style={{ fontFamily: C.fontBody, color: C.ink }}>
      {hero}
      {liveMonitor}
      {roundsHeader}
      {toolbar}

      {/* Sessions list */}
      {isLoadingSessions ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.cream }}>
                  {['Name', 'Date', 'Time', 'Status', 'Participants', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 5 ? 'right' : 'left', padding: '13px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.purple, opacity: .8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map((session, index) => {
                  const st = STATUS_STYLE[session.status] || STATUS_STYLE.draft;
                  return (
                    <tr key={`${session.id}-${index}`} style={{ borderTop: `1px solid ${C.hair}` }}>
                      <td style={{ padding: '14px 18px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep }}>{session.name}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.ink, opacity: .8 }}>{session.date}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.ink, opacity: .8 }}>{session.startTime}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.fg }} />{session.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: C.ink, opacity: .8 }}>{(session as unknown as { participants?: unknown[] }).participants?.length || 0}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditFromList(session)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageSession(session)}>
                              <Users className="h-4 w-4 mr-2" />
                              Manage
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateSession(session)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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