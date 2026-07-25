/* Wonderelo — shared organizer/admin redesign atoms.
   Ported 1:1 from design/v06/project/pages/organizer-shared.jsx.

   The design mock exposed every atom on `window`; here each is a real named
   ES export so screen components can:
     import { C, Italic, Eyebrow, Btn, PageHead, PageShell, FormField } from './organizerAtoms';

   Mock-only dev scaffolding was dropped: the window.__wBilling / window.setBilling
   billing-dev-toggle block, the <PlanDevToggle> dev segmented control, and the
   `Object.assign(window, …)` global exposure. OrgNav no longer reads
   window.__wBilling — it takes a `billing` prop (default 'subscription').

   Global brand CSS (--w-* tokens + Space Grotesk body font) already lives on
   :root; the C hex values below are referenced directly, exactly as the mock did. */
import React from 'react';

export const C = {
  purple: '#5C2277', purpleDeep: '#4b1d51', purpleInk: '#2d1133',
  orange: '#dd531c', orangeBright: '#ff6a2a',
  cream: '#f7f1e6', paper: '#fbf6ec', paperDeep: '#f1e9d8',
  ink: '#3a2e34',
  hair: 'rgba(76,25,77,.10)', hairStrong: 'rgba(76,25,77,.18)',
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, serif',
  fontBody: '"Space Grotesk", system-ui, sans-serif',
  fontHand: '"Caveat", cursive',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

type BillingKind = 'subscription' | 'credits' | 'free';

export const Italic = ({ children, color = C.orange }: { children?: React.ReactNode; color?: string }) => (
  <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>
);

export const Diamond = ({ size = 8, color = C.orange, style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <span style={{ display: 'inline-block', width: size, height: size, background: color, transform: 'rotate(45deg)', ...style }} />
);

export const Eyebrow = ({ children, color = C.orange }: { children?: React.ReactNode; color?: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
    fontFamily: C.fontBody,
  }}>
    <span style={{ width: 24, height: 1, background: color }} />
    {children}
  </span>
);

// Matches the homepage-desktop nav lockup exactly: 120px symbol centered in a
// 40px box (so it doesn't push the wordmark), 32px wordmark, homepage gap.
export const Logo = ({ size = 120, wordmark = 32, dark = false }: { size?: number; wordmark?: number; dark?: boolean }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(8, (size - 40) / 2 + 4), cursor: 'pointer' }}>
    <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img
        src="assets/Wonderelo-logo-symbol.png" alt=""
        style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-6deg)', width: size, height: size, objectFit: 'contain' }}
      />
    </div>
    <div style={{
      fontFamily: C.fontDisplay, fontWeight: 800, fontSize: wordmark,
      letterSpacing: '-0.03em', color: dark ? '#fff' : C.purpleDeep, lineHeight: 1,
    }}>
      wonderelo
    </div>
  </div>
);

export const Btn = ({ children, variant = 'primary', size = 'md', full = false, leadingIcon, trailingIcon, style = {} }: {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'darkGhost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const base: React.CSSProperties = {
    fontFamily: C.fontBody, fontWeight: 600,
    border: '1px solid transparent', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
  };
  const sz: React.CSSProperties = size === 'sm' ? { padding: '8px 12px', fontSize: 13 }
    : size === 'lg' ? { padding: '14px 20px', fontSize: 15 }
    : { padding: '11px 16px', fontSize: 14 };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: '0 6px 16px rgba(221,83,28,.25)' },
    secondary: { background: C.purpleDeep, color: '#fff' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
    darkGhost: { background: 'rgba(255,255,255,.08)', color: '#fff', borderColor: 'rgba(255,255,255,.18)' },
  };
  return <button style={{ ...base, ...sz, ...variants[variant], ...style }}>{leadingIcon}{children}{trailingIcon}</button>;
};

export const ArrowR = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
// Alias — some screen components import this as `ArrowRight`.
export const ArrowRight = ArrowR;

