// Wonderelo — Organizer · Home (Dashboard + Rounds merged into one page)
function DashboardMergedScreen() {
  const { WC: C, Btn, PageShell } = window;
  const [onboarding, setOnboarding] = React.useState(false);
  const [welcome, setWelcome] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  // Driven from the Overview chip toggle (outside the page). First login also
  // opens the founder's welcome modal.
  React.useEffect(() => {
    window.setOnboarding = (v) => setOnboarding(v === 'on' || v === true || v === 'show');
    window.setWelcomeModal = (v) => {
      const on = v === 'on' || v === true || v === 'show' || v === 'standard' || v === 'compact';
      setWelcome(on);
      setCompact(v === 'compact');
    };
    return () => { delete window.setOnboarding; delete window.setWelcomeModal; };
  }, []);

  // ── Welcome-modal photo crop tweaks — pan (object-position) + zoom (scale). ──
  React.useEffect(() => {
    if (document.getElementById('tweaks-welcome-photo')) return;
    const DEFAULTS = /*EDITMODE-BEGIN*/{
      "welcomePosX": 50,
      "welcomePosY": 38,
      "welcomeScale": 1
    }/*EDITMODE-END*/;
    const state = Object.assign({}, DEFAULTS);
    const root = document.documentElement;
    const cssMap = {
      welcomePosX: ['--welcome-pos-x', '%'],
      welcomePosY: ['--welcome-pos-y', '%'],
      welcomeScale: ['--welcome-scale', ''],
    };
    function apply() { for (const [k, [p, s]] of Object.entries(cssMap)) root.style.setProperty(p, state[k] + s); }
    apply();
    function rowHTML(key, label, min, max, step, unit) {
      const v = state[key];
      const display = unit === '\u00d7' ? (+v).toFixed(2) : v;
      return `
        <label style="display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;">
          <span style="font-weight:600;font-size:12px;">${label}</span>
          <span data-out="${key}" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#4C194D;">${display}${unit}</span>
          <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}" style="grid-column:1 / -1;width:100%;accent-color:#dd531c;">
        </label>`;
    }
    const panel = document.createElement('div');
    panel.id = 'tweaks-welcome-photo';
    panel.style.cssText = [
      'position:fixed','right:20px','bottom:20px','z-index:9999',
      'width:280px','background:#fff','border:1px solid rgba(76,25,77,.18)',
      'border-radius:14px','box-shadow:0 12px 40px rgba(76,25,77,.18)',
      'padding:16px 16px 14px','font-family:"Bricolage Grotesque",system-ui,sans-serif',
      'font-size:13px','color:#2A1538','display:none'
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#4C194D;">Tweaks \u00b7 Welcome photo</div>
        <button type="button" id="tweaks-welcome-close" aria-label="Close" style="background:none;border:0;font-size:18px;line-height:1;color:#2A1538;cursor:pointer;padding:2px 6px;">\u00d7</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${rowHTML('welcomePosX','Position X', 0, 100, 1, '%')}
        ${rowHTML('welcomePosY','Position Y', 0, 100, 1, '%')}
        ${rowHTML('welcomeScale','Scale', 1, 3, 0.05, '\u00d7')}
      </div>`;
    document.body.appendChild(panel);
    panel.querySelectorAll('input[type=range]').forEach((input) => {
      input.addEventListener('input', () => {
        const k = input.dataset.key;
        const isScale = k.endsWith('Scale');
        const v = isScale ? parseFloat(input.value) : parseInt(input.value, 10);
        state[k] = v;
        const unit = isScale ? '\u00d7' : '%';
        const out = panel.querySelector(`[data-out="${k}"]`);
        if (out) out.textContent = (isScale ? v.toFixed(2) : v) + unit;
        apply();
        try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch (e) {}
      });
    });
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') panel.style.display = 'block';
      else if (d.type === '__deactivate_edit_mode') panel.style.display = 'none';
    };
    const onClose = () => { panel.style.display = 'none'; try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {} };
    panel.querySelector('#tweaks-welcome-close').addEventListener('click', onClose);
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
    return () => { window.removeEventListener('message', onMsg); panel.remove(); };
  }, []);

  const Icon = ({ d, size = 16, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    copy:  '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/>',
    ext:   '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    plus:  '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cal:   '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin:   '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    slide: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  };
  const Italic = ({ children, color = C.orangeBright }) => <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;

  const STATUS = {
    published: { label: 'Published', fg: C.orange,            bg: 'rgba(221,83,28,.10)', bd: 'rgba(221,83,28,.30)' },
    scheduled: { label: 'Scheduled', fg: C.purple,            bg: 'rgba(92,34,119,.10)', bd: 'rgba(92,34,119,.28)' },
    draft:     { label: 'Draft',     fg: '#9a8478',           bg: 'rgba(154,132,120,.14)', bd: 'rgba(154,132,120,.34)' },
    completed: { label: 'Completed', fg: '#1f8a4d',           bg: 'rgba(31,138,77,.10)', bd: 'rgba(31,138,77,.28)' },
  };
  const Avatars = ({ n, names }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {names.map((nm, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: [C.purpleDeep, C.orange, C.purple][i % 3], color: '#fff', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i ? -7 : 0, border: '2px solid #fff' }}>{nm}</div>)}
      {n > 0 && <span style={{ marginLeft: 8, fontSize: 12.5, color: C.ink, opacity: .65 }}>{n}</span>}
    </div>
  );
  const Meta = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .8 }}>
      <span style={{ color: 'rgba(75,29,81,.45)', display: 'inline-flex' }}><Icon d={icon} size={14} /></span>{children}
    </div>
  );
  function RoundCard({ name, date, time, status, parts, names, point }) {
    const st = STATUS[status];
    return (
      <div style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
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
            {parts > 0
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.ink, opacity: .7 }}><span style={{ color: 'rgba(75,29,81,.45)', display: 'inline-flex' }}><Icon d={I.users} size={15} /></span>{parts} registered</span>
              : <span style={{ fontSize: 13, color: C.ink, opacity: .45 }}>No registrations yet</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.purpleDeep, cursor: 'pointer' }}>Manage <Icon d={I.arrow} size={14} /></span>
          </div>
        </div>
      </div>
    );
  }
  const Pill = ({ label, count, active }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.fontBody, background: active ? C.purpleDeep : '#fff', color: active ? '#fff' : C.ink, border: `1.5px solid ${active ? C.purpleDeep : C.hairStrong}`, opacity: active ? 1 : .8 }}>
      {label}
      <span style={{ fontFamily: C.fontMono, fontSize: 11.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: active ? 'rgba(255,255,255,.2)' : 'rgba(76,25,77,.07)', color: active ? '#fff' : C.purpleDeep }}>{count}</span>
    </div>
  );

  const rounds = [
    { name: 'Welcome mixer',          date: 'Sat 14 Jun 2026', time: '14:00 · 3 rounds', status: 'published', parts: 86, names: ['AM','TV','LK'], point: 'Main entrance' },
    { name: 'Founders speed network', date: 'Sat 14 Jun 2026', time: '16:30 · 2 rounds', status: 'published', parts: 64, names: ['DN','SL'],      point: 'Rooftop bar' },
    { name: 'Investor lounge',        date: 'Sun 15 Jun 2026', time: '11:00 · 1 round',  status: 'scheduled', parts: 18, names: ['EK','MH'],      point: 'Hall B · Stage left' },
    { name: 'Design jam meetup',      date: 'Sun 15 Jun 2026', time: '15:00 · 2 rounds', status: 'draft',     parts: 0,  names: [],                 point: 'Not set' },
    { name: 'Closing party connect',  date: 'Sun 15 Jun 2026', time: '20:00 · 1 round',  status: 'draft',     parts: 0,  names: [],                 point: 'Garden terrace' },
    { name: 'Morning coffee rounds',  date: 'Fri 13 Jun 2026', time: '09:00 · 2 rounds', status: 'completed', parts: 52, names: ['JK','PR','AB'], point: 'Café corner' },
  ];

  const cnt = (s) => rounds.filter((r) => r.status === s).length;

  // ── Welcome-modal size config. `compact` fits the whole card on a 13" MacBook ──
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

  return (
    <PageShell navActive="Rounds">
      {/* First-login welcome modal — the founder's story + a wish for the organizer */}
      {welcome && (
        <div onClick={() => setWelcome(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(45,17,51,.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: wz.modalW, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto', background: '#fff', borderRadius: 24, border: `1px solid ${C.hairStrong}`, boxShadow: '0 40px 100px rgba(45,17,51,.45)', position: 'relative' }}>
            <button onClick={() => setWelcome(false)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, zIndex: 3, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.92)', color: C.purpleDeep, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}>
              <Icon d="<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>" size={18} />
            </button>
            {/* Photo from the founder's 30th birthday party — pan/zoom via Tweaks */}
            <div style={{ position: 'relative', borderRadius: '24px 24px 0 0', overflow: 'hidden', background: C.cream, height: wz.photoH }}>
              <img src="assets/Andy-birthday-30-Wonderelo.png" alt="Andy's 30th birthday party — the night Wonderelo began" style={{ display: 'block', width: '100%', height: wz.photoH, objectFit: 'cover', objectPosition: 'var(--welcome-pos-x, 50%) var(--welcome-pos-y, 38%)', transform: 'scale(var(--welcome-scale, 1))', transformOrigin: 'var(--welcome-pos-x, 50%) var(--welcome-pos-y, 38%)' }} />
              {/* "That's me!" founder annotation — hand label + drawn arrow to his face, as on Our Story */}
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
                <p style={{ margin: 0 }}>So I'd asked a friend to build an app that paired two random guests every few minutes and sent them off to meet for one drink. Ninety minutes later the room was full of friendships — many of them last till today — that never would have happened on their own.</p>
                <p style={{ margin: 0 }}>That night, it wasn't only my birthday we celebrated: <strong style={{ color: C.purpleDeep, fontWeight: 700 }}>Wonderelo</strong> was born too.</p>
              </div>
              <div style={{ marginTop: wz.callMt, padding: wz.callPad, borderRadius: 14, background: 'rgba(221,83,28,.06)', border: '1px solid rgba(221,83,28,.22)', fontSize: wz.callFs, lineHeight: 1.55, color: C.purpleDeep }}>
                Now it's your turn. I hope Wonderelo helps you bring your people together — and makes your event truly <Italic color={C.orange}>unforgettable</Italic>.
              </div>
              <div style={{ marginTop: wz.rowMt, display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="assets/Andy-Abel-Wonderelo.jpg" alt="Andy Abel" style={{ width: wz.avatar, height: wz.avatar, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.hair}` }} />
                <div>
                  <div style={{ fontFamily: C.fontHand, fontWeight: 700, fontSize: wz.name, color: C.purpleDeep, lineHeight: 1 }}>Andy Abel</div>
                  <div style={{ marginTop: 3, fontSize: wz.role, color: C.ink, opacity: .6 }}>Founder of Wonderelo</div>
                </div>
              </div>
              <button onClick={() => setWelcome(false)} style={{ marginTop: wz.btnMt, width: '100%', padding: wz.btnPad, borderRadius: 12, border: 'none', background: C.orange, color: '#fff', fontFamily: C.fontBody, fontWeight: 700, fontSize: wz.btnFs, cursor: 'pointer', boxShadow: '0 8px 20px rgba(221,83,28,.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Let's make your event unforgettable <Icon d={I.arrow} size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero band — greeting + shareable event link */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '34px 36px',
        background: 'radial-gradient(circle at 12% 0%, rgba(221,83,28,.30), transparent 55%), linear-gradient(135deg, ' + C.purpleDeep + ' 0%, ' + C.purple + ' 62%, #3a1442 100%)',
        boxShadow: '0 22px 44px rgba(75,29,81,.28)', marginBottom: 22,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orangeBright, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
          <span style={{ width: 22, height: 1, background: C.orangeBright }} />Founder Summit 2026
        </span>
        <h1 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', color: '#fff', lineHeight: 1.04 }}>
          Let's make your event <Italic>unforgettable</Italic>, Andy.
        </h1>
        <p style={{ margin: '12px 0 22px', fontSize: 14.5, color: 'rgba(255,255,255,.72)', maxWidth: 460 }}>Share your event link so people can register for your rounds.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 14, color: '#fff' }}>wonderelo.com/founder-summit</span>
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><Icon d={I.copy} size={16} /></span>
              <span style={{ color: 'rgba(255,255,255,.85)', display: 'inline-flex', cursor: 'pointer' }}><Icon d={I.qr} size={16} /></span>
            </span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#fff', opacity: .9, cursor: 'pointer' }}>View event page <Icon d={I.ext} size={14} /></span>
          <a href="Event Promo Slide.html" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#fff', color: C.purpleDeep, fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}><Icon d={I.slide} size={15} /> Slide</a>
        </div>
      </div>

      {onboarding && (
        <div style={{ marginBottom: 26, borderRadius: 18, border: `1px solid rgba(221,83,28,.25)`, background: 'rgba(221,83,28,.04)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep }}>
              <span style={{ color: C.orange, display: 'inline-flex' }}><Icon d={I.rocket} size={19} /></span>Get started
            </span>
            <span onClick={() => setOnboarding(false)} style={{ color: 'rgba(75,29,81,.4)', cursor: 'pointer', display: 'inline-flex' }}><Icon d="<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>" size={18} /></span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: C.ink, opacity: .65 }}>1 of 4 steps completed</p>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(76,25,77,.10)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ width: '25%', height: '100%', background: C.orange, borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [I.link, 'Choose your event page URL', 'Pick a memorable URL like wonderelo.com/your-name', true],
              [I.eye,  'Open your event page', 'See what participants see when they visit your page', false],
              [I.edit, 'Create new round', 'Set up a networking round with your event details', false],
              [I.rocket, 'Publish a round', 'Make your round visible on your event page', false],
            ].map(([ic, label, desc, done], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, background: done ? 'rgba(31,138,77,.07)' : '#fff', border: `1px solid ${C.hair}` }}>
                <span style={{ color: done ? '#1f8a4d' : 'rgba(75,29,81,.35)', display: 'inline-flex', marginTop: 1 }}><Icon d={done ? I.check : I.circle} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: C.fontBody, fontWeight: 700, fontSize: 14, color: done ? 'rgba(43,24,16,.5)' : C.purpleDeep, textDecoration: done ? 'line-through' : 'none' }}>{label}</div>
                  <div style={{ marginTop: 3, fontSize: 12.5, color: C.ink, opacity: .6 }}>{desc}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: C.purple, cursor: 'pointer', flexShrink: 0 }}>Show me</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rounds section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, letterSpacing: '-.03em', color: C.purpleDeep, lineHeight: 1 }}>Your <Italic color={C.orange}>rounds</Italic></h2>
        <Btn variant="primary" leadingIcon={<Icon d={I.plus} size={15} />}>Create round</Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ width: 260, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', borderRadius: 999, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={I.search} size={15} /></span>
          <span style={{ fontSize: 13.5, color: 'rgba(43,24,16,.5)' }}>Search rounds…</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Pill label="All" count={rounds.length} active />
          <Pill label="Published" count={cnt('published')} />
          <Pill label="Scheduled" count={cnt('scheduled')} />
          <Pill label="Draft" count={cnt('draft')} />
          <Pill label="Completed" count={cnt('completed')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {rounds.map((r, i) => <RoundCard key={i} {...r} />)}
      </div>
    </PageShell>
  );
}

Object.assign(window, { DashboardMergedScreen });
