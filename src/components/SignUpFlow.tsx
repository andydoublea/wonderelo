/* Wonderelo — organizer Sign Up wizard (Claude Design v06).

   Ported 1:1 from the design bundle `design/v06/project/pages/auth-screens.jsx`
   (organizer sign-up = OSAccount → OSDiscovery → OSOrg, a 3-step `DesktopCard`
   + `Steps` wizard). Atoms (Logo / Field / Btn / Steps / DesktopCard / Italic)
   are inlined here — same approach as `Homepage.tsx` — rendering 1:1 on the
   clean single-brand base (no skin / neutralisers).

   ALL wizard logic is preserved from the previous component: step state, email
   availability check + debounce, slug check, registration-draft autosave,
   per-step validation, submit/verify handoff and every prop. Only the
   markup/styling changed. The presentational `SignUpFlowView` (also consumed by
   AdminPagePreview) keeps its exact prop interface; the container delegates to
   it so the real flow and the admin preview share one redesigned view. */
import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ServiceType } from '../App';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface SignUpData {
  email: string;
  password: string;
  serviceType: ServiceType;
  urlSlug: string;
  discoverySource: string;
  companySize: string;
  userRole: string;
  organizerName: string;
  eventType: string;
  eventTypeOther: string;
}

interface SignUpFlowProps {
  onComplete: (data: SignUpData) => void;
  onBack: () => void;
  onSwitchToSignIn?: () => void;
}

const companySizeOptions = [
  { value: '1', label: 'Just me' },
  { value: '2-10', label: '2–10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' }
];

const roleOptions = [
  { value: 'founder', label: 'Founder / Co-founder' },
  { value: 'ceo', label: 'CEO/Executive' },
  { value: 'marketing', label: 'Marketing manager' },
  { value: 'events', label: 'Events manager' },
  { value: 'operations', label: 'Operations manager' },
  { value: 'business-dev', label: 'Business development' },
  { value: 'community', label: 'Community manager' },
  { value: 'other', label: 'Other' }
];

const eventTypeOptions = [
  { value: 'conference', label: 'Conference or barcamp' },
  { value: 'community-meetup', label: 'Community meetup' },
  { value: 'student-hall', label: 'Student hall networking' },
  { value: 'party', label: 'Party' },
  { value: 'festival', label: 'Festival' },
  { value: 'company-event', label: 'Company event' },
  { value: 'company-team', label: 'Company team networking' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'dating', label: 'Dating' },
  { value: 'bar-cafe', label: 'Bar or Café event (e.g. board game night)' },
  { value: 'other', label: 'Other (please describe)' }
];

const discoveryOptions = [
  { value: 'search', label: 'Google search' },
  { value: 'social', label: 'Social media' },
  { value: 'referral', label: 'Friend/colleague referral' },
  { value: 'conference', label: 'Conference/event' },
  { value: 'blog', label: 'Blog/article' },
  // HIDDEN (not in design — design has 6 discovery options): Partner/integration.
  // Kept in code; filtered out of the rendered list via `visibleDiscoveryOptions`.
  { value: 'partner', label: 'Partner/integration' },
  { value: 'other', label: 'Other' }
];

// Design shows 6 options; the 'partner' option is preserved above but not rendered.
const visibleDiscoveryOptions = discoveryOptions.filter((o) => o.value !== 'partner');

/* ─────────────────────────────────────────────────────────────
   Brand palette + inlined atoms — verbatim from the design bundle
   (`auth-screens.jsx` / `participant-screens.jsx` `C` + `WAtoms`).
   ───────────────────────────────────────────────────────────── */
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
  danger: '#dc2626',
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, serif',
  fontBody: '"Space Grotesk", system-ui, sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

/* The design's italic serif accent. */
function Italic({ children, color = C.orange }: { children: ReactNode; color?: string }) {
  return <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;
}

function Diamond({ size = 8, color = C.orange, style = {} }: { size?: number; color?: string; style?: CSSProperties }) {
  return <span style={{ display: 'inline-block', width: size, height: size, background: color, transform: 'rotate(45deg)', ...style }} />;
}

