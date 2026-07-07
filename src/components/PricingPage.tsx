import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import { PricingPanel } from './PricingPanel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { useAccessToken } from '../stores';
import '../styles/wonderelo-public.css';
import '../styles/wonderelo-pricing.css';

// ── Comparison-table data (static — from design/v06/project/pages/Pricing.html) ──
type Cell = boolean | string;
interface CompareRow { feature: string; free: Cell; single: Cell; unlimited: Cell; unlimitedAccent?: boolean; }
interface CompareSection { section: string; rows: CompareRow[]; }

const COMPARE: CompareSection[] = [
  {
    section: 'Core engine',
    rows: [
      { feature: 'Random & topic-based matching', free: true, single: true, unlimited: true },
      { feature: 'Custom round duration & group size', free: true, single: true, unlimited: true },
      { feature: 'Meeting points & ice-breakers', free: true, single: true, unlimited: true },
    ],
  },
  {
    section: 'Limits',
    rows: [
      { feature: 'Participants per event', free: 'Up to 5', single: '5 – 5 000', unlimited: '5 – 5 000', unlimitedAccent: true },
      { feature: 'Events per month', free: 'Unlimited', single: '1 per credit', unlimited: 'Unlimited', unlimitedAccent: true },
      { feature: 'Rounds per event', free: 'Unlimited', single: 'Unlimited', unlimited: 'Unlimited' },
    ],
  },
  {
    section: 'Branding & promotion',
    rows: [
      { feature: 'Custom event page', free: false, single: true, unlimited: true },
      { feature: 'QR code & promo slide', free: false, single: true, unlimited: true },
      { feature: 'Remove Wonderelo branding', free: false, single: false, unlimited: true },
    ],
  },
  {
    section: 'Support',
    rows: [
      { feature: 'Email support', free: true, single: true, unlimited: 'Priority · 24h', unlimitedAccent: true },
    ],
  },
];

// ── FAQ data (static — from the mock) ──
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What counts as one event?',
    a: 'An event is a single Wonderelo URL — the page where participants register. You can run as many networking rounds inside that event as you want. So a 3-day conference with rounds every morning is still one event, not three.',
  },
  {
    q: 'Do you charge per participant?',
    a: 'No. You pick a capacity tier (5 / 50 / 200 / 500 / 1 000 / 5 000) and pay a flat price for that ceiling. If 47 people show up to a 50-tier event, you still pay the 50 price.',
  },
  {
    q: 'Can I upgrade mid-subscription?',
    a: "Yes. Move up a capacity tier any time and we'll prorate the difference. Moving down takes effect at the next billing cycle.",
  },
  {
    q: 'What payment methods do you support?',
    a: "All major cards via Stripe. For annual subscriptions over €1 000 we can also issue an invoice (SEPA / wire). Drop us a note if that's you.",
  },
  {
    q: 'Is there a non-profit discount?',
    a: "Yes — schools, universities, and registered non-profits get 40% off any plan. Reply to your welcome email with proof and we'll apply it.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Subscriptions cancel at the end of your current billing period — no fees, no questions. Single-event credits never expire.',
  },
];

// Comparison-table cell icons (verbatim SVG sizing from the mock)
const TickIco = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const CrossIco = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function Cell({ value, accent }: { value: Cell; accent?: boolean }) {
  if (typeof value === 'string') {
    return <td className="is-cell" style={{ fontWeight: 600, ...(accent ? { color: 'var(--w-orange)' } : {}) }}>{value}</td>;
  }
  return (
    <td className={`is-cell${value ? '' : ' is-dim'}`}>{value ? TickIco : CrossIco}</td>
  );
}

interface PricingPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function PricingPage({ onGetStarted, onSignIn }: PricingPageProps) {
  const navigate = useNavigate();
  const accessToken = useAccessToken();
  const handleGetStarted = onGetStarted || (() => navigate('/signup'));
  const handleSignIn = onSignIn || (() => navigate('/signin'));

  return (
    <div className="wonderelo w-public pr-page">
      <PublicNav onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <main>

        {/* ───────── Hero ───────── */}
        <section className="pr-hero">
          <span className="pr-deco-1" />
          <span className="pr-deco-2" />
          <span className="pr-deco-3" />
          <div className="w-shell-narrow pr-hero-inner">
            <span className="w-eyebrow" style={{ justifyContent: 'center' }}>Pricing · No surprises</span>
            <h1 className="w-display" style={{ marginTop: 18 }}>Simple pricing,<br/><span className="w-italic">no worry</span></h1>
            <p className="pr-lede">Start free with up to 5 participants. Pay per event when you need it, or subscribe for unlimited rounds. No hidden fees, cancel anytime.</p>
          </div>
        </section>

        {/* ───────── Capacity selector + plan cards ───────── */}
        <section className="w-shell">
          <PricingPanel accessToken={accessToken} />
        </section>

        {/* ───────── Comparison table ───────── */}
        <section className="w-shell pr-compare">
          <div className="pr-compare-head">
            <span className="w-eyebrow">Compare</span>
            <h2 className="w-h1">What's <span className="w-italic">included</span></h2>
            <p className="w-lede" style={{ maxWidth: 580, margin: '18px auto 0' }}>Every plan ships with the full networking engine — what differs is capacity, branding, and how often you run.</p>
          </div>

          <table className="pr-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Feature</th>
                <th>Free</th>
                <th>Single event</th>
                <th className="is-featured">Unlimited</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((sec) => (
                <Fragment key={sec.section}>
                  <tr className="pr-section-row">
                    <td colSpan={4}>{sec.section}</td>
                  </tr>
                  {sec.rows.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <Cell value={row.free} />
                      <Cell value={row.single} />
                      <Cell value={row.unlimited} accent={row.unlimitedAccent} />
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="w-shell pr-faq">
          <div className="pr-faq-side">
            <span className="w-eyebrow">Questions</span>
            <h2 className="w-h1" style={{ marginTop: 14 }}>Curious about <span className="w-italic">something else?</span></h2>
            <p>Drop us a line — we usually reply within a few hours during European working hours.</p>
            <a className="w-btn w-btn-ghost" href="mailto:hello@wonderelo.com">
              <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              hello@wonderelo.com
            </a>
          </div>
          <Accordion type="single" collapsible defaultValue="faq-0" className="pr-faq-list">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="pr-faq-item">
                <AccordionTrigger className="pr-faq-q">
                  {item.q}
                  <span className="pr-faq-mark" aria-hidden>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pr-faq-a">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section className="w-shell">
          <div className="pr-cta">
            <span className="deco-1" />
            <span className="deco-2" />
            <span className="deco-italic">go</span>
            <div>
              <h2 className="w-h1">Run your first <span className="w-italic">round</span> in under a minute</h2>
              <p>You don't need a credit card. Spin up a free event, share the URL with five people, and see how it feels before you commit to anything.</p>
            </div>
            <div className="pr-cta-actions">
              <a className="w-btn w-btn-ghost" href="#" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Watch a demo</a>
              <a className="w-btn w-btn-primary w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>
                Start for free
                <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
