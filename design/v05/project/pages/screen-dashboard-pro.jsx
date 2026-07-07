// Wonderelo — Organizer · Dashboard (attractive / trimmed version)
// Same data & actions as Dashboard.tsx — fewer elements, warmer layout.
function DashboardProScreen() {
  const { WC: C, Btn, PageShell } = window;

  const Icon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    copy:  '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/>',
    ext:   '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    plus:  '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  };
  const Italic = ({ children, color = C.orangeBright }) => <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;

  const Avatars = ({ n, names }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {names.map((nm, i) => (
        <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: [C.purpleDeep, C.orange, C.purple][i % 3], color: '#fff', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i ? -8 : 0, border: '2px solid #fff' }}>{nm}</div>
      ))}
      <span style={{ marginLeft: 8, fontSize: 13, color: C.ink, opacity: .7 }}>{n} registered</span>
    </div>
  );

  function RoundLine({ name, when, parts, names, accent, live }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 18px', borderRadius: 14, background: '#fff', border: `1px solid ${C.hair}`, boxShadow: '0 6px 16px rgba(75,29,81,.05)' }}>
        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: accent }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, color: C.purpleDeep, letterSpacing: '-.015em' }}>{name}</span>
            {live && <span style={{ fontFamily: C.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: C.orange, background: 'rgba(221,83,28,.1)', border: '1px solid rgba(221,83,28,.3)', borderRadius: 999, padding: '2px 8px' }}>LIVE</span>}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: C.ink, opacity: .6 }}>{when}</div>
        </div>
        <Avatars n={parts} names={names} />
        <span style={{ color: 'rgba(75,29,81,.4)', display: 'inline-flex' }}><Icon d={I.arrow} size={17} /></span>
      </div>
    );
  }

  return (
    <PageShell navActive="Dashboard">
      {/* Hero band — greeting + shareable event link */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '34px 36px',
        background: 'radial-gradient(circle at 12% 0%, rgba(221,83,28,.30), transparent 55%), linear-gradient(135deg, ' + C.purpleDeep + ' 0%, ' + C.purple + ' 62%, #3a1442 100%)',
        boxShadow: '0 22px 44px rgba(75,29,81,.28)', marginBottom: 26,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orangeBright, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
          <span style={{ width: 22, height: 1, background: C.orangeBright }} />Founder Summit 2026
        </span>
        <h1 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: '#fff', lineHeight: 1 }}>
          Good to see you, <Italic>Andy.</Italic>
        </h1>
        <p style={{ margin: '12px 0 22px', fontSize: 14.5, color: 'rgba(255,255,255,.72)', maxWidth: 460 }}>Share your event link so people can register for your rounds.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 14, color: '#fff' }}>wonderelo.com/founder-summit</span>
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><Icon d={I.copy} size={16} /></span>
              <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><Icon d={I.qr} size={16} /></span>
            </span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#fff', opacity: .9, cursor: 'pointer' }}>View event page <Icon d={I.ext} size={14} /></span>
        </div>
      </div>

      {/* Stats — three calm tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 26 }}>
        {[['2', 'Published', C.orange], ['1', 'Scheduled', C.purple], ['104', 'People registered', C.purpleDeep]].map(([v, l, col], i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 8px 20px rgba(75,29,81,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ width: 9, height: 9, background: col, transform: 'rotate(45deg)', display: 'inline-block' }} />
              <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 34, color: C.purpleDeep, letterSpacing: '-.03em', lineHeight: 1 }}>{v}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13.5, color: C.ink, opacity: .65 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Up next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-.02em' }}>Up next</h2>
        <Btn variant="primary" size="sm" leadingIcon={<Icon d={I.plus} size={15} />}>Create round</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RoundLine name="Welcome mixer"          when="Sat 14 Jun · 14:00 · 3 rounds" parts={86} names={['AM', 'TV', 'LK']} accent={C.orange} live />
        <RoundLine name="Founders speed network" when="Sat 14 Jun · 16:30 · 2 rounds" parts={64} names={['DN', 'SL']}       accent={C.orange} />
        <RoundLine name="Investor lounge"        when="Sun 15 Jun · 11:00 · 1 round"  parts={18} names={['EK', 'MH']}       accent={C.purple} />
      </div>
    </PageShell>
  );
}

Object.assign(window, { DashboardProScreen });
