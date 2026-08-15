/* Wonderelo — Terms of use (`/terms`).
   Public content page: PublicNav + PublicFooter, brand `.w-*` classes, wrapped
   in the `.wonderelo w-public` scope (same shell as OurStoryPage / PricingPage).

   ⚠️ PLACEHOLDER CONTENT. This is a structured page shell only. The section
   headings show what a complete agreement should cover, but every body line is
   a generic, non-binding placeholder marked "[Draft — …]". Replace with your
   own reviewed legal text before publishing. */
import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import '../styles/wonderelo-public.css';

interface TermsOfUsePageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

// Section headings map what a complete Terms of use should cover; each `body`
// is a neutral description of the section's purpose — NOT binding legal wording.
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Acceptance of these terms', body: 'This section will explain that by creating an account, publishing an event, or joining a round, users agree to the terms set out here.' },
  { title: 'Who can use Wonderelo', body: 'This section will describe eligibility requirements and the account responsibilities that apply to organizers and participants.' },
  { title: 'The service we provide', body: 'This section will summarise what Wonderelo does — hosting speed-networking events and rounds — and note that features may change over time.' },
  { title: 'Organizer responsibilities', body: 'This section will outline what event organizers are responsible for, including the accuracy of event details and how they handle participant data.' },
  { title: 'Participant conduct', body: 'This section will set expectations for respectful behaviour during networking rounds and at events.' },
  { title: 'Plans, credits and payments', body: 'This section will describe the free tier, paid plans, single-event credits, and how billing is handled.' },
  { title: 'Cancellations and refunds', body: 'This section will explain how subscriptions and credits can be cancelled and under what conditions any refunds apply.' },
  { title: 'Acceptable use', body: 'This section will list the activities that are not permitted when using the platform.' },
  { title: 'Intellectual property', body: 'This section will cover ownership of the Wonderelo brand and software, and of any content you upload.' },
  { title: 'Third-party services', body: 'This section will note the third-party providers Wonderelo relies on, such as payment and messaging services.' },
  { title: 'Disclaimers and limitation of liability', body: "This section will set out the limits of Wonderelo's liability, to the fullest extent permitted by law." },
  { title: 'Suspension and termination', body: 'This section will explain the circumstances in which an account may be suspended or closed.' },
  { title: 'Changes to these terms', body: 'This section will describe how and when these terms may be updated, and how users are notified.' },
  { title: 'Governing law', body: "This section will state which country's laws govern these terms and where any disputes are resolved." },
  { title: 'Contact', body: 'This section will tell users how to reach us with questions about these terms.' },
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

export function TermsOfUsePage({ onGetStarted, onSignIn }: TermsOfUsePageProps) {
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
        <h1 className="w-h1" style={{ marginTop: 16 }}>Terms of <span className="w-italic">use</span></h1>
        <p style={{ margin: '14px 0 0', fontFamily: 'var(--w-font-mono)', fontSize: 13, color: 'var(--w-ink)', opacity: .6 }}>
          Last updated: 15 August 2026
        </p>
        <p className="w-lede">
          These terms explain the rules for using Wonderelo. The text below is a structured template: the headings show what a
          complete agreement should cover, but the wording is placeholder only and is not legally binding until replaced with your own reviewed terms.
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
            {s.title === 'Contact' && (
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
