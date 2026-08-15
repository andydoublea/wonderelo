// Wonderelo — Organizer · Rounds list  (/rounds)
// Maps to: src/components/NetworkingDashboard.tsx (list view)
// Faithful to the real screen — no new fields/functionality.
function RoundsListScreen() {
  const { WC: C, Btn, PageShell } = window;

  const Icon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    more: '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  };

  const STATUS = {
    draft:     { label: 'Draft',     bg: 'rgba(76,25,77,.07)',  bd: 'rgba(76,25,77,.18)',  fg: C.purpleDeep },
    scheduled: { label: 'Scheduled', bg: 'rgba(92,34,119,.10)', bd: 'rgba(92,34,119,.28)', fg: C.purple },
    published: { label: 'Published', bg: 'rgba(221,83,28,.10)', bd: 'rgba(221,83,28,.30)', fg: C.orange },
    completed: { label: 'Completed', bg: 'rgba(31,138,77,.10)', bd: 'rgba(31,138,77,.30)', fg: '#1f8a4d' },
  };
  function Badge({ s }) {
    const st = STATUS[s];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, fontFamily: C.fontMono, fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.fg }} />{st.label}
      </span>
    );
  }

  function MetaRow({ icon, children }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .82 }}>
        <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={icon} size={15} /></span>
        {children}
      </div>
    );
  }

  function SessionCard({ name, date, time, status, parts, points }) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 8px 22px rgba(75,29,81,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <Badge s={status} />
          <span style={{ color: 'rgba(75,29,81,.4)', cursor: 'pointer', display: 'inline-flex' }}><Icon d={I.more} size={18} /></span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep, lineHeight: 1.1 }}>{name}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <MetaRow icon={I.cal}>{date}</MetaRow>
          <MetaRow icon={I.clock}>{time}</MetaRow>
          <MetaRow icon={I.users}>{parts} registered</MetaRow>
          <MetaRow icon={I.pin}>{points}</MetaRow>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
          <Btn variant="ghost" size="sm" style={{ flex: 1 }} leadingIcon={<Icon d={I.edit} size={14} />}>Edit</Btn>
          <Btn variant="secondary" size="sm" style={{ flex: 1 }} leadingIcon={<Icon d={I.users} size={14} />}>Manage</Btn>
        </div>
      </div>
    );
  }

  const Select = ({ label, w }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}`, width: w, fontSize: 14, color: C.ink, fontFamily: C.fontBody }}>
      {label}<span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.chevron} size={15} /></span>
    </div>
  );
  const ViewBtn = ({ icon, active }) => (
    <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? C.purpleDeep : '#fff', color: active ? '#fff' : C.purpleDeep, border: `1.5px solid ${active ? C.purpleDeep : C.hairStrong}` }}>
      <Icon d={icon} size={17} />
    </div>
  );

  const rounds = [
    { name: 'Welcome mixer',          date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds', status: 'published', parts: 86, points: 'Main entrance, Lobby +1' },
    { name: 'Founders speed network', date: 'Sat 14 Jun 2026', time: '16:30 · 2 rounds', status: 'published', parts: 64, points: 'Rooftop bar' },
    { name: 'Investor lounge',        date: 'Sun 15 Jun 2026', time: '11:00 · 1 round',  status: 'scheduled', parts: 18, points: 'Hall B · Stage left' },
    { name: 'Design jam meetup',      date: 'Sun 15 Jun 2026', time: '15:00 · 2 rounds', status: 'draft',     parts: 0,  points: 'Not set' },
    { name: 'Closing party connect',  date: 'Sun 15 Jun 2026', time: '20:00 · 1 round',  status: 'draft',     parts: 0,  points: 'Garden terrace' },
    { name: 'Morning coffee rounds',  date: 'Fri 13 Jun 2026', time: '09:00 · 2 rounds', status: 'completed', parts: 52, points: 'Café corner' },
  ];

  return (
    <PageShell navActive="Rounds">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: C.purpleDeep, lineHeight: 1 }}>Your networking rounds</h1>
          <p style={{ margin: '12px 0 0', fontSize: 14.5, color: C.ink, opacity: .7 }}>6 rounds</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" leadingIcon={<Icon d={I.ext} size={15} />}>Event page</Btn>
          <Btn variant="primary">Create round</Btn>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 18, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 8px 22px rgba(75,29,81,.05)' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: C.paper, border: `1.5px solid ${C.hairStrong}` }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.search} size={16} /></span>
          <span style={{ fontSize: 14, color: 'rgba(43,24,16,.5)' }}>Search rounds…</span>
        </div>
        <Select label="All statuses" w={180} />
        <Select label="Date (newest first)" w={220} />
        <div style={{ display: 'flex', gap: 8 }}>
          <ViewBtn icon={I.grid} active />
          <ViewBtn icon={I.table} />
          <ViewBtn icon={I.cal} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {rounds.map((r, i) => <SessionCard key={i} {...r} />)}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
        <span style={{ fontSize: 13, color: C.ink, opacity: .6 }}>Showing 1–6 of 6 rounds</span>
      </div>
    </PageShell>
  );
}

Object.assign(window, { RoundsListScreen });
