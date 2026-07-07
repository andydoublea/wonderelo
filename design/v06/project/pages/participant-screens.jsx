// Wonderelo — Phase 02 participant + onboarding screens
// Each export is a self-contained "screen" component, designed to be wrapped
// in either:
//   • <IOSDevice> for mobile (participant) screens
//   • a plain <DesktopCard> for organizer onboarding (sign in / up / verify)
//
// Brand vocabulary mirrors the Phase 01 public pages:
//   purple-deep #4b1d51 · orange #dd531c · cream #f7f1e6 · paper #fbf6ec
//   Bricolage Grotesque (display) · Instrument Serif italic (accent)

const C = {
  purple: '#5C2277',
  purpleDeep: '#4b1d51',
  purpleInk: '#2d1133',
  orange: '#dd531c',
  orangeBright: '#ff6a2a',
  cream: '#f7f1e6',
  paper: '#fbf6ec',
  paperDeep: '#f1e9d8',
  ink: '#3a2e34',
  hair: 'rgba(76,25,77,.10)',
  hairStrong: 'rgba(76,25,77,.18)',
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, serif',
  fontBody: '"Space Grotesk", system-ui, sans-serif',
  fontHand: '"Caveat", cursive',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

// ─────────────────────────────────────────────────────────────
// Reusable atoms
// ─────────────────────────────────────────────────────────────
const Italic = ({ children, color = C.orange }) => (
  <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>
);

const Diamond = ({ size = 8, color = C.orange, style = {} }) => (
  <span style={{ display: 'inline-block', width: size, height: size, background: color, transform: 'rotate(45deg)', ...style }} />
);

const Eyebrow = ({ children, color = C.orange }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
    fontFamily: C.fontBody,
  }}>
    <span style={{ width: 18, height: 1, background: color }} />
    {children}
  </span>
);

// Brand logo. Hidden when rendered inside page chrome (nav already shows the
// brand) via AuthChromeCtx, so the auth card doesn't double up the wordmark.
const AuthChromeCtx = React.createContext(false);
const Logo = ({ size = 28, dark = false, symbolScale = 1.05 }) => {
  if (React.useContext(AuthChromeCtx)) return null;
  return (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <img
      src="assets/Wonderelo-logo-symbol.png" alt=""
      style={{ width: size * symbolScale, height: size * symbolScale, objectFit: 'contain', flexShrink: 0 }}
    />
    <div style={{
      fontFamily: C.fontDisplay, fontWeight: 800, fontSize: size * 0.66,
      letterSpacing: '-0.025em', color: dark ? '#fff' : C.purpleDeep, lineHeight: 1,
    }}>
      wonderelo
    </div>
  </div>
  );
};

