/* Wonderelo — Help center (`/help`).
   Public content page: PublicNav + PublicFooter, brand `.w-*` classes, wrapped
   in the `.wonderelo w-public` scope (same shell as OurStoryPage / PricingPage).

   Unlike the legal templates, this page carries real, accurate help content
   about how Wonderelo's speed-networking rounds work, plus FAQs for organizers
   and participants. Keep it truthful to the product's actual features. */
import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import '../styles/wonderelo-public.css';

interface HelpCenterPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

// The round lifecycle — accurate to the product: register → reminder →
// meeting point → meet → share contacts.
const STEPS: { title: string; body: string }[] = [
  { title: 'Register for a round', body: 'Participants open the event page (via a link or QR code) and pick a round time that suits them. No app to download and no account to create.' },
  { title: 'Get a reminder', body: 'A reminder goes out shortly before the round begins, so everyone who signed up is ready when it starts.' },
  { title: 'Go to your meeting point', body: 'When the round opens, each participant sees who they have been matched with and the named meeting point where they should find each other.' },
  { title: 'Meet and talk', body: 'Pairs or small groups have a set amount of time to talk — often with an optional ice-breaker prompt to get the conversation going.' },
  { title: 'Share contacts', body: 'After the round, participants can choose to share contact details with the people they enjoyed meeting, and see what others shared back.' },
];

const ORGANIZER_FAQ: { q: string; a: string }[] = [
  { q: 'How do I create a networking round?', a: 'From your organizer dashboard, open Rounds and create a new one. Set the date and time, the round duration, the group size, and choose random or topic-based matching.' },
  { q: 'How do I publish and share my event?', a: 'Every event has its own public page and URL. Publish the event, then share the link or the auto-generated QR code so participants can register themselves.' },
  { q: 'What are meeting points?', a: "Meeting points are named spots at your venue — for example “Table 4” or “By the window”. Assigning them tells matched participants exactly where to go, so nobody has to hunt around the room." },
  { q: 'Random or topic-based matching — which should I pick?', a: 'Random matching pairs people freely for maximum serendipity. Topic-based matching groups people around shared interests or goals that you define when you set up the round.' },
  { q: 'Can I run several rounds at one event?', a: 'Yes. An event is a single URL, and you can run as many rounds inside it as you like — for example one every morning of a multi-day conference.' },
  { q: 'How many participants can I have?', a: 'The free tier supports up to 5 participants. Paid capacity tiers scale up to 5,000 participants per event.' },
];

const PARTICIPANT_FAQ: { q: string; a: string }[] = [
  { q: 'How do I join an event?', a: 'Open the event link or scan the QR code the organizer shared, then register and pick a round time. That is all it takes.' },
  { q: 'Do I need to install anything?', a: 'No. Wonderelo runs in your web browser. Just keep the event page (or your reminder link) handy for when your round is about to start.' },
  { q: 'How will I know who to meet, and where?', a: 'When the round starts, your screen shows who you have been matched with and the meeting point where the two of you should find each other.' },
  { q: 'What if I want to stay in touch afterwards?', a: 'After a round you can share your contact details with the people you met, and see the details that others chose to share with you.' },
  { q: 'Is my information private?', a: 'You control what you share. Contact details are only exchanged when you choose to share them after a round.' },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--w-paper)',
  border: '1px solid var(--w-hairline)',
  borderRadius: 'var(--w-r-md)',
  padding: '4px 20px',
  marginTop: 12,
};

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div>
      {items.map((item) => (
        <details key={item.q} style={cardStyle}>
          <summary
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
              listStyle: 'none', cursor: 'pointer', padding: '16px 0',
              fontFamily: 'var(--w-font-display)', fontWeight: 700, fontSize: 17,
              color: 'var(--w-purple-deep)',
            }}
          >
            {item.q}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--w-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </summary>
          <p style={{ margin: 0, padding: '0 0 18px', lineHeight: 1.6, color: 'var(--w-ink)', opacity: .85 }}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function HelpCenterPage({ onGetStarted, onSignIn }: HelpCenterPageProps) {
  const navigate = useNavigate();
  const handleGetStarted = onGetStarted || (() => navigate('/signup'));
  const handleSignIn = onSignIn || (() => navigate('/signin'));

  return (
    <div className="wonderelo w-public">
      <PublicNav onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <main className="w-shell-narrow" style={{ paddingTop: 56, paddingBottom: 32 }}>
        {/* Hero */}
        <span className="w-eyebrow">Help center</span>
        <h1 className="w-display" style={{ fontSize: 'clamp(38px, 5vw, 60px)', marginTop: 16 }}>
          How can we <span className="w-italic">help?</span>
        </h1>
        <p className="w-lede">
          Everything you need to run — or take part in — a Wonderelo speed-networking event. New here? Start with what Wonderelo is,
          then jump to the questions for organizers or participants below.
        </p>

        {/* What is Wonderelo */}
        <section style={{ marginTop: 48 }}>
          <h2 className="w-h2">What is <span className="w-italic">Wonderelo?</span></h2>
          <p style={{ margin: '16px 0 0', lineHeight: 1.65, color: 'var(--w-ink)', fontSize: 17 }}>
            Wonderelo is a speed-networking platform for events. Organizers create timed networking rounds; participants register,
            get matched with someone new, meet at a designated spot, and can swap contact details afterwards. Everything runs in the
            browser through a shared link or QR code — there is no app to install.
          </p>
        </section>

        {/* How a round works */}
        <section style={{ marginTop: 48 }}>
          <h2 className="w-h2">How a networking round <span className="w-italic">works</span></h2>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map((step, i) => (
              <div key={step.title} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div
                  aria-hidden
                  style={{
                    flex: 'none', width: 38, height: 38, borderRadius: 999,
                    background: 'var(--w-purple-deep)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 16,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="w-h3" style={{ fontSize: 19 }}>{step.title}</h3>
                  <p style={{ margin: '6px 0 0', lineHeight: 1.6, color: 'var(--w-ink)', opacity: .85 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Organizer FAQ */}
        <section style={{ marginTop: 56 }}>
          <span className="w-eyebrow">For organizers</span>
          <h2 className="w-h2" style={{ marginTop: 14 }}>Running your <span className="w-italic">event</span></h2>
          <div style={{ marginTop: 20 }}>
            <Faq items={ORGANIZER_FAQ} />
          </div>
        </section>

        {/* Participant FAQ */}
        <section style={{ marginTop: 56 }}>
          <span className="w-eyebrow">For participants</span>
          <h2 className="w-h2" style={{ marginTop: 14 }}>Joining a <span className="w-italic">round</span></h2>
          <div style={{ marginTop: 20 }}>
            <Faq items={PARTICIPANT_FAQ} />
          </div>
        </section>

        {/* Contact us */}
        <section
          style={{
            marginTop: 64,
            background: 'var(--w-cream)', border: '1px solid var(--w-hairline)',
            borderRadius: 'var(--w-r-lg)', padding: '36px 32px', textAlign: 'center',
          }}
        >
          <h2 className="w-h2">Still <span className="w-italic">stuck?</span></h2>
          <p style={{ margin: '14px auto 0', maxWidth: 480, lineHeight: 1.6, color: 'var(--w-ink)' }}>
            We usually reply within a few hours during European working hours. Tell us what you are trying to do and we will point you the right way.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="w-btn w-btn-primary w-btn-lg" href="mailto:hello@wonderelo.com">
              <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              hello@wonderelo.com
            </a>
            <a className="w-btn w-btn-ghost w-btn-lg" href="/pricing" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}>
              See pricing
            </a>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
