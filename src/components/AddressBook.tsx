import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PdNav } from './redesign/PdNav';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Users, Mail, Phone, ArrowLeft, Copy, Check, Download, Linkedin, Instagram, Globe } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';
import { WondereloHeader } from './WondereloHeader';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  otherSocial?: string;
  acquiredAt: string;
  sessionName: string;
  sessionDate: string;
  roundName: string;
  organizerName: string;
  organizerSlug: string;
  allPartners: { firstName: string; lastName: string }[];
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface AddressBookViewProps {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  copiedId: string | null;
  firstName?: string;
  lastName?: string;
  onBack: () => void;
  onDownloadVCard: (contact: Contact) => void;
  onCopyEmail: (email: string, id: string) => void;
  onCopyPhone: (phone: string, id: string) => void;
}

function formatDateStr(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AddressBookView({
  contacts,
  isLoading,
  error,
  copiedId,
  firstName,
  lastName,
  onBack,
  onDownloadVCard,
  onCopyEmail,
  onCopyPhone,
}: AddressBookViewProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const GRAD = ['#2563d6,#7c2db5', '#1f9d57,#0d9488', '#e8541c,#db2777', '#7c2db5,#db2777', '#0d9488,#2563d6', '#ca8a04,#d62828'];
  const ini = (c: Contact) => `${(c.firstName || '?')[0] || ''}${(c.lastName || '')[0] || ''}`.toUpperCase();
  const fmt = (s: string) => { try { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const I = {
    back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>,
    phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    linkedin: <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3s-2.3 1.57-2.3 3.2V21H9z"/></svg>,
    globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>,
    insta: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>,
    down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return (
    <div className="wonderelo pa-page" data-active="address-book" data-state={contacts.length > 0 ? 'full' : 'empty'}>
      <div className="ac-shell">
        <PdNav
          firstName={firstName}
          lastName={lastName}
          onBrandClick={onBack}
          onDashboard={onBack}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="address-book">
          <button className="ac-back" type="button" onClick={onBack}>{I.back}Back to dashboard</button>
          <div className="ac-head">
            <span className="ac-eyebrow">People you've met</span>
            <h1 className="ac-title">Address <em>book</em></h1>
            {contacts.length > 0
              ? <span className="ab-count"><span className="dot" /> {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} from your rounds</span>
              : <p className="ac-sub" style={{ marginTop: 8 }}>People you've exchanged contacts with through Wonderelo.</p>}
          </div>
          {isLoading ? (
            <p className="ac-sub">Loading…</p>
          ) : error ? (
            <p className="ac-sub" style={{ color: 'var(--w-destructive)' }}>{error}</p>
          ) : contacts.length === 0 ? (
            <div className="ab-empty">
              <div className="ring">{I.users}</div>
              <h3>No contacts yet</h3>
              <p>After a round, you and your partner can choose to share contact details. Shared contacts show up here.</p>
            </div>
          ) : (
            <div className="ab-list">
              {contacts.map((c, i) => (
                <div className="ab-card" key={c.id}>
                  <div className="ab-top">
                    <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                      <span className="ab-id" style={{ background: `linear-gradient(145deg,${GRAD[i % GRAD.length]})` }}>{ini(c)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="ab-name">{c.firstName} {c.lastName}</div>
                        <div className="ab-meta"><span className="ev">{c.organizerName || c.sessionName}</span><span className="ss">{c.sessionName}{c.roundName ? <> · <b>{c.roundName}</b></> : null}</span></div>
                      </div>
                    </div>
                    <span className="ab-date">{fmt(c.acquiredAt)}</span>
                  </div>
                  <div className="ab-rows">
                    {c.email && <div className="ab-row">{I.mail}<a href={`mailto:${c.email}`}>{c.email}</a><button className="copy" type="button" title="Copy" onClick={() => onCopyEmail(c.email, c.id)}>{copiedId === c.id ? I.check : I.copy}</button></div>}
                    {c.phone && <div className="ab-row">{I.phone}<a href={`tel:${c.phone}`}>{c.phone}</a><button className="copy" type="button" title="Copy" onClick={() => onCopyPhone(c.phone!, c.id)}>{I.copy}</button></div>}
                  </div>
                  {(c.linkedinUrl || c.websiteUrl || c.instagramUrl) && (
                    <div className="ab-socials">
                      {c.linkedinUrl && <a className="ab-chip" href={c.linkedinUrl} target="_blank" rel="noopener noreferrer">{I.linkedin} LinkedIn</a>}
                      {c.websiteUrl && <a className="ab-chip" href={c.websiteUrl} target="_blank" rel="noopener noreferrer">{I.globe} Website</a>}
                      {c.instagramUrl && <a className="ab-chip" href={c.instagramUrl} target="_blank" rel="noopener noreferrer">{I.insta} Instagram</a>}
                    </div>
                  )}
                  {c.allPartners && c.allPartners.length > 1 && (
                    <div className="ab-group">Group: {c.allPartners.map((ap) => `${ap.firstName} ${ap.lastName}`.trim()).filter(Boolean).join(', ')}</div>
                  )}
                  <button className="ac-btn is-outline is-block ab-save" type="button" onClick={() => onDownloadVCard(c)}>{I.down}Save to phone contacts</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <footer className="ac-footer">
          <a className="ac-brand"><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
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

export function AddressBook() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, [token]);

  const loadContacts = async () => {
    if (!token) return;
    try {
      debugLog('[AddressBook] Loading contacts');
      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/shared-contacts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load contacts');
      }

      const data = await response.json();
      debugLog('[AddressBook] Contacts loaded:', data);
      const mapped: Contact[] = (data.sharedContacts || []).map((sc: any) => ({
        id: sc.matchId,
        firstName: sc.partner.firstName,
        lastName: sc.partner.lastName,
        email: sc.partner.email,
        phone: sc.partner.phone,
        linkedinUrl: sc.partner.linkedinUrl,
        instagramUrl: sc.partner.instagramUrl,
        websiteUrl: sc.partner.websiteUrl,
        otherSocial: sc.partner.otherSocial,
        acquiredAt: sc.sharedAt || new Date().toISOString(),
        sessionName: sc.sessionName || '',
        sessionDate: sc.sessionDate || '',
        roundName: sc.roundName || '',
        organizerName: sc.organizerName || '',
        organizerSlug: sc.organizerSlug || '',
        allPartners: sc.allPartners || [],
      }));
      setContacts(mapped);
    } catch (err) {
      errorLog('[AddressBook] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadVCard = (c: Contact) => {
    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.firstName} ${c.lastName}`.trim(),
      `N:${c.lastName};${c.firstName};;;`,
    ];
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
    if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
    if (c.linkedinUrl) lines.push(`URL;type=LinkedIn:${c.linkedinUrl}`);
    if (c.instagramUrl) lines.push(`URL;type=Instagram:${c.instagramUrl}`);
    if (c.websiteUrl) lines.push(`URL:${c.websiteUrl}`);
    if (c.sessionName || c.organizerName) {
      lines.push(`NOTE:Met at ${[c.organizerName, c.sessionName].filter(Boolean).join(' – ')}`);
    }
    lines.push('END:VCARD');
    const vcard = lines.join('\r\n');
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.firstName}_${c.lastName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // The nav avatar/name is the signed-in participant, which this endpoint doesn't return.
  // Reuse the profile the dashboard/profile pages cache in localStorage (best-effort; falls
  // back to the generic "Me" chip when absent).
  const cachedMe = (() => {
    try { return JSON.parse(localStorage.getItem(`participant_profile_${token}`) || '{}'); } catch { return {}; }
  })();

  return (
    <AddressBookView
      contacts={contacts}
      isLoading={isLoading}
      error={error}
      copiedId={copiedId}
      firstName={cachedMe.firstName}
      lastName={cachedMe.lastName}
      onBack={() => navigate(`/p/${token}`)}
      onDownloadVCard={handleDownloadVCard}
      onCopyEmail={(email, id) => handleCopy(email, id)}
      onCopyPhone={(phone, id) => handleCopy(phone, id)}
    />
  );
}