/* Brand lockup (symbol + wordmark). Clickable — returns to home (onBack). */
function Logo({ size = 28, symbolScale = 1.42, onClick }: { size?: number; symbolScale?: number; onClick?: () => void }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src="/Wonderelo-logo-symbol.png"
        alt=""
        style={{ width: size * symbolScale, height: size * symbolScale, objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: size * 0.66, letterSpacing: '-0.025em', color: C.purpleDeep, lineHeight: 1 }}>
        wonderelo
      </div>
    </div>
  );
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 14, color = C.danger }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 3a9 9 0 1 0 9 9" opacity="0.9" />
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}

/* Eyebrow label (auth-screens.jsx `Eyebrow`). */
function Eyebrow({ children, color = C.orange }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
      <span style={{ width: 18, height: 1, background: color }} />
      {children}
    </span>
  );
}

/* Large framed icon (auth-screens.jsx `BigIcon`). */
function BigIcon({ children, badge = C.orange }: { children: ReactNode; badge?: string }) {
  return (
    <div style={{
      width: 88, height: 88, borderRadius: 22, margin: '0 auto 22px',
      background: `linear-gradient(140deg, #fff, ${C.cream})`, border: `1px solid ${C.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <Diamond size={10} color={badge} style={{ position: 'absolute', top: -6, right: -6 }} />
      {children}
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
  );
}

/* External-link glyph — the design "Open Gmail" CTA leading icon. */
function ExternalLinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
  );
}

/* Primary CTA button (extends the mock atom with onClick / disabled / loading). */
function Btn({
  children,
  variant = 'primary',
  size = 'lg',
  full = false,
  leadingIcon,
  trailingIcon,
  onClick,
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
  full?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base: CSSProperties = {
    fontFamily: C.fontBody, fontWeight: 600,
    border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
    transition: 'transform .12s, box-shadow .12s, background .12s, opacity .12s',
    opacity: disabled ? 0.5 : 1,
  };
  const sz: CSSProperties = size === 'md' ? { padding: '12px 18px', fontSize: 14.5 } : { padding: '15px 22px', fontSize: 16 };
  const variants: Record<string, CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: disabled ? 'none' : '0 6px 16px rgba(221,83,28,.30)' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sz, ...variants[variant] }}>
      {leadingIcon}{children}{trailingIcon}
    </button>
  );
}

/* Wizard progress indicator (auth-screens.jsx `Steps`). */
function Steps({ n, total, label }: { n: number; total: number; label: ReactNode }) {
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

/* Card wrapper (auth-screens.jsx `DesktopCard`). */
function DesktopCard({ width = 520, children, footer }: { width?: number; children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      style={{
        width: '100%', maxWidth: width, background: C.paper,
        fontFamily: C.fontBody, color: C.ink, padding: '40px 36px 32px',
        borderRadius: 24, border: `1px solid ${C.hair}`,
        boxShadow: '0 20px 40px rgba(76,25,77,.12)',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 24,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Diamond size={9} style={{ position: 'absolute', top: 20, right: 24 }} />
      <Diamond size={6} color={C.purple} style={{ position: 'absolute', top: 32, right: 40, opacity: .5 }} />
      {children}
      {footer && (
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.hair}`, fontSize: 12, color: C.ink, opacity: .65, textAlign: 'center' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

/* Card heading (title + serif accent + sub). */
function Heading({ title, accent, sub }: { title: string; accent: ReactNode; sub: string }) {
  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
        {title} <Italic>{accent}</Italic>
      </h1>
      <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: .78, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

/* Small "← …" back / switch link (auth-screens.jsx `BackLink`). */
function BackLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .65, background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default', padding: 0 }}
    >
      {children}
    </button>
  );
}

/* Editable input field (auth-screens.jsx `Field`, wired to real state). */
function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  error,
  suffix,
  password = false,
  showPassword = false,
  onTogglePassword,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  suffix?: ReactNode;
  password?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const inputType = password ? (showPassword ? 'text' : 'password') : type;
  const borderCol = error ? C.danger : focused ? C.orange : C.hairStrong;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', color: C.purpleDeep, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px', borderRadius: 12, background: '#fff',
          border: `1.5px solid ${borderCol}`,
          boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.12)' : 'none',
          transition: 'border-color .12s, box-shadow .12s',
        }}
      >
        <input
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 15, color: C.ink, minWidth: 0 }}
        />
        {suffix}
        {password && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 12, color: error ? C.danger : C.ink, opacity: error ? 1 : .7, display: 'inline-flex', alignItems: 'center', gap: 5 }}>{error || hint}</span>
      )}
    </label>
  );
}

