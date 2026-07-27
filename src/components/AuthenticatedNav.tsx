import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { C, Diamond } from './redesign/organizerAtoms';

interface AuthenticatedNavProps {
  currentView: string;
  currentUser: any;
  isAdminUser: boolean;
  onNavigateToDashboard?: () => void;
  onNavigateToRounds: () => void;
  onNavigateToAccountSettings: () => void;
  onNavigateToEventPageSettings?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToAdmin?: () => void;
  onSignOut: () => void;
}

// Billing/plan tier shown in the nav status pill. The current AuthenticatedNav
// interface carries no billing prop (and AppRouter passes none), so we default
// to 'subscription' — matching the design mock's default. If a real billing
// signal becomes available, thread it in here.
type BillingKind = 'subscription' | 'credits' | 'free';
const BILLING: BillingKind = 'subscription';

// ── inline SVG glyphs (match design/v06 OrgNav) ──────────────────────────────
const IconAccount = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></svg>
);
const IconBilling = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
);
const IconEventPage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
);
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const IconSignOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
const UserGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M5 21v-1a7 7 0 0 1 14 0v1" /></svg>
);

export function AuthenticatedNav({
  currentView,
  currentUser,
  isAdminUser,
  onNavigateToDashboard,
  onNavigateToRounds,
  onNavigateToAccountSettings,
  onNavigateToEventPageSettings,
  onNavigateToBilling,
  onNavigateToAdmin,
  onSignOut,
}: AuthenticatedNavProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 900px)').matches
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const isImpersonating = localStorage.getItem('is_impersonation') === 'true';

  // Responsive: collapse to a hamburger drawer below 900px (keeps the previous
  // mobile-collapse behaviour, just driven by matchMedia so the inline-styled
  // nav can switch layouts without media-query CSS).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close the desktop user dropdown on outside click (parity with the old Radix menu).
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const roundsActive = currentView === 'rounds' || currentView === 'dashboard';
  const eventPageActive = currentView === 'event-page-settings';
  const adminActive = currentView === 'admin';

  // Person name (organizerName = "Your name") drives the user chip + avatar initials.
  // Event name (eventName) drives the separate green event pill — design keeps them distinct.
  const organizerName = currentUser?.organizerName || 'Your name';
  const eventName = currentUser?.eventName || '';
  const initials = (organizerName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'W';

  const endImpersonation = () => {
    localStorage.removeItem('is_impersonation');
    window.close();
  };

  // Wrap a handler so the desktop menu / mobile drawer close after navigating.
  const run = (fn?: () => void) => () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    fn?.();
  };

  // ── Center tab (Rounds / Event page / Admin panel) ─────────────────────────
  const Tab = ({ label, active, onClick }: { label: string; active: boolean; onClick?: () => void }) => (
    <div
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
        color: active ? C.purpleDeep : C.ink,
        opacity: active ? 1 : 0.65,
        background: active ? 'rgba(76,25,77,.08)' : 'transparent',
        display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontBody,
      }}
    >
      {active && <Diamond size={6} />}
      {label}
    </div>
  );

  // ── Desktop dropdown menu item ─────────────────────────────────────────────
  const MenuItem = ({ icon, children, onClick, danger, active }: {
    icon?: ReactNode; children?: ReactNode; onClick?: () => void; danger?: boolean; active?: boolean;
  }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
        fontFamily: C.fontBody, fontSize: 13.5, fontWeight: active ? 700 : 500,
        color: danger ? '#c0392b' : C.purpleDeep,
        background: active ? 'rgba(76,25,77,.07)' : 'transparent',
      }}
    >
      <span style={{ display: 'inline-flex', opacity: 0.7 }}>{icon}</span>{children}
    </div>
  );

  // ── Brand lockup (homepage-desktop nav lockup) ─────────────────────────────
  const logoClick = onNavigateToDashboard || onNavigateToRounds;
  const Logo = (
    <div
      onClick={run(logoClick)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 44, cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img
          src="/Wonderelo-logo-symbol.png"
          alt=""
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-6deg)', width: 120, height: 120, objectFit: 'contain' }}
        />
      </div>
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', color: C.purpleDeep, lineHeight: 1 }}>
        wonderelo
      </div>
    </div>
  );

  // ── Plan / credits status pill ─────────────────────────────────────────────
  const PLANS: Record<BillingKind, { dot: string; bg: string; bd: string; main: string; meta: string; metaUsers?: boolean }> = {
    subscription: { dot: C.orange, bg: 'rgba(221,83,28,.08)', bd: 'rgba(221,83,28,.30)', main: 'Unlimited events', meta: 'up to 200', metaUsers: true },
    credits:      { dot: C.purple, bg: 'rgba(76,25,77,.06)',  bd: C.hairStrong,          main: '3 credits', meta: 'Up to 50' },
    free:         { dot: 'rgba(76,25,77,.4)', bg: 'transparent', bd: C.hairStrong,       main: 'Free plan', meta: 'Up to 5' },
  };
  const plan = PLANS[BILLING] || PLANS.subscription;
  const PlanPill = (
    <div
      title="Billing & plan"
      onClick={run(onNavigateToBilling)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 11px',
        borderRadius: 999, border: `1px solid ${plan.bd}`, background: plan.bg, cursor: 'pointer', fontFamily: C.fontBody,
      }}
    >
      <Diamond size={7} color={plan.dot} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.purpleDeep, letterSpacing: '-.01em' }}>{plan.main}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: C.ink, opacity: 0.55, fontFamily: C.fontMono }}>
        {plan.meta}
        {plan.metaUsers && <UserGlyph />}
      </span>
    </div>
  );

  // ── Event chip (green dot + event name) — design shows this between the plan pill and the user chip.
  const EventPill = eventName ? (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 10px',
        borderRadius: 999, border: `1px solid ${C.hairStrong}`, background: 'rgba(255,255,255,.5)',
        fontSize: 12, fontWeight: 600, color: C.purpleDeep, fontFamily: C.fontBody, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,.18)' }} />
      {eventName}
    </div>
  ) : null;

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${C.hair}`, background: 'rgba(251,246,236,.92)',
        backdropFilter: 'saturate(180%) blur(6px)',
      }}
    >
      <div
        style={{
          padding: isDesktop ? '14px 40px' : '12px 20px',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'auto 1fr auto' : 'auto auto',
          gap: 24, alignItems: 'center', justifyContent: isDesktop ? undefined : 'space-between',
        }}
      >
        {Logo}

        {isDesktop && (
          <div style={{ display: 'flex', gap: 4, justifySelf: 'center' }}>
            <Tab label="Rounds" active={roundsActive} onClick={run(onNavigateToRounds)} />
            <Tab label="Event page" active={eventPageActive} onClick={run(onNavigateToEventPageSettings)} />
          </div>
        )}

        {isDesktop ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }} ref={menuRef}>
            {PlanPill}
            {EventPill}

            {isImpersonating && (
              <button
                onClick={endImpersonation}
                style={{
                  display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  border: '1px solid #dd7a1c', background: 'rgba(221,122,28,.08)', color: '#b45309',
                  fontSize: 12, fontWeight: 600, fontFamily: C.fontBody, whiteSpace: 'nowrap',
                }}
              >
                End impersonation
              </button>
            )}

            {/* Name → dropdown */}
            <div
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '5px 10px 5px 6px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${menuOpen ? C.hairStrong : 'transparent'}`,
                background: menuOpen ? 'rgba(255,255,255,.7)' : 'transparent',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 12 }}>{initials}</div>
              <span style={{ fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, color: C.purpleDeep, whiteSpace: 'nowrap' }}>{organizerName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purpleDeep} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
            </div>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, width: 200, padding: 6,
                  background: '#fff', borderRadius: 12, border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)',
                }}
              >
                <MenuItem icon={<IconAccount />} active={currentView === 'account-settings'} onClick={run(onNavigateToAccountSettings)}>Account settings</MenuItem>
                <MenuItem icon={<IconEventPage />} active={eventPageActive} onClick={run(onNavigateToEventPageSettings)}>Event page</MenuItem>
                <MenuItem icon={<IconBilling />} active={currentView === 'billing'} onClick={run(onNavigateToBilling)}>Billing</MenuItem>
                {isAdminUser && !isImpersonating && (
                  <MenuItem icon={<IconAccount />} active={adminActive} onClick={run(onNavigateToAdmin)}>Admin panel</MenuItem>
                )}
                <div style={{ height: 1, background: C.hair, margin: '4px 0' }} />
                <MenuItem icon={<IconHome />} onClick={run(() => navigate('/'))}>Go to homepage</MenuItem>
                <div style={{ height: 1, background: C.hair, margin: '4px 0' }} />
                <MenuItem icon={<IconSignOut />} danger onClick={run(onSignOut)}>Sign out</MenuItem>
              </div>
            )}
          </div>
        ) : (
          /* Mobile hamburger toggle */
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
              borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: C.purpleDeep,
            }}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            )}
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {!isDesktop && mobileMenuOpen && (
        <div style={{ borderTop: `1px solid ${C.hair}`, background: 'rgba(251,246,236,.98)', padding: '12px 16px' }}>
          <MobileItem label="Rounds" active={roundsActive} onClick={run(onNavigateToRounds)} />
          <MobileItem label="Event page" icon={<IconEventPage />} active={eventPageActive} onClick={run(onNavigateToEventPageSettings)} />
          <div style={{ height: 1, background: C.hair, margin: '8px 0' }} />
          <MobileItem label="Account settings" icon={<IconAccount />} active={currentView === 'account-settings'} onClick={run(onNavigateToAccountSettings)} />
          <MobileItem label="Billing" icon={<IconBilling />} active={currentView === 'billing'} onClick={run(onNavigateToBilling)} />
          {isAdminUser && !isImpersonating && (
            <MobileItem label="Admin panel" icon={<IconAccount />} active={adminActive} onClick={run(onNavigateToAdmin)} />
          )}
          <MobileItem label="Go to homepage" icon={<IconHome />} onClick={run(() => navigate('/'))} />
          {isImpersonating && (
            <>
              <div style={{ height: 1, background: C.hair, margin: '8px 0' }} />
              <MobileItem label="End impersonation" onClick={run(endImpersonation)} danger />
            </>
          )}
          <div style={{ height: 1, background: C.hair, margin: '8px 0' }} />
          <MobileItem label="Sign out" icon={<IconSignOut />} danger onClick={run(onSignOut)} />
        </div>
      )}
    </div>
  );
}

// Mobile drawer row.
function MobileItem({ label, icon, active, danger, onClick }: {
  label: string; icon?: ReactNode; active?: boolean; danger?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 9, cursor: 'pointer',
        fontFamily: C.fontBody, fontSize: 14.5, fontWeight: active ? 700 : 500,
        color: danger ? '#c0392b' : C.purpleDeep,
        background: active ? 'rgba(76,25,77,.08)' : 'transparent',
      }}
    >
      {icon && <span style={{ display: 'inline-flex', opacity: 0.7 }}>{icon}</span>}
      {label}
    </div>
  );
}
