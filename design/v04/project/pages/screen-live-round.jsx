// Wonderelo — Phase 03 · Live round monitor  (a.k.a. Session report)
// Rebuilt to match the codebase EXACTLY: src/components/SessionAdministration.tsx
//   · Header "Session report: {name}" (+ Refresh — kept per request)
//   · 3-col grid: session card (left) + Participant statistics + Round statistics
//   · Round participants: round selector buttons → participants table (Met with)
function LiveRoundScreen() {
  const { WC: C, Italic, PageShell } = window;
  const R = React;

  const Ico = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    refresh:  '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
    minus:    '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>',
    check:    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    x:        '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    hand:     '<path d="M11 11V6a1.5 1.5 0 0 1 3 0v5M14 10V5a1.5 1.5 0 0 1 3 0v6M8 12V8a1.5 1.5 0 0 1 3 0v3"/><path d="M17 8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L8 12"/>',
    userX:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/>',
    help:     '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    trend:    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    alert:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    cal:      '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pin:      '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    users:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  };

  // ── round publish status (driven by the Overview "Status" dev toggle) ──
  if (typeof window !== 'undefined') {
    window.__wRoundStatus = window.__wRoundStatus || 'published';
    window.setRoundStatus = window.setRoundStatus || ((v) => { window.__wRoundStatus = v; window.dispatchEvent(new CustomEvent('w-roundstatus')); });
  }
  const [roundStatus, setRoundStatus] = R.useState((typeof window !== 'undefined' && window.__wRoundStatus) || 'published');
  R.useEffect(() => {
    const h = () => setRoundStatus(window.__wRoundStatus || 'published');
    window.addEventListener('w-roundstatus', h);
    return () => window.removeEventListener('w-roundstatus', h);
  }, []);
  const published = roundStatus !== 'draft';

  // ── session being monitored ──
  const session = { name: 'Welcome mixer', date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds · 6 min', point: 'Main entrance', mode: 'Across groups · pairs', registered: 86 };

  // ── participant statistics (status breakdown, codebase fields) ──
  const total = 120;
  const pStats = [
    { label: 'Registered',  value: 18, color: '#2563eb', icon: I.userPlus },
    { label: 'Cancelled',   value: 6,  color: '#dc2626', icon: I.minus },
    { label: 'Confirmed',   value: 24, color: '#1f8a4d', icon: I.check },
    { label: 'Unconfirmed', value: 12, color: '#d97706', icon: I.x },
    { label: 'Met',         value: 48, color: '#0f9d6e', icon: I.hand },
    { label: 'Missed',      value: 8,  color: '#e11d48', icon: I.userX },
    { label: 'No match',    value: 4,  color: '#64748b', icon: I.help },
  ];

  // ── round statistics ──
  const favRounds = [
    { name: 'Round 1', range: '14:00 – 14:06', count: 86 },
    { name: 'Round 2', range: '16:30 – 16:36', count: 64 },
    { name: 'Round 3', range: '19:30 – 19:36', count: 42 },
  ];
  const unconfRound = { name: 'Round 3', range: '19:30 – 19:36', count: 12 };

  // ── rounds + their participants ──
  const rounds = [
    { id: 'r1', name: 'Round 1 · 14:00', count: 86 },
    { id: 'r2', name: 'Round 2 · 16:30', count: 64 },
    { id: 'r3', name: 'Round 3 · 19:30', count: 42 },
  ];
  const ROUND_PARTS = {
    r1: [
      { name: 'Anna M.',    status: 'met',        met: ['Marek H.'] },
      { name: 'Marek H.',   status: 'met',        met: ['Anna M.'] },
      { name: 'Petra S.',   status: 'met',        met: ['Filip K.'] },
      { name: 'Filip K.',   status: 'met',        met: ['Petra S.'] },
      { name: 'Adam W.',    status: 'missed',     met: [] },
      { name: 'Sara D.',    status: 'no-match',   met: [] },
    ],
    r2: [
      { name: 'Anna M.',    status: 'matched',    met: ['Marek H.'] },
      { name: 'Marek H.',   status: 'matched',    met: ['Anna M.'] },
      { name: 'Petra S.',   status: 'checked-in', met: [] },
      { name: 'Filip K.',   status: 'confirmed',  met: [] },
      { name: 'Adam W.',    status: 'met',        met: ['Jonas W.'] },
      { name: 'Jonas W.',   status: 'met',        met: ['Adam W.'] },
      { name: 'Daniela Y.', status: 'unconfirmed',met: [] },
    ],
    r3: [
      { name: 'Lukas B.',   status: 'registered', met: [] },
      { name: 'Tomáš V.',   status: 'registered', met: [] },
      { name: 'Sara D.',    status: 'confirmed',  met: [] },
    ],
  };
  const pBadge = {
    registered:  { bg: 'rgba(37,99,235,.12)',  fg: '#1d4ed8' },
    confirmed:   { bg: 'rgba(31,138,77,.12)',  fg: '#1f7a40' },
    unconfirmed: { bg: 'rgba(217,119,6,.14)',  fg: '#b45309' },
    cancelled:   { bg: 'rgba(220,38,38,.10)',  fg: '#b91c1c' },
    matched:     { bg: 'rgba(124,58,160,.14)', fg: '#7c2da0' },
    'checked-in':{ bg: 'rgba(79,70,229,.12)',  fg: '#4338ca' },
    met:         { bg: 'rgba(15,157,110,.14)', fg: '#0f7a57' },
    'no-match':  { bg: 'rgba(100,116,139,.14)',fg: '#475569' },
    missed:      { bg: 'rgba(225,29,72,.10)',  fg: '#be123c' },
  };

  const [roundId, setRoundId] = R.useState('r2');
  const parts = ROUND_PARTS[roundId] || [];

  // ── atoms ──
  const Card = ({ children, pad = 0 }) => (
    <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, overflow: 'hidden', padding: pad }}>{children}</section>
  );
  const CardHead = ({ title }) => (
    <div style={{ padding: '20px 24px 14px' }}>
      <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 18, color: C.purpleDeep, letterSpacing: '-0.015em' }}>{title}</h3>
    </div>
  );
  const Sep = () => <div style={{ height: 1, background: C.hair, margin: '16px 0' }} />;
  const StatBig = ({ icon, label, value, sub }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={icon} size={15} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</span>
      </div>
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: C.purpleDeep, lineHeight: 1 }}>{value}</div>
      {sub && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: C.ink, opacity: .55 }}>{sub}</p>}
    </div>
  );

  return (
    <PageShell navActive="Rounds">
      {/* Header — Session report + Refresh (kept) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: published ? C.orange : '#b45309', fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
            <span style={{ width: 24, height: 1, background: published ? C.orange : '#b45309' }} />{published ? 'Live round monitor' : 'Round preview · not published'}
          </span>
          <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, lineHeight: 1, letterSpacing: '-0.035em', color: C.purpleDeep }}>
            Round <Italic>report</Italic><span style={{ color: C.orange, fontFamily: C.fontDisplay, fontWeight: 800, margin: '0 4px 0 1px' }}>:</span>{session.name}
          </h1>
        </div>
        <button type="button" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 11,
          background: 'transparent', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep,
          fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          transition: 'background .15s, border-color .15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.cream; e.currentTarget.style.borderColor = C.orange; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.hairStrong; }}>
          <Ico d={I.refresh} size={15} /> Refresh
        </button>
      </div>

      {/* Session card + statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22, alignItems: 'start', marginBottom: 22 }}>
        {/* Left — session card */}
        <div style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
          <div style={{ height: 4, background: C.orange }} />
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-.025em', color: C.purpleDeep, lineHeight: 1.05 }}>{session.name}</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: published ? 'rgba(221,83,28,.10)' : 'rgba(217,119,6,.12)', border: `1px solid ${published ? 'rgba(221,83,28,.30)' : 'rgba(217,119,6,.32)'}`, color: published ? C.orange : '#b45309', fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: published ? C.orange : '#d97706' }} />{published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[[I.cal, session.date], [I.clock, session.time], [I.pin, session.point], [I.users, session.mode]].map(([ic, tx], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.ink }}>
                  <span style={{ color: C.orange, display: 'inline-flex', flexShrink: 0 }}><Ico d={ic} size={16} /></span>{tx}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: `1px solid ${C.hair}`, fontSize: 13.5, color: C.purpleDeep, fontWeight: 600 }}>
              <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={I.users} size={15} /></span>{session.registered} registered across all rounds
            </div>
          </div>
        </div>

        {/* Right — two stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {/* Participant statistics */}
          <Card>
            <CardHead title="Participant statistics" />
            <div style={{ padding: '0 24px 22px' }}>
              {pStats.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < pStats.length - 1 ? `1px solid ${C.hair}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: s.color, display: 'inline-flex' }}><Ico d={s.icon} size={16} /></span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: s.color }}>{s.value}</span>
                    <span style={{ width: 38, textAlign: 'right', fontSize: 12.5, fontFamily: C.fontMono, color: C.ink, opacity: .55 }}>{Math.round((s.value / total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Round statistics */}
          <Card>
            <CardHead title="Round statistics" />
            <div style={{ padding: '0 24px 22px' }}>
              <StatBig icon={I.eye} label="Event page views" value="1,240" sub="Estimated views" />
              <Sep />
              <StatBig icon={I.trend} label="Average rounds per participant" value="2.3" />
              <Sep />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#d97706', display: 'inline-flex' }}><Ico d={I.alert} size={15} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Most unconfirmed round</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{unconfRound.range.split(' ')[0]}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(217,119,6,.14)', color: '#b45309', whiteSpace: 'nowrap' }}>{unconfRound.count} unconfirmed</span>
                </div>
              </div>
              <Sep />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={I.clock} size={15} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Most favourite rounds</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {favRounds.map((r) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 13, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{r.range.split(' ')[0]}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(76,25,77,.06)', color: C.purpleDeep, whiteSpace: 'nowrap' }}>{r.count} registrations</span>
                    </div>
                  ))}
                </div>
              </div>
              <Sep />
              <StatBig icon={I.hand} label="Contacts exchanged" value={<span style={{ color: '#0f9d6e' }}>67%</span>} sub="48 of 72 meetings" />
            </div>
          </Card>
        </div>
      </div>

      {/* Round participants */}
      <Card>
        <CardHead title="Round participants" />
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.purpleDeep, marginBottom: 12 }}>Select round</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
            {rounds.map((r) => {
              const on = roundId === r.id;
              return (
                <button key={r.id} type="button" onClick={() => setRoundId(r.id)} style={{
                  textAlign: 'left', padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${on ? C.orange : C.hairStrong}`, background: on ? 'rgba(221,83,28,.05)' : '#fff',
                  fontFamily: C.fontBody, transition: 'border-color .15s, background .15s',
                }}
                  onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = 'rgba(221,83,28,.5)'; e.currentTarget.style.background = C.cream; } }}
                  onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = C.hairStrong; e.currentTarget.style.background = '#fff'; } }}>
                  <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14.5, color: C.purpleDeep }}>{r.name}</div>
                  <div style={{ marginTop: 2, fontSize: 12.5, color: C.ink, opacity: .6 }}>{r.count} participants</div>
                </button>
              );
            })}
          </div>

          {/* Participants table */}
          <div style={{ border: `1px solid ${C.hair}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.cream }}>
                  {['Participant', 'Status', 'Met with'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.purple, opacity: .8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => {
                  const b = pBadge[p.status] || { bg: 'rgba(76,25,77,.06)', fg: C.purpleDeep };
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${C.hair}` }}>
                      <td style={{ padding: '13px 18px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep }}>{p.name}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ padding: '4px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: b.bg, color: b.fg, whiteSpace: 'nowrap' }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        {p.met.length > 0
                          ? <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>{p.met.map((m) => <span key={m} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${C.hairStrong}`, color: C.purpleDeep }}>{m}</span>)}</span>
                          : <span style={{ fontSize: 13, color: C.ink, opacity: .5 }}>No matches yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

window.LiveRoundScreen = LiveRoundScreen;
