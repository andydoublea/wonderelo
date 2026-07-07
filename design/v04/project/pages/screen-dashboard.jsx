// Wonderelo — Organizer · Dashboard  (/dashboard)
// Maps to: src/components/Dashboard.tsx (DashboardView, returning-organizer state)
// Faithful to the real screen — no new fields/functionality.
function DashboardScreen() {
  const { WC: C, Btn, PageShell } = window;

  const Icon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    ext:   '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    copy:  '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/>',
    edit:  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    slide: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    plus:  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    draft: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    sched: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    play:  '<polygon points="5 3 19 12 5 21 5 3"/>',
    done:  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  };

  function StatCard({ label, value, icon, accent }) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 6px 16px rgba(75,29,81,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: C.ink, opacity: .65 }}>{label}</span>
          <span style={{ color: accent, display: 'inline-flex' }}><Icon d={icon} size={15} /></span>
        </div>
        <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, color: C.purpleDeep, letterSpacing: '-.02em' }}>{value}</div>
      </div>
    );
  }

  const STATUS = {
    published: { label: 'Published', bg: 'rgba(221,83,28,.10)', bd: 'rgba(221,83,28,.30)', fg: C.orange },
    scheduled: { label: 'Scheduled', bg: 'rgba(92,34,119,.10)', bd: 'rgba(92,34,119,.28)', fg: C.purple },
  };
  function Badge({ s }) {
    const st = STATUS[s];
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: st.fg }} />{st.label}</span>;
  }

  function SessionRow({ name, when, status, parts }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 4px', borderBottom: `1px solid ${C.hair}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep, letterSpacing: '-.01em' }}>{name}</div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: C.ink, opacity: .65, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.clock} size={13} /></span>{when}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.ink, opacity: .75 }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.users} size={14} /></span>{parts}
        </div>
        <Badge s={status} />
        <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.edit} size={13} />}>Edit</Btn>
      </div>
    );
  }

  return (
    <PageShell navActive="Dashboard">
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: C.purpleDeep, lineHeight: 1 }}>Dashboard</h1>
      </div>

      {/* Your event page */}
      <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 20, marginBottom: 22, boxShadow: '0 8px 22px rgba(75,29,81,.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>Your event page</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: C.paper, border: `1px solid ${C.hair}`, marginBottom: 14 }}>
          <span style={{ flex: 1, fontFamily: C.fontMono, fontSize: 13.5, color: C.purpleDeep }}>wonderelo.com/founder-summit</span>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.ext} size={15} /></span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.copy} size={14} />}>Copy</Btn>
          <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.qr} size={14} />}>QR code</Btn>
          <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.edit} size={14} />}>Edit</Btn>
          <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.slide} size={14} />}>Slide</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard label="Draft"     value="2" icon={I.draft} accent="rgba(75,29,81,.55)" />
        <StatCard label="Scheduled" value="1" icon={I.sched} accent={C.purple} />
        <StatCard label="Published" value="2" icon={I.play}  accent={C.orange} />
        <StatCard label="Completed" value="1" icon={I.done}  accent="#1f8a4d" />
      </div>

      {/* Published on event page */}
      <div style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 22, boxShadow: '0 8px 22px rgba(75,29,81,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep, letterSpacing: '-.01em' }}>Published on event page</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" size="sm" leadingIcon={<Icon d={I.plus} size={15} />}>Create new round</Btn>
            <Btn variant="ghost" size="sm">Show all rounds</Btn>
          </div>
        </div>
        <div style={{ fontFamily: C.fontMono, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(75,29,81,.5)', margin: '10px 0 2px' }}>Sat 14 Jun 2026</div>
        <SessionRow name="Welcome mixer"          when="14:00 · 3 rounds" status="published" parts={86} />
        <SessionRow name="Founders speed network" when="16:30 · 2 rounds" status="published" parts={64} />
        <div style={{ fontFamily: C.fontMono, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(75,29,81,.5)', margin: '18px 0 2px' }}>Sun 15 Jun 2026</div>
        <SessionRow name="Investor lounge" when="11:00 · 1 round" status="scheduled" parts={18} />
      </div>
    </PageShell>
  );
}

Object.assign(window, { DashboardScreen });
