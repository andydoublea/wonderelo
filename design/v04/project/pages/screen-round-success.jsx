// Wonderelo — Phase 03 · Round created (success)
// Maps to: src/components/SessionSuccessPage.tsx (SessionSuccessView)
// Organizer lands here right after creating a round. Two states, flipped by the
// Overview "Status" dev toggle (window.setRoundStatus):
//   · published → celebratory "share your event" card (URL · copy · QR · promo slide)
//   · draft     → amber "schedule it" notice instead of the share card
function RoundSuccessScreen() {
  const { WC: C, Italic, Diamond, Btn, PageShell } = window;
  const R = React;

  // ── Dev-only state: published vs draft ──
  if (typeof window !== 'undefined') {
    window.__wRoundStatus = window.__wRoundStatus || 'published';
    window.setRoundStatus = window.setRoundStatus || ((v) => {
      window.__wRoundStatus = v; window.dispatchEvent(new CustomEvent('w-roundstatus'));
    });
  }
  const [status, setStatus] = R.useState((typeof window !== 'undefined' && window.__wRoundStatus) || 'published');
  const [copied, setCopied] = R.useState(false);
  const fallRef = R.useRef(null);
  // Dev-triggered "falling confetti" — rAF-driven (not CSS) so it animates even on
  // the Overview board where CSS animations are force-disabled. window.dropConfetti().
  R.useEffect(() => {
    let raf = null, last = null, pieces = [];
    const COLORS = [C.orange, C.orangeBright, C.purple, GREEN, '#f5b301'];
    function tick(ts) {
      if (last == null) last = ts;
      const dt = Math.min(48, ts - last); last = ts;
      let alive = 0;
      for (const p of pieces) {
        if (p.done) continue;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const sway = Math.sin(p.y * 0.05 + p.ph) * p.amp;
        p.el.style.transform = `translate(${sway}px, ${p.y}vh) rotate(${p.rot}deg)`;
        if (p.y > 114) { p.done = true; p.el.remove(); } else alive++;
      }
      if (alive > 0) raf = requestAnimationFrame(tick);
      else { raf = null; last = null; pieces = []; }
    }
    function drop() {
      const host = fallRef.current; if (!host) return;
      for (let i = 0; i < 120; i++) {
        const el = document.createElement('i');
        const w = 6 + Math.random() * 9, h = 4 + Math.random() * 7;
        el.style.cssText = `position:absolute;top:0;left:${Math.random() * 100}vw;width:${w}px;height:${h}px;background:${COLORS[i % COLORS.length]};border-radius:1px;opacity:.95;will-change:transform;`;
        host.appendChild(el);
        pieces.push({ el, y: -10 - Math.random() * 45, vy: 0.011 + Math.random() * 0.016, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 0.35, amp: 6 + Math.random() * 24, ph: Math.random() * 6.28, done: false });
      }
      if (!raf) { last = null; raf = requestAnimationFrame(tick); }
    }
    window.dropConfetti = drop;
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, []);
  R.useEffect(() => {
    const h = () => setStatus(window.__wRoundStatus || 'published');
    window.addEventListener('w-roundstatus', h);
    return () => window.removeEventListener('w-roundstatus', h);
  }, []);
  const isDraft = status === 'draft';

  const Icon = ({ d, size = 18, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const I = {
    check: '<polyline points="20 6 9 17 4 12"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14" y2="17"/><line x1="14" y1="20" x2="17" y2="20"/><line x1="20" y1="14" x2="21" y2="14"/><line x1="17" y1="17" x2="21" y2="17"/><line x1="21" y1="20" x2="21" y2="21"/>',
    slide: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  };

  const GREEN = '#1f8a5b';
  const eventUrl = 'wonderelo.com/founder-summit-2026';

  // Stylized QR motif — decorative, not a scannable code (seeded so it's stable).
  const qr = R.useMemo(() => {
    const n = 21; const cells = [];
    let s = 1337; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c > n - 8) || (r > n - 8 && c < 7);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (finder(r, c)) {
        const inR = r % (n - 1), inC = c % (n - 1);
        const rr = r < 7 ? r : r - (n - 7), cc = c < 7 ? c : c - (n - 7);
        const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        cells.push(ring || core);
      } else cells.push(rnd() > 0.56);
    }
    return { n, cells };
  }, []);

  const Meta = ({ icon, children, strong }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: C.fontBody, fontSize: 14, color: C.ink, fontWeight: strong ? 600 : 400 }}>
      <span style={{ color: C.orange, display: 'inline-flex', flexShrink: 0 }}><Icon d={icon} size={16} /></span>{children}
    </div>
  );

  const ShareBtn = ({ icon, children, onClick, active }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
      padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
      fontFamily: C.fontBody, fontSize: 14, fontWeight: 600,
      background: active ? 'rgba(31,138,91,.10)' : '#fff',
      border: `1.5px solid ${active ? 'rgba(31,138,91,.4)' : C.hairStrong}`,
      color: active ? GREEN : C.purpleDeep,
    }}>
      <Icon d={icon} size={16} />{children}
    </button>
  );

  // Confetti scatter — base state is the visible end state, so it still reads
  // when entrance animations are stripped (e.g. on the zoomed-out Overview).
  const confetti = [
    { l: '8%',  t: 38,  c: C.orange,       s: 13, r: 18 }, { l: '17%', t: 96,  c: C.purple,      s: 9,  r: -12 },
    { l: '26%', t: 20,  c: C.orangeBright, s: 10, r: 30 }, { l: '40%', t: 120, c: GREEN,         s: 8,  r: 8 },
    { l: '60%', t: 118, c: C.orange,       s: 9,  r: -20 },{ l: '74%', t: 24,  c: GREEN,         s: 11, r: 14 },
    { l: '83%', t: 92,  c: C.purple,       s: 9,  r: 22 }, { l: '92%', t: 44,  c: C.orangeBright, s: 13, r: -8 },
    { l: '50%', t: 8,   c: C.orange,       s: 8,  r: 0 },  { l: '34%', t: 70,  c: C.purple,      s: 7,  r: -24 },
    { l: '66%', t: 64,  c: C.orangeBright, s: 8,  r: 16 },
  ];

  return (
    <PageShell navActive="Rounds" bg={C.paper}>

      {/* Dev-triggered falling confetti layer */}
      <div ref={fallRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 80 }} />

      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* ── Celebration header ── */}
        <div style={{ position: 'relative', textAlign: 'center', paddingTop: 18 }}>
          <div className="rs-confetti" aria-hidden="true" style={{ position: 'absolute', inset: '0 -40px', pointerEvents: 'none' }}>
            {confetti.map((d, i) => (
              <i key={i} style={{ position: 'absolute', left: d.l, top: d.t, width: d.s, height: d.s, background: d.c, transform: `rotate(45deg)`, opacity: .9, borderRadius: 1 }} />
            ))}
          </div>

          <div className="rs-ring" style={{ position: 'relative', width: 88, height: 88, margin: '0 auto', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 34px rgba(31,138,91,.34)' }}>
            <span style={{ color: '#fff', display: 'inline-flex' }}><Icon d={I.check} size={42} sw={3} /></span>
          </div>

          <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
            <span style={{ width: 22, height: 1, background: C.orange }} />Founder Summit 2026<span style={{ width: 22, height: 1, background: C.orange }} />
          </div>
          <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 46, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.purpleDeep }}>
            Round created <Italic>successfully.</Italic>
          </h1>
          <p style={{ margin: '14px auto 0', maxWidth: 440, fontSize: 15.5, lineHeight: 1.55, color: C.ink, opacity: .8 }}>
            {isDraft
              ? 'Your round is saved as a draft. Schedule it to make it visible on your event page.'
              : 'Welcome mixer is live on your event page. Share it to start filling those rounds.'}
          </p>
        </div>

        {/* ── Created round card ── */}
        <div style={{ marginTop: 34, overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, boxShadow: '0 14px 34px rgba(75,29,81,.08)' }}>
          <div style={{ height: 4, background: isDraft ? '#9a8478' : C.orange }} />
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 23, letterSpacing: '-.025em', color: C.purpleDeep, lineHeight: 1.05 }}>Welcome mixer</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: isDraft ? 'rgba(154,132,120,.14)' : 'rgba(221,83,28,.10)', border: `1px solid ${isDraft ? 'rgba(154,132,120,.34)' : 'rgba(221,83,28,.30)'}`, color: isDraft ? '#9a8478' : C.orange, fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isDraft ? '#9a8478' : C.orange }} />{isDraft ? 'Draft' : 'Published'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px 20px' }}>
              <Meta icon={I.cal}>Sat 14 Jun 2026</Meta>
              <Meta icon={I.clock}>14:00 · 3 rounds · 6 min</Meta>
              <Meta icon={I.pin}>Main entrance</Meta>
              <Meta icon={I.users}>Across groups · pairs</Meta>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
              <span style={{ fontSize: 13, color: C.ink, opacity: .45 }}>No registrations yet</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.purpleDeep, cursor: 'pointer' }}>Edit round <Icon d={I.arrow} size={13} /></span>
            </div>
          </div>
        </div>

        {/* ── Draft notice OR share card ── */}
        {isDraft ? (
          <div style={{ marginTop: 18, display: 'flex', gap: 14, alignItems: 'flex-start', padding: '20px 22px', borderRadius: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.30)' }}>
            <span style={{ color: '#d98a0b', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><Icon d={I.warn} size={22} /></span>
            <div>
              <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>This round is in draft mode</div>
              <p style={{ margin: '5px 0 14px', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .75 }}>Participants can’t see or register for it yet. Schedule it to publish it on your event page.</p>
              <Btn variant="primary" leadingIcon={<Icon d={I.cal} size={15} />}>Schedule round</Btn>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 26, boxShadow: '0 10px 26px rgba(75,29,81,.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
              {/* QR motif */}
              <div style={{ width: 132, padding: 12, borderRadius: 14, background: C.cream, border: `1px solid ${C.hair}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${qr.n}, 1fr)`, gap: 1, aspectRatio: '1 / 1' }}>
                  {qr.cells.map((on, i) => <span key={i} style={{ background: on ? C.purpleInk : 'transparent', borderRadius: .5 }} />)}
                </div>
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep }}>Share your event</h3>
                <p style={{ margin: '6px 0 14px', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .72 }}>Your round is live — promote it to get participants registered.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: C.cream, border: `1px solid ${C.hairStrong}` }}>
                  <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex', flexShrink: 0 }}><Icon d={I.external} size={15} /></span>
                  <code style={{ flex: 1, fontFamily: C.fontMono, fontSize: 13, color: C.purpleDeep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventUrl}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
              <ShareBtn icon={copied ? I.check : I.copy} active={copied} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? 'Copied!' : 'Copy URL'}</ShareBtn>
              <ShareBtn icon={I.qr}>QR code</ShareBtn>
              <ShareBtn icon={I.slide}>Promo slide</ShareBtn>
            </div>

            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.orange, cursor: 'pointer' }}>How to promote your event <Icon d={I.arrow} size={13} /></span>
            </div>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
          <Btn variant="ghost" leadingIcon={<Icon d={I.back} size={15} />}>Back to rounds</Btn>
          <Btn variant="secondary" trailingIcon={<Icon d={I.arrow} size={14} />}>Create another round</Btn>
        </div>

      </div>
    </PageShell>
  );
}

window.RoundSuccessScreen = RoundSuccessScreen;