/* Editable radio list (auth-screens.jsx `RadioList`, wired to real state). */
function RadioList({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <div
            key={o.value}
            role="radio"
            aria-checked={on}
            tabIndex={0}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(o.value); } }}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11, cursor: 'pointer',
              border: `1.5px solid ${on ? C.orange : C.hairStrong}`,
              background: on ? 'rgba(221,83,28,.06)' : '#fff',
              transition: 'border-color .12s, background .12s',
            }}
          >
            <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${on ? C.orange : C.hairStrong}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
            </span>
            <span style={{ fontSize: 14, color: on ? C.purpleDeep : C.ink, fontWeight: on ? 600 : 500 }}>{o.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Editable select (auth-screens.jsx `SelectField`, native <select> styled to match). */
function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', color: C.purpleDeep, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div
        style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          padding: '13px 16px', borderRadius: 12, background: '#fff',
          border: `1.5px solid ${focused ? C.orange : C.hairStrong}`,
          boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.12)' : 'none',
          transition: 'border-color .12s, box-shadow .12s',
        }}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent', appearance: 'none',
            WebkitAppearance: 'none', MozAppearance: 'none',
            fontFamily: C.fontBody, fontSize: 15, color: value ? C.ink : 'rgba(58,46,52,.5)',
            cursor: 'pointer', paddingRight: 20,
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 16, pointerEvents: 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </label>
  );
}

/* Organizer email-verification screen (auth-screens.jsx `OSVerify`).
   Rendered as the post-signup state. The backend pre-confirms the account
   (`admin.createUser({ email_confirm: true })`) and sends no verification email,
   so the primary CTA continues straight to the dashboard via `onContinue`
   (→ onComplete → /rounds) — otherwise signup would dead-end here. The re-send
   countdown is cosmetic; "Use a different email →" returns to step 1. */
function OrganizerVerifyScreen({ email, onContinue, onDifferentEmail }: { email: string; onContinue: () => void; onDifferentEmail: () => void }) {
  return (
    <div
      className="wonderelo"
      style={{
        minHeight: '100vh', width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 20px', background: C.cream,
        fontFamily: C.fontBody, color: C.ink, position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(rgba(76,25,77,.6) 1px, transparent 1px)', backgroundSize: '4px 4px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <DesktopCard width={480}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Logo symbolScale={1.42} /></div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <BigIcon><MailIcon /></BigIcon>
            <Eyebrow>Almost there</Eyebrow>
            <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
              Verify your <Italic>email</Italic>
            </h1>
            <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: 0.82 }}>
              Your account for <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>{email}</strong> is ready. Continue to open your dashboard.
            </p>
          </div>
          <Btn variant="primary" size="lg" full onClick={onContinue} trailingIcon={<ExternalLinkIcon size={16} />}>
            Continue to dashboard
          </Btn>
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, fontFamily: C.fontMono, fontSize: 11, color: C.ink, opacity: 0.6 }}>
            Re-sending in 0:23 ·{' '}
            <button type="button" onClick={onDifferentEmail} style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: C.fontMono, fontSize: 11, color: C.purpleDeep, fontWeight: 600, cursor: 'pointer' }}>
              Use a different email →
            </button>
          </div>
        </DesktopCard>
      </div>
    </div>
  );
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// ============================================================

