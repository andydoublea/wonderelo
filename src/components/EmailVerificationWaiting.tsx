import { useEffect, useState } from 'react';

interface EmailVerificationWaitingProps {
  email?: string;
  /* Registration-flow chrome (optional — omitted in standalone/admin-preview usage). */
  eventName?: string;
  selectedCount?: number;
  onBack?: () => void;
  /* Re-send the verification email. Container adds a cooldown around it. */
  onResend?: () => void | Promise<void>;
}

// Detect email provider and return a link to open it
export function getEmailProviderLink(email?: string): { name: string; url: string } | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { name: 'Open Gmail', url: 'https://mail.google.com' };
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    return { name: 'Open Outlook', url: 'https://outlook.live.com' };
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.co.uk') {
    return { name: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' };
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return { name: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' };
  }
  if (domain === 'protonmail.com' || domain === 'proton.me' || domain === 'pm.me') {
    return { name: 'Open Proton Mail', url: 'https://mail.proton.me' };
  }
  // Fallback so the "Open …" button always shows (matches the design, which never hides it).
  return { name: 'Open email app', url: 'mailto:' };
}

const Icon = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>,
  mailBold: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>,
};

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface EmailVerificationWaitingViewProps {
  email?: string;
  emailProvider: { name: string; url: string } | null;
  onOpenProvider: () => void;
  eventName?: string;
  selectedCount?: number;
  onBack?: () => void;
  onResend?: () => void;
  resendCooldown?: number;
}

export function EmailVerificationWaitingView({
  email,
  emailProvider,
  onOpenProvider,
  eventName,
  selectedCount,
  onBack,
  onResend,
  resendCooldown = 0,
}: EmailVerificationWaitingViewProps) {
  return (
    <div className="wonderelo cr-page cev">
      <div className="cr-shell">
      {onBack && (
        <div className="cr-topbar">
          <a className="cr-back" role="button" tabIndex={0} onClick={onBack}>{Icon.back}<span>Meeting points</span></a>
          {selectedCount != null && (
            <div className="cr-recap">
              <strong>{selectedCount} {selectedCount === 1 ? 'round' : 'rounds'}</strong>
              <span className="dot">·</span>
              <span>{eventName}</span>
            </div>
          )}
        </div>
      )}

      <div className="cr-head">
        <h1>Check your <em className="w-italic">email</em></h1>
        <p className="lede">Click the link in your email to verify and continue.</p>
      </div>

      <div className="cr-card">
        <div className="cr-mailicon">
          <span className="dmd" />
          {Icon.mail}
        </div>
        <p className="sent">We sent the email to</p>
        <p className="email">{email}</p>

        {emailProvider && (
          <a className="cr-open" role="button" tabIndex={0} onClick={onOpenProvider}>
            {Icon.mailBold}
            <span>{emailProvider.name}</span>
          </a>
        )}

        {onResend ? (
          <div className="cr-resend">
            <strong>Don't see it?</strong> Check your spam folder, or{' '}
            <button className="retry" type="button" onClick={onResend} disabled={resendCooldown > 0}>resend the link</button>.
            {resendCooldown > 0 && <span> Available in {Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, '0')}.</span>}
          </div>
        ) : (
          <div className="cr-resend">
            <strong>Don't see it?</strong> Check your spam folder.
          </div>
        )}
      </div>

      <footer className="cr-footer">
        <a className="cr-brand"><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
        <p className="tagline">Break your bubble, meet new people</p>
        <p className="copy">© 2026 Wonderelo</p>
      </footer>
      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

export function EmailVerificationWaiting({ email, eventName, selectedCount, onBack, onResend }: EmailVerificationWaitingProps) {
  const emailProvider = getEmailProviderLink(email);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]);

  const handleResend = onResend
    ? () => {
        if (cooldown > 0) return;
        onResend();
        setCooldown(24);
      }
    : undefined;

  return (
    <EmailVerificationWaitingView
      email={email}
      emailProvider={emailProvider}
      onOpenProvider={() => {
        if (emailProvider) window.open(emailProvider.url, '_blank');
      }}
      eventName={eventName}
      selectedCount={selectedCount}
      onBack={onBack}
      onResend={handleResend}
      resendCooldown={cooldown}
    />
  );
}
