// Wonderelo — Phase 03 · Organizer studio MOBILE versions
// Faithful mobile redesigns of the desktop studio screens (single-column,
// stacked cards, slim app nav, dark brand footer). Reuses organizer atoms.
// Exposes: RoundsMobileScreen, RoundCreatedMobileScreen (+ shell helpers).
(function () {
  const C = window.WC;
  const R = React;

  const MIcon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const MI = {
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    slide: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>',
  };
  const Italic = ({ children, color = C.orange }) => <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;

  // ── Slim mobile app nav ──
  function MNav({ active = 'Rounds' }) {
    return (
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(251,246,236,.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.hair}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="assets/Wonderelo-logo-symbol.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-.03em', color: C.purpleDeep }}>wonderelo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 11 }}>AA</div>
            <span style={{ color: C.purpleDeep, display: 'inline-flex' }}><MIcon d={MI.menu} size={20} /></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 18px 10px' }}>
          {['Rounds', 'Event page'].map((t) => (
            <div key={t} style={{ padding: '7px 13px', borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: C.fontBody, display: 'inline-flex', alignItems: 'center', gap: 6, background: t === active ? 'rgba(76,25,77,.08)' : 'transparent', color: t === active ? C.purpleDeep : C.ink, opacity: t === active ? 1 : .6 }}>
              {t === active && <span style={{ width: 5, height: 5, background: C.orange, transform: 'rotate(45deg)' }} />}{t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Dark brand footer (mirrors participant dashboard) ──
  function MFooter() {
    return (
      <footer style={{ background: '#2d1133', padding: '38px 22px calc(34px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="assets/Wonderelo-logo-symbol.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain', transform: 'rotate(-6deg)' }} />
          <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.03em', color: '#fff' }}>wonderelo</span>
        </div>
        <span style={{ fontFamily: C.fontDisplay, fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,.85)' }}>Break your bubble, meet new people</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 10.5, letterSpacing: '.04em', color: 'rgba(255,255,255,.4)' }}>© 2026 Wonderelo</span>
      </footer>
    );
  }

  // ── Mobile shell ──
  function MShell({ active = 'Rounds', children, fab }) {
    return (
      <div style={{ width: 432, minHeight: 760, background: C.paper, display: 'flex', flexDirection: 'column', fontFamily: C.fontBody, color: C.ink, position: 'relative', overflow: 'hidden' }}>
        <MNav active={active} />
        <div style={{ flex: 1, padding: '20px 18px 30px' }}>{children}</div>
        {fab}
        <MFooter />
      </div>
    );
  }

  // ── Eyebrow (mobile) ──
  const Eyebrow = ({ children, color = C.orange }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color, fontSize: 10.5, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
      <span style={{ width: 18, height: 1, background: color }} />{children}
    </span>
  );

  const STATUS = {
    published: { label: 'Published', fg: C.orange, bg: 'rgba(221,83,28,.10)', bd: 'rgba(221,83,28,.30)' },
    scheduled: { label: 'Scheduled', fg: C.purple, bg: 'rgba(92,34,119,.10)', bd: 'rgba(92,34,119,.28)' },
    draft: { label: 'Draft', fg: '#9a8478', bg: 'rgba(154,132,120,.14)', bd: 'rgba(154,132,120,.34)' },
    completed: { label: 'Completed', fg: '#1f8a4d', bg: 'rgba(31,138,77,.10)', bd: 'rgba(31,138,77,.28)' },
  };

  // ══════════════════════════════════════════════════════════════
  // ROUNDS (mobile dashboard) — maps to DashboardMergedScreen
  // ══════════════════════════════════════════════════════════════
  function RoundsMobileScreen() {
    const Meta = ({ icon, children }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .8 }}>
        <span style={{ color: 'rgba(75,29,81,.45)', display: 'inline-flex' }}><MIcon d={icon} size={14} /></span>{children}
      </div>
    );
    const RoundCard = ({ name, date, time, status, parts, point }) => {
      const st = STATUS[status];
      return (
        <div style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, boxShadow: '0 8px 20px rgba(75,29,81,.05)' }}>
          <div style={{ height: 4, background: st.fg }} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', color: C.purpleDeep, lineHeight: 1.1 }}>{name}</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, fontFamily: C.fontMono, fontSize: 9, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: st.fg }} />{st.label}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Meta icon={MI.cal}>{date}</Meta>
              <Meta icon={MI.clock}>{time}</Meta>
              <Meta icon={MI.pin}>{point}</Meta>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              {parts > 0
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.ink, opacity: .7 }}><span style={{ color: 'rgba(75,29,81,.45)', display: 'inline-flex' }}><MIcon d={MI.users} size={14} /></span>{parts} registered</span>
                : <span style={{ fontSize: 12.5, color: C.ink, opacity: .45 }}>No registrations yet</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep }}>Manage <MIcon d={MI.chevR} size={13} /></span>
            </div>
          </div>
        </div>
      );
    };
    const rounds = [
      { name: 'Welcome mixer', date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds', status: 'published', parts: 86, point: 'Main entrance' },
      { name: 'Founders speed network', date: 'Sat 14 Jun 2026', time: '16:30 · 2 rounds', status: 'published', parts: 64, point: 'Rooftop bar' },
      { name: 'Investor lounge', date: 'Sun 15 Jun 2026', time: '11:00 · 1 round', status: 'scheduled', parts: 18, point: 'Hall B · Stage left' },
      { name: 'Design jam meetup', date: 'Sun 15 Jun 2026', time: '15:00 · 2 rounds', status: 'draft', parts: 0, point: 'Not set' },
      { name: 'Morning coffee rounds', date: 'Fri 13 Jun 2026', time: '09:00 · 2 rounds', status: 'completed', parts: 52, point: 'Café corner' },
    ];
    const stats = [['2', 'Published', C.orange], ['1', 'Scheduled', C.purple], ['2', 'Drafts', '#64748b'], ['1', 'Completed', '#1f8a4d']];
    const pills = ['All', 'Published', 'Scheduled', 'Draft'];

    return (
      <MShell active="Rounds">
        {/* Hero band */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '24px 22px', background: 'radial-gradient(circle at 12% 0%, rgba(221,83,28,.30), transparent 55%), linear-gradient(135deg, ' + C.purpleDeep + ' 0%, ' + C.purple + ' 62%, #3a1442 100%)', boxShadow: '0 18px 36px rgba(75,29,81,.28)', marginBottom: 20 }}>
          <Eyebrow color={C.orangeBright}>Founder Summit 2026</Eyebrow>
          <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, letterSpacing: '-.03em', color: '#fff', lineHeight: 1.06 }}>
            Make your event <Italic color={C.orangeBright}>unforgettable</Italic>, Andy.
          </h1>
          <p style={{ margin: '10px 0 18px', fontSize: 13.5, color: 'rgba(255,255,255,.72)' }}>Share your event link so people can register for your rounds.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ flex: 1, fontFamily: C.fontMono, fontSize: 12.5, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>wonderelo.com/founder-summit</span>
            <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex' }}><MIcon d={MI.copy} size={15} /></span>
            <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex' }}><MIcon d={MI.qr} size={15} /></span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', fontSize: 13, fontWeight: 600, color: '#fff' }}>View page <MIcon d={MI.ext} size={13} /></span>
            <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 10, background: '#fff', color: C.purpleDeep, fontSize: 13, fontWeight: 700 }}><MIcon d={MI.slide} size={14} /> Slide</span>
          </div>
        </div>

        {/* Filter pills — wrap to rows, no scrollbar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[['All', rounds.length], ['Published', rounds.filter(r => r.status === 'published').length], ['Scheduled', rounds.filter(r => r.status === 'scheduled').length], ['Draft', rounds.filter(r => r.status === 'draft').length], ['Completed', rounds.filter(r => r.status === 'completed').length]].map(([p, c], i) => (
            <div key={p} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px 8px 15px', borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: C.fontBody, background: i === 0 ? C.purpleDeep : '#fff', color: i === 0 ? '#fff' : C.ink, border: `1.5px solid ${i === 0 ? C.purpleDeep : C.hairStrong}`, opacity: i === 0 ? 1 : .8 }}>
              {p}
              <span style={{ fontFamily: C.fontMono, fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: i === 0 ? 'rgba(255,255,255,.2)' : 'rgba(76,25,77,.07)', color: i === 0 ? '#fff' : C.purpleDeep }}>{c}</span>
            </div>
          ))}
        </div>

        {/* Section header — title + New round button above the cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', color: C.purpleDeep }}>Your rounds</h2>
          <button style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, border: 'none', background: C.orange, color: '#fff', fontFamily: C.fontBody, fontWeight: 700, fontSize: 13.5, boxShadow: '0 8px 18px rgba(221,83,28,.32)', cursor: 'pointer' }}>
            <MIcon d={MI.plus} size={16} /> New round
          </button>
        </div>

        {/* Rounds — single column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rounds.map((r, i) => <RoundCard key={i} {...r} />)}
        </div>
      </MShell>
    );
  }

  window.RoundsMobileScreen = RoundsMobileScreen;
  window.MStudioShell = MShell;
  window.MStudioAtoms = { MIcon, MI, Italic, Eyebrow, STATUS };
})();
