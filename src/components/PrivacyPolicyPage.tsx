/* Wonderelo — Privacy policy (`/privacy`).
   Public content page: PublicNav + PublicFooter, brand `.w-*` classes, wrapped
   in the `.wonderelo w-public` scope (same shell as OurStoryPage / PricingPage).

   ⚠️ PLACEHOLDER CONTENT. This is a structured page shell only. The section
   headings show what a complete privacy policy should cover, but every body line
   is a generic, non-binding placeholder marked "[Draft — …]". Replace with your
   own reviewed legal text before publishing. */
import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import '../styles/wonderelo-public.css';

interface PrivacyPolicyPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

// Section headings map what a complete Privacy policy should cover; each `body`
// is a neutral description of the section's purpose — NOT a binding statement of
// how data is actually processed.
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Introduction', body: 'This section will introduce who is responsible for your data and the scope of this policy.' },
  { title: 'Information we collect', body: 'This section will list the categories of personal data collected from organizers and participants, such as name, email address, and phone number.' },
  { title: 'How we use your information', body: 'This section will explain the purposes for which personal data is processed, such as running events and sending round reminders.' },
  { title: 'Legal bases for processing', body: 'This section will set out the legal grounds relied on to process personal data under applicable data-protection law.' },
  { title: 'Cookies and analytics', body: 'This section will describe the cookies and analytics tools used and how you can control them.' },
  { title: 'How we share information', body: 'This section will explain when, and with whom, personal data may be shared — including service providers and event organizers.' },
  { title: 'Data retention', body: 'This section will describe how long personal data is kept and the criteria used to determine that period.' },
  { title: 'International transfers', body: 'This section will explain how data is safeguarded if it is transferred outside your country or region.' },
  { title: 'Your rights', body: 'This section will list the rights you have over your personal data, such as access, correction, and deletion.' },
  { title: 'Security', body: 'This section will describe the measures taken to protect personal data.' },
  { title: "Children's privacy", body: 'This section will state the platform position on use by children and any minimum-age requirements.' },
  { title: 'Changes to this policy', body: 'This section will describe how updates to this policy are communicated.' },
  { title: 'Contact and data requests', body: 'This section will tell you how to contact us or exercise your data-protection rights.' },
];

const draftNote: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 12,
  fontFamily: 'var(--w-font-mono)',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '.02em',
  color: 'var(--w-orange)',
  background: 'rgba(221,83,28,.08)',
  border: '1px solid rgba(221,83,28,.22)',
  borderRadius: 999,
  padding: '4px 12px',
};

export function PrivacyPolicyPage({ onGetStarted, onSignIn }: PrivacyPolicyPageProps) {
  const navigate = useNavigate();
  const handleGetStarted = onGetStarted || (() => navigate('/signup'));
  const handleSignIn = onSignIn || (() => navigate('/signin'));

  return (
    <div className="wonderelo w-public">
      <PublicNav onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <main className="w-shell-narrow" style={{ paddingTop: 56, paddingBottom: 32 }}>
        {/* Draft-template banner */}
        <div
          role="note"
          style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            background: 'rgba(221,83,28,.08)', border: '1px solid rgba(221,83,28,.28)',
            borderRadius: 'var(--w-r-md)', padding: '16px 18px', marginBottom: 40,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--w-orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--w-purple-deep)', lineHeight: 1.45 }}>
            Draft template — replace with your official legal text before publishing.
          </p>
        </div>

        {/* Header */}
        <span className="w-eyebrow">Legal</span>
        <h1 className="w-h1" style={{ marginTop: 16 }}>Privacy <span className="w-italic">policy</span></h1>
        <p style={{ margin: '14px 0 0', fontFamily: 'var(--w-font-mono)', fontSize: 13, color: 'var(--w-ink)', opacity: .6 }}>
          Last updated: 15 August 2026
        </p>
        <p className="w-lede">
          This policy explains how Wonderelo handles personal data. The text below is a structured template: the headings show what a
          complete privacy policy should cover, but the wording is placeholder only and must be replaced with your own reviewed policy before you rely on it.
        </p>

        {/* Sections */}
        {SECTIONS.map((s, i) => (
          <section
            key={s.title}
            style={{ marginTop: 36, paddingTop: 32, borderTop: i === 0 ? 'none' : '1px solid var(--w-hairline)' }}
          >
            <h2 className="w-h3" style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--w-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--w-orange)' }}>{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </h2>
            <div><span style={draftNote}>[Draft — replace with your reviewed legal text]</span></div>
            <p style={{ margin: '12px 0 0', lineHeight: 1.6, color: 'var(--w-ink)', opacity: .85 }}>{s.body}</p>
            {s.title === 'Contact and data requests' && (
              <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
                <a className="w-foot-link" href="mailto:hello@wonderelo.com" style={{ color: 'var(--w-orange)', fontWeight: 600 }}>hello@wonderelo.com</a>
              </p>
            )}
          </section>
        ))}
      </main>

      <PublicFooter />
    </div>
  );
}
