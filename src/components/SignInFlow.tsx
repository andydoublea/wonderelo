import { useState, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { apiBaseUrl, publicAnonKey, projectId } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface SignInData {
  email: string;
  password: string;
}

interface SignInFlowProps {
  onComplete: (userData: any, sessionData?: any) => void;
  onBack: () => void;
  onSwitchToSignUp: () => void;
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// Main success-path view: Participant + Organizer tabs.
// Forgot-password, email-sent, and quick-test sub-views
// remain inside the container (not previewed).
// ============================================================

export interface SignInFlowViewProps {
  activeTab: 'participant' | 'organizer';
  onTabChange: (tab: 'participant' | 'organizer') => void;
  // organizer form
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onForgotPassword: () => void;
  // participant form
  participantEmail: string;
  participantLoading: boolean;
  participantError: string;
  onParticipantEmailChange: (value: string) => void;
  onParticipantSubmit: (e: React.FormEvent) => void;
  // nav
  onBack: () => void;
  onSwitchToSignUp: () => void;
  isFormValid: boolean;
}

// ────────────────────────────────────────────────────────────────
// Brand palette + inline atoms — ported 1:1 from the Claude Design v06
// mock (`design/v06/project/pages/auth-screens.jsx` / `participant-screens.jsx`).
// Kept inline here (like Homepage.tsx) rather than a shared module.
// ────────────────────────────────────────────────────────────────
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

const footerLinkStyle: CSSProperties = {
  background: 'transparent', border: 'none', padding: 0,
  fontFamily: C.fontBody, fontSize: 12.5, color: C.purpleDeep, fontWeight: 600, cursor: 'pointer',
};

/* The design's italic serif accent (kept as an inline serif accent per brief). */
function Italic({ children, color = C.orange }: { children: ReactNode; color?: string }) {
  return <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;
}

function Diamond({ size = 8, color = C.orange, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return <span style={{ display: 'inline-block', width: size, height: size, background: color, transform: 'rotate(45deg)', ...style }} />;
}

function Eyebrow({ children, color = C.orange }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color, fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
      <span style={{ width: 18, height: 1, background: color }} />
      {children}
    </span>
  );
}

/* Brand lockup — clickable (→ back to home) like the Homepage nav lockup. */
function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: onClick ? 'pointer' : 'default' }}
    >
      <img src="/Wonderelo-logo-symbol.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, letterSpacing: '-0.025em', color: C.purpleDeep, lineHeight: 1 }}>wonderelo</div>
    </div>
  );
}

function MailMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

/* Primary CTA (mock `Btn`, size lg) — wired for real disabled/loading states. */
function Btn({
  children, variant = 'primary', full = false, leadingIcon, trailingIcon,
  loading = false, disabled = false, type = 'button', onClick, style,
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  full?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: '0 6px 16px rgba(221,83,28,.30)' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
  };
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        fontFamily: C.fontBody, fontWeight: 600, border: '1px solid transparent',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
        padding: '15px 22px', fontSize: 16, opacity: isDisabled ? 0.6 : 1,
        transition: 'transform .12s, box-shadow .12s, background .12s, opacity .12s',
        ...variants[variant], ...style,
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

/* Input field (mock `Field`) — controlled, with its own focus-ring state. */
function Field({
  label, headerRight, type = 'text', value, placeholder, onChange, disabled, trailing, id, autoComplete,
}: {
  label: string;
  headerRight?: ReactNode;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  trailing?: ReactNode;
  id?: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <label htmlFor={id} style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', color: C.purpleDeep, textTransform: 'uppercase' }}>{label}</label>
        {headerRight}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12,
        background: '#fff', border: `1.5px solid ${focused ? C.orange : C.hairStrong}`,
        boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.12)' : 'none',
        transition: 'border-color .12s, box-shadow .12s',
      }}>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 15, color: C.ink, minWidth: 0 }}
        />
        {trailing}
      </div>
    </div>
  );
}

/* Cream page + centred DesktopCard shell (mock) — shared by the view and the
   live container so every auth state renders the same brand card 1:1. */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="wonderelo">
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', fontFamily: C.fontBody, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{
            background: C.paper, color: C.ink, padding: '40px 36px 32px',
            borderRadius: 24, border: `1px solid ${C.hair}`, boxShadow: '0 20px 40px rgba(76,25,77,.12)',
            display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
          }}>
            {/* corner diamonds */}
            <Diamond size={9} style={{ position: 'absolute', top: 20, right: 24 }} />
            <Diamond size={6} color={C.purple} style={{ position: 'absolute', top: 32, right: 40, opacity: 0.5 }} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Segmented Participant / Organizer control (mock) — interactive, shared. */