// Primary CTA button
const Btn = ({ children, variant = 'primary', size = 'md', full = false, leadingIcon, trailingIcon, style = {} }) => {
  const base = {
    fontFamily: C.fontBody, fontWeight: 600,
    border: '1px solid transparent', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
    transition: 'transform .12s, box-shadow .12s, background .12s',
  };
  const sz = size === 'sm' ? { padding: '9px 14px', fontSize: 13 }
    : size === 'lg' ? { padding: '15px 22px', fontSize: 16 }
    : { padding: '12px 18px', fontSize: 14.5 };
  const variants = {
    primary: { background: C.orange, color: '#fff', boxShadow: '0 6px 16px rgba(221,83,28,.30)' },
    secondary: { background: C.purpleDeep, color: '#fff' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
    darkGhost: { background: 'rgba(255,255,255,.08)', color: '#fff', borderColor: 'rgba(255,255,255,.18)' },
  };
  return <button style={{ ...base, ...sz, ...variants[variant], ...style }}>{leadingIcon}{children}{trailingIcon}</button>;
};

const ArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Desktop card wrapper (for organizer onboarding screens)
// On mobile (AuthMobileCtx = true) it goes full-bleed: no card chrome, fills width.
// ─────────────────────────────────────────────────────────────
const AuthMobileCtx = React.createContext(false);
function DesktopCard({ width = 480, height = 'auto', children, footer }) {
  const mobile = React.useContext(AuthMobileCtx);
  return (
    <div style={{
      width: mobile ? '100%' : width, minHeight: height === 'auto' ? undefined : (mobile ? undefined : height), background: C.paper,
      fontFamily: C.fontBody, color: C.ink, padding: mobile ? '24px 22px 28px' : '40px 36px 32px',
      borderRadius: mobile ? 0 : 24, border: mobile ? 'none' : `1px solid ${C.hair}`,
      boxShadow: mobile ? 'none' : '0 20px 40px rgba(76,25,77,.12)',
      flex: mobile ? 1 : undefined, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* corner diamond */}
      <Diamond size={9} style={{ position: 'absolute', top: 20, right: 24 }} />
      <Diamond size={6} color={C.purple} style={{ position: 'absolute', top: 32, right: 40, opacity: .5 }} />
      {children}
      {footer && <div style={{
        marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.hair}`,
        fontSize: 12, color: C.ink, opacity: .65, textAlign: 'center',
      }}>{footer}</div>}
    </div>
  );
}

// Input field (used in many screens)
function Field({ label, type = 'text', value = '', placeholder, prefix, suffix, hint, error, focused = false, password = false }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', color: C.purpleDeep, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px', borderRadius: 12,
        background: '#fff',
        border: `1.5px solid ${error ? '#dc2626' : focused ? C.orange : C.hairStrong}`,
        boxShadow: focused ? `0 0 0 3px rgba(221,83,28,.12)` : 'none',
      }}>
        {prefix && <span style={{ color: C.ink, opacity: .6, fontSize: 14 }}>{prefix}</span>}
        <input
          type={type} defaultValue={value} placeholder={placeholder} readOnly
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: C.fontBody, fontSize: 15, color: C.ink, minWidth: 0,
          }}
        />
        {password && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        )}
        {suffix && <span style={{ color: C.purple, fontSize: 13, fontWeight: 600, fontFamily: C.fontMono }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 12, color: error ? '#dc2626' : C.ink, opacity: error ? 1 : .7 }}>{error || hint}</span>
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// 01 · Sign In  (organizer + participant tabs)
// ─────────────────────────────────────────────────────────────
function SignInScreen() {
  return (
    <DesktopCard width={480} footer={<>By signing in you agree to our <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Terms</span> &amp; <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Privacy</span>.</>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.ink, opacity: .55, letterSpacing: '.04em' }}>v1.0</span>
      </div>

      <div>
        <Eyebrow>Welcome back</Eyebrow>
        <h1 style={{ margin: '12px 0 6px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Sign in to <Italic>Wonderelo.</Italic>
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: .75 }}>Two ways in — pick the one that fits.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(76,25,77,.06)', borderRadius: 12 }}>
        <button style={{
          flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none',
          background: '#fff', color: C.purpleDeep, fontWeight: 700, fontSize: 13.5,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          <Diamond size={6} color={C.orange} /> Organizer
        </button>
        <button style={{
          flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none',
          background: 'transparent', color: C.ink, opacity: .7, fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
        }}>
          Participant
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email address" value="hello@founder-summit.com" placeholder="you@event.com" />
        <Field label="Password" type="password" value="••••••••••" focused password />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .8 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4, background: C.orange,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          Remember me
        </label>
        <a href="#" style={{ fontSize: 13, color: C.purpleDeep, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
      </div>

      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Sign in</Btn>

      <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: C.hair }} />
        <span style={{ position: 'relative', background: C.paper, padding: '0 14px', fontSize: 11, fontFamily: C.fontMono, letterSpacing: '.14em', color: C.ink, opacity: .55, textTransform: 'uppercase' }}>
          New here
        </span>
      </div>

      <Btn variant="ghost" size="md" full>Create a Wonderelo account</Btn>
    </DesktopCard>
  );
}

// ─────────────────────────────────────────────────────────────
// 02 · Sign Up (multi-step — step 3 of 5)
// ─────────────────────────────────────────────────────────────
function SignUpScreen() {
  return (
    <DesktopCard width={520}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <button style={{
          fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .65,
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>← Already have an account?</button>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: C.fontMono, letterSpacing: '.14em', color: C.purple, opacity: .8, textTransform: 'uppercase', marginBottom: 10 }}>
          <span>Step 03 / 05</span>
          <span>Setting up <Italic>your space</Italic></span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i < 2 ? C.orange : i === 2 ? C.orange : 'rgba(76,25,77,.10)',
            }} />
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Pick your <Italic>event URL.</Italic>
        </h2>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, color: C.ink, opacity: .8 }}>
          This is where participants will land. Choose carefully — once set it stays with you.
        </p>
      </div>

      <Field
        label="Your URL"
        prefix="wonderelo.com /"
        value="founder-summit"
        suffix="✓ available"
        focused
        hint="3–32 characters · letters, numbers, dashes only"
      />

      <div style={{
        padding: '16px 18px', borderRadius: 14, background: C.cream,
        border: `1px dashed ${C.hairStrong}`,
        display: 'flex', gap: 12, alignItems: 'start',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: C.orange, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
          <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Tip — </strong>
          Use something memorable participants will type on a phone. Most organizers pick the event name with a year.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <Btn variant="ghost" size="lg">Back</Btn>
        <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Continue</Btn>
      </div>
    </DesktopCard>
  );
}

// ─────────────────────────────────────────────────────────────
// 03 · Email verification waiting
// ─────────────────────────────────────────────────────────────
function EmailVerifyScreen() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo /></div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          background: 'linear-gradient(140deg, #fff, ' + C.cream + ')',
          border: `1px solid ${C.hair}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', marginBottom: 24,
        }}>
          <Diamond size={10} color={C.orange} style={{ position: 'absolute', top: -6, right: -6 }} />
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 5L2 7" />
          </svg>
        </div>

        <Eyebrow>Almost there</Eyebrow>
        <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Check your <Italic>inbox.</Italic>
        </h1>
        <p style={{ margin: '0 auto 0', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>
          We just sent a magic link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>andy@founder-summit.com</strong>. Click it and you're in.
        </p>
      </div>

      <Btn variant="primary" size="lg" full leadingIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      }>Open Gmail</Btn>

      <div style={{
        padding: 16, borderRadius: 12,
        background: 'rgba(76,25,77,.04)',
        border: `1px solid ${C.hair}`,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ fontSize: 13, color: C.ink, opacity: .82 }}>
          <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Can't see it?</strong> Check spam — or wait 30 seconds and try again.
        </div>
        <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.ink, opacity: .55 }}>
          Re-sending in 0:23 · <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Use a different email →</span>
        </div>
      </div>
    </DesktopCard>
  );
}

// ─────────────────────────────────────────────────────────────
// 04 · Reset password
// ─────────────────────────────────────────────────────────────
function ResetPasswordScreen() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <button style={{
          fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .65,
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>← Back to sign in</button>
      </div>

      <div>
        <Eyebrow>Reset password</Eyebrow>
        <h1 style={{ margin: '12px 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Choose a <Italic>new password.</Italic>
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: .8 }}>Pick something memorable. We never store the original.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="New password" type="password" value="••••••••" password />
        <Field label="Repeat password" type="password" value="••••••••" focused password />
      </div>

      {/* Strength */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: C.fontMono, color: C.ink, opacity: .65, marginBottom: 8, letterSpacing: '.04em' }}>
          <span>Strength</span>
          <span style={{ color: C.orange, fontWeight: 700 }}>Strong</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 3 ? C.orange : 'rgba(76,25,77,.10)' }} />
          ))}
        </div>
        <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: C.ink, opacity: .82 }}>
          {[
            ['8 characters or more', true],
            ['Mix of letters and numbers', true],
            ['One special character (!@#…)', false],
          ].map(([label, ok]) => (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: ok ? C.orange : 'transparent',
                border: ok ? 'none' : `1.5px solid ${C.hairStrong}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                {ok && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Save new password</Btn>
    </DesktopCard>
  );
}

// ═════════════════════════════════════════════════════════════
// MOBILE PARTICIPANT SCREENS (iOS frame, 402x874)
// ═════════════════════════════════════════════════════════════

// Shared mini header for participant screens (sits under iOS status bar)
function PHeader({ title, slug, action, color = C.purpleDeep, bg = C.paper }) {
  return (
    <div style={{
      padding: '12px 18px 14px',
      background: bg, borderBottom: `1px solid ${C.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <img
          src="assets/Wonderelo-logo-symbol.png" alt=""
          style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 14, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{title}</div>
          {slug && <div style={{ fontFamily: C.fontMono, fontSize: 10.5, color: C.ink, opacity: .55, marginTop: 3, letterSpacing: '.02em' }}>{slug}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 05 · Participant register (event landing → name/email)
// ─────────────────────────────────────────────────────────────
function ParticipantRegisterContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <PHeader
        title="Founder Summit 2026"
        slug="wonderelo.com/founder-summit-26"
      />

      <div style={{ padding: '26px 22px 0' }}>
        <Eyebrow>You're invited</Eyebrow>
        <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Join the <Italic>welcome mixer.</Italic>
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.5, color: C.ink, opacity: .82 }}>
          A 45-minute round at the mezzanine bar. 60+ founders &amp; investors. You'll be matched once doors open.
        </p>

        {/* Mini meta */}
        <div style={{
          display: 'flex', gap: 14, marginTop: 18, padding: '12px 14px',
          background: C.cream, borderRadius: 12, border: `1px solid ${C.hair}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .75, textTransform: 'uppercase' }}>Tonight</div>
            <div style={{ marginTop: 4, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>19:00 <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.orange, fontWeight: 400 }}>—</span> 19:45</div>
          </div>
          <div style={{ width: 1, background: C.hair }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .75, textTransform: 'uppercase' }}>Going</div>
            <div style={{ marginTop: 4, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>64 <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.orange, fontWeight: 400, fontSize: 13 }}>/ 80</span></div>
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="First name" value="Andy" />
          <Field label="Email" value="andy.abel@" focused />
        </div>

        <label style={{ display: 'flex', gap: 10, alignItems: 'start', marginTop: 16, fontSize: 12.5, color: C.ink, opacity: .8, lineHeight: 1.45 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4, background: C.orange, flexShrink: 0, marginTop: 2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          Send me a reminder 15 min before the round starts.
        </label>

        <div style={{ marginTop: 16 }}>
          <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Join the round</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 06 · Participant Dashboard
// ─────────────────────────────────────────────────────────────
function ParticipantDashboardContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <PHeader
        title="Founder Summit 2026"
        slug="hi, Andy · participant"
        action={
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: C.purpleDeep,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 12,
          }}>AM</div>
        }
      />

      {/* Live banner */}
      <div style={{
        margin: '14px 18px 0', padding: '14px 16px',
        background: C.orange, color: '#fff', borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <Diamond size={28} color="rgba(255,255,255,.12)" style={{ position: 'absolute', right: 14, top: 14 }} />
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.15)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', opacity: .85 }}>Live now</div>
          <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 15, marginTop: 3 }}>You're matched <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color: '#fff' }}>—</span> Round 02</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </div>

      {/* Day group */}
      <div style={{ padding: '24px 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontSize: 16, color: C.orange }}>Tonight</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 10, letterSpacing: '.18em', color: C.purple, opacity: .65, textTransform: 'uppercase' }}>Tue · 12 May</span>
        <span style={{ flex: 1, height: 1, background: C.hair }} />
      </div>

      {/* Rounds list */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { step: '01', name: 'Two truths, one stretch', time: '19:00', status: 'done', pill: 'Wrapped', meta: '3 min · pairs' },
          { step: '02', name: "What's the bet you're making?", time: '19:15', status: 'live', pill: 'Now', meta: '5 min · pairs · 62 matched' },
          { step: '03', name: "Closing toast — one intro you'd love", time: '19:30', status: 'next', pill: 'In 14 min', meta: '4 min · groups of 4' },
          { step: '04', name: 'Late-night portfolio jam', time: '21:30', status: 'upcoming', pill: 'Join', meta: '45 min · 2 rounds' },
        ].map(r => {
          const isLive = r.status === 'live';
          const isDone = r.status === 'done';
          return (
            <div key={r.step} style={{
              padding: '14px 14px', borderRadius: 14,
              background: isLive ? C.purpleDeep : '#fff',
              border: isLive ? 'none' : `1px solid ${C.hair}`,
              display: 'flex', gap: 12, alignItems: 'center',
              opacity: isDone ? .55 : 1,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: isLive ? C.orange : isDone ? C.paperDeep : C.cream,
                border: isLive ? 'none' : `1.5px solid ${isDone ? C.hair : C.orange}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: isLive ? '#fff' : C.purpleDeep,
                fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 13,
              }}>{r.step}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', lineHeight: 1.2,
                  color: isLive ? '#fff' : C.purpleDeep,
                  textDecoration: isDone ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.name}</div>
                <div style={{
                  marginTop: 4, fontSize: 11, fontFamily: C.fontMono, letterSpacing: '.02em',
                  color: isLive ? 'rgba(255,255,255,.7)' : C.ink, opacity: isLive ? 1 : .65,
                }}>{r.time} · {r.meta}</div>
              </div>
              <div style={{
                padding: '5px 10px', borderRadius: 999,
                background: isLive ? 'rgba(255,255,255,.18)' : r.status === 'next' ? 'rgba(221,83,28,.10)' : C.cream,
                color: isLive ? '#fff' : r.status === 'next' ? C.orange : C.purpleDeep,
                fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                flexShrink: 0, fontFamily: C.fontBody,
              }}>{r.pill}</div>
            </div>
          );
        })}
      </div>

      {/* Meeting points hint */}
      <div style={{ padding: '20px 18px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Diamond size={6} color={C.orange} />
        <span style={{ fontSize: 12, color: C.ink, opacity: .65 }}>4 meeting points · <span style={{ color: C.purpleDeep, fontWeight: 600 }}>view map →</span></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 07 · Round Detail (before round opens)
// ─────────────────────────────────────────────────────────────
function RoundDetailContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.paper, borderBottom: `1px solid ${C.hair}`,
      }}>
        <button style={{
          background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: C.fontBody, fontWeight: 600, fontSize: 13.5, color: C.purpleDeep, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Dashboard
        </button>
        <span style={{ fontFamily: C.fontMono, fontSize: 10.5, color: C.ink, opacity: .55, letterSpacing: '.04em' }}>Round 03 of 03</span>
      </div>

      <div style={{ padding: '22px 22px 0' }}>
        <Eyebrow>Tonight · 19:30</Eyebrow>
        <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Closing toast — one intro you'd <Italic>love.</Italic>
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .8 }}>
          Groups of four. Each person names one introduction they'd love to make tonight. The group then helps.
        </p>

        {/* Round meta strip */}
        <div style={{
          marginTop: 18,
          background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 14,
          padding: '14px 16px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
        }}>
          {[
            ['Duration', '4 min', 'each'],
            ['Group', '4 people', 'incl. you'],
            ['Opens in', '14 min', 'at 19:30'],
          ].map((row, i) => (
            <div key={i} style={{
              padding: '0 8px',
              borderLeft: i === 0 ? 'none' : `1px solid ${C.hair}`,
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>{row[0]}</div>
              <div style={{ marginTop: 4, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep, letterSpacing: '-0.015em' }}>{row[1]}</div>
              <div style={{ marginTop: 1, fontSize: 10, color: C.ink, opacity: .55, fontFamily: C.fontMono }}>{row[2]}</div>
            </div>
          ))}
        </div>

        {/* Meeting points */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', color: C.purple, textTransform: 'uppercase', opacity: .8 }}>Meeting points</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 10.5, color: C.ink, opacity: .55 }}>4 spots</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['A', 'Coffee bar', 'far left of main hall'],
              ['B', 'Foyer corner', 'near the merch wall'],
              ['C', 'Atrium tree', 'centre under skylight'],
              ['D', 'Stage left', 'beside the speaker rope'],
            ].map(([letter, name, where]) => (
              <div key={letter} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', background: '#fff', borderRadius: 12,
                border: `1px solid ${C.hair}`,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: C.purpleDeep, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 13,
                }}>{letter}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 13.5, color: C.purpleDeep }}>{name}</div>
                  <div style={{ fontSize: 11, color: C.ink, opacity: .6, fontFamily: C.fontMono, marginTop: 2 }}>{where}</div>
                </div>
                <Diamond size={6} color={C.orange} />
              </div>
            ))}
          </div>
        </div>

        {/* Reminder toggle */}
        <div style={{
          marginTop: 18, padding: '14px 14px', borderRadius: 12,
          background: C.cream, border: `1px solid ${C.hair}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.purpleDeep, fontFamily: C.fontDisplay, fontWeight: 700 }}>Notify me 2 min before</div>
            <div style={{ fontSize: 11.5, color: C.ink, opacity: .7, marginTop: 2 }}>We'll send a push so you can walk over.</div>
          </div>
          {/* iOS-style switch */}
          <div style={{ width: 44, height: 26, borderRadius: 999, background: C.orange, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
          </div>
        </div>

        <div style={{ marginTop: 16, marginBottom: 40 }}>
          <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>You're in — count me</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Geometric ID — placeholder hex/triangle visual w/ a number
// ─────────────────────────────────────────────────────────────
function GeoID({ n, size = 'lg', color = C.orange }) {
  const big = size === 'lg';
  const d = big ? 220 : 64;
  return (
    <div style={{
      width: d, height: d, borderRadius: big ? 22 : 10,
      background: 'linear-gradient(140deg, ' + color + ' 0%, ' + C.orangeBright + ' 100%)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: big ? '0 12px 30px rgba(221,83,28,.30)' : '0 3px 8px rgba(0,0,0,.10)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(255,255,255,.25), transparent 40%),
          radial-gradient(circle at 80% 20%, rgba(0,0,0,.15), transparent 40%)
        `,
      }} />
      {/* Decorative shapes */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <polygon points="0,0 30,0 0,30" fill="rgba(255,255,255,.18)" />
        <polygon points="100,100 70,100 100,70" fill="rgba(0,0,0,.10)" />
        <circle cx="80" cy="22" r="10" fill="rgba(255,255,255,.20)" />
        <polygon points="50,50 70,80 30,80" fill="rgba(255,255,255,.15)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: C.fontDisplay, fontWeight: 800, fontSize: big ? 120 : 36,
        color: '#fff', textShadow: '0 4px 16px rgba(0,0,0,.25)', letterSpacing: '-0.04em',
      }}>{n}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 08 · Match — Find your partner