// Top app nav for authenticated organizer screens (shared layout).
// `billing` replaces the mock's window.__wBilling read (default 'subscription').
export function OrgNav({ active = 'Rounds', billing = 'subscription' }: { active?: string; billing?: BillingKind }) {
  const tabs = ['Rounds', 'Event page'];
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Plan/credits status pill — content matches the pricing model (config/pricing.ts).
  const PLANS: Record<BillingKind, { dot: string; bg: string; bd: string; main: string; meta: string; metaUsers?: boolean }> = {
    subscription: { dot: C.orange, bg: 'rgba(221,83,28,.08)', bd: 'rgba(221,83,28,.30)', main: 'Unlimited events', meta: 'up to 200', metaUsers: true },
    credits:      { dot: C.purple, bg: 'rgba(76,25,77,.06)',  bd: C.hairStrong,          main: '3 credits', meta: 'Up to 50' },
    free:         { dot: 'rgba(76,25,77,.4)', bg: 'transparent', bd: C.hairStrong,        main: 'Free plan', meta: 'Up to 5' },
  };
  const plan = PLANS[billing] || PLANS.subscription;
  // Single-participant glyph — marks the capacity meta as a participant count.
  const UserGlyph = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M5 21v-1a7 7 0 0 1 14 0v1" /></svg>
  );
  const MenuItem = ({ icon, children, danger, active: isActive }: { icon?: React.ReactNode; children?: React.ReactNode; danger?: boolean; active?: boolean }) => (
    <div onClick={() => setMenuOpen(false)} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
      fontFamily: C.fontBody, fontSize: 13.5, fontWeight: isActive ? 700 : 500,
      color: danger ? '#c0392b' : C.purpleDeep,
      background: isActive ? 'rgba(76,25,77,.07)' : 'transparent',
    }}>
      <span style={{ display: 'inline-flex', opacity: .7 }}>{icon}</span>{children}
    </div>
  );
  return (
    <div style={{
      borderBottom: `1px solid ${C.hair}`, background: 'rgba(251,246,236,.92)',
      padding: '14px 40px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center',
    }}>
      <Logo />
      <div style={{ display: 'flex', gap: 4, justifySelf: 'center' }}>
        {tabs.map(t => (
          <div key={t} style={{
            padding: '8px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
            color: t === active ? C.purpleDeep : C.ink,
            opacity: t === active ? 1 : .65,
            background: t === active ? 'rgba(76,25,77,.08)' : 'transparent',
            display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontBody,
          }}>
            {t === active && <Diamond size={6} />}
            {t}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
        {/* Plan / credits status — subscription, prepaid credits, or free tier (before the event chip) */}
        <div title="Billing & plan" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 11px',
          borderRadius: 999, border: `1px solid ${plan.bd}`, background: plan.bg, cursor: 'pointer', fontFamily: C.fontBody,
        }}>
          <Diamond size={7} color={plan.dot} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.purpleDeep, letterSpacing: '-.01em' }}>{plan.main}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: C.ink, opacity: .55, fontFamily: C.fontMono }}>
            {plan.meta}
            {plan.metaUsers && <UserGlyph />}
          </span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 10px',
          borderRadius: 999, border: `1px solid ${C.hairStrong}`, background: 'rgba(255,255,255,.5)',
          fontSize: 12, fontWeight: 600, color: C.purpleDeep, fontFamily: C.fontBody, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,.18)' }} />
          Founder Summit 2026
        </div>
        {/* Name → dropdown (Go to homepage · Sign out) */}
        <div onClick={() => setMenuOpen(o => !o)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 9, padding: '5px 10px 5px 6px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${menuOpen ? C.hairStrong : 'transparent'}`, background: menuOpen ? 'rgba(255,255,255,.7)' : 'transparent',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 12 }}>AA</div>
          <span style={{ fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, color: C.purpleDeep, whiteSpace: 'nowrap' }}>Andy Abel</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .55, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, width: 200, padding: 6,
            background: '#fff', borderRadius: 12, border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)',
          }}>
            <MenuItem active={active === 'Account'} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></svg>}>Account settings</MenuItem>
            <MenuItem active={active === 'Billing'} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}>Billing</MenuItem>
            <div style={{ height: 1, background: C.hair, margin: '4px 0' }} />
            <MenuItem icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}>Go to homepage</MenuItem>
            <div style={{ height: 1, background: C.hair, margin: '4px 0' }} />
            <MenuItem danger icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}>Sign out</MenuItem>
          </div>
        )}
      </div>
    </div>
  );
}

