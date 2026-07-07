/* Wonderelo — participant top nav (Claude Design `.pd-nav`), shared by the
   participant dashboard + account pages. Maps to ParticipantLayout.tsx / ParticipantNav. */
import { useEffect, useState } from 'react';

const I = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="12" cy="10" r="2"/><path d="M9 15.5a3 3 0 0 1 6 0"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

interface PdNavProps {
  firstName?: string;
  lastName?: string;
  onBrandClick?: () => void;
  onDashboard?: () => void;
  onProfile?: () => void;
  onAddressBook?: () => void;
  onHome?: () => void;
  onLogout?: () => void;
}

export function PdNav({ firstName, lastName, onBrandClick, onDashboard, onProfile, onAddressBook, onHome, onLogout }: PdNavProps) {
  const [open, setOpen] = useState(false);
  // Two-letter monogram (first + last initial), matching the design avatar chip ("AA").
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'A';

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const item = (icon: JSX.Element, label: string, onClick?: () => void, danger = false) => (
    <button className={`pd-nav-menu-item${danger ? ' is-danger' : ''}`} type="button" role="menuitem"
      onClick={() => { setOpen(false); onClick?.(); }}>
      {icon}{label}
    </button>
  );

  return (
    <nav className="pd-nav">
      <a className="pd-brand" role="button" tabIndex={0} onClick={onBrandClick}>
        <span className="mark"><span className="inner" /></span>
        <span className="word">wond<em>e</em>relo</span>
      </a>
      <div className={`pd-nav-cta${open ? ' is-open' : ''}`} role="button" tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <span className="av-mini">{initials}</span>
        <span>{firstName || 'Me'}</span>
        <svg className="pd-nav-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div className={`pd-nav-menu${open ? ' is-open' : ''}`} role="menu" onClick={(e) => e.stopPropagation()}>
        {item(I.dashboard, 'Dashboard', onDashboard)}
        {item(I.profile, 'Profile', onProfile)}
        {item(I.book, 'Address book', onAddressBook)}
        {item(I.home, 'Wonderelo home', onHome)}
        <div className="pd-nav-menu-divider" />
        {item(I.logout, 'Logout', onLogout, true)}
      </div>
    </nav>
  );
}
