/* Wonderelo — Reset password (Claude Design v06).

   View markup ported 1:1 from the design bundle
   `design/v06/project/pages/auth-screens.jsx` — the `OIReset` DesktopCard
   (brand Logo + "Back to sign in" link, "Reset password" eyebrow, display
   title with an <Italic> accent, the two password fields, a password-strength
   indicator, and a primary CTA). The success state reuses the same card design
   language (PSSuccess-style badge + card).

   The atoms (C palette, Italic, Eyebrow, Logo, Btn, DesktopCard) are inlined
   here — the same approach Homepage.tsx uses — rather than imported, so this
   screen renders 1:1 on the clean fixed-brand base with no skin/neutralisers.

   ALL container logic is preserved from the previous implementation: the URL
   token extraction/cleanup effect, `isFormValid` / `getPasswordError`
   validation, the `reset-password-with-token` submit handler, and every piece
   of state + the `ResetPasswordFlowViewProps` contract (shared with
   AdminPagePreview). Only the markup/styling changed. The password inputs stay
   real `<input type="password">` with the existing value/onChange handlers; the
   strength meter is a pure derivation of the `password` prop, so it needs no
   new container state. */
import { useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface ResetPasswordFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Brand palette + atoms — verbatim from the design mock's `C` object
   and the WAtoms (Italic / Eyebrow / Logo / Btn / DesktopCard).
   ───────────────────────────────────────────────────────────── */
const C = {
  purple: '#5C2277',
  purpleDeep: '#4b1d51',
  orange: '#dd531c',
  orangeBright: '#ff6a2a',
  cream: '#f7f1e6',
  paper: '#fbf6ec',
  ink: '#3a2e34',
  hair: 'rgba(76,25,77,.10)',
  hairStrong: 'rgba(76,25,77,.18)',
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, serif',
  fontBody: '"Space Grotesk", system-ui, sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

function Italic({ children, color = C.orange }: { children?: ReactNode; color?: string }) {
  return <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;
}

function Diamond({ size = 8, color = C.orange, style = {} }: { size?: number; color?: string; style?: CSSProperties }) {
  return <span style={{ display: 'inline-block', width: size, height: size, background: color, transform: 'rotate(45deg)', ...style }} />;
}

function Eyebrow({ children, color = C.orange }: { children?: ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
      fontFamily: C.fontBody,
    }}>
      <span style={{ width: 18, height: 1, background: color }} />
      {children}
    </span>
  );
}

function Logo({ size = 28, symbolScale = 1.42 }: { size?: number; symbolScale?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <img
        src="/Wonderelo-logo-symbol.png" alt=""
        style={{ width: size * symbolScale, height: size * symbolScale, objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{
        fontFamily: C.fontDisplay, fontWeight: 800, fontSize: size * 0.66,
        letterSpacing: '-0.025em', color: C.purpleDeep, lineHeight: 1,
      }}>
        wonderelo
      </div>
    </div>
  );
}

function Btn({
  children, variant = 'primary', size = 'md', full = false, leadingIcon, trailingIcon,
  type = 'button', disabled = false, onClick, style = {},
}: {
  children?: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    fontFamily: C.fontBody, fontWeight: 600,
    border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
    opacity: disabled ? 0.55 : 1,
    transition: 'transform .12s, box-shadow .12s, background .12s, opacity .12s',
  };
  const sz: CSSProperties = size === 'sm' ? { padding: '9px 14px', fontSize: 13 }
    : size === 'lg' ? { padding: '15px 22px', fontSize: 16 }
    : { padding: '12px 18px', fontSize: 14.5 };
  const variants: Record<string, CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: disabled ? 'none' : '0 6px 16px rgba(221,83,28,.30)' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...sz, ...variants[variant], ...style }}>
      {leadingIcon}{children}{trailingIcon}
    </button>
  );
}