export interface SignUpFlowViewProps {
  currentStep: number;
  totalSteps: number;
  email: string;
  password: string;
  organizerName: string;
  showPassword: boolean;
  emailCheckStatus: 'idle' | 'checking' | 'available' | 'taken';
  discoverySource: string;
  eventType: string;
  eventTypeOther: string;
  companySize: string;
  userRole: string;
  error: string;
  isLoading: boolean;
  isStepValid: boolean;
  stepTitle: string;
  stepDescription: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onOrganizerNameChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onDiscoverySourceChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
  onEventTypeOtherChange: (v: string) => void;
  onCompanySizeChange: (v: string) => void;
  onUserRoleChange: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onBack: () => void;
  onSwitchToSignIn?: () => void;
}

/* Per-step chrome, from the mock (OSAccount / OSDiscovery / OSOrg). */
const STEP_META: Record<number, { stepsLabel: ReactNode; title: string; accent: ReactNode; sub: string }> = {
  1: { stepsLabel: <>Create <Italic>your account</Italic></>, title: 'Get started', accent: 'for free.', sub: "Set up the login you'll use to run your events." },
  2: { stepsLabel: <>A little <Italic>context</Italic></>, title: 'How did you', accent: 'hear about us?', sub: 'Helps us understand how organizers find Wonderelo.' },
  3: { stepsLabel: <>About <Italic>your space</Italic></>, title: 'Tell us about', accent: 'your events.', sub: 'So we can tailor templates and defaults for you.' },
};