function Segmented({
  active, onChange, disabled,
}: {
  active: 'participant' | 'organizer';
  onChange: (tab: 'participant' | 'organizer') => void;
  disabled?: boolean;
}) {
  const tab = (key: 'participant' | 'organizer', label: string) => {
    const on = active === key;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(key)}
        style={{
          flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none',
          background: on ? '#fff' : 'transparent',
          color: on ? C.purpleDeep : C.ink, opacity: on ? 1 : 0.7,
          fontFamily: C.fontBody, fontWeight: on ? 700 : 600, fontSize: 13.5,
          boxShadow: on ? '0 1px 3px rgba(0,0,0,.06)' : 'none', cursor: disabled ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'background .12s, color .12s',
        }}
      >
        {on && <Diamond size={6} color={C.orange} />}{label}
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(76,25,77,.06)', borderRadius: 12 }}>
      {tab('participant', 'Participant')}
      {tab('organizer', 'Organizer')}
    </div>
  );
}

/* Inline error banner (mock) — shared. */
function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.25)' }}>
      <X size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#dc2626' }}>{children}</span>
    </div>
  );
}

/* Large framed icon for the "sent"/"forgot" screens (mock `BigIcon`). */
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

function LockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  );
}

export function SignInFlowView({
  activeTab,
  onTabChange,
  email,
  password,
  showPassword,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
  onForgotPassword,
  participantEmail,
  participantLoading,
  participantError,
  onParticipantEmailChange,
  onParticipantSubmit,
  onBack,
  onSwitchToSignUp,
  isFormValid,
}: SignInFlowViewProps) {
  const isParticipant = activeTab === 'participant';

  return (
    <AuthShell>
      {/* Top row — brand lockup (click → back to home) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo onClick={onBack} />
      </div>

      {/* Heading */}
      <div>
        <Eyebrow>Welcome back</Eyebrow>
        <h1 style={{ margin: '12px 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Sign in to <Italic>Wonderelo.</Italic>
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: 0.78, lineHeight: 1.5 }}>
          {isParticipant ? 'Two ways in — pick the one that fits.' : 'Manage your events and rounds.'}
        </p>
      </div>

      {/* Segmented Participant / Organizer control */}
      <Segmented active={activeTab} onChange={onTabChange} disabled={isLoading || participantLoading} />

      {isParticipant ? (
        <form onSubmit={onParticipantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {participantError && <ErrorBanner>{participantError}</ErrorBanner>}
          <Field
            id="participantEmail"
            label="Email address"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            value={participantEmail}
            onChange={(e) => onParticipantEmailChange(e.target.value)}
            disabled={participantLoading}
          />
          <Btn type="submit" variant="primary" full loading={participantLoading} disabled={!participantEmail} leadingIcon={<MailMini />}>
            {participantLoading ? 'Sending link…' : 'Email me a magic link'}
          </Btn>
          <p style={{ margin: 0, fontSize: 12.5, color: C.ink, opacity: 0.65, textAlign: 'center', lineHeight: 1.5 }}>
            No password needed. We email you a link that signs you straight in.
          </p>
        </form>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Field
            id="email"
            label="Email address"
            type="email"
            placeholder="you@event.com"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isLoading}
          />
          <Field
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading}
            headerRight={
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isLoading}
                style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: C.fontBody, fontSize: 13, color: C.purpleDeep, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer' }}
              >
                Forgot password?
              </button>
            }
            trailing={
              <button
                type="button"
                onClick={onToggleShowPassword}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex', cursor: isLoading ? 'default' : 'pointer', color: C.ink }}
              >
                {showPassword ? <EyeOff size={18} style={{ opacity: 0.6 }} /> : <Eye size={18} style={{ opacity: 0.6 }} />}
              </button>
            }
          />
          <Btn type="submit" variant="primary" full loading={isLoading} disabled={!isFormValid} trailingIcon={<ArrowRightIcon size={16} />}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.hair}`, fontSize: 12.5, color: C.ink, opacity: 0.72, textAlign: 'center' }}>
        {isParticipant ? (
          <>
            Are you an organizer?{' '}
            <button type="button" onClick={() => onTabChange('organizer')} disabled={isLoading || participantLoading} style={footerLinkStyle}>
              Sign in here →
            </button>
          </>
        ) : (
          <>
            Need an account?{' '}
            <button type="button" onClick={onSwitchToSignUp} disabled={isLoading || participantLoading} style={footerLinkStyle}>
              Sign up for free →
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export function SignInFlow({ onComplete, onBack, onSwitchToSignUp }: SignInFlowProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [lastResetRequestTime, setLastResetRequestTime] = useState<number>(0);
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: ''
  });
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  
  // Show quick test logins only on dev/staging (not production)
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const showTestLogins = isLocalhost || projectId !== 'tpsgnnrkwgvgnsktuicr';

  // Participant magic link state
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState('');
  const [participantSuccess, setParticipantSuccess] = useState(false);
  
  // Track active tab
  const [activeTab, setActiveTab] = useState<'participant' | 'organizer'>('participant');

  const updateFormData = (field: keyof SignInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const isFormValid = () => {
    return formData.email && formData.password;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentForm = formDataRef.current;
    if (!currentForm.email || !currentForm.password) return;

    setIsLoading(true);
    setError('');

    try {
      // Use Supabase client directly for authentication
      const { supabase } = await import('../utils/supabase/client');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: currentForm.email,
        password: currentForm.password,
      });

      if (signInError) {
        errorLog('Sign in error:', signInError);
        setError(signInError.message || 'Failed to sign in');
        return;
      }

      if (!data.session || !data.user) {
        setError('Failed to create session');
        return;
      }

      // Fetch user profile from backend. Retry on transient failure — without the
      // profile we end up with a "half-logged-in" user missing organizerName/urlSlug,
      // which silently breaks the dashboard and Account Settings. Never complete
      // sign-in without a profile.
      let userProfile: any = null;
      let lastProfileError = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const profileResponse = await fetch(`${apiBaseUrl}/profile`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (profileResponse.ok) {
            const profileResult = await profileResponse.json();
            if (profileResult?.profile?.organizerName) {
              userProfile = profileResult.profile;
              break;
            }
            lastProfileError = `Profile response missing organizerName (attempt ${attempt})`;
          } else {
            lastProfileError = `Profile fetch HTTP ${profileResponse.status} (attempt ${attempt})`;
          }
        } catch (err) {
          lastProfileError = `Profile fetch exception (attempt ${attempt}): ${err instanceof Error ? err.message : String(err)}`;
        }
        errorLog(lastProfileError);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }

      if (!userProfile) {
        errorLog('Sign-in aborted: could not load profile after retries.', lastProfileError);
        // Clean up the half-established session so the user can retry cleanly
        try {
          const { supabase } = await import('../utils/supabase/client');
          await supabase.auth.signOut();
        } catch {}
        setError('Signed in, but could not load your profile. Please try again.');
        return;
      }

      // Create user object for onComplete
      const userData = {
        id: data.user.id,
        email: data.user.email,
        ...userProfile
      };

      onComplete(userData, data.session);
    } catch (error) {
      errorLog('Sign in error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(formData.email); // Pre-fill with current email if available
    setResetError('');
    setResetSuccess(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) return;

    // Check if user tried too soon
    const now = Date.now();
    const timeSinceLastRequest = now - lastResetRequestTime;
    const RATE_LIMIT_MS = 60000; // 60 seconds

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      setResetError(`Please wait ${remainingSeconds} seconds before requesting another reset email`);
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      // Mark that we initiated a reset password flow
      localStorage.setItem('oliwonder_reset_password_initiated', 'true');
      localStorage.setItem('oliwonder_reset_password_email', resetEmail);
      localStorage.setItem('oliwonder_reset_password_timestamp', Date.now().toString());

      const response = await fetch(
        `${apiBaseUrl}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: resetEmail }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setResetSuccess(true);
        setLastResetRequestTime(now);
      } else {
        errorLog('Password reset error:', result);
        
        // Show user-friendly message for rate limit
        if (response.status === 429) {
          setResetError('Please wait 60 seconds before requesting another reset email');
          setLastResetRequestTime(now);
        } else {
          setResetError(result.error || 'Failed to send reset email');
        }
        
        // Clear localStorage on error
        localStorage.removeItem('oliwonder_reset_password_initiated');
        localStorage.removeItem('oliwonder_reset_password_email');
        localStorage.removeItem('oliwonder_reset_password_timestamp');
      }
    } catch (error) {
      errorLog('Password reset error:', error);
      setResetError('Network error. Please try again.');
      // Clear localStorage on error
      localStorage.removeItem('oliwonder_reset_password_initiated');
      localStorage.removeItem('oliwonder_reset_password_email');
      localStorage.removeItem('oliwonder_reset_password_timestamp');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  const handleParticipantMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participantEmail) return;

    setParticipantLoading(true);
    setParticipantError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/participant/send-magic-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: participantEmail }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setParticipantSuccess(true);
      } else {
        errorLog('Magic link error:', result);
        setParticipantError(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      errorLog('Magic link error:', error);
      setParticipantError('Network error. Please try again.');
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleParticipantQuickLogin = async (email: string) => {
    setParticipantLoading(true);
    setParticipantError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/participant/quick-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success && result.token) {
        debugLog('Quick login successful, redirecting to:', `/p/${result.token}`);
        // Redirect to participant dashboard
        navigate(`/p/${result.token}`);
      } else {
        errorLog('Quick login error:', result);
        setParticipantError(result.error || 'Failed to login');
      }
    } catch (error) {
      errorLog('Quick login error:', error);
      setParticipantError('Network error. Please try again.');
    } finally {
      setParticipantLoading(false);
    }
  };

  // ── Forgot-password sub-view (brand card) ──────────────────────────
  if (showForgotPassword) {
    return (
      <AuthShell>
        {resetSuccess ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Logo onClick={onBack} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <BigIcon><MailIcon /></BigIcon>
              <Eyebrow>Email sent</Eyebrow>
              <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
                Check your <Italic>inbox</Italic>
              </h1>
              <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: 0.82 }}>
                We sent a password reset link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>{resetEmail}</strong>.
              </p>
            </div>
            <Btn variant="primary" full onClick={onBack} trailingIcon={<ArrowRightIcon size={16} />}>
              Done
            </Btn>
            <div style={{ paddingTop: 16, borderTop: `1px solid ${C.hair}`, fontSize: 12.5, color: C.ink, opacity: 0.72, textAlign: 'center' }}>
              <button type="button" onClick={handleBackToSignIn} style={footerLinkStyle}>← Back to sign in</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Logo onClick={onBack} />
              <button type="button" onClick={handleBackToSignIn} disabled={resetLoading} style={{ ...footerLinkStyle, fontFamily: C.fontMono, opacity: 0.7 }}>← Back to sign in</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <BigIcon badge={C.purple}><LockIcon /></BigIcon>
              <Eyebrow>Reset password</Eyebrow>
              <h1 style={{ margin: '12px 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
                Forgot your <Italic>password?</Italic>
              </h1>
              <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: 0.78, lineHeight: 1.5 }}>
                Enter your email and we'll send a reset link.
              </p>
            </div>
            {resetError && <ErrorBanner>{resetError}</ErrorBanner>}
            <Field
              id="resetEmail"
              label="Email address"
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetLoading}
            />
            <Btn type="submit" variant="primary" full loading={resetLoading} disabled={!resetEmail} leadingIcon={<MailMini />}>
              {resetLoading ? 'Sending email…' : 'Send reset link'}
            </Btn>
            <div style={{ paddingTop: 16, borderTop: `1px solid ${C.hair}`, fontSize: 12.5, color: C.ink, opacity: 0.72, textAlign: 'center' }}>
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchToSignUp} disabled={resetLoading} style={footerLinkStyle}>
                Sign up for free →
              </button>
            </div>
          </form>
        )}
      </AuthShell>
    );
  }

  // ── Participant "magic link sent" success (brand card) ─────────────
  if (participantSuccess) {
    return (
      <AuthShell>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo onClick={onBack} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <BigIcon><MailIcon /></BigIcon>
          <Eyebrow>Link sent</Eyebrow>
          <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
            Check your <Italic>inbox</Italic>
          </h1>
          <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: 0.82 }}>
            We emailed a magic link to <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>{participantEmail}</strong>. Click it on this device and you're in.
          </p>
        </div>
        <Btn variant="primary" full onClick={onBack} trailingIcon={<ArrowRightIcon size={16} />}>
          Done
        </Btn>
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, fontSize: 13, color: C.ink, opacity: 0.82, textAlign: 'center' }}>
          <strong style={{ color: C.purpleDeep, fontWeight: 600 }}>Wrong email?</strong>{' '}
          <button
            type="button"
            onClick={() => { setParticipantSuccess(false); setParticipantEmail(''); }}
            style={footerLinkStyle}
          >
            Use a different one →
          </button>
        </div>
      </AuthShell>
    );
  }

  // ── Main sign-in card: Participant / Organizer tabs (brand card) ───
  return (
    <AuthShell>
      {/* Top row — brand lockup (click → back to home) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo onClick={onBack} />
      </div>

      {/* Heading */}
      <div>
        <Eyebrow>Welcome back</Eyebrow>
        <h1 style={{ margin: '12px 0 8px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.07, letterSpacing: '-0.025em', color: C.purpleDeep }}>
          Sign in to <Italic>Wonderelo.</Italic>
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: C.ink, opacity: 0.78, lineHeight: 1.5 }}>
          {activeTab === 'participant' ? 'Two ways in — pick the one that fits.' : 'Manage your events and rounds.'}
        </p>
      </div>

      {/* Segmented Participant / Organizer control */}
      <Segmented active={activeTab} onChange={setActiveTab} disabled={isLoading || participantLoading} />

      {activeTab === 'participant' ? (
        <form onSubmit={handleParticipantMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {participantError && <ErrorBanner>{participantError}</ErrorBanner>}
          <Field
            id="participantEmail"
            label="Email address"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            value={participantEmail}
            onChange={(e) => {
              setParticipantEmail(e.target.value);
              if (participantError) setParticipantError('');
            }}
            disabled={participantLoading}
          />
          <Btn type="submit" variant="primary" full loading={participantLoading} disabled={!participantEmail} leadingIcon={<MailMini />}>
            {participantLoading ? 'Sending link…' : 'Email me a magic link'}
          </Btn>
          <p style={{ margin: 0, fontSize: 12.5, color: C.ink, opacity: 0.65, textAlign: 'center', lineHeight: 1.5 }}>
            No password needed. We email you a link that signs you straight in.
          </p>

          {/* Quick test logins — dev/staging only */}
          {showTestLogins && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.ink, opacity: 0.5, fontFamily: C.fontBody }}>Quick test logins</span>
              <Btn type="button" variant="ghost" full onClick={() => navigate('/p/tok-alice-001')} disabled={participantLoading} style={{ fontSize: 13, padding: '11px 18px' }}>
                Alice Novak
              </Btn>
              <Btn type="button" variant="ghost" full onClick={() => navigate('/p/tok-bob-001')} disabled={participantLoading} style={{ fontSize: 13, padding: '11px 18px' }}>
                Bob Kovac
              </Btn>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Field
            id="email"
            label="Email address"
            type="email"
            placeholder="you@event.com"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            disabled={isLoading}
          />
          <Field
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            disabled={isLoading}
            headerRight={
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: C.fontBody, fontSize: 13, color: C.purpleDeep, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer' }}
              >
                Forgot password?
              </button>
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex', cursor: isLoading ? 'default' : 'pointer', color: C.ink }}
              >
                {showPassword ? <EyeOff size={18} style={{ opacity: 0.6 }} /> : <Eye size={18} style={{ opacity: 0.6 }} />}
              </button>
            }
          />
          <Btn type="submit" variant="primary" full loading={isLoading} disabled={!isFormValid()} trailingIcon={<ArrowRightIcon size={16} />}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Btn>

          {/* Quick test login — dev/staging only */}
          {showTestLogins && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.ink, opacity: 0.5, fontFamily: C.fontBody }}>Quick test login</span>
              <Btn
                type="button"
                variant="ghost"
                full
                disabled={isLoading}
                onClick={() => {
                  const newData = { email: 'andy.double.a+org@gmail.com', password: 'Rukuku' };
                  setFormData(newData);
                  formDataRef.current = newData;
                  setError('');
                  handleSubmit();
                }}
                style={{ fontSize: 13, padding: '11px 18px' }}
              >
                andy.double.a+org@gmail.com
              </Btn>
            </div>
          )}
        </form>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.hair}`, fontSize: 12.5, color: C.ink, opacity: 0.72, textAlign: 'center' }}>
        {activeTab === 'participant' ? (
          <>
            Are you an organizer?{' '}
            <button type="button" onClick={() => setActiveTab('organizer')} disabled={isLoading || participantLoading} style={footerLinkStyle}>
              Sign in here →
            </button>
          </>
        ) : (
          <>
            Need an account?{' '}
            <button type="button" onClick={onSwitchToSignUp} disabled={isLoading || participantLoading} style={footerLinkStyle}>
              Sign up for free →
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}