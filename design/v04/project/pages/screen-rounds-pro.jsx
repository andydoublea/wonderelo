// Wonderelo — Organizer · Rounds (attractive / trimmed version)
// Same data & actions as NetworkingDashboard.tsx — fewer controls, richer cards.
function RoundsProScreen() {
  const { WC: C, Btn, PageShell } = window;

  const Icon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus:   '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    cal:    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock:  '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin:    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    arrow:  '<path d="M5 12h14M13 5l7 7-7 7"/>',
    ext:    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  };
  const Italic = ({ children, color = C.orange }) => <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;

  const STATUS = {
    published: { label: 'Published', fg: C.orange,     bg: 'rgba(221,83,28,.10)',  bd: 'rgba(221,83,28,.30)' },
    scheduled: { label: 'Scheduled', fg: C.purple,     bg: 'rgba(92,34,119,.10)',  bd: 'rgba(92,34,119,.28)' },
    draft:     { label: 'Draft',     fg: 'rgba(75,29,81,.65)', bg: 'rgba(76,25,77,.06)', bd: 'rgba(76,25,77,.16)' },
    completed: { label: 'Completed', fg: '#1f8a4d',     bg: 'rgba(31,138,77,.10)',  bd: 'rgba(31,138,77,.28)' },
  };

  const Avatars = ({ n, names }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {names.map((nm, i) => (
        <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: [C.purpleDeep, C.orange, C.purple][i % 3], color: '#fff', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i ? -7 : 0, border: '2px solid #fff' }}>{nm}</div>
      ))}
      {n > 0 && <span style={{ marginLeft: 8, fontSize: 12.5, color: C.ink, opacity: .65 }}>{n}</span>}
    </div>
  );

  const Meta = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .8 }}>
      <span style={{ color: 'rgba(75,29,81,.45)', display: 'inline-flex' }}><Icon d={icon} size={14} /></span>{children}
    </div>
  );

  function Card({ name, date, time, status, parts, names, point }) {
    const st = STATUS[status];
    return (
      <div style={{ position: 'relative', overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
        <div style={{ height: 4, background: st.fg }} />
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 21, letterSpacing: '-.025em', color: C.purpleDeep, lineHeight: 1.05 }}>{name}</h3>
            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.fg }} />{st.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Meta icon={I.cal}>{date}</Meta>
            <Meta icon={I.clock}>{time}</Meta>
            <Meta icon={I.pin}>{point}</Meta>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
            <Avatars n={parts} names={names} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.purpleDeep, cursor: 'pointer' }}>Manage <Icon d={I.arrow} size={14} /></span>
          </div>
        </div>
      </div>
    );
  }

  const Pill = ({ label, active }) => (
    <div style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.fontBody,
      background: active ? C.purpleDeep : '#fff', color: active ? '#fff' : C.ink,
      border: `1.5px solid ${active ? C.purpleDeep : C.hairStrong}`, opacity: active ? 1 : .8 }}>{label}</div>
  );

  const rounds = [
    { name: 'Welcome mixer',          date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds', status: 'published', parts: 86, names: ['AM','TV','LK'], point: 'Main entrance' },
    { name: 'Founders speed network', date: 'Sat 14 Jun 2026', time: '16:30 · 2 rounds', status: 'published', parts: 64, names: ['DN','SL'],      point: 'Rooftop bar' },
    { name: 'Investor lounge',        date: 'Sun 15 Jun 2026', time: '11:00 · 1 round',  status: 'scheduled', parts: 18, names: ['EK','MH'],      point: 'Hall B · Stage left' },
    { name: 'Design jam meetup',      date: 'Sun 15 Jun 2026', time: '15:00 · 2 rounds', status: 'draft',     parts: 0,  names: [],                 point: 'Not set' },
    { name: 'Closing party connect',  date: 'Sun 15 Jun 2026', time: '20:00 · 1 round',  status: 'draft',     parts: 0,  names: [],                 point: 'Garden terrace' },
    { name: 'Morning coffee rounds',  date: 'Fri 13 Jun 2026', time: '09:00 · 2 rounds', status: 'completed', parts: 52, names: ['JK','PR','AB'], point: 'Café corner' },
  ];

  return (
    <PageShell navActive="Rounds">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 26 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: C.purpleDeep, lineHeight: 1 }}>Your <Italic>rounds</Italic></h1>
          <p style={{ margin: '12px 0 0', fontSize: 14.5, color: C.ink, opacity: .65 }}>6 rounds across Founder Summit 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" leadingIcon={<Icon d={I.ext} size={15} />}>Event page</Btn>
          <Btn variant="primary" leadingIcon={<Icon d={I.plus} size={15} />}>Create round</Btn>
        </div>
      </div>

      {/* Search + status pills only — no extra controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 999, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.search} size={16} /></span>
          <span style={{ fontSize: 14, color: 'rgba(43,24,16,.5)' }}>Search rounds…</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill label="All" active />
          <Pill label="Published" />
          <Pill label="Scheduled" />
          <Pill label="Draft" />
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {rounds.map((r, i) => <Card key={i} {...r} />)}
      </div>
    </PageShell>
  );
}

Object.assign(window, { RoundsProScreen });