// Form field — desktop sized
export function FormField({ label, value = '', placeholder, hint, prefix, suffix, focused = false, helper, width, type = 'text' }: {
  label?: React.ReactNode;
  value?: string;
  placeholder?: string;
  hint?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  focused?: boolean;
  helper?: React.ReactNode;
  width?: number | string;
  type?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, width }}>
      <span style={{ fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase' }}>
        {label}
        {helper && <span style={{ marginLeft: 8, fontSize: 10, color: C.ink, opacity: .55, letterSpacing: '.02em', textTransform: 'none', fontFamily: C.fontMono, fontWeight: 400 }}>{helper}</span>}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', borderRadius: 11,
        background: '#fff',
        border: `1.5px solid ${focused ? C.orange : C.hairStrong}`,
        boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
      }}>
        {prefix && <span style={{ color: C.ink, opacity: .6, fontSize: 13.5, fontFamily: C.fontMono }}>{prefix}</span>}
        <input type={type} defaultValue={value} placeholder={placeholder} readOnly style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
        }} />
        {suffix && <span style={{ color: C.purple, fontSize: 12, fontWeight: 600, fontFamily: C.fontMono }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontSize: 11.5, color: C.ink, opacity: .7 }}>{hint}</span>}
    </label>
  );
}
// Alias — some screen components import this as `Field`.
export const Field = FormField;

// Footer — exact port of the homepage footer (FooterSection in sections.jsx).
export function StudioFooter() {
  const cols = [
    { title: 'Product', links: ['Features', 'How it works', 'Pricing'] },
    { title: 'Company', links: ['Our story', 'Newsroom', 'Contact us'] },
    { title: 'Support', links: ['Help center'] },
    { title: 'Legal', links: ['Terms of use', 'Privacy policy'] },
  ];
  const Social = ({ children }: { children?: React.ReactNode }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, color: 'rgba(255,255,255,.6)' }}>{children}</span>
  );
  return (
    <footer style={{ background: C.purpleInk, color: 'rgba(255,255,255,.7)', padding: '80px 60px 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 60, marginBottom: 60 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="assets/Wonderelo-logo-symbol.png" alt="" style={{ width: 96, height: 96, transform: 'rotate(-6deg)' }} />
              <span style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>wonderelo</span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div style={{ fontFamily: C.fontBody, fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 18 }}>{c.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.links.map((l) => (
                  <li key={l} style={{ fontFamily: C.fontBody, fontSize: 14, color: 'rgba(255,255,255,.65)', cursor: 'pointer', width: 'fit-content' }}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: C.fontBody, fontSize: 13, color: 'rgba(255,255,255,.5)' }}>© 2025 Wonderelo. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Social><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></Social>
            <Social><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></Social>
            <Social><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></Social>
            <Social><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg></Social>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Page shell — used inside browser window
export function PageShell({ children, nav = true, navActive, bg = C.paper, footer = true, billing = 'subscription' }: {
  children?: React.ReactNode;
  nav?: boolean;
  navActive?: string;
  bg?: string;
  footer?: boolean;
  billing?: BillingKind;
}) {
  return (
    <div style={{ background: bg, fontFamily: C.fontBody, color: C.ink, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {nav && <OrgNav active={navActive} billing={billing} />}
      <div style={{ flex: 1, width: '100%', maxWidth: 1240, margin: '0 auto', padding: '40px 32px 64px', boxSizing: 'border-box' }}>
        {children}
      </div>
      {footer && <StudioFooter />}
    </div>
  );
}

export function PageHead({ eyebrow, title, lede, actions }: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 32, marginBottom: 36 }}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 style={{
          margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800,
          fontSize: 44, lineHeight: 1, letterSpacing: '-0.035em', color: C.purpleDeep,
        }}>{title}</h1>
        {lede && <p style={{ margin: '14px 0 0', maxWidth: 540, fontSize: 15, lineHeight: 1.55, color: C.ink, opacity: .8 }}>{lede}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  );
}
