// Wonderelo — Organizer studio MOBILE versions (part 3)
// Live round monitor · Round form · Billing — faithful mobile redesigns.
(function () {
  const C = window.WC;
  const R = React;
  const MShell = window.MStudioShell;
  const { MIcon, MI, Italic, Eyebrow } = window.MStudioAtoms;
  const Btn = window.Btn;

  const MHead = ({ eyebrow, title, lede, right }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div><Eyebrow>{eyebrow}</Eyebrow></div>
        {right}
      </div>
      <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.04, letterSpacing: '-0.035em', color: C.purpleDeep }}>{title}</h1>
      {lede && <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .78 }}>{lede}</p>}
    </div>
  );
  const Label = ({ children }) => (
    <span style={{ display: 'block', fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase', marginBottom: 8 }}>{children}</span>
  );
  const MField = ({ value, prefix, suffix, focused, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${focused ? C.orange : C.hairStrong}` }}>
      {icon && <span style={{ color: C.orange, display: 'inline-flex' }}><MIcon d={icon} size={15} /></span>}
      {prefix && <span style={{ color: C.ink, opacity: .55, fontSize: 13.5, fontFamily: C.fontMono }}>{prefix}</span>}
      <input defaultValue={value} readOnly style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 14.5, color: C.ink, minWidth: 0 }} />
      {suffix && <span style={{ color: C.ink, opacity: .55, fontSize: 13 }}>{suffix}</span>}
    </div>
  );
  const FormCard = ({ icon, title, hint, children }) => (
    <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: hint ? 8 : 16 }}>
        <span style={{ color: C.orange, display: 'inline-flex' }}><MIcon d={icon} size={18} /></span>
        <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', color: C.purpleDeep }}>{title}</h3>
      </div>
      {hint && <p style={{ margin: '0 0 16px', fontSize: 12.5, color: C.ink, opacity: .65 }}>{hint}</p>}
      {children}
    </section>
  );

  // ══════════════════════════════════════════════════════════════
  // LIVE ROUND MONITOR (mobile) — mirrors the desktop Round report (C4)
  // ══════════════════════════════════════════════════════════════
  function LiveRoundMobileScreen() {
    // round publish status (driven by the Overview "Status" dev toggle)
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

    const II = {
      refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
      userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
      minus: '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>',
      check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      x: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      hand: '<path d="M11 11V6a1.5 1.5 0 0 1 3 0v5M14 10V5a1.5 1.5 0 0 1 3 0v6M8 12V8a1.5 1.5 0 0 1 3 0v3"/><path d="M17 8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L8 12"/>',
      userX: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/>',
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
      alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    };

    // ── same data as the desktop Round report ──
    const session = { name: 'Welcome mixer', date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds · 6 min', point: 'Main entrance', mode: 'Across groups · pairs', registered: 86 };
    const total = 120;
    const pStats = [
      { label: 'Registered', value: 18, color: '#2563eb', icon: II.userPlus },
      { label: 'Cancelled', value: 6, color: '#dc2626', icon: II.minus },
      { label: 'Confirmed', value: 24, color: '#1f8a4d', icon: II.check },
      { label: 'Unconfirmed', value: 12, color: '#d97706', icon: II.x },
      { label: 'Met', value: 48, color: '#0f9d6e', icon: II.hand },
      { label: 'Missed', value: 8, color: '#e11d48', icon: II.userX },
      { label: 'No match', value: 4, color: '#64748b', icon: II.help },
    ];
    const favRounds = [
      { name: 'Round 1', range: '14:00 – 14:06', count: 86 },
      { name: 'Round 2', range: '16:30 – 16:36', count: 64 },
      { name: 'Round 3', range: '19:30 – 19:36', count: 42 },
    ];
    const unconfRound = { name: 'Round 3', range: '19:30 – 19:36', count: 12 };
    const rounds = [
      { id: 'r1', name: 'Round 1 · 14:00', count: 86 },
      { id: 'r2', name: 'Round 2 · 16:30', count: 64 },
      { id: 'r3', name: 'Round 3 · 19:30', count: 42 },
    ];
    const ROUND_PARTS = {
      r1: [
        { name: 'Anna M.', status: 'met', met: ['Marek H.'] },
        { name: 'Marek H.', status: 'met', met: ['Anna M.'] },
        { name: 'Petra S.', status: 'met', met: ['Filip K.'] },
        { name: 'Filip K.', status: 'met', met: ['Petra S.'] },
        { name: 'Adam W.', status: 'missed', met: [] },
        { name: 'Sara D.', status: 'no-match', met: [] },
      ],
      r2: [
        { name: 'Anna M.', status: 'matched', met: ['Marek H.'] },
        { name: 'Marek H.', status: 'matched', met: ['Anna M.'] },
        { name: 'Petra S.', status: 'checked-in', met: [] },
        { name: 'Filip K.', status: 'confirmed', met: [] },
        { name: 'Adam W.', status: 'met', met: ['Jonas W.'] },
        { name: 'Jonas W.', status: 'met', met: ['Adam W.'] },
        { name: 'Daniela Y.', status: 'unconfirmed', met: [] },
      ],
      r3: [
        { name: 'Lukas B.', status: 'registered', met: [] },
        { name: 'Tomáš V.', status: 'registered', met: [] },
        { name: 'Sara D.', status: 'confirmed', met: [] },
      ],
    };
    const pBadge = {
      registered: { bg: 'rgba(37,99,235,.12)', fg: '#1d4ed8' },
      confirmed: { bg: 'rgba(31,138,77,.12)', fg: '#1f7a40' },
      unconfirmed: { bg: 'rgba(217,119,6,.14)', fg: '#b45309' },
      cancelled: { bg: 'rgba(220,38,38,.10)', fg: '#b91c1c' },
      matched: { bg: 'rgba(124,58,160,.14)', fg: '#7c2da0' },
      'checked-in': { bg: 'rgba(79,70,229,.12)', fg: '#4338ca' },
      met: { bg: 'rgba(15,157,110,.14)', fg: '#0f7a57' },
      'no-match': { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
      missed: { bg: 'rgba(225,29,72,.10)', fg: '#be123c' },
    };
    const [roundId, setRoundId] = R.useState('r2');
    const parts = ROUND_PARTS[roundId] || [];

    const Card = ({ title, children }) => (
      <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        {title && <div style={{ padding: '16px 18px 12px' }}><h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', color: C.purpleDeep }}>{title}</h3></div>}
        {children}
      </section>
    );
    const Sep = () => <div style={{ height: 1, background: C.hair, margin: '14px 0' }} />;
    const StatBig = ({ icon, label, value, sub }) => (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><MIcon d={icon} size={14} /></span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{label}</span>
        </div>
        <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 26, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1 }}>{value}</div>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: C.ink, opacity: .55 }}>{sub}</p>}
      </div>
    );

    return (
      <MShell active="Rounds">
        {/* Header — report eyebrow + headline + refresh */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: published ? C.orange : '#b45309', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
              <span style={{ width: 18, height: 1, background: published ? C.orange : '#b45309' }} />{published ? 'Live round monitor' : 'Round preview · not published'}
            </span>
            <button style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontFamily: C.fontBody, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}><MIcon d={II.refresh} size={14} /> Refresh</button>
          </div>
          <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.04, letterSpacing: '-0.035em', color: C.purpleDeep }}>
            Round <Italic>report</Italic><span style={{ color: C.orange, fontFamily: C.fontDisplay, fontWeight: 800, margin: '0 3px 0 1px' }}>:</span>{session.name}
          </h1>
        </div>

        {/* Session card */}
        <section style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, marginBottom: 16 }}>
          <div style={{ height: 4, background: published ? C.orange : '#d97706' }} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.025em', color: C.purpleDeep, lineHeight: 1.05 }}>{session.name}</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 999, background: published ? 'rgba(221,83,28,.10)' : 'rgba(217,119,6,.12)', border: `1px solid ${published ? 'rgba(221,83,28,.30)' : 'rgba(217,119,6,.32)'}`, color: published ? C.orange : '#b45309', fontFamily: C.fontMono, fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: published ? C.orange : '#d97706' }} />{published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[[II.cal, session.date], [II.clock, session.time], [II.pin, session.point], [II.users, session.mode]].map(([ic, tx], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: C.ink }}>
                  <span style={{ color: C.orange, display: 'inline-flex', flexShrink: 0 }}><MIcon d={ic} size={15} /></span>{tx}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.hair}`, fontSize: 13, color: C.purpleDeep, fontWeight: 600 }}>
              <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><MIcon d={II.users} size={14} /></span>{session.registered} registered across all rounds
            </div>
          </div>
        </section>

        {/* Participant statistics */}
        <Card title="Participant statistics">
          <div style={{ padding: '0 18px 18px' }}>
            {pStats.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < pStats.length - 1 ? `1px solid ${C.hair}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: s.color, display: 'inline-flex' }}><MIcon d={s.icon} size={15} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.03em', color: s.color }}>{s.value}</span>
                  <span style={{ width: 34, textAlign: 'right', fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .55 }}>{Math.round((s.value / total) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Round statistics */}
        <Card title="Round statistics">
          <div style={{ padding: '0 18px 18px' }}>
            <StatBig icon={II.eye} label="Event page views" value="1,240" sub="Estimated views" />
            <Sep />
            <StatBig icon={II.trend} label="Average rounds per participant" value="2.3" />
            <Sep />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#d97706', display: 'inline-flex' }}><MIcon d={II.alert} size={14} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>Most unconfirmed round</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 12.5, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{unconfRound.range.split(' ')[0]}</span>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(217,119,6,.14)', color: '#b45309', whiteSpace: 'nowrap' }}>{unconfRound.count} unconfirmed</span>
              </div>
            </div>
            <Sep />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><MIcon d={II.clock} size={14} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>Most favourite rounds</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {favRounds.map((r) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{r.range.split(' ')[0]}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(76,25,77,.06)', color: C.purpleDeep, whiteSpace: 'nowrap' }}>{r.count} registrations</span>
                  </div>
                ))}
              </div>
            </div>
            <Sep />
            <StatBig icon={II.hand} label="Contacts exchanged" value={<span style={{ color: '#0f9d6e' }}>67%</span>} sub="48 of 72 meetings" />
          </div>
        </Card>

        {/* Round participants */}
        <Card title="Round participants">
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.purpleDeep, marginBottom: 10 }}>Select round</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
              {rounds.map((r) => {
                const on = roundId === r.id;
                return (
                  <button key={r.id} type="button" onClick={() => setRoundId(r.id)} style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 11, cursor: 'pointer',
                    border: `2px solid ${on ? C.orange : C.hairStrong}`, background: on ? 'rgba(221,83,28,.05)' : '#fff',
                    fontFamily: C.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  }}>
                    <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: C.ink, opacity: .6 }}>{r.count} participants</span>
                  </button>
                );
              })}
            </div>

            {/* participant rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {parts.map((p, i) => {
                const b = pBadge[p.status] || { bg: 'rgba(76,25,77,.06)', fg: C.purpleDeep };
                return (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.hair}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep }}>{p.name}</span>
                      <span style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: b.bg, color: b.fg, whiteSpace: 'nowrap' }}>{p.status}</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: C.ink, opacity: .45 }}>Met</span>
                      {p.met.length > 0
                        ? <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>{p.met.map((m) => <span key={m} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, border: `1px solid ${C.hairStrong}`, color: C.purpleDeep }}>{m}</span>)}</span>
                        : <span style={{ fontSize: 12.5, color: C.ink, opacity: .5 }}>No matches yet</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </MShell>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // BILLING (mobile)
  // ══════════════════════════════════════════════════════════════
  function BillingMobileScreen() {
    const [billing, setBilling] = R.useState((typeof window !== 'undefined' && window.__wBilling) || 'subscription');
    const [intv, setIntv] = R.useState('annual');
    const [tab, setTab] = R.useState('invoices');
    const [cancelOpen, setCancelOpen] = R.useState(false);
    R.useEffect(() => {
      const h = () => setBilling(window.__wBilling || 'subscription');
      window.addEventListener('w-billing', h);
      return () => window.removeEventListener('w-billing', h);
    }, []);
    const hasSub = billing === 'subscription', hasCredits = billing === 'credits';
    const credits = billing === 'free' ? [] : [{ cap: 50, balance: 3 }];
    const totalCredits = credits.reduce((s, c) => s + c.balance, 0);
    const coin = "<circle cx='12' cy='12' r='8'/><path d='M9.5 9.5h5M9.5 14.5h5'/>";
    const single = 99, monthly = 199, annual = 1990, annualPerMo = Math.round(annual / 12);
    const Ico = ({ d, size = 15 }) => <MIcon d={d} size={size} />;
    const Card = ({ children, accent }) => <section style={{ background: '#fff', border: `1px solid ${accent || C.hair}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>{children}</section>;
    const check = "<polyline points='20 6 9 17 4 12'/>";
    const STOPS = [5, 50, 200, 500, 1000, 5000];
    const tier = 2;

    return (
      <MShell active="Billing">
        <MHead eyebrow="Plan &amp; payments" title={<>Billing &amp; <Italic>subscription</Italic></>} />

        {(hasSub || credits.length > 0) && (
          <Card>
            <div style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>Your plan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasSub && (
                  <div style={{ borderRadius: 12, border: `1.5px solid ${C.hairStrong}`, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Subscription</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: C.purpleDeep, color: '#fff' }}>Active</span>
                    </div>
                    <div style={{ marginTop: 10, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep }}>Unlimited events</div>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: C.ink, opacity: .75 }}>Up to 200 participants · €{monthly}/month</p>
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: C.ink, opacity: .6, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ico d={MI.cal} size={14} /> Next billing: 12 Feb 2027</p>
                    <button type="button" onClick={() => setCancelOpen(true)} style={{ marginTop: 14, width: '100%', padding: '11px', borderRadius: 11, background: 'transparent', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontFamily: C.fontBody, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>Cancel subscription</button>
                  </div>
                )}
                {credits.length > 0 && (
                  <div style={{ borderRadius: 12, border: `1.5px solid ${C.hairStrong}`, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Single-event credits</span>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(221,83,28,.12)', color: C.orange }}>{totalCredits} available</span>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {credits.map((c) => (
                        <div key={c.cap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 13px', borderRadius: 10, background: C.cream, border: `1px solid ${C.hair}` }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.purpleDeep, fontWeight: 600 }}><span style={{ color: C.orange, display: 'inline-flex' }}><Ico d={coin} size={15} /></span>Up to {c.cap} participants</span>
                          <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, color: C.purpleDeep }}>{c.balance} {c.balance === 1 ? 'credit' : 'credits'}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: '11px 0 0', fontSize: 11.5, color: C.ink, opacity: .6 }}>Applied automatically when you publish an event of that size.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>{hasSub ? 'Change plan' : 'Choose a plan'}</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12.5, color: C.ink, opacity: .65 }}>Pricing is based on your event's capacity.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 11, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.22)', marginBottom: 18 }}>
              <span style={{ color: '#1f7a40', display: 'inline-flex' }}><Ico d="<path d='M12 3l1.9 4.6L19 9l-4.1 3 1.4 5L12 14.8 7.7 17l1.4-5L5 9l5.1-1.4z'/>" size={15} /></span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1f7a40' }}>Events up to 5 participants free for testing</span>
            </div>
            {/* capacity (static) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.purpleDeep }}>Event capacity</span>
              <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, color: C.purpleDeep }}>Up to 200</span>
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 999, background: 'rgba(76,25,77,.12)', marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: 0, height: 6, width: '40%', borderRadius: 999, background: C.orange }} />
              <div style={{ position: 'absolute', left: '40%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: '#fff', border: `2px solid ${C.orange}`, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.fontMono, fontSize: 10.5, color: C.ink, opacity: .55 }}>{STOPS.map((s, i) => <span key={s} style={{ color: i === tier ? C.orange : undefined, fontWeight: i === tier ? 700 : 400, opacity: i === tier ? 1 : .55 }}>{s.toLocaleString()}</span>)}</div>

            {/* plan cards stacked */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: `1.5px solid ${C.hairStrong}`, borderRadius: 14, padding: 18 }}>
                <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>Single event</span>
                <div style={{ margin: '6px 0 2px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, color: C.purpleDeep, letterSpacing: '-0.03em' }}>€{single}</div>
                <span style={{ fontSize: 12, color: C.ink, opacity: .6 }}>per event credit</span>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Up to 200 participants', 'Valid for one event', 'Unlimited rounds'].map(t => <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.ink }}><span style={{ color: C.orange, display: 'inline-flex' }}><Ico d={check} size={14} /></span>{t}</span>)}
                </div>
                <div style={{ marginTop: 16 }}><Btn variant="ghost" full leadingIcon={<Ico d="<rect x='1' y='4' width='22' height='16' rx='2'/><line x1='1' y1='10' x2='23' y2='10'/>" size={15} />}>Pay €{single}</Btn></div>
              </div>
              <div style={{ border: `2px solid ${C.orange}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>Unlimited events</span>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: 'rgba(221,83,28,.12)', color: C.orange }}>Popular</span>
                </div>
                <div style={{ marginTop: 12, display: 'inline-flex', padding: 3, gap: 2, borderRadius: 9, background: 'rgba(76,25,77,.08)' }}>
                  {[['annual', 'Annually'], ['monthly', 'Monthly']].map(([v, l]) => {
                    const on = intv === v;
                    return <button key={v} onClick={() => setIntv(v)} style={{ padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, background: on ? '#fff' : 'transparent', color: on ? C.purpleDeep : C.ink, opacity: on ? 1 : .6 }}>{l}{v === 'annual' && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#1f7a40' }}>-17%</span>}</button>;
                  })}
                </div>
                <div style={{ marginTop: 12, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, color: C.purpleDeep, letterSpacing: '-0.03em' }}>€{intv === 'monthly' ? monthly : annualPerMo}</div>
                <span style={{ fontSize: 12, color: C.ink, opacity: .6 }}>{intv === 'monthly' ? 'per month' : `per month, billed €${annual.toLocaleString()} annually`}</span>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['Up to 200 participants', false], ['Unlimited events', true], ['Priority support', false]].map(([t, bold]) => <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.ink, fontWeight: bold ? 700 : 400 }}><span style={{ color: C.orange, display: 'inline-flex' }}><Ico d={check} size={14} /></span>{t}</span>)}
                </div>
                <div style={{ marginTop: 16 }}><Btn variant="primary" full leadingIcon={<Ico d="<rect x='1' y='4' width='22' height='16' rx='2'/><line x1='1' y1='10' x2='23' y2='10'/>" size={15} />}>Subscribe</Btn></div>
              </div>
            </div>
          </div>
        </Card>

        {/* invoices */}
        <Card>
          <div style={{ padding: '0 18px', borderBottom: `1px solid ${C.hair}`, display: 'flex', gap: 4 }}>
            {[['invoices', 'Invoices'], ['credits', 'Credit history']].map(([v, l]) => {
              const on = tab === v;
              return <button key={v} onClick={() => setTab(v)} style={{ padding: '14px 10px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, color: on ? C.purpleDeep : C.ink, opacity: on ? 1 : .55, borderBottom: `2px solid ${on ? C.purpleDeep : 'transparent'}`, marginBottom: -1 }}>{l}</button>;
            })}
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(tab === 'invoices'
              ? [['12 Feb 2026', 'Unlimited events', '€1,990.00'], ['08 Jan 2026', 'Single event credit', '€99.00'], ['12 Feb 2025', 'Unlimited events', '€990.00']]
              : [['Jan 8, 2026', 'Purchased · Up to 50', '+3'], ['Jan 20, 2026', 'Used for event', '-1']]
            ).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 11, border: `1px solid ${C.hair}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.purpleDeep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[1]}</div>
                  <div style={{ marginTop: 2, fontFamily: C.fontMono, fontSize: 11.5, color: C.ink, opacity: .6 }}>{r[0]}</div>
                </div>
                <span style={{ flexShrink: 0, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: tab === 'credits' ? (r[2][0] === '+' ? '#1f7a40' : C.orange) : C.purpleDeep }}>{r[2]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* billing details */}
        <Card>
          <div style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>Billing details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[['Name', 'Founder Summit s.r.o.'], ['Tax ID', 'SK2120998877'], ['Address', 'Hlavná 12, 811 01 Bratislava, Slovakia'], ['Invoice email', 'billing@founder-summit.com']].map(([l, v]) => (
                <div key={l}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink, opacity: .5 }}>{l}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.purpleDeep, fontWeight: 500 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Cancel subscription confirmation dialog */}
        {cancelOpen && (
          <div onClick={() => setCancelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,17,51,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18, border: `1px solid ${C.hairStrong}`, boxShadow: '0 30px 70px rgba(75,29,81,.30)', padding: 22 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep }}>Cancel subscription?</h3>
              <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55, color: C.ink, opacity: .78 }}>You'll keep full access to <strong style={{ color: C.purpleDeep }}>Unlimited events</strong> until <strong style={{ color: C.purpleDeep }}>12 Feb 2027</strong>. After that your account moves to the Free plan. Any single-event credits you own stay available.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                <button type="button" onClick={() => setCancelOpen(false)} style={{ width: '100%', fontFamily: C.fontBody, fontWeight: 700, fontSize: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: C.orange, color: '#fff', border: 'none', boxShadow: '0 6px 16px rgba(221,83,28,.22)' }}>Keep subscription</button>
                <button type="button" onClick={() => setCancelOpen(false)} style={{ width: '100%', fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: '#c0392b', border: '1.5px solid rgba(192,57,43,.4)' }}>Cancel subscription</button>
              </div>
            </div>
          </div>
        )}
      </MShell>
    );
  }

  window.LiveRoundMobileScreen = LiveRoundMobileScreen;
  window.BillingMobileScreen = BillingMobileScreen;
})();
