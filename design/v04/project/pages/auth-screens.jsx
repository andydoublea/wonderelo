// ════════════════════════════════════════════════════════════════
// Wonderelo — Auth flows (4): Participant sign up · Participant sign in
//                            · Organizer sign up · Organizer sign in
// Desktop card screens. Atoms reused from participant-screens.jsx (window.WAtoms).
// Maps to codebase:
//   SignUpFlow.tsx (organizer, 3 steps) · SignInFlow.tsx (participant magic-link
//   + organizer password tabs) · ResetPasswordFlow.tsx · EmailVerificationWaiting.tsx
//   · SessionRegistration.tsx / RegistrationFlow.tsx (participant) · RegistrationSuccess.tsx
// ════════════════════════════════════════════════════════════════
const { C, Italic, Diamond, Eyebrow, Logo, Btn, ArrowRight, DesktopCard, Field } = window.WAtoms;

// ── small shared bits ────────────────────────────────────────────
const TopRow = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {left || <Logo symbolScale={1.42} />}
    {right}
  </div>
);

const BackLink = ({ children }) => (
  <button style={{ fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .65, background: 'transparent', border: 'none', cursor: 'pointer' }}>{children}</button>
);

function Steps({ n, total, label }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: C.fontMono, letterSpacing: '.14em', color: C.purple, opacity: .8, textTransform: 'uppercase', marginBottom: 10 }}>
        <span>Step {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <span>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < n ? C.orange : 'rgba(76,25,77,.10)' }} />
        ))}
      </div>
    </div>
  );
}

function Heading({ eyebrow, title, accent, sub }) {
  return (
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 style={{ margin: eyebrow ? '12px 0 8px' : '0 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
        {title} {accent && <Italic>{accent}</Italic>}
      </h1>
      {sub && <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: .78, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function Segmented({ active }) {
  // Participant / Organizer style segmented control
  const tab = (label, on) => (
    <div style={{
      flex: 1, padding: '10px 14px', borderRadius: 8, textAlign: 'center',
      background: on ? '#fff' : 'transparent', color: on ? C.purpleDeep : C.ink,
      opacity: on ? 1 : .7, fontWeight: on ? 700 : 600, fontSize: 13.5,
      boxShadow: on ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    }}>
      {on && <Diamond size={6} color={C.orange} />}{label}
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(76,25,77,.06)', borderRadius: 12 }}>
      {tab('Participant', active === 'participant')}
      {tab('Organizer', active === 'organizer')}
    </div>
  );
}

const Check = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

function Checkbox({ label, checked = true }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.ink, opacity: .85, lineHeight: 1.45 }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
        background: checked ? C.orange : 'transparent', color: '#fff',
        border: checked ? 'none' : `1.5px solid ${C.hairStrong}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{checked && <Check size={11} />}</span>
      <span>{label}</span>
    </label>
  );
}

function RadioList({ options, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <div key={o} style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11,
            border: `1.5px solid ${on ? C.orange : C.hairStrong}`,
            background: on ? 'rgba(221,83,28,.06)' : '#fff',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${on ? C.orange : C.hairStrong}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}</span>
            <span style={{ fontSize: 14, color: on ? C.purpleDeep : C.ink, fontWeight: on ? 600 : 500 }}>{o}</span>
          </div>
        );
      })}
    </div>
  );
}

function SelectField({ label, value }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', color: C.purpleDeep, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
        <span style={{ fontSize: 15, color: C.ink }}>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
    </label>
  );
}

const MailIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
);

function BigIcon({ children, badge = C.orange }) {
  return (
    <div style={{
      width: 88, height: 88, borderRadius: 22, margin: '0 auto 22px',
      background: 'linear-gradient(140deg, #fff, ' + C.cream + ')', border: `1px solid ${C.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <Diamond size={10} color={badge} style={{ position: 'absolute', top: -6, right: -6 }} />
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1 · PARTICIPANT SIGN UP  (join an event — guest path)
// ════════════════════════════════════════════════════════════════
function PSContact() {
  return (
    <DesktopCard width={480} footer={<>Your details are only shared with a match if you both agree.</>}>
      <TopRow right={<span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.ink, opacity: .55 }}>Founder Summit 2026</span>} />
      <Heading eyebrow="Join the event" title="Tell us" accent="who you are." sub="No account, no password. Just the basics so we can match you and send a reminder before your round." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="First name" value="Andy" />
          <Field label="Last name" value="Abel" />
        </div>
        <Field label="Email address" value="andy.abel@klimas.io" focused />
        <Field label="Phone number" prefix="🇸🇰 +421" value="903 555 218" hint="We text a reminder 5 min before the round." />
      </div>
      <Checkbox label={<>I agree to the <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Terms</span> &amp; <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Privacy Policy</span>.</>} />
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Continue</Btn>
    </DesktopCard>
  );
}

function PSVerify() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo symbolScale={1.42} /></div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <BigIcon><MailIcon /></BigIcon>
        <Eyebrow>One quick step</Eyebrow>
        <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>Confirm your <Italic>email</Italic></h1>
        <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>We sent a confirmation link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>andy.abel@klimas.io</strong>. Tap it to lock in your spot.</p>
      </div>
      <Btn variant="primary" size="lg" full leadingIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      }>Open Gmail</Btn>
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, fontSize: 13, color: C.ink, opacity: .82 }}>
        <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Didn't get it?</strong> Check spam, or <span style={{ color: C.purpleDeep, fontWeight: 600 }}>resend in 0:24</span>.
      </div>
    </DesktopCard>
  );
}