// ─────────────────────────────────────────────────────────────
function MatchPartnerContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.paper,
      }}>
        <Logo size={22} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(221,83,28,.10)', color: C.orange,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <Diamond size={5} color={C.orange} /> Live
        </div>
      </div>

      <div style={{ padding: '14px 22px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: C.fontMono, letterSpacing: '.14em', color: C.purple, opacity: .75, textTransform: 'uppercase' }}>
          Round 02 · find your match
        </span>
        <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Show this to your <Italic>match.</Italic>
        </h1>

        {/* Big own ID */}
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
          <GeoID n="07" />
        </div>
        <div style={{
          marginTop: 14, fontFamily: C.fontDisplay, fontWeight: 800,
          fontSize: 40, color: C.purpleDeep, letterSpacing: '-0.03em', lineHeight: 1,
        }}>Andy</div>
        <div style={{ marginTop: 6, fontFamily: C.fontSerif, fontStyle: 'italic', fontSize: 16, color: C.orange }}>
          Coffee bar · A
        </div>
      </div>

      <div style={{ padding: '24px 22px 8px' }}>
        {/* Partner box */}
        <div style={{
          background: '#fff', border: `1.5px solid ${C.hair}`,
          borderRadius: 20, padding: '20px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .8, textTransform: 'uppercase' }}>Your match</div>
              <div style={{
                marginTop: 4, fontFamily: C.fontDisplay, fontWeight: 800,
                fontSize: 28, color: C.purpleDeep, letterSpacing: '-0.025em', lineHeight: 1,
              }}>Marek</div>
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.ink, opacity: .8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,.20)' }} />
                Already at the spot
              </div>
            </div>
            <div style={{ width: 48, height: 1, background: C.hair }} />
          </div>

          <div style={{ marginTop: 16, padding: '14px 0 0', borderTop: `1px dashed ${C.hairStrong}` }}>
            <div style={{ fontSize: 12.5, color: C.ink, opacity: .8, textAlign: 'center', marginBottom: 12 }}>
              Which number is <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Marek</strong>?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[12, 38, 21].map((n, i) => (
                <button key={n} style={{
                  border: 'none', padding: 0, background: 'transparent', cursor: 'pointer',
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: i === 1 ? `0 0 0 3px ${C.purpleDeep}` : 'none',
                  transform: i === 1 ? 'scale(1.03)' : 'none',
                  transition: 'transform .15s',
                }}>
                  <GeoID n={n.toString().padStart(2, '0')} size="sm" color={i === 0 ? '#6b8b4a' : i === 1 ? C.purpleDeep : '#b48b4f'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: C.ink, opacity: .65 }}>
          Walking deadline · <strong style={{ color: C.orange, fontWeight: 700 }}>0:42</strong> · then we'll start without them
        </div>

        <div style={{ marginTop: 14, marginBottom: 40, textAlign: 'center' }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: C.ink, opacity: .65, textDecoration: 'underline',
            fontFamily: C.fontBody,
          }}>Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 09 · Match — Networking (round is live)
// ─────────────────────────────────────────────────────────────
function MatchNetworkingContent() {
  return (
    <div style={{ background: C.purpleDeep, minHeight: '100%', color: '#fff', fontFamily: C.fontBody, paddingTop: 40, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: -40, top: 80, width: 120, height: 120,
        background: 'rgba(255,255,255,.04)', transform: 'rotate(45deg)',
      }} />
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative',
      }}>
        <Logo size={22} dark />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,.10)', color: '#fff',
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <Diamond size={5} color={C.orangeBright} /> In round
        </div>
      </div>

      <div style={{ padding: '20px 22px 0', textAlign: 'center', position: 'relative' }}>
        <span style={{ fontSize: 10.5, fontFamily: C.fontMono, letterSpacing: '.18em', color: C.orangeBright, textTransform: 'uppercase' }}>
          Round 02 · in progress
        </span>
        <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff' }}>
          You're with <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.orangeBright, fontWeight: 400 }}>Marek.</span>
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,.7)' }}>
          5-minute pair round. Ask one of these — or anything.
        </p>

        {/* Countdown */}
        <div style={{
          margin: '24px auto 0', padding: '18px 28px',
          background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.10)',
          borderRadius: 18, display: 'inline-flex', alignItems: 'baseline', gap: 8,
        }}>
          <div style={{
            fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em',
            color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            04<span style={{ color: 'rgba(255,255,255,.35)', margin: '0 4px' }}>:</span>27
          </div>
          <div style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontSize: 16, color: C.orangeBright }}>left</div>
        </div>

        {/* Progress ring representation */}
        <div style={{
          margin: '14px auto 0', height: 4, borderRadius: 4, width: '100%',
          background: 'rgba(255,255,255,.10)', overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: '52%', background: 'linear-gradient(90deg, ' + C.orange + ', ' + C.orangeBright + ')' }} />
        </div>
      </div>

      {/* Ice-breakers */}
      <div style={{ padding: '28px 22px 0', position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', color: C.orangeBright, textTransform: 'uppercase', marginBottom: 14 }}>
          Ice-breakers — pick one
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            "What's the bet you're making this year nobody else is?",
            "Worst job you ever had — and what you learned from it.",
            "If you could clone one person on your team, who and why?",
          ].map((q, i) => (
            <div key={i} style={{
              padding: '14px 14px 14px 18px', background: i === 0 ? 'rgba(221,83,28,.18)' : 'rgba(255,255,255,.06)',
              border: i === 0 ? '1px solid ' + C.orangeBright : '1px solid rgba(255,255,255,.10)',
              borderRadius: 12,
              display: 'flex', gap: 12, alignItems: 'start',
            }}>
              <span style={{
                fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 14,
                color: i === 0 ? C.orangeBright : 'rgba(255,255,255,.55)',
                flexShrink: 0, marginTop: 1,
              }}>0{i+1}</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: i === 0 ? '#fff' : 'rgba(255,255,255,.78)', textAlign: 'left' }}>
                {q}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, marginBottom: 40, textAlign: 'center' }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: 'rgba(255,255,255,.65)', textDecoration: 'underline',
            fontFamily: C.fontBody,
          }}>End early</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10 · Missed round
// ─────────────────────────────────────────────────────────────
function MissedRoundContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <PHeader
        title="Founder Summit 2026"
        slug="hi, Andy · participant"
      />

      <div style={{ padding: '40px 22px 0', textAlign: 'center' }}>
        {/* Illustration */}
        <div style={{
          width: 110, height: 110, margin: '0 auto', borderRadius: 28,
          background: C.cream, border: `1px solid ${C.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Diamond size={12} color={C.orange} style={{ position: 'absolute', top: -6, right: -6 }} />
          <Diamond size={8} color={C.purple} style={{ position: 'absolute', bottom: -4, left: 14, opacity: .5 }} />
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'repeating-linear-gradient(45deg, ' + C.hairStrong + ' 0 1px, transparent 1px 6px)',
            border: `1.5px dashed ${C.hairStrong}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <span style={{
          display: 'inline-block', marginTop: 24, padding: '5px 12px', borderRadius: 999,
          background: 'rgba(76,25,77,.06)', color: C.purple,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>Round closed</span>

        <h1 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          You missed <Italic>round 02.</Italic>
        </h1>
        <p style={{ margin: '14px auto 0', maxWidth: 280, fontSize: 14, lineHeight: 1.5, color: C.ink, opacity: .82 }}>
          The walking deadline passed before you checked in. The next round opens in 14 minutes.
        </p>

        {/* Next round card */}
        <div style={{
          marginTop: 28, padding: '16px 18px',
          background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: C.orange, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>03</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .75, textTransform: 'uppercase' }}>Next · 19:30</div>
            <div style={{ marginTop: 4, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14.5, color: C.purpleDeep, lineHeight: 1.2 }}>
              Closing toast — one intro you'd <Italic>love</Italic>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Btn variant="primary" size="lg" full>I'll be there in 14 minutes</Btn>
        </div>
        <div style={{ marginTop: 12, marginBottom: 40 }}>
          <Btn variant="ghost" size="md" full>Back to dashboard</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 07 · Match — Meeting point ("I am here")
//   Maps to: src/components/MatchInfo.tsx · MatchInfoMatchedView
// ─────────────────────────────────────────────────────────────
function MeetingPointContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.paper,
      }}>
        <Logo size={22} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(221,83,28,.10)', color: C.orange,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <Diamond size={5} color={C.orange} /> Live
        </div>
      </div>

      <div style={{ padding: '14px 22px 0', textAlign: 'center' }}>
        {/* Walking countdown */}
        <div style={{
          margin: '0 auto', padding: '10px 18px',
          background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 14,
          display: 'inline-flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{ fontSize: 10, fontFamily: C.fontMono, letterSpacing: '.16em', color: C.purple, opacity: .7, textTransform: 'uppercase' }}>Walk over in</span>
          <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 26, color: C.purpleDeep, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>2:48</span>
        </div>

        <h1 style={{ margin: '20px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 26, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          We have a match — <Italic>now go to:</Italic>
        </h1>

        {/* Meeting point box */}
        <div style={{
          margin: '22px 0 0', padding: '22px 18px',
          background: '#fff', border: `2px solid ${C.hairStrong}`, borderRadius: 22,
        }}>
          <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, color: C.purpleDeep, letterSpacing: '-0.025em', lineHeight: 1 }}>
            Coffee bar
          </div>
          {/* Meeting point image placeholder */}
          <div style={{
            marginTop: 16, height: 150, borderRadius: 14, overflow: 'hidden',
            background: 'linear-gradient(135deg, ' + C.cream + ', ' + C.paperDeep + ')',
            border: `1px solid ${C.hair}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Diamond size={10} color={C.orange} style={{ position: 'absolute', top: 14, right: 16, opacity: .7 }} />
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .5 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 22px 0' }}>
        <Btn variant="primary" size="lg" full leadingIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        }>I'm at the Coffee bar</Btn>
        <div style={{ marginTop: 14, marginBottom: 40, textAlign: 'center' }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: C.ink, opacity: .65, textDecoration: 'underline', fontFamily: C.fontBody,
          }}>Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7b · Match — No match found
//   Maps to: src/components/MatchInfo.tsx · MatchInfoNoMatchView
// ─────────────────────────────────────────────────────────────
function NoMatchContent() {
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <PHeader title="Founder Summit 2026" slug="hi, Andy · participant" />

      <div style={{ padding: '44px 22px 0', textAlign: 'center' }}>
        <div style={{
          width: 110, height: 110, margin: '0 auto', borderRadius: 28,
          background: C.cream, border: `1px solid ${C.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Diamond size={12} color={C.orange} style={{ position: 'absolute', top: -6, right: -6 }} />
          <Diamond size={8} color={C.purple} style={{ position: 'absolute', bottom: -4, left: 14, opacity: .5 }} />
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .65 }}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /><path d="M8 11h6" />
          </svg>
        </div>

        <span style={{
          display: 'inline-block', marginTop: 24, padding: '5px 12px', borderRadius: 999,
          background: 'rgba(76,25,77,.06)', color: C.purple,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>Round 01 closed</span>

        <h1 style={{ margin: '14px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          No match <Italic>this time.</Italic>
        </h1>
        <p style={{ margin: '14px auto 0', maxWidth: 280, fontSize: 14, lineHeight: 1.5, color: C.ink, opacity: .82 }}>
          No one else confirmed for this round. It happens early on — the next round usually has more people.
        </p>

        <div style={{ marginTop: 28 }}>
          <Btn variant="primary" size="lg" full>Try another round</Btn>
        </div>
        <div style={{ marginTop: 12, marginBottom: 40 }}>
          <Btn variant="ghost" size="md" full>Back to dashboard</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9b · Contact sharing — "Time is up!" + reactions + share toggle
//   Maps to: src/components/ContactSharing.tsx · PartnerFeedbackView
// ─────────────────────────────────────────────────────────────
function ContactSharingContent() {
  const reactions = [
    { id: 'nice', label: 'Nice talk', on: true },
    { id: 'interesting', label: 'Very interesting', on: true },
    { id: 'continue', label: 'Continue the chat', on: false },
    { id: 'nice-person', label: "You're very nice", on: false },
  ];
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.paper,
      }}>
        <Logo size={22} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(76,25,77,.06)', color: C.purple,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <Diamond size={5} color={C.purple} /> Round done
        </div>
      </div>

      <div style={{ padding: '16px 22px 0', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.03em', color: C.purpleDeep }}>
          Time's <Italic>up.</Italic>
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: C.ink, opacity: .82 }}>How was your conversation?</p>
        <p style={{ margin: '10px auto 0', maxWidth: 290, fontSize: 12.5, lineHeight: 1.5, color: C.ink, opacity: .62 }}>
          We often underestimate how much others enjoyed talking to us. If you did, let them know.
        </p>
      </div>

      <div style={{ padding: '22px 22px 0' }}>
        {/* Partner card */}
        <div style={{ background: '#fff', border: `2px solid ${C.hair}`, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 12px' }}>
            <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-0.02em', textAlign: 'left' }}>
              Marek Novák
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: C.ink, opacity: .55, textAlign: 'left', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: C.fontMono }}>
              Send a quick reaction
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {reactions.map((r) => (
                <span key={r.id} style={{
                  padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  border: '1px solid ' + (r.on ? 'rgba(221,83,28,.35)' : C.hair),
                  background: r.on ? 'rgba(221,83,28,.10)' : 'rgba(76,25,77,.03)',
                  color: r.on ? C.orange : C.ink,
                }}>{r.label}</span>
              ))}
            </div>
          </div>

          <div style={{
            padding: '14px 18px', borderTop: `1px solid ${C.hair}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.purpleDeep }}>Share my contact</div>
              <div style={{ marginTop: 3, fontSize: 11.5, color: C.ink, opacity: .6, lineHeight: 1.35 }}>
                Both must agree — swapped only if you both do.
              </div>
            </div>
            {/* Switch (on) */}
            <span style={{
              width: 46, height: 27, borderRadius: 999, background: C.orange, position: 'relative', flexShrink: 0,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,.15)',
            }}>
              <span style={{ position: 'absolute', top: 3, left: 22, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
            </span>
          </div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 40 }}>
          <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Next</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9c · Wonderelo feedback — rate the experience
//   Maps to: src/components/ContactSharing.tsx · WondereloFeedbackView
// ─────────────────────────────────────────────────────────────
function WondereloFeedbackContent() {
  const faces = [
    { id: 'sad', emoji: '🙁', label: 'Not great', on: false },
    { id: 'ok', emoji: '😐', label: 'Okay', on: false },
    { id: 'great', emoji: '😄', label: 'Great!', on: true },
  ];
  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: C.fontBody, color: C.ink, paddingTop: 40 }}>
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.paper,
      }}>
        <Logo size={22} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(76,25,77,.06)', color: C.purple,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <Diamond size={5} color={C.purple} /> Last step
        </div>
      </div>

      <div style={{ padding: '34px 22px 0', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          How was your <Italic>Wonderelo?</Italic>
        </h1>
        <p style={{ margin: '12px auto 0', maxWidth: 270, fontSize: 14, color: C.ink, opacity: .72 }}>
          A quick read helps your organizer make the next round even better.
        </p>

        {/* Face rating */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 14 }}>
          {faces.map((f) => (
            <div key={f.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              padding: '14px 16px', borderRadius: 18,
              border: '2px solid ' + (f.on ? C.orange : C.hair),
              background: f.on ? 'rgba(221,83,28,.07)' : '#fff',
              transform: f.on ? 'scale(1.06)' : 'none', transition: 'transform .15s',
            }}>
              <span style={{ fontSize: 34, lineHeight: 1 }}>{f.emoji}</span>
              <span style={{ fontSize: 11, color: f.on ? C.orange : C.ink, opacity: f.on ? 1 : .6, fontWeight: 600 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Free text */}
        <div style={{
          marginTop: 22, padding: '14px 16px', minHeight: 84,
          background: '#fff', border: `1.5px solid ${C.hairStrong}`, borderRadius: 14,
          fontSize: 14, color: C.ink, opacity: .5, textAlign: 'left',
        }}>Tell us more (optional)…</div>
      </div>

      <div style={{ padding: '22px 22px 0' }}>
        <Btn variant="primary" size="lg" full>Finish</Btn>
        <div style={{ marginTop: 12, marginBottom: 40 }}>
          <Btn variant="ghost" size="md" full>Back</Btn>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Expose to window for the host HTML to use
// ═════════════════════════════════════════════════════════════
Object.assign(window, {
  SignInScreen,
  SignUpScreen,
  EmailVerifyScreen,
  ResetPasswordScreen,
  ParticipantRegisterContent,
  ParticipantDashboardContent,
  RoundDetailContent,
  MeetingPointContent,
  NoMatchContent,
  MatchPartnerContent,
  MatchNetworkingContent,
  ContactSharingContent,
  WondereloFeedbackContent,
  MissedRoundContent,
  WC: C,
  AuthMobileCtx,
  AuthChromeCtx,
  // Shared atoms for auth-screens.jsx (loaded after this file)
  WAtoms: { C, Italic, Diamond, Eyebrow, Logo, Btn, ArrowRight, DesktopCard, Field },
});
