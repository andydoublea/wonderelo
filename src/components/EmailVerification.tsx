import { useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

// ============================================================
// Pure view (shared with AdminPagePreview)
// Redesigned to the Claude Design v06 brand auth-card language
// (same DesktopCard / atoms as SignInFlow / SignUpFlow). No exact
// mock exists for this token-landing screen — it mirrors the auth
// card styling for its verifying / success / error states.
// ============================================================

export type EmailVerificationStatus = 'verifying' | 'success' | 'error';

export interface EmailVerificationViewProps {
  status: EmailVerificationStatus;
  message: string;
  verificationType?: string;
  onGoToRounds: () => void;
  onReturnHome: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Brand palette + inlined atoms — verbatim from the design bundle
   (`auth-screens.jsx` / `participant-screens.jsx` `C` + `WAtoms`).
   ───────────────────────────────────────────────────────────── */
const C = {
  purple: '#5C2277',
  purpleDeep: '#4b1d51',
  orange: '#dd531c',
  orangeBright: '#ff6a2a',
  cream: '#f7f1e6',
  paper: '#fbf6ec',
  ink: '#3a2e34',
  danger: '#dc2626',
  hair: 'rgba(76,25,77,.10)',
  hairStrong: 'rgba(76,25,77,.18)',
  fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
  fontSerif: '"Instrument Serif", Georgia, serif',
  fontBody: '"Space Grotesk", system-ui, sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

function Italic({ children, color = C.orange }: { children: ReactNode; color?: string }) {
  return <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', fontWeight: 400, color }}>{children}</span>;
}

function Diamond({ size = 8, color = C.orange, style = {} }: { size?: number; color?: string; style?: CSSProperties }) {
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

function Logo({ size = 28, symbolScale = 1.42 }: { size?: number; symbolScale?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <img src="/Wonderelo-logo-symbol.png" alt="" style={{ width: size * symbolScale, height: size * symbolScale, objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: size * 0.66, letterSpacing: '-0.025em', color: C.purpleDeep, lineHeight: 1 }}>wonderelo</div>
    </div>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
  );
}

function Btn({
  children, variant = 'primary', full = false, leadingIcon, trailingIcon, onClick,
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  full?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onClick?: () => void;
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: '0 6px 16px rgba(221,83,28,.30)' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: C.fontBody, fontWeight: 600, border: '1px solid transparent', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        whiteSpace: 'nowrap', borderRadius: 12, width: full ? '100%' : undefined,
        padding: '15px 22px', fontSize: 16,
        transition: 'transform .12s, box-shadow .12s, background .12s',
        ...variants[variant],
      }}
    >
      {leadingIcon}{children}{trailingIcon}
    </button>
  );
}

/* Card wrapper (auth-screens.jsx `DesktopCard`). */
function DesktopCard({ width = 480, children }: { width?: number; children: ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: width, background: C.paper, fontFamily: C.fontBody, color: C.ink,
      padding: '40px 36px 32px', borderRadius: 24, border: `1px solid ${C.hair}`,
      boxShadow: '0 20px 40px rgba(76,25,77,.12)', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', overflow: 'hidden',
    }}>
      <Diamond size={9} style={{ position: 'absolute', top: 20, right: 24 }} />
      <Diamond size={6} color={C.purple} style={{ position: 'absolute', top: 32, right: 40, opacity: 0.5 }} />
      {children}
    </div>
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

function Spinner({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g stroke={C.purpleDeep} strokeWidth="2" strokeLinecap="round">
        <path d="M12 3a9 9 0 1 0 9 9" opacity="0.9" />
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}

function XGlyph({ size = 40, color = C.danger }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  );
}

/* Success tile — the orange gradient check from the design's confirmed screens. */
function SuccessTile() {
  return (
    <div style={{
      width: 92, height: 92, borderRadius: 24, margin: '0 auto 22px',
      background: `linear-gradient(140deg, ${C.orange}, ${C.orangeBright})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 14px 30px rgba(221,83,28,.32)', position: 'relative',
    }}>
      <Diamond size={11} color={C.purpleDeep} style={{ position: 'absolute', top: -7, left: -7 }} />
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
  );
}

export function EmailVerificationView({
  status,
  message,
  onGoToRounds,
  onReturnHome,
}: EmailVerificationViewProps) {
  const eyebrow = status === 'verifying' ? 'One moment' : status === 'success' ? 'All set' : "Something's off";
  const title = status === 'verifying' ? 'Verifying your' : status === 'success' ? 'Email' : 'Verification';
  const accent = status === 'verifying' ? 'email' : status === 'success' ? 'verified' : 'failed';

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
            {status === 'success' ? (
              <SuccessTile />
            ) : status === 'error' ? (
              <BigIcon badge={C.purple}><XGlyph /></BigIcon>
            ) : (
              <BigIcon><Spinner /></BigIcon>
            )}
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 style={{ margin: '14px 0 12px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.purpleDeep }}>
              {title} <Italic>{accent}</Italic>
            </h1>
            <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 14.5, lineHeight: 1.55, color: C.ink, opacity: 0.82 }}>
              {message}
            </p>
          </div>

          {status === 'success' && (
            <Btn variant="primary" full onClick={onGoToRounds} trailingIcon={<ArrowRightIcon size={16} />}>
              Go to my rounds
            </Btn>
          )}

          {status === 'error' && (
            <>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.25)', fontSize: 13, color: C.danger, lineHeight: 1.5 }}>
                {message.includes('most recent verification email')
                  ? 'Please check your inbox for the latest verification link and use that one instead.'
                  : 'The verification link may have expired or is invalid. Please try registering again.'}
              </div>
              <Btn variant="ghost" full onClick={onReturnHome}>
                Return to homepage
              </Btn>
            </>
          )}
        </DesktopCard>
      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

export function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verificationType = searchParams.get('type') || 'registration';

  const [status, setStatus] = useState<EmailVerificationStatus>('verifying');
  const [message, setMessage] = useState('Verifying your email…');
  const [participantToken, setParticipantToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link - no token provided');
      return;
    }

    verifyEmail();
  }, [token, verificationType]);

  const verifyEmail = async () => {
    try {
      debugLog('=== EMAIL VERIFICATION ===');
      debugLog('Type:', verificationType);
      debugLog('Token:', token);

      const endpoint = verificationType === 'email_change'
        ? '/verify-email-change'
        : '/verify-participant-email';

      const response = await fetch(
        `${apiBaseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verificationToken: token
          })
        }
      );

      debugLog('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        errorLog('Verification failed:', errorData);

        setStatus('error');
        setMessage(errorData.error || 'Failed to verify email');
        return;
      }

      const data = await response.json();
      debugLog('Verification success:', data);

      if (data.token) {
        localStorage.setItem('participant_token', data.token);
        setParticipantToken(data.token);
        debugLog('✅ Participant token saved to localStorage');
      }

      setStatus('success');

      if (verificationType === 'email_change') {
        setMessage('Email changed successfully! Your new email address is now active.');
      } else {
        setMessage('Email verified successfully! Your registration is now complete.');
      }

      setTimeout(() => {
        if (data.token) {
          navigate(`/p/${data.token}`);
        } else {
          navigate('/');
        }
      }, 3000);

    } catch (error) {
      errorLog('Error verifying email:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  return (
    <EmailVerificationView
      status={status}
      message={message}
      verificationType={verificationType}
      onGoToRounds={() => {
        if (participantToken) {
          navigate(`/p/${participantToken}`);
        } else {
          navigate('/');
        }
      }}
      onReturnHome={() => navigate('/')}
    />
  );
}