function PSSuccess() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo symbolScale={1.42} /></div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ width: 92, height: 92, borderRadius: 24, margin: '0 auto 22px', background: 'linear-gradient(140deg, ' + C.orange + ', ' + C.orangeBright + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(221,83,28,.32)', position: 'relative' }}>
          <Diamond size={11} color={C.purpleDeep} style={{ position: 'absolute', top: -7, left: -7 }} />
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <Eyebrow>You're in</Eyebrow>
        <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 33, lineHeight: 1.06, letterSpacing: '-0.025em', color: C.purpleDeep }}>Registration <Italic>confirmed</Italic></h1>
        <p style={{ margin: '0 auto', maxWidth: 350, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>You're registered for <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Welcome mixer · R1</strong>. We'll text you 5 minutes before it starts.</p>
      </div>
      <div style={{ padding: '16px 18px', borderRadius: 14, background: C.cream, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.45 }}>
          <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Sat 14 Jun · 14:00</strong><br />Main entrance, level 1
        </div>
      </div>
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Go to my dashboard</Btn>
    </DesktopCard>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · PARTICIPANT SIGN IN  (returning — magic link)
// ════════════════════════════════════════════════════════════════
function PIEmail() {
  return (
    <DesktopCard width={480}>
      <TopRow />
      <Heading eyebrow="Welcome back" title="Sign in to" accent="Wonderelo." sub="Two ways in — pick the one that fits." />
      <Segmented active="participant" />
      <Field label="Email address" value="andy.abel@klimas.io" focused />
      <Btn variant="primary" size="lg" full leadingIcon={<MailMini />}>Email me a magic link</Btn>
      <p style={{ margin: 0, fontSize: 12.5, color: C.ink, opacity: .65, textAlign: 'center', lineHeight: 1.5 }}>No password needed. We email you a link that signs you straight in.</p>
    </DesktopCard>
  );
}

const MailMini = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
);

function PISent() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo symbolScale={1.42} /></div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <BigIcon><MailIcon /></BigIcon>
        <Eyebrow>Link sent</Eyebrow>
        <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>Check your <Italic>inbox</Italic></h1>
        <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>We emailed a magic link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>andy.abel@klimas.io</strong>. Click it on this device and you're back in.</p>
      </div>
      <Btn variant="primary" size="lg" full leadingIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      }>Open Gmail</Btn>
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, fontSize: 13, color: C.ink, opacity: .82 }}>
        <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Wrong email?</strong> <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Use a different one →</span>
      </div>
    </DesktopCard>
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · ORGANIZER SIGN UP  (3-step account creation)
// ════════════════════════════════════════════════════════════════
function OSAccount() {
  return (
    <DesktopCard width={520}>
      <TopRow right={<BackLink>← Already have an account?</BackLink>} />
      <Steps n={1} total={3} label={<>Create <Italic>your account</Italic></>} />
      <Heading title="Get started" accent="for free." sub="Set up the login you'll use to run your events." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email address" value="andy@founder-summit.com" suffix="✓ available" focused />
        <Field label="Password" type="password" value="••••••••••" password hint="Minimum 6 characters." />
        <Field label="Your name" value="Andy Abel" />
      </div>
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Next</Btn>
    </DesktopCard>
  );
}

function OSDiscovery() {
  return (
    <DesktopCard width={520}>
      <TopRow right={<BackLink>← Back</BackLink>} />
      <Steps n={2} total={3} label={<>A little <Italic>context</Italic></>} />
      <Heading title="How did you" accent="hear about us?" sub="Helps us understand how organizers find Wonderelo." />
      <RadioList value="Friend/colleague referral" options={[ 'Google search', 'Social media', 'Friend/colleague referral', 'Conference/event', 'Blog/article', 'Other' ]} />
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Next</Btn>
    </DesktopCard>
  );
}

function OSOrg() {
  return (
    <DesktopCard width={520}>
      <TopRow right={<BackLink>← Back</BackLink>} />
      <Steps n={3} total={3} label={<>About <Italic>your space</Italic></>} />
      <Heading title="Tell us about" accent="your events." sub="So we can tailor templates and defaults for you." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SelectField label="What do you organise?" value="Conference or barcamp" />
        <SelectField label="Company size" value="2–10 employees" />
        <SelectField label="Your role" value="Founder / Co-founder" />
      </div>
      <Btn variant="primary" size="lg" full trailingIcon={<Check size={15} />}>Create account</Btn>
    </DesktopCard>
  );
}

function OSVerify() {
  return (
    <DesktopCard width={480}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo symbolScale={1.42} /></div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <BigIcon><MailIcon /></BigIcon>
        <Eyebrow>Almost there</Eyebrow>
        <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>Verify your <Italic>email</Italic></h1>
        <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>We sent a verification link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>andy@founder-summit.com</strong>. Confirm it to open your dashboard.</p>
      </div>
      <Btn variant="primary" size="lg" full leadingIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      }>Open Gmail</Btn>
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, fontFamily: C.fontMono, fontSize: 11, color: C.ink, opacity: .6 }}>
        Re-sending in 0:23 · <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Use a different email →</span>
      </div>
    </DesktopCard>
  );
}

// ════════════════════════════════════════════════════════════════
// 4 · ORGANIZER SIGN IN  (email + password, forgot, reset)
// ════════════════════════════════════════════════════════════════
function OISignIn() {
  return (
    <DesktopCard width={480} footer={<>Need an account? <span style={{ color: C.purpleDeep, fontWeight: 600 }}>Sign up for free →</span></>}>
      <TopRow />
      <Heading eyebrow="Welcome back" title="Sign in to" accent="Wonderelo." sub="Manage your events and rounds." />
      <Segmented active="organizer" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email address" value="andy@founder-summit.com" />
        <Field label="Password" type="password" value="••••••••••" focused password />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
        <Checkbox label="Remember me" />
        <a href="#" style={{ fontSize: 13, color: C.purpleDeep, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
      </div>
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Sign in</Btn>
    </DesktopCard>
  );
}

function OIForgot() {
  return (
    <DesktopCard width={480}>
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <BigIcon badge={C.purple}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </BigIcon>
        <Heading eyebrow="Reset password" title="Forgot your" accent="password?" sub="Enter your email and we'll send a reset link." />
      </div>
      <Field label="Email address" value="andy@founder-summit.com" focused />
      <Btn variant="primary" size="lg" full leadingIcon={<MailMini />}>Send reset link</Btn>
    </DesktopCard>
  );
}

function OIReset() {
  return (
    <DesktopCard width={480}>
      <TopRow right={<BackLink>← Back to sign in</BackLink>} />
      <Heading eyebrow="Reset password" title="Choose a" accent="new password." sub="Pick something memorable. We never store the original." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="New password" type="password" value="••••••••" password />
        <Field label="Repeat password" type="password" value="••••••••" focused password />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: C.fontMono, color: C.ink, opacity: .65, marginBottom: 8, letterSpacing: '.04em' }}>
          <span>Strength</span><span style={{ color: C.orange, fontWeight: 700 }}>Strong</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 3 ? C.orange : 'rgba(76,25,77,.10)' }} />)}
        </div>
        <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: C.ink, opacity: .82 }}>
          {[['8 characters or more', true], ['Mix of letters and numbers', true], ['One special character (!@#…)', false]].map(([label, ok]) => (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: ok ? C.orange : 'transparent', border: ok ? 'none' : `1.5px solid ${C.hairStrong}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{ok && <Check size={8} />}</span>
              {label}
            </li>
          ))}
        </ul>
      </div>
      <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />}>Save new password</Btn>
    </DesktopCard>
  );
}

// ── expose ───────────────────────────────────────────────────────
Object.assign(window, {
  PSContact, PSVerify, PSSuccess,
  PIEmail, PISent,
  OSAccount, OSDiscovery, OSOrg, OSVerify,
  OISignIn, OIForgot, OIReset,
});