function DesktopCard({ width = 480, children, footer }: { width?: number; children?: ReactNode; footer?: ReactNode }) {
  return (
    <div style={{
      width, background: C.paper,
      fontFamily: C.fontBody, color: C.ink, padding: '40px 36px 32px',
      borderRadius: 24, border: `1px solid ${C.hair}`,
      boxShadow: '0 20px 40px rgba(76,25,77,.12)',
      boxSizing: 'border-box', maxWidth: '100%',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'relative', overflow: 'hidden',
    }}>
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

/* Icon glyphs (inline SVGs, matching the mock's stroke style). */
const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const CheckGlyph = ({ size = 8 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const EyeGlyph = ({ off = false }: { off?: boolean }) => (
  off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
);
const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/* Editable password field — the mock's `Field` visual language, but a real
   controlled <input type="password"> with a show/hide eye toggle. */
function PasswordField({
  label, value, placeholder, reveal, onChange, onToggle, disabled, error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  reveal: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
  disabled?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
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
        boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.12)' : 'none',
      }}>
        <input
          type={reveal ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: C.fontBody, fontSize: 15, color: C.ink, minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          style={{ display: 'inline-flex', background: 'transparent', border: 'none', padding: 0, cursor: disabled ? 'not-allowed' : 'pointer', lineHeight: 0 }}
        >
          <EyeGlyph off={reveal} />
        </button>
      </div>
      {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
    </label>
  );
}

/* Password-strength indicator — pure derivation of the password value
   (mirrors the mock's Strength bars + criteria checklist). */
function passwordStrength(pw: string) {
  const checks = [
    { label: '8 characters or more', ok: pw.length >= 8 },
    { label: 'Mix of letters and numbers', ok: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw) },
    { label: 'One special character (!@#…)', ok: /[^a-zA-Z0-9]/.test(pw) },
  ];
  const met = checks.filter((c) => c.ok).length;
  const filled = pw ? Math.min(4, met + 1) : 0; // 1..4 bars once anything is typed
  const label = !pw ? '' : filled >= 4 ? 'Strong' : filled === 3 ? 'Good' : filled === 2 ? 'Fair' : 'Weak';
  return { checks, filled, label };
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// ============================================================

export interface ResetPasswordFlowViewProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string;
  success: boolean;
  passwordError: string;
  isFormValid: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onComplete: () => void;
}

const screenWrap: CSSProperties = {
  minHeight: '100vh', background: C.cream,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, boxSizing: 'border-box', fontFamily: C.fontBody,
};

export function ResetPasswordFlowView({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isLoading,
  error,
  success,
  passwordError,
  isFormValid,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onSubmit,
  onBack,
  onComplete,
}: ResetPasswordFlowViewProps) {
  if (success) {
    return (
      <div className="wonderelo">
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={screenWrap}>
          <DesktopCard width={480}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Logo /></div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{
                width: 92, height: 92, borderRadius: 24, margin: '0 auto 22px',
                background: `linear-gradient(140deg, ${C.orange}, ${C.orangeBright})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 14px 30px rgba(221,83,28,.32)', position: 'relative', color: '#fff',
              }}>
                <Diamond size={11} color={C.purpleDeep} style={{ position: 'absolute', top: -7, left: -7 }} />
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <Eyebrow>All set</Eyebrow>
              <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 33, lineHeight: 1.06, letterSpacing: '-0.025em', color: C.purpleDeep }}>
                Password <Italic>updated.</Italic>
              </h1>
              <p style={{ margin: '0 auto', maxWidth: 350, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: .82 }}>
                You can now sign in with your new password.
              </p>
            </div>
            <Btn variant="primary" size="lg" full trailingIcon={<ArrowRight size={16} />} onClick={onComplete}>
              Continue to sign in
            </Btn>
          </DesktopCard>
        </div>
      </div>
    );
  }

  const strength = passwordStrength(password);

  return (
    <div className="wonderelo">
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={screenWrap}>
        <DesktopCard width={480}>
          {/* Top row: brand logo + back-to-sign-in link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo />
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              style={{ fontSize: 12, fontFamily: C.fontMono, color: C.ink, opacity: .65, background: 'transparent', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              ← Back to sign in
            </button>
          </div>

          {/* Heading */}
          <div>
            <Eyebrow>Reset password</Eyebrow>
            <h1 style={{ margin: '12px 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
              Choose a <Italic>new password.</Italic>
            </h1>
            <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: .78, lineHeight: 1.5 }}>
              Pick something memorable. We never store the original.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Error banner */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
                background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.22)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                <span style={{ fontSize: 13, color: '#dc2626', fontFamily: C.fontBody }}>{error}</span>
              </div>
            )}

            {/* Password fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PasswordField
                label="New password"
                value={password}
                placeholder="Minimum 6 characters"
                reveal={showPassword}
                onChange={onPasswordChange}
                onToggle={onToggleShowPassword}
                disabled={isLoading}
                error={passwordError}
              />
              <PasswordField
                label="Repeat password"
                value={confirmPassword}
                placeholder="Confirm your password"
                reveal={showConfirmPassword}
                onChange={onConfirmPasswordChange}
                onToggle={onToggleShowConfirmPassword}
                disabled={isLoading}
              />
            </div>

            {/* Strength meter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: C.fontMono, color: C.ink, opacity: .65, marginBottom: 8, letterSpacing: '.04em' }}>
                <span>Strength</span>
                {strength.label && <span style={{ color: C.orange, fontWeight: 700, opacity: 1 }}>{strength.label}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.filled ? C.orange : 'rgba(76,25,77,.10)' }} />
                ))}
              </div>
              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: C.ink, opacity: .82 }}>
                {strength.checks.map(({ label, ok }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: ok ? C.orange : 'transparent',
                      border: ok ? 'none' : `1.5px solid ${C.hairStrong}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>{ok && <CheckGlyph size={8} />}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <Btn
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={!isFormValid || isLoading}
              leadingIcon={isLoading ? <Spinner size={16} /> : undefined}
              trailingIcon={isLoading ? undefined : <ArrowRight size={16} />}
            >
              {isLoading ? 'Updating password…' : 'Save new password'}
            </Btn>
          </form>
        </DesktopCard>
      </div>
    </div>
  );
}

export function ResetPasswordFlow({ onComplete, onBack }: ResetPasswordFlowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    debugLog('=== RESET PASSWORD FLOW (OLIWONDER) ===');
    debugLog('Token from URL:', token);

    if (!token) {
      debugLog('❌ No reset token in URL');
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    debugLog('✅ Reset token found');
    setResetToken(token);

    // Clean URL (remove token from visible URL for security)
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('token');
    window.history.replaceState({}, document.title, cleanUrl.toString());
  }, []);



  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const isFormValid = () => {
    return formData.password &&
           formData.confirmPassword &&
           formData.password === formData.confirmPassword &&
           formData.password.length >= 6;
  };

  const getPasswordError = () => {
    if (!formData.password) return '';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;
    if (!resetToken) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/reset-password-with-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: resetToken,
            newPassword: formData.password
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      errorLog('Password reset error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResetPasswordFlowView
      password={formData.password}
      confirmPassword={formData.confirmPassword}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isLoading={isLoading}
      error={error}
      success={success}
      passwordError={getPasswordError()}
      isFormValid={!!isFormValid()}
      onPasswordChange={(v) => updateFormData('password', v)}
      onConfirmPasswordChange={(v) => updateFormData('confirmPassword', v)}
      onToggleShowPassword={() => setShowPassword(!showPassword)}
      onToggleShowConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
      onSubmit={handleSubmit}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
}