export function SignUpFlowView({
  currentStep,
  totalSteps,
  email,
  password,
  organizerName,
  showPassword,
  emailCheckStatus,
  discoverySource,
  eventType,
  eventTypeOther,
  companySize,
  userRole,
  error,
  isLoading,
  isStepValid,
  onEmailChange,
  onPasswordChange,
  onOrganizerNameChange,
  onToggleShowPassword,
  onDiscoverySourceChange,
  onEventTypeChange,
  onEventTypeOtherChange,
  onCompanySizeChange,
  onUserRoleChange,
  onNext,
  onPrev,
  onSubmit,
  onBack,
  onSwitchToSignIn,
}: SignUpFlowViewProps) {
  const meta = STEP_META[currentStep] ?? STEP_META[1];
  const isLast = currentStep >= totalSteps;

  // Email availability → the mock's suffix / hint slots.
  const emailSuffix =
    emailCheckStatus === 'available' ? (
      <span style={{ color: C.purple, fontSize: 13, fontWeight: 600, fontFamily: C.fontMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <CheckIcon size={12} /> available
      </span>
    ) : undefined;
  const emailHint = emailCheckStatus === 'checking' ? (
    <><Spinner size={12} /> Checking availability…</>
  ) : undefined;
  const emailError = emailCheckStatus === 'taken' ? 'Email is already registered' : undefined;

  const passwordHint = password && password.length < 6 ? 'Password must be at least 6 characters' : 'Minimum 6 characters.';

  return (
    <div
      className="wonderelo"
      style={{
        minHeight: '100vh', width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 20px', background: C.cream,
        fontFamily: C.fontBody, color: C.ink, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* texture grain — same treatment as the homepage hero */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(rgba(76,25,77,.6) 1px, transparent 1px)', backgroundSize: '4px 4px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <DesktopCard width={520}>
          {/* Top row — logo (→ home) + contextual back / switch link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo symbolScale={1.42} onClick={onBack} />
            {currentStep === 1
              ? (onSwitchToSignIn && <BackLink onClick={onSwitchToSignIn}>← Already have an account?</BackLink>)
              : <BackLink onClick={onPrev}>← Back</BackLink>}
          </div>

          <Steps n={currentStep} total={totalSteps} label={meta.stepsLabel} />
          <Heading title={meta.title} accent={meta.accent} sub={meta.sub} />

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)' }}>
              <XIcon size={15} />
              <span style={{ fontSize: 13, color: C.danger }}>{error}</span>
            </div>
          )}

          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field
                label="Email address"
                type="email"
                value={email}
                onChange={onEmailChange}
                placeholder="your@email.com"
                suffix={emailSuffix}
                hint={emailHint}
                error={emailError}
              />
              <Field
                label="Password"
                value={password}
                onChange={onPasswordChange}
                placeholder="Minimum 6 characters"
                password
                showPassword={showPassword}
                onTogglePassword={onToggleShowPassword}
                hint={passwordHint}
              />
              <Field
                label="Your name"
                value={organizerName}
                onChange={onOrganizerNameChange}
                placeholder="John Doe"
              />
            </div>
          )}

          {currentStep === 2 && (
            <RadioList options={visibleDiscoveryOptions} value={discoverySource} onChange={onDiscoverySourceChange} />
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SelectField
                label="What do you organise?"
                value={eventType}
                onChange={onEventTypeChange}
                placeholder="Select event type"
                options={eventTypeOptions}
              />
              {/* HIDDEN (not in design) — conditional "Describe your event type" field
                  shown when eventType === 'other'. Logic preserved; guarded to never render. */}
              {false && eventType === 'other' && (
                <Field
                  label="Describe your event type"
                  value={eventTypeOther}
                  onChange={onEventTypeOtherChange}
                  placeholder="Please describe your event type"
                />
              )}
              <SelectField
                label="Company size"
                value={companySize}
                onChange={onCompanySizeChange}
                placeholder="Select company size"
                options={companySizeOptions}
              />
              <SelectField
                label="Your role"
                value={userRole}
                onChange={onUserRoleChange}
                placeholder="Select your role"
                options={roleOptions}
              />
            </div>
          )}

          {isLast ? (
            <Btn
              variant="primary"
              size="lg"
              full
              onClick={onSubmit}
              disabled={!isStepValid || isLoading}
              leadingIcon={isLoading ? <Spinner size={16} /> : undefined}
              trailingIcon={isLoading ? undefined : <CheckIcon size={15} />}
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </Btn>
          ) : (
            <Btn
              variant="primary"
              size="lg"
              full
              onClick={onNext}
              disabled={!isStepValid}
              trailingIcon={<ArrowRight size={16} />}
            >
              Next
            </Btn>
          )}
        </DesktopCard>
      </div>
    </div>
  );
}

export function SignUpFlow({ onComplete, onBack, onSwitchToSignIn }: SignUpFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // After account creation the design shows an email-verification screen (OSVerify)
  // instead of redirecting straight to the dashboard.
  const [accountCreated, setAccountCreated] = useState(false);
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const emailTimeoutRef = useRef<NodeJS.Timeout>();
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    serviceType: 'event',
    urlSlug: '',
    discoverySource: '',
    companySize: '',
    userRole: '',
    organizerName: '',
    eventType: '',
    eventTypeOther: ''
  });

  const totalSteps = 3;

  // Function to remove diacritics and convert to URL-friendly slug
  const removeDiacritics = (str: string): string => {
    const diacriticsMap: { [key: string]: string } = {
      'á': 'a', 'ä': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
      'č': 'c', 'ç': 'c', 'ć': 'c',
      'ď': 'd', 'đ': 'd',
      'é': 'e', 'ě': 'e', 'ë': 'e', 'è': 'e', 'ê': 'e',
      'í': 'i', 'ï': 'i', 'ì': 'i', 'î': 'i',
      'ľ': 'l', 'ĺ': 'l', 'ł': 'l',
      'ň': 'n', 'ñ': 'n', 'ń': 'n',
      'ó': 'o', 'ö': 'o', 'ô': 'o', 'ò': 'o', 'õ': 'o', 'ø': 'o',
      'ř': 'r', 'ŕ': 'r',
      'š': 's', 'ś': 's',
      'ť': 't',
      'ú': 'u', 'ů': 'u', 'ü': 'u', 'ù': 'u', 'û': 'u',
      'ý': 'y', 'ÿ': 'y',
      'ž': 'z', 'ź': 'z', 'ż': 'z',
      'Á': 'a', 'Ä': 'a', 'À': 'a', 'Â': 'a', 'Ã': 'a', 'Å': 'a',
      'Č': 'c', 'Ç': 'c', 'Ć': 'c',
      'Ď': 'd', 'Đ': 'd',
      'É': 'e', 'Ě': 'e', 'Ë': 'e', 'È': 'e', 'Ê': 'e',
      'Í': 'i', 'Ï': 'i', 'Ì': 'i', 'Î': 'i',
      'Ľ': 'l', 'Ĺ': 'l', 'Ł': 'l',
      'Ň': 'n', 'Ñ': 'n', 'Ń': 'n',
      'Ó': 'o', 'Ö': 'o', 'Ô': 'o', 'Ò': 'o', 'Õ': 'o', 'Ø': 'o',
      'Ř': 'r', 'Ŕ': 'r',
      'Š': 's', 'Ś': 's',
      'Ť': 't',
      'Ú': 'u', 'Ů': 'u', 'Ü': 'u', 'Ù': 'u', 'Û': 'u',
      'Ý': 'y', 'Ÿ': 'y',
      'Ž': 'z', 'Ź': 'z', 'Ż': 'z'
    };

    return str
      .split('')
      .map(char => diacriticsMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/\s+/g, '') // Remove spaces completely
      .replace(/[^a-z0-9]/g, '') // Remove all special characters
      .trim(); // Remove leading/trailing whitespace
  };

  const updateFormData = (field: keyof SignUpData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check URL slug availability when it changes
    if (field === 'urlSlug' && value.length >= 3) {
      checkSlugAvailability(value);
    } else if (field === 'urlSlug') {
      setSlugCheckStatus('idle');
    }

    // Check email availability when it changes (with debounce)
    if (field === 'email') {
      // Clear previous timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }

      // Reset status immediately
      setEmailCheckStatus('idle');

      // Check if email format is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && emailRegex.test(value)) {
        // Set debounced check
        emailTimeoutRef.current = setTimeout(() => {
          checkEmailAvailability(value);
        }, 500); // 500ms debounce
      }
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    setSlugCheckStatus('checking');
    try {
      const response = await fetch(
        `${apiBaseUrl}/check-slug/${slug}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSlugCheckStatus(result.available ? 'available' : 'taken');
      } else {
        errorLog('Failed to check slug availability');
        setSlugCheckStatus('idle');
      }
    } catch (error) {
      errorLog('Error checking slug availability:', error);
      setSlugCheckStatus('idle');
    }
  };

  const checkEmailAvailability = async (email: string) => {
    setEmailCheckStatus('checking');
    try {
      debugLog('Checking email availability:', email);

      const response = await fetch(
        `${apiBaseUrl}/check-email/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      debugLog('Email check response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        debugLog('Email check result:', result);
        setEmailCheckStatus(result.available ? 'available' : 'taken');
      } else {
        const errorText = await response.text();
        errorLog('Failed to check email availability:', response.status, errorText);
        setEmailCheckStatus('idle');
      }
    } catch (error) {
      errorLog('Error checking email availability:', error);
      setEmailCheckStatus('idle');
    }
  };

  // Save registration draft to backend (non-blocking)
  const saveRegistrationDraft = (step: number) => {
    if (!formData.email) return;
    // Don't save password to the draft — only non-sensitive fields
    const { password, ...safeFormData } = formData;
    debugLog('Saving registration draft:', { email: formData.email, step, formData: safeFormData });
    fetch(
      `${apiBaseUrl}/registration-draft`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, currentStep: step, formData: safeFormData }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        errorLog('Registration draft save failed:', res.status, text);
      } else {
        debugLog('Registration draft saved successfully for step', step);
      }
    }).catch((err) => {
      errorLog('Registration draft save network error:', err);
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      saveRegistrationDraft(nextStepNum);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // Email must be available, password must be valid, and organizer name must be provided
        const emailValid = formData.email && emailCheckStatus === 'available';
        const passwordValid = formData.password.length >= 6;
        const organizerNameValid = formData.organizerName && formData.organizerName.trim().length > 0;
        return emailValid && passwordValid && organizerNameValid;
      case 2:
        return formData.discoverySource;
      case 3:
        // The "Describe your event type" field is hidden (not in design), so we no
        // longer require eventTypeOther — otherwise picking "Other" would dead-end the
        // wizard. Original gate preserved for reference:
        //   const eventTypeValid = formData.eventType && (formData.eventType !== 'other' || formData.eventTypeOther.trim().length > 0);
        const eventTypeValid = !!formData.eventType;
        return formData.companySize && formData.userRole && eventTypeValid;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Use the backend-generated slug instead of any frontend value
        localStorage.setItem('slug_auto_generated', 'true');
        // Persist the backend slug so the OSVerify "Continue" handoff carries it.
        setFormData((prev) => ({ ...prev, urlSlug: result.urlSlug || prev.urlSlug }));
        // Show the design's post-signup verification screen (OSVerify).
        setAccountCreated(true);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      errorLog('Sign up error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Create your account';
      case 2: return 'How did you hear about us?';
      case 3: return 'About your organization';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Get started with your Wonderelo account';
      case 2: return 'Help us understand how you discovered Wonderelo';
      case 3: return 'Tell us about your organization and role';
      default: return '';
    }
  };

  // URL slug is now generated randomly by the backend on registration
  // The organizer can customize it later via settings

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  // Keep the container's slug-check machinery referenced (verify handoff / draft).
  void removeDiacritics;
  void slugCheckStatus;

  // Post-signup: show the organizer email-verification screen (design OSVerify).
  // The backend creates the account with `email_confirm: true` (admin.createUser),
  // so the user is pre-confirmed and NO verification email is ever sent (any env).
  // OSVerify must therefore offer a real way forward — its primary CTA continues to
  // the dashboard via onComplete (→ /rounds) rather than dead-ending on "check your
  // email". "Use a different email" still returns to step 1 to correct a typo.
  if (accountCreated) {
    return (
      <OrganizerVerifyScreen
        email={formData.email}
        onContinue={() => onComplete({ ...formData })}
        onDifferentEmail={() => { setAccountCreated(false); setCurrentStep(1); }}
      />
    );
  }

  return (
    <SignUpFlowView
      currentStep={currentStep}
      totalSteps={totalSteps}
      email={formData.email}
      password={formData.password}
      organizerName={formData.organizerName}
      showPassword={showPassword}
      emailCheckStatus={emailCheckStatus}
      discoverySource={formData.discoverySource}
      eventType={formData.eventType}
      eventTypeOther={formData.eventTypeOther}
      companySize={formData.companySize}
      userRole={formData.userRole}
      error={error}
      isLoading={isLoading}
      isStepValid={!!isStepValid()}
      stepTitle={getStepTitle()}
      stepDescription={getStepDescription()}
      onEmailChange={(v) => updateFormData('email', v)}
      onPasswordChange={(v) => updateFormData('password', v)}
      onOrganizerNameChange={(v) => updateFormData('organizerName', v)}
      onToggleShowPassword={() => setShowPassword(!showPassword)}
      onDiscoverySourceChange={(v) => updateFormData('discoverySource', v)}
      onEventTypeChange={(v) => updateFormData('eventType', v)}
      onEventTypeOtherChange={(v) => updateFormData('eventTypeOther', v)}
      onCompanySizeChange={(v) => updateFormData('companySize', v)}
      onUserRoleChange={(v) => updateFormData('userRole', v)}
      onNext={nextStep}
      onPrev={prevStep}
      onSubmit={handleSubmit}
      onBack={onBack}
      onSwitchToSignIn={onSwitchToSignIn}
    />
  );
}
