// Wonderelo — Phase 04 · Account + Billing settings
// Maps to: src/components/AccountSettings.tsx + src/components/BillingSettings.tsx

// Account settings — content matches AccountSettings.tsx EXACTLY:
// one "Account information" card → Your name (autosave) · Email (+ change-email
// form) · Password (+ change-password form). Nothing else exists on this page.
function AccountSettingsScreen() {
  const { WC: C, Italic, PageShell, PageHead } = window;
  const R = React;
  const [showEmail, setShowEmail] = R.useState(false);
  const [showPass, setShowPass] = R.useState(false);

  const Label = ({ children, htmlFor }) => (
    <span style={{ display: 'block', fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase', marginBottom: 8 }}>{children}</span>
  );
  const Field = ({ value, placeholder, type = 'text', disabled = false, focused = false }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11,
      background: disabled ? C.cream : '#fff',
      border: `1.5px solid ${focused ? C.orange : C.hairStrong}`,
      boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
    }}>
      <input type={type} defaultValue={value} placeholder={placeholder} readOnly disabled={disabled} style={{
        flex: 1, border: 'none', outline: 'none', background: 'transparent',
        fontFamily: C.fontBody, fontSize: 14, color: disabled ? 'rgba(58,46,52,.55)' : C.ink, minWidth: 0,
      }} />
    </div>
  );
  const LinkBtn = ({ children, onClick }) => (
    <button type="button" onClick={onClick} style={{
      display: 'block', marginTop: 8, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: C.fontBody, fontSize: 12.5, fontWeight: 600, color: C.orange,
    }}>{children}</button>
  );
  const Hint = ({ children }) => (
    <p style={{ margin: '7px 0 0', fontSize: 11.5, color: C.ink, opacity: .6 }}>{children}</p>
  );
  const ActionBtn = ({ children, outline, onClick }) => (
    <button type="button" onClick={onClick} style={{
      fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '9px 16px', borderRadius: 10,
      background: 'transparent',
      color: C.purpleDeep,
      border: outline ? `1.5px solid ${C.hairStrong}` : '1px solid transparent',
      opacity: outline ? 1 : .8,
    }}>{children}</button>
  );
  const InlineForm = ({ children }) => (
    <div style={{ maxWidth: 380, marginTop: 16, padding: 18, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
  );

  return (
    <PageShell navActive="Account">
      <PageHead eyebrow="Your account" title={<>Account <Italic>settings</Italic></>} />

      <div style={{ maxWidth: 760 }}>
        <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 28 }}>
          <h3 style={{ margin: '0 0 24px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Account information</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Your name — saves automatically */}
            <div style={{ maxWidth: 380 }}>
              <Label>Your name</Label>
              <Field value="Andy Abel" placeholder="John Doe" focused />
              <Hint>Saves automatically</Hint>
            </div>

            {/* Email — disabled, with collapsible change form */}
            <div>
              <div style={{ maxWidth: 380 }}>
                <Label>Email</Label>
                <Field value="andy@founder-summit.com" disabled />
              </div>
              <LinkBtn onClick={() => setShowEmail((v) => !v)}>{showEmail ? 'Cancel' : 'Change email'}</LinkBtn>

              {showEmail && (
                <InlineForm>
                  <p style={{ margin: 0, fontSize: 13, color: C.ink, opacity: .7, lineHeight: 1.5 }}>
                    For security, we'll send a verification email to your new address and notify your current email
                  </p>
                  <div>
                    <Label>New email</Label>
                    <Field placeholder="Enter new email" type="email" />
                  </div>
                  <div>
                    <Label>Current password</Label>
                    <Field placeholder="Enter current password" type="password" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionBtn outline>Change email</ActionBtn>
                    <ActionBtn onClick={() => setShowEmail(false)}>Cancel</ActionBtn>
                  </div>
                </InlineForm>
              )}
            </div>

            {/* Password — masked, with collapsible change form */}
            <div>
              <div style={{ maxWidth: 380 }}>
                <Label>Password</Label>
                <Field value="••••••••" disabled />
              </div>
              <LinkBtn onClick={() => setShowPass((v) => !v)}>{showPass ? 'Cancel' : 'Change password'}</LinkBtn>

              {showPass && (
                <InlineForm>
                  <div>
                    <Label>Current password</Label>
                    <Field placeholder="Enter current password" type="password" />
                  </div>
                  <div>
                    <Label>New password</Label>
                    <Field placeholder="Enter new password" type="password" />
                    <Hint>At least 6 characters</Hint>
                  </div>
                  <div>
                    <Label>Confirm new password</Label>
                    <Field placeholder="Confirm new password" type="password" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionBtn outline>Change password</ActionBtn>
                    <ActionBtn onClick={() => setShowPass(false)}>Cancel</ActionBtn>
                  </div>
                </InlineForm>
              )}
            </div>

          </div>
        </section>
      </div>
    </PageShell>
  );
}

// Capacity slider — draggable thumb that snaps to the nearest pricing tier with a
// spring animation. Thumb, ticks and labels all share one percentage basis so the
// knob always lands exactly over its value. Click a label or anywhere on the rail.
function CapacitySlider({ C }) {
  const R = React;
  const STOPS = [5, 50, 200, 500, 1000, 5000];
  const N = STOPS.length;
  const [idx, setIdx] = R.useState(2); // default tier 200
  const [drag, setDrag] = R.useState(null); // live fraction 0..1 while dragging, else null
  const trackRef = R.useRef(null);

  const stopFrac = (i) => i / (N - 1);
  const frac = drag != null ? drag : stopFrac(idx);
  const dispIdx = drag != null ? Math.round(drag * (N - 1)) : idx;

  const fracFromX = (clientX) => {
    const el = trackRef.current;
    if (!el) return stopFrac(idx);
    const r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  R.useEffect(() => {
    if (drag == null) return;
    const move = (e) => { const cx = e.touches ? e.touches[0].clientX : e.clientX; setDrag(fracFromX(cx)); };
    const up = (e) => {
      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      setIdx(Math.round(fracFromX(cx) * (N - 1)));
      setDrag(null); // clearing drag triggers the spring settle to the nearest stop
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag]);

  const start = (e) => { e.preventDefault(); setDrag(fracFromX(e.clientX)); };
  // Spring while settling; instant follow while the user is actively dragging.
  const settle = 'left .32s cubic-bezier(.34,1.56,.64,1), width .32s cubic-bezier(.34,1.56,.64,1)';
  const railTrans = drag == null ? settle : 'none';
  const pad = 11; // knob radius — keeps end stops fully on the rail

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.purpleDeep }}>Event capacity</span>
        <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Up to {STOPS[dispIdx].toLocaleString()} participants</span>
      </div>
      <div style={{ padding: `0 ${pad}px` }}>
        <div
          ref={trackRef}
          onPointerDown={start}
          style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}
        >
          {/* rail */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 999, background: 'rgba(76,25,77,.12)' }} />
          {/* fill */}
          <div style={{ position: 'absolute', left: 0, height: 6, width: `${frac * 100}%`, borderRadius: 999, background: C.orange, transition: railTrans }} />
          {/* tick dots */}
          {STOPS.map((v, i) => (
            <span key={v} style={{ position: 'absolute', left: `${stopFrac(i) * 100}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: i <= dispIdx ? 'rgba(255,255,255,.75)' : 'rgba(76,25,77,.28)', pointerEvents: 'none' }} />
          ))}
          {/* knob */}
          <div style={{
            position: 'absolute', left: `${frac * 100}%`, top: '50%',
            transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%',
            background: '#fff', border: `2px solid ${C.orange}`,
            boxShadow: drag != null ? '0 4px 14px rgba(221,83,28,.38)' : '0 2px 6px rgba(0,0,0,.15)',
            transition: (drag == null ? settle + ', box-shadow .2s' : 'box-shadow .2s'),
            cursor: 'grab', pointerEvents: 'none',
          }} />
        </div>
        {/* labels — click to jump */}
        <div style={{ position: 'relative', height: 18, marginTop: 8 }}>
          {STOPS.map((v, i) => {
            const on = i === dispIdx;
            return (
              <button key={v} type="button" onClick={() => setIdx(i)} style={{
                position: 'absolute', left: `${stopFrac(i) * 100}%`, transform: 'translateX(-50%)',
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: C.fontMono, fontSize: 11.5, fontWeight: on ? 700 : 400,
                color: on ? C.orange : C.ink, opacity: on ? 1 : .55, whiteSpace: 'nowrap',
                transition: 'color .2s, opacity .2s',
              }}>{v.toLocaleString()}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Billing & subscription — content mirrors BillingSettings.tsx + PricingPanel.tsx.
// Sections, copy and pricing all come from the codebase (config/pricing.ts, tier 200):
//   1. Your plan (subscription OR single-event credits — hidden on free)
//   2. Change/Choose a plan  (capacity slider + Single event / Unlimited cards)
//   3. Invoices / Credit history tabs
//   4. Billing details
// Reacts to the dev "Plan" state (subscription / credits / free) like the real
// conditional rendering.
function BillingSettingsScreen() {
  const { WC: C, Italic, PageShell, PageHead } = window;
  const R = React;
  const [billing, setBilling] = R.useState((typeof window !== 'undefined' && window.__wBilling) || 'subscription');
  R.useEffect(() => {
    const h = () => setBilling(window.__wBilling || 'subscription');
    window.addEventListener('w-billing', h);
    return () => window.removeEventListener('w-billing', h);
  }, []);
  const [interval, setInterval] = R.useState('annual'); // matches code default
  const [qty, setQty] = R.useState(1);
  const [tab, setTab] = R.useState('invoices');
  const [cancelOpen, setCancelOpen] = R.useState(false);

  // Purchased single-event credits the organizer owns (per tier, like the codebase).
  const credits = billing === 'free' ? [] : [{ cap: 50, balance: 3 }];
  const totalCredits = credits.reduce((s, c) => s + c.balance, 0);
  const coin = "<circle cx='12' cy='12' r='8'/><path d='M9.5 9.5h5M9.5 14.5h5'/>";

  const hasSub = billing === 'subscription';
  const hasCredits = billing === 'credits';

  // ── shared atoms ──────────────────────────────────────────
  const Card = ({ children, accent }) => (
    <section style={{ background: '#fff', border: `1px solid ${accent || C.hair}`, borderRadius: 18, marginBottom: 20, overflow: 'hidden' }}>{children}</section>
  );
  const CardHead = ({ children, sub, right }) => (
    <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 18, color: C.purpleDeep, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 9 }}>{children}</h3>
        {sub && <p style={{ margin: '5px 0 0', fontSize: 13, color: C.ink, opacity: .65 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
  const Body = ({ children, style = {} }) => <div style={{ padding: 24, ...style }}>{children}</div>;
  const Badge = ({ children, tone = 'green' }) => {
    const tones = {
      green: { bg: 'rgba(34,197,94,.12)', fg: '#1f7a40' },
      dark:  { bg: C.purpleDeep, fg: '#fff' },
      amber: { bg: 'rgba(221,83,28,.12)', fg: C.orange },
    };
    const t = tones[tone] || tones.green;
    return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.03em', background: t.bg, color: t.fg }}>{children}</span>;
  };
  const OutBtn = ({ children, primary, full, onClick }) => (
    <button type="button" onClick={onClick} style={{
      fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
      padding: '10px 16px', borderRadius: 11, width: full ? '100%' : undefined,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: primary ? C.orange : 'transparent',
      color: primary ? '#fff' : C.purpleDeep,
      border: primary ? '1px solid transparent' : `1.5px solid ${C.hairStrong}`,
      boxShadow: primary ? '0 6px 16px rgba(221,83,28,.22)' : 'none',
    }}>{children}</button>
  );
  const Ico = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const card = '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>';

  // ── pricing (tier 200, from config/pricing.ts) ────────────
  const single = 99, monthly = 199, annual = 1990, annualPerMo = Math.round(annual / 12);

  return (
    <PageShell navActive="Billing">
      <PageHead
        eyebrow="Plan &amp; payments"
        title={<>Billing &amp; <Italic>subscription</Italic></>}
      />

      {/* 1 · Your plan — only when there's a subscription or credits */}
      {(hasSub || credits.length > 0) && (
        <Card>
          <CardHead>Your plan</CardHead>
          <Body>
            {/* Subscription and credits shown as equal cards when both are owned */}
            <div style={{ display: 'grid', gridTemplateColumns: (hasSub && credits.length > 0) ? '1fr 1fr' : '1fr', gap: 18 }}>
              {hasSub && (
                <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, border: `1.5px solid ${C.hairStrong}`, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Subscription</span>
                    <Badge tone="dark">Active</Badge>
                  </div>
                  <div style={{ marginTop: 12, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Unlimited events</div>
                  <p style={{ margin: '6px 0 0', fontSize: 13.5, color: C.ink, opacity: .75 }}>Up to 200 participants · €{monthly}/month</p>
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .7 }}>
                    <Ico d="<rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/>" size={15} /> Next billing: 12 Feb 2027
                  </div>
                  <div style={{ flex: 1, minHeight: 16 }} />
                  <div style={{ marginTop: 16 }}><OutBtn onClick={() => setCancelOpen(true)}>Cancel subscription</OutBtn></div>
                </div>
              )}
              {credits.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, border: `1.5px solid ${C.hairStrong}`, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Single-event credits</span>
                    <Badge tone="amber">{totalCredits} available</Badge>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {credits.map((c) => (
                      <div key={c.cap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderRadius: 11, background: C.cream, border: `1px solid ${C.hair}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.purpleDeep, fontWeight: 600 }}><span style={{ color: C.orange, display: 'inline-flex' }}><Ico d={coin} size={16} /></span>Up to {c.cap} participants</span>
                        <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.02em' }}>{c.balance} {c.balance === 1 ? 'credit' : 'credits'}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minHeight: 16 }} />
                  <p style={{ margin: '14px 0 0', fontSize: 12.5, color: C.ink, opacity: .6 }}>A credit is applied automatically when you publish an event of that size.</p>
                </div>
              )}
            </div>
          </Body>
        </Card>
      )}

      {/* 2 · Change / Choose a plan (PricingPanel) */}
      <Card>
        <CardHead sub="Pricing is based on your event's capacity">{hasSub ? 'Change plan' : 'Choose a plan'}</CardHead>
        <Body>
          {/* Free-tier notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 12, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.22)', marginBottom: 22 }}>
            <span style={{ color: '#1f7a40', display: 'inline-flex' }}><Ico d="<path d='M12 3l1.9 4.6L19 9l-4.1 3 1.4 5L12 14.8 7.7 17l1.4-5L5 9l5.1-1.4z'/>" size={16} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1f7a40' }}>Events up to 5 participants free for testing purposes</span>
          </div>

          {/* Capacity slider — draggable, snaps to nearest tier */}
          <CapacitySlider C={C} />

          {/* Redeem gift card */}
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13.5, color: C.ink, opacity: .7, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}>Redeem gift card</span>
          </div>

          {/* Two plan cards */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Single event */}
            <div style={{ border: `1.5px solid ${C.hairStrong}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 17, color: C.purpleDeep }}>Single event</span>
              <div style={{ margin: '6px 0 2px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, color: C.purpleDeep, letterSpacing: '-0.03em' }}>€{single}</div>
              <span style={{ fontSize: 12.5, color: C.ink, opacity: .6 }}>per event credit</span>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['Up to 200 participants', 'Valid for one event per credit', 'Unlimited rounds'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.ink }}>
                    <span style={{ color: C.orange, display: 'inline-flex' }}><Ico d="<polyline points='20 6 9 17 4 12'/>" size={15} /></span>{t}
                  </span>
                ))}
              </div>
              <div style={{ flex: 1, minHeight: 14 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.purpleDeep }}>Credits</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.hairStrong}`, background: '#fff', cursor: 'pointer', color: C.purpleDeep, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ico d="<line x1='5' y1='12' x2='19' y2='12'/>" size={13} /></button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, color: C.purpleDeep }}>{qty}</span>
                  <button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.hairStrong}`, background: '#fff', cursor: 'pointer', color: C.purpleDeep, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ico d="<line x1='12' y1='5' x2='12' y2='19'/><line x1='5' y1='12' x2='19' y2='12'/>" size={13} /></button>
                </div>
              </div>
              <OutBtn full><Ico d={card} size={15} /> <span>Pay €{single * qty}</span></OutBtn>
            </div>

            {/* Unlimited events */}
            <div style={{ border: `2px solid ${C.orange}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 17, color: C.purpleDeep }}>Unlimited events</span>
                <Badge tone="amber">Popular</Badge>
              </div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignSelf: 'flex-start', padding: 3, gap: 2, borderRadius: 9, background: 'rgba(76,25,77,.08)' }}>
                {[['annual', 'Annually'], ['monthly', 'Monthly']].map(([v, l]) => {
                  const on = interval === v;
                  return (
                    <button key={v} type="button" onClick={() => setInterval(v)} style={{ padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, background: on ? '#fff' : 'transparent', color: on ? C.purpleDeep : C.ink, opacity: on ? 1 : .6, boxShadow: on ? '0 1px 3px rgba(0,0,0,.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {l}{v === 'annual' && <span style={{ fontSize: 10, fontWeight: 700, color: '#1f7a40' }}>-17%</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, color: C.purpleDeep, letterSpacing: '-0.03em' }}>€{interval === 'monthly' ? monthly : annualPerMo}</div>
                <span style={{ fontSize: 12.5, color: C.ink, opacity: .6 }}>{interval === 'monthly' ? 'per month' : <>per month, billed €{annual.toLocaleString()} annually</>}</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[['Up to 200 participants', false], ['Unlimited events', true], ['Priority support', false]].map(([t, bold]) => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.ink, fontWeight: bold ? 700 : 400 }}>
                    <span style={{ color: C.orange, display: 'inline-flex' }}><Ico d="<polyline points='20 6 9 17 4 12'/>" size={15} /></span>{t}
                  </span>
                ))}
              </div>
              <div style={{ flex: 1, minHeight: 14 }} />
              <OutBtn primary full><Ico d={card} size={15} /> Subscribe</OutBtn>
            </div>
          </div>

          <p style={{ margin: '14px 0 0', textAlign: 'right', fontSize: 11.5, color: C.ink, opacity: .55, fontFamily: C.fontMono }}>All prices excl. VAT</p>
        </Body>
      </Card>

      {/* 3 · Invoices / Credit history */}
      <Card>
        <div style={{ padding: '0 24px', borderBottom: `1px solid ${C.hair}`, display: 'flex', gap: 4 }}>
          {[['invoices', 'Invoices'], ['credits', 'Credit history']].map(([v, l]) => {
            const on = tab === v;
            return (
              <button key={v} type="button" onClick={() => setTab(v)} style={{ padding: '14px 14px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, color: on ? C.purpleDeep : C.ink, opacity: on ? 1 : .55, borderBottom: `2px solid ${on ? C.purpleDeep : 'transparent'}`, marginBottom: -1 }}>{l}</button>
            );
          })}
        </div>
        <Body style={{ padding: 0 }}>
          {tab === 'invoices' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                  {['Date', 'Description', 'Type', 'Amount', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 3 && i <= 4 ? (i === 3 ? 'right' : 'center') : (i === 5 ? 'right' : 'left'), padding: '14px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['12 Feb 2026', 'Unlimited events', 'Subscription', '€1,990.00'],
                  ['08 Jan 2026', 'Single event credit', 'Single event', '€99.00'],
                  ['12 Feb 2025', 'Unlimited events', 'Subscription', '€990.00'],
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.hair}` }}>
                    <td style={{ padding: '14px 16px', fontFamily: C.fontMono, fontSize: 12.5, color: C.ink, opacity: .8, whiteSpace: 'nowrap' }}>{r[0]}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13.5, color: C.purpleDeep, fontWeight: 500 }}>{r[1]}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.ink, opacity: .65 }}>{r[2]}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep, whiteSpace: 'nowrap' }}>{r[3]}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><Badge>Paid</Badge></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, border: `1.5px solid ${C.hairStrong}`, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep, cursor: 'pointer' }}><Ico d="<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>" size={13} /> PDF</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                  {['Date', 'Type', 'Details', 'Credits'].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '14px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Jan 8, 2026', 'Purchased', '#16a34a', 'Up to 50 participants', '+3'],
                  ['Jan 20, 2026', 'Used for event', '#dd531c', 'Up to 50 participants', '-1'],
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.hair}` }}>
                    <td style={{ padding: '14px 16px', fontFamily: C.fontMono, fontSize: 12.5, color: C.ink, opacity: .8, whiteSpace: 'nowrap' }}>{r[0]}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13.5, color: C.purpleDeep }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: r[2] }} />{r[1]}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.ink, opacity: .65 }}>{r[3]}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: r[4][0] === '+' ? '#1f7a40' : C.orange }}>{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Body>
      </Card>

      {/* 4 · Billing details */}
      <Card>
        <CardHead right={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: `1.5px solid ${C.hairStrong}`, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep, cursor: 'pointer' }}><Ico d="<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/>" size={13} /> Edit billing details</span>}>
          <span style={{ color: C.purpleDeep, display: 'inline-flex' }}><Ico d="<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>" size={17} /></span>
          Billing details
        </CardHead>
        <Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '20px 40px' }}>
            {[
              ['Name', 'Founder Summit s.r.o.'],
              ['Tax ID', 'SK2120998877'],
              ['Address', 'Hlavná 12, 811 01 Bratislava, Slovakia'],
              ['Invoice email', 'billing@founder-summit.com'],
            ].map(([l, v]) => (
              <div key={l}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink, opacity: .5 }}>{l}</p>
                <p style={{ margin: '5px 0 0', fontSize: 14, color: C.purpleDeep, fontWeight: l === 'Address' ? 400 : 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {v}
                  {l === 'Invoice email' && <span style={{ color: C.ink, opacity: .5, display: 'inline-flex', cursor: 'pointer' }}><Ico d="<path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'/>" size={13} /></span>}
                </p>
              </div>
            ))}
          </div>
        </Body>
      </Card>
      {/* Cancel subscription confirmation dialog */}
      {cancelOpen && (
        <div onClick={() => setCancelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,17,51,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 18, border: `1px solid ${C.hairStrong}`, boxShadow: '0 30px 70px rgba(75,29,81,.30)', padding: 28 }}>
            <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: C.purpleDeep }}>Cancel subscription?</h3>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: C.ink, opacity: .78 }}>You'll keep full access to <strong style={{ color: C.purpleDeep }}>Unlimited events</strong> until <strong style={{ color: C.purpleDeep }}>12 Feb 2027</strong>. After that your account moves to the Free plan (events up to 5 participants). Any single-event credits you own stay available.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setCancelOpen(false)} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: C.orange, color: '#fff', border: 'none', boxShadow: '0 6px 16px rgba(221,83,28,.22)' }}>Keep subscription</button>
              <button type="button" onClick={() => setCancelOpen(false)} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: '#c0392b', border: '1.5px solid rgba(192,57,43,.4)' }}>Cancel subscription</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

window.AccountSettingsScreen = AccountSettingsScreen;
window.BillingSettingsScreen = BillingSettingsScreen;
