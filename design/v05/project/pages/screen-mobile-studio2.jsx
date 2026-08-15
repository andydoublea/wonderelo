// Wonderelo — Organizer studio MOBILE versions (part 2)
// Account settings · Event page settings · Round created — faithful mobile
// redesigns reusing the mobile shell + atoms from screen-mobile-studio.jsx.
(function () {
  const C = window.WC;
  const R = React;
  const MShell = window.MStudioShell;
  const { MIcon, MI, Italic, Eyebrow } = window.MStudioAtoms;
  const Btn = window.Btn;

  // shared mobile header (eyebrow + title)
  const MHead = ({ eyebrow, title, lede }) => (
    <div style={{ marginBottom: 20 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.purpleDeep }}>{title}</h1>
      {lede && <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: C.ink, opacity: .78 }}>{lede}</p>}
    </div>
  );
  const Label = ({ children }) => (
    <span style={{ display: 'block', fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase', marginBottom: 8 }}>{children}</span>
  );
  const MField = ({ value, placeholder, prefix, suffix, disabled, focused, type = 'text' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: disabled ? C.cream : '#fff', border: `1.5px solid ${focused ? C.orange : C.hairStrong}`, boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none' }}>
      {prefix && <span style={{ color: C.ink, opacity: .55, fontSize: 13.5, fontFamily: C.fontMono, whiteSpace: 'nowrap' }}>{prefix}</span>}
      <input type={type} defaultValue={value} placeholder={placeholder} readOnly disabled={disabled} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 14.5, color: disabled ? 'rgba(58,46,52,.55)' : C.ink, minWidth: 0 }} />
      {suffix && <span style={{ color: C.purple, fontSize: 12, fontWeight: 600, fontFamily: C.fontMono, whiteSpace: 'nowrap' }}>{suffix}</span>}
    </div>
  );
  const Link = ({ children, onClick }) => (
    <button type="button" onClick={onClick} style={{ display: 'block', marginTop: 9, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, color: C.orange }}>{children}</button>
  );

  // ══════════════════════════════════════════════════════════════
  // ACCOUNT SETTINGS (mobile)
  // ══════════════════════════════════════════════════════════════
  function AccountMobileScreen() {
    const [showEmail, setShowEmail] = R.useState(false);
    const [showPass, setShowPass] = R.useState(false);
    const InlineForm = ({ children }) => (
      <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    );
    const ActionRow = ({ label, onCancel }) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${C.hairStrong}`, background: '#fff', color: C.purpleDeep, fontFamily: C.fontBody, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{label}</button>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'transparent', color: C.ink, opacity: .7, fontFamily: C.fontBody, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
      </div>
    );
    return (
      <MShell active="Account">
        <MHead eyebrow="Your account" title={<>Account <Italic>settings</Italic></>} />
        <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 22 }}>
          <h3 style={{ margin: '0 0 20px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 18, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Account information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <Label>Your name</Label>
              <MField value="Andy Abel" focused />
              <p style={{ margin: '7px 0 0', fontSize: 11.5, color: C.ink, opacity: .6 }}>Saves automatically</p>
            </div>
            <div>
              <Label>Email</Label>
              <MField value="andy@founder-summit.com" disabled />
              <Link onClick={() => setShowEmail(v => !v)}>{showEmail ? 'Cancel' : 'Change email'}</Link>
              {showEmail && (
                <InlineForm>
                  <p style={{ margin: 0, fontSize: 12.5, color: C.ink, opacity: .7, lineHeight: 1.5 }}>We'll send a verification email to your new address.</p>
                  <div><Label>New email</Label><MField placeholder="Enter new email" type="email" /></div>
                  <div><Label>Current password</Label><MField placeholder="Enter current password" type="password" /></div>
                  <ActionRow label="Change email" onCancel={() => setShowEmail(false)} />
                </InlineForm>
              )}
            </div>
            <div>
              <Label>Password</Label>
              <MField value="••••••••" disabled />
              <Link onClick={() => setShowPass(v => !v)}>{showPass ? 'Cancel' : 'Change password'}</Link>
              {showPass && (
                <InlineForm>
                  <div><Label>Current password</Label><MField placeholder="Enter current password" type="password" /></div>
                  <div><Label>New password</Label><MField placeholder="Enter new password" type="password" /><p style={{ margin: '7px 0 0', fontSize: 11.5, color: C.ink, opacity: .6 }}>At least 6 characters</p></div>
                  <div><Label>Confirm new password</Label><MField placeholder="Confirm new password" type="password" /></div>
                  <ActionRow label="Change password" onCancel={() => setShowPass(false)} />
                </InlineForm>
              )}
            </div>
          </div>
        </section>
      </MShell>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // EVENT PAGE SETTINGS (mobile)
  // ══════════════════════════════════════════════════════════════
  function EventSettingsMobileScreen() {
    return (
      <MShell active="Event page">
        <MHead eyebrow="Event page" title={<>Event page <Italic>settings</Italic></>} lede="This information is visible on your event page." />
        <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div><Label>Event organizer name</Label><MField value="Founder Summit 2026" /></div>
            <div><Label>Event page URL</Label><MField prefix="wonderelo.com /" value="founder-summit" suffix="✓ available" focused /></div>
            <div>
              <Label>Profile image</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${C.purpleDeep} 0%, ${C.purple} 60%, ${C.orange} 130%)`, border: `2px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 26, color: '#fff', letterSpacing: '-.02em' }}>FS</span>
                </div>
                <div style={{ flex: 1 }}>
                  <button style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontFamily: C.fontBody, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                    <MIcon d="<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/>" size={15} /> Upload image
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, color: C.ink, opacity: .6, lineHeight: 1.45 }}>JPG, PNG, WEBP · Up to 5MB · 200×200px+</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div style={{ marginTop: 14 }}>
          <Btn variant="primary" full size="lg" leadingIcon={<MIcon d="<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'/><polyline points='17 21 17 13 7 13 7 21'/><polyline points='7 3 7 8 15 8'/>" size={15} />}>Save changes</Btn>
        </div>
      </MShell>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ROUND CREATED (mobile) — mirrors RoundSuccessScreen
  // ══════════════════════════════════════════════════════════════
  function RoundCreatedMobileScreen() {
    if (typeof window !== 'undefined') {
      window.__wRoundStatus = window.__wRoundStatus || 'published';
      window.setRoundStatus = window.setRoundStatus || ((v) => { window.__wRoundStatus = v; window.dispatchEvent(new CustomEvent('w-roundstatus')); });
    }
    const [status, setStatus] = R.useState((typeof window !== 'undefined' && window.__wRoundStatus) || 'published');
    const [copied, setCopied] = R.useState(false);
    const fallRef = R.useRef(null);
    R.useEffect(() => {
      let raf = null, last = null, pieces = [];
      const GRN = '#1f8a5b';
      const COLORS = [C.orange, C.orangeBright, C.purple, GRN, '#f5b301'];
      function tick(ts) {
        if (last == null) last = ts;
        const dt = Math.min(48, ts - last); last = ts;
        let alive = 0;
        for (const p of pieces) {
          if (p.done) continue;
          p.y += p.vy * dt; p.rot += p.vr * dt;
          const sway = Math.sin(p.y * 0.05 + p.ph) * p.amp;
          p.el.style.transform = `translate(${sway}px, ${p.y}vh) rotate(${p.rot}deg)`;
          if (p.y > 114) { p.done = true; p.el.remove(); } else alive++;
        }
        if (alive > 0) raf = requestAnimationFrame(tick);
        else { raf = null; last = null; pieces = []; }
      }
      function drop() {
        const host = fallRef.current; if (!host) return;
        for (let i = 0; i < 90; i++) {
          const el = document.createElement('i');
          const w = 6 + Math.random() * 8, h = 4 + Math.random() * 6;
          el.style.cssText = `position:absolute;top:0;left:${Math.random() * 100}vw;width:${w}px;height:${h}px;background:${COLORS[i % COLORS.length]};border-radius:1px;opacity:.95;will-change:transform;`;
          host.appendChild(el);
          pieces.push({ el, y: -10 - Math.random() * 40, vy: 0.012 + Math.random() * 0.016, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 0.35, amp: 5 + Math.random() * 20, ph: Math.random() * 6.28, done: false });
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
    const GREEN = '#1f8a5b';
    const Meta = ({ icon, children }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: C.fontBody, fontSize: 13.5, color: C.ink }}>
        <span style={{ color: C.orange, display: 'inline-flex', flexShrink: 0 }}><MIcon d={icon} size={15} /></span>{children}
      </div>
    );
    const confetti = [
      { l: '6%', t: 30, c: C.orange, s: 11 }, { l: '20%', t: 78, c: C.purple, s: 8 },
      { l: '30%', t: 14, c: C.orangeBright, s: 9 }, { l: '70%', t: 16, c: GREEN, s: 10 },
      { l: '84%', t: 74, c: C.purple, s: 8 }, { l: '92%', t: 34, c: C.orangeBright, s: 11 },
      { l: '50%', t: 4, c: C.orange, s: 7 }, { l: '60%', t: 88, c: C.orange, s: 8 },
    ];
    const ShareBtn = ({ icon, children, onClick, active }) => (
      <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: C.fontBody, fontSize: 12.5, fontWeight: 600, background: active ? 'rgba(31,138,91,.10)' : '#fff', border: `1.5px solid ${active ? 'rgba(31,138,91,.4)' : C.hairStrong}`, color: active ? GREEN : C.purpleDeep }}>
        <MIcon d={icon} size={17} />{children}
      </button>
    );
    return (
      <MShell active="Rounds">
        <div ref={fallRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 80 }} />
        <div style={{ position: 'relative', textAlign: 'center', paddingTop: 10 }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: '0 -10px', pointerEvents: 'none' }}>
            {confetti.map((d, i) => <i key={i} style={{ position: 'absolute', left: d.l, top: d.t, width: d.s, height: d.s, background: d.c, transform: 'rotate(45deg)', opacity: .9, borderRadius: 1 }} />)}
          </div>
          <div style={{ position: 'relative', width: 78, height: 78, margin: '0 auto', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(31,138,91,.34)' }}>
            <span style={{ color: '#fff', display: 'inline-flex' }}><MIcon d="<polyline points='20 6 9 17 4 12'/>" size={38} sw={3} /></span>
          </div>
          <div style={{ marginTop: 18 }}><Eyebrow>Founder Summit 2026</Eyebrow></div>
          <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.purpleDeep }}>Round created <Italic>successfully</Italic></h1>
          <p style={{ margin: '12px auto 0', maxWidth: 320, fontSize: 14, lineHeight: 1.5, color: C.ink, opacity: .8 }}>
            {isDraft ? 'Saved as a draft. Schedule it to make it visible on your event page.' : 'Welcome mixer is live. Share it to start filling those rounds.'}
          </p>
        </div>

        {/* round card */}
        <div style={{ marginTop: 26, overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, boxShadow: '0 10px 26px rgba(75,29,81,.07)' }}>
          <div style={{ height: 4, background: isDraft ? '#9a8478' : C.orange }} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, letterSpacing: '-.025em', color: C.purpleDeep }}>Welcome mixer</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isDraft ? 'rgba(154,132,120,.14)' : 'rgba(221,83,28,.10)', border: `1px solid ${isDraft ? 'rgba(154,132,120,.34)' : 'rgba(221,83,28,.30)'}`, color: isDraft ? '#9a8478' : C.orange, fontFamily: C.fontMono, fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: isDraft ? '#9a8478' : C.orange }} />{isDraft ? 'Draft' : 'Published'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Meta icon={MI.cal}>Sat 14 Jun 2026</Meta>
              <Meta icon={MI.clock}>14:00 · 3 rounds · 6 min</Meta>
              <Meta icon={MI.pin}>Main entrance</Meta>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              <span style={{ fontSize: 12.5, color: C.ink, opacity: .45 }}>No registrations yet</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep }}>Edit <MIcon d={MI.arrow} size={13} /></span>
            </div>
          </div>
        </div>

        {/* share / draft */}
        {isDraft ? (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 14, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.30)' }}>
            <span style={{ color: '#d98a0b', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><MIcon d="<path d='M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>" size={20} /></span>
            <div>
              <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 15, color: C.purpleDeep }}>This round is in draft mode</div>
              <p style={{ margin: '5px 0 12px', fontSize: 13, lineHeight: 1.5, color: C.ink, opacity: .75 }}>Schedule it to publish it on your event page.</p>
              <Btn variant="primary" leadingIcon={<MIcon d={MI.cal} size={15} />}>Schedule round</Btn>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 20, boxShadow: '0 10px 26px rgba(75,29,81,.05)' }}>
            <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', color: C.purpleDeep }}>Share your event</h3>
            <p style={{ margin: '6px 0 14px', fontSize: 13, lineHeight: 1.5, color: C.ink, opacity: .72 }}>Your round is live — promote it to get participants registered.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: C.cream, border: `1px solid ${C.hairStrong}` }}>
              <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex', flexShrink: 0 }}><MIcon d={MI.ext} size={14} /></span>
              <code style={{ flex: 1, fontFamily: C.fontMono, fontSize: 12.5, color: C.purpleDeep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>wonderelo.com/founder-summit-2026</code>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9, marginTop: 14 }}>
              <ShareBtn icon={copied ? '<polyline points=\'20 6 9 17 4 12\'/>' : MI.copy} active={copied} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? 'Copied!' : 'Copy URL'}</ShareBtn>
              <ShareBtn icon={MI.qr}>QR code</ShareBtn>
              <ShareBtn icon={MI.slide}>Promo</ShareBtn>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" full size="lg" trailingIcon={<MIcon d={MI.arrow} size={14} />}>Create another round</Btn>
          <Btn variant="ghost" full size="lg" leadingIcon={<MIcon d="<line x1='19' y1='12' x2='5' y2='12'/><polyline points='12 19 5 12 12 5'/>" size={15} />}>Back to rounds</Btn>
        </div>
      </MShell>
    );
  }

  window.AccountMobileScreen = AccountMobileScreen;
  window.EventSettingsMobileScreen = EventSettingsMobileScreen;
  window.RoundCreatedMobileScreen = RoundCreatedMobileScreen;
})();
