/* Wonderelo — public Homepage (Claude Design v06).

   Ported 1:1 from the design bundle at
   `design/v06/project/pages/home/` — `Homepage.html` is only a React/Babel
   shell; the real markup lives in `app.js` (FullHomepage = Nav + HeroConfettiV2
   + HomepageBelowHero), `hero-variants.js` (Nav / ParticipantBar / Hero /
   LogoStrip) and `sections.jsx` (everything below the hero).

   The mock ships its OWN nav (`.wn-nav*`), not the shared `.w-nav`, so the nav
   is ported here rather than using `<PublicNav/>` — but it performs the same
   real actions the legacy nav did (sign in / get started / navigation).

   Runtime effects (`.fx-*` reveal / lift / ripple classes) come from the mock's
   `interactivity.js`, re-expressed as `useHomepageFx` below so the `.fx-*`
   rules already in `src/styles/wonderelo-homepage.css` stay live.

   ALL container logic is preserved from the previous Homepage: organizer /
   participant redirect effect, participant-code join, lead-magnet form. */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { debugLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/wonderelo-public.css';
import '../styles/wonderelo-homepage.css';

/* ─────────────────────────────────────────────────────────────
   Brand palette — verbatim from hero-variants.js `C` / sections.jsx `SC`
   ───────────────────────────────────────────────────────────── */
const C = {
  purple: '#5C2277',
  purpleDeep: '#4b1d51',
  purpleInk: '#2d1133',
  orange: '#dd531c',
  orangeBright: '#ff6a2a',
  cream: '#f7f1e6',
  paper: '#fbf6ec',
  paperDeep: '#f1e9d8',
  ink: '#3a2e34',
};

const HERO_SUB =
  'Easily turn socializing from side effect into program highlight! Networking rounds perfect for conferences, meet-ups, festivals, internal meetings, weddings and parties';
const HERO_CTA = 'Organize networking rounds';
const HERO_BADGES = ['Ready in five minutes', 'No attendee list needed', 'Organize networking rounds'];

/* Nav links — mock copy, wired to the real destinations. */
const NAV_LINKS: Array<{ label: string; target: string }> = [
  { label: 'Who is it for?', target: '#who-is-it-for' },
  { label: 'How it works', target: '#how-it-works' },
  { label: 'Pricing', target: '/pricing' },
];

/* Event-type tiles keep the legacy `/for/:slug` routes. */
const EVENT_TYPES = [
  { title: 'Conferences & barcamps', desc: 'Ensure everyone leaves with new contacts — even introverts and solo attendees.', path: '/for/conferences' },
  { title: 'Meetups', desc: 'Mix people beyond their usual circles and create fresh conversations every time.', path: '/for/meetups' },
  { title: 'Festivals & parties', desc: 'Break the ice between groups, make solo guests feel included – make your event more fun!', path: '/for/festivals' },
  { title: 'Weddings', desc: 'Mix Team Bride and Team Groom so the two sides finally get to know each other.', path: '/for/weddings' },
  { title: 'Bars & cafés', desc: 'Host speed datings, quiz nights, board game evenings — give regulars a reason to come back.', path: '/for/bars' },
  { title: 'Schools & universities', desc: 'Help students get to know each other, form project teams, or break the ice at the start of a new semester.', path: '/for/schools' },
  { title: 'Company teams', desc: 'Build deeper relationships across departments and help remote colleagues connect face-to-face.', path: '/for/teams' },
];

/* Blog cards keep the legacy slugs so `/blog/:slug` still resolves. */
const BLOG_POSTS = [
  { slug: 'meeting-points-guide', tag: 'Networking', title: 'Meeting points: the secret ingredient of great networking rounds', desc: 'Why designated meeting spots make networking less awkward and way more fun.', time: '5 min read' },
  { slug: 'how-to-promote-your-event', tag: 'Strategy', title: 'How to promote your event and get more signups', desc: 'From social media to on-site QR codes — practical ways to drive attendance.', time: '7 min read' },
  { slug: 'random-vs-ai-matching', tag: 'Research', title: 'Random vs AI matching: which one actually works?', desc: 'We tested both approaches at real events. The results surprised us.', time: '6 min read' },
];

/* ─────────────────────────────────────────────────────────────
   Primitives (sections.jsx / hero-variants.js)
   ───────────────────────────────────────────────────────────── */

/* The design's italic serif accent. Uses `.w-italic` so the brand island's
   vs-jasper neutraliser keeps it orange + serif. */
function Italic({ children, color }: { children: ReactNode; color?: string }) {
  return <span className="w-italic" style={color ? { color } : undefined}>{children}</span>;
}

function SectionTitle({ children, maxWidth = 900 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <h2
      className="hp-h2"
      style={{
        margin: '16px auto 0',
        maxWidth,
        textAlign: 'center',
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontWeight: 800,
        fontSize: 56,
        lineHeight: 1.0,
        letterSpacing: '-0.035em',
        color: C.purpleDeep,
        textWrap: 'balance',
      } as CSSProperties}
    >
      {children}
    </h2>
  );
}

function Lede({ children, maxWidth = 640 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <p className="hp-lede" style={{ margin: '20px auto 0', maxWidth, textAlign: 'center', fontSize: 18, lineHeight: 1.55, color: C.ink }}>
      {children}
    </p>
  );
}

function ArrowS({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function CheckS({ size = 18, color = C.orange }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StarS({ size = 16, color = C.orange }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8 1.6l1.94 4.06L14.4 6.3l-3.32 3.06L11.94 14 8 11.66 4.06 14l.86-4.64L1.6 6.3l4.46-.64z" />
    </svg>
  );
}

function Star({ size = 14, color = C.orange, fill }: { size?: number; color?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill ? color : 'none'} stroke={color} strokeWidth="1.4">
      <path d="M8 1.6l1.94 4.06L14.4 6.3l-3.32 3.06L11.94 14 8 11.66 4.06 14l.86-4.64L1.6 6.3l4.46-.64z" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: bg, color: fg, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, letterSpacing: '.02em' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg }} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Interaction layer — port of the mock's interactivity.js, scoped to the
   page root instead of `#root`. Tags inline-styled nodes with the `.fx-*`
   classes that `wonderelo-homepage.css` animates, then wires the reveal
   observers, diamond parallax and magnetic buttons.
   ───────────────────────────────────────────────────────────── */
function useHomepageFx(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let alive = true;
    let rafId = 0;

    // 1 — click ripple
    const onClick = (e: MouseEvent) => {
      const tgt = (e.target as HTMLElement | null)?.closest?.('button, a, [role="button"]');
      if (!tgt) return;
      const r = document.createElement('div');
      r.className = 'fx-ripple';
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    };
    root.addEventListener('click', onClick);

    // 2 — reveal observers
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    const stepIO = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); stepIO.unobserve(entry.target); }
      }),
      { threshold: 0.25, rootMargin: '0px 0px -15% 0px' },
    );

    // 3 — tag inline-styled nodes
    const tagAll = () => {
      root.querySelectorAll<HTMLElement>('div[style*="border-radius: 24"], div[style*="border-radius:24"]').forEach((el) => {
        if (el.classList.contains('fx-card')) return;
        el.classList.add('fx-card');
        const media = el.querySelector<HTMLElement>('div[style*="border-radius: 16"], div[style*="border-radius:16"]');
        if (media) media.classList.add('fx-card-media');
      });

      root.querySelectorAll<HTMLElement>('[style*="rotate(45deg)"]').forEach((el) => {
        if (el.classList.contains('fx-diamond')) return;
        el.classList.add('fx-diamond');
        const s = el.getAttribute('style') || '';
        if (s.includes('position: absolute') || s.includes('position:absolute')) {
          el.classList.add('fx-float');
          el.style.animationDelay = `${Math.random() * 6}s`;
        }
      });

      root.querySelectorAll<HTMLElement>('button, [role="button"]').forEach((el) => el.classList.add('fx-btn'));

      root.querySelectorAll<HTMLElement>('span, em').forEach((el) => {
        const f = el.style && el.style.fontFamily;
        if ((f && /Instrument Serif/i.test(f)) || el.classList.contains('w-italic')) el.classList.add('fx-ember');
      });

      root.querySelectorAll<HTMLElement>('a').forEach((el) => {
        const hasOnlyMedia = el.querySelector('img,svg') && !el.textContent?.trim();
        if (hasOnlyMedia) el.classList.add('fx-icon');
        else if (el.textContent?.trim()) el.classList.add('fx-link');
      });

      root.querySelectorAll<HTMLElement>('[style*="cursor: pointer"], [style*="cursor:pointer"]').forEach((el) => {
        if (el.matches('button, a, [role="button"], .fx-card')) return;
        el.classList.add('fx-clickable');
      });

      root.querySelectorAll<HTMLElement>('[style*="border-radius: 999"], [style*="border-radius:999"], [style*="border-radius: 100"]').forEach((el) => {
        const isClickable = el.matches('button, a, [role="button"]') || /cursor:\s*pointer/.test(el.getAttribute('style') || '');
        if (isClickable) el.classList.add('fx-pill');
      });

      root.querySelectorAll<HTMLElement>('div, a').forEach((el) => {
        const txt = el.textContent || '';
        if (/wonderelo/i.test(txt) && txt.length < 30 && el.children.length <= 4) el.classList.add('fx-lockup');
      });

      root.querySelectorAll<HTMLElement>('img').forEach((el) => {
        const parent = el.closest('button, a, [role="button"], .fx-clickable');
        if (parent && !el.closest('.fx-card')) el.classList.add('fx-img-click');
      });

      root.querySelectorAll<HTMLElement>('section').forEach((sec) => {
        if (sec.classList.contains('fx-reveal')) return;
        sec.classList.add('fx-reveal');
        sec.querySelectorAll<HTMLElement>('.fx-card').forEach((c) => c.classList.add('fx-stagger'));
      });

      root.querySelectorAll<HTMLElement>('.fx-step-row').forEach((row) => {
        if (row.dataset.fxStepObserved) return;
        row.dataset.fxStepObserved = '1';
        stepIO.observe(row);
      });
    };

    const observeAll = () => root.querySelectorAll('.fx-reveal:not(.is-in)').forEach((el) => io.observe(el));

    const wireMagnetic = () => {
      root.querySelectorAll<HTMLElement>('.fx-btn').forEach((btn) => {
        if (btn.dataset.fxMag) return;
        btn.dataset.fxMag = '1';
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          const mx = (e.clientX - r.left - r.width / 2) / r.width;
          const my = (e.clientY - r.top - r.height / 2) / r.height;
          btn.style.transform = `translate(${(mx * 6).toFixed(1)}px, ${(my * 6 - 2).toFixed(1)}px) scale(1.02)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
      });
    };

    // 4 — diamond parallax
    const parallax = () => {
      if (!alive) return;
      root.querySelectorAll<HTMLElement>('.fx-diamond.fx-float').forEach((el, i) => {
        const speed = 0.04 + (i % 5) * 0.01;
        const r = el.getBoundingClientRect();
        const offset = (window.innerHeight / 2 - r.top) * speed;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
      rafId = requestAnimationFrame(parallax);
    };

    const pass = () => { tagAll(); observeAll(); wireMagnetic(); };
    pass();
    rafId = requestAnimationFrame(parallax);

    // Re-tag when React swaps nodes (flip clock, regrouping tiles, cycling photos).
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; if (alive) pass(); });
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      if (queued) cancelAnimationFrame(queued);
      mo.disconnect();
      io.disconnect();
      stepIO.disconnect();
      root.removeEventListener('click', onClick);
    };
  }, [rootRef]);
}

/* ─────────────────────────────────────────────────────────────
   Nav — the mock's own `.wn-nav` (sticky, light), wired to real actions
   ───────────────────────────────────────────────────────────── */
function Nav({
  onGetStarted,
  onSignIn,
  onNavigate,
  logoSize = 120,
}: {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onNavigate: (path: string) => void;
  logoSize?: number;
}) {
  const { t } = useTranslation();
  const ink = C.purpleDeep;
  const linkColor = 'rgba(76,25,77,.78)';
  const borderCol = 'rgba(76,25,77,.10)';

  const goto = (target: string) => {
    if (target.startsWith('#')) {
      document.getElementById(target.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate(target);
    }
  };

  return (
    <div
      className="wn-nav wn-nav-light"
      style={{
        position: 'sticky', top: 0, left: 0, right: 0, height: 80, zIndex: 50,
        borderBottom: `1px solid ${borderCol}`,
        background: 'rgba(247,241,230,.85)',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
      }}
    >
      <div style={{ maxWidth: 1440, height: '100%', margin: '0 auto', padding: '0 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          className="wn-nav-lockup"
          role="button"
          tabIndex={0}
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onNavigate('/'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('/'); } }}
          style={{ display: 'flex', alignItems: 'center', gap: Math.max(8, (logoSize - 40) / 2 + 4), cursor: 'pointer' }}
        >
          {/* Logo symbol — scales from its own center, doesn't push the wordmark */}
          <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img
              src="/Wonderelo-logo-symbol.png"
              alt=""
              style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-6deg)', width: logoSize, height: logoSize, objectFit: 'contain' }}
            />
          </div>
          {/* 32px — the mock spreads an override over its `wordmarkSize` default, so
              the wordmark is always 32px regardless of the prop. */}
          <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: ink }}>wonderelo</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, color: linkColor, fontWeight: 500 }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.target}
              className="wn-nav-link"
              onClick={(e) => { e.preventDefault(); goto(l.target); }}
              style={{ color: linkColor, textDecoration: 'none', padding: '6px 0', position: 'relative' }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: ink }}>
          <a
            href="/signin"
            className="wn-nav-signin"
            onClick={(e) => { e.preventDefault(); if (onSignIn) onSignIn(); else onNavigate('/signin'); }}
            style={{ cursor: 'pointer', fontWeight: 500, color: ink, textDecoration: 'none' }}
          >
            {t('nav.logIn', 'Sign in')}
          </a>
          <button
            type="button"
            className="wn-nav-cta"
            onClick={onGetStarted}
            style={{ background: C.orange, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            {/* Own key, not the shared `nav.getStarted` ("Get started") — the mock's
                homepage CTA reads "Start for free" and must not inherit the other
                public pages' translation. */}
            {t('homepage.nav.cta', 'Start for free')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Participant join bar — real code entry (was its own section before)
   ───────────────────────────────────────────────────────────── */
function ParticipantBar({
  topOffset = 0,
  participantCode,
  onParticipantCodeChange,
  onParticipantJoin,
}: {
  topOffset?: number;
  participantCode: string;
  onParticipantCodeChange: (v: string) => void;
  onParticipantJoin: () => void;
}) {
  const { t } = useTranslation();
  const ink = 'rgba(76,25,77,.7)';
  const hasCode = !!participantCode.trim();

  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: topOffset, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 14,
        borderBottom: '1px solid rgba(76,25,77,.10)',
        zIndex: 9,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      <span style={{ fontSize: 13, color: ink, fontWeight: 500 }}>
        {t('homepage.participant.joining', 'Joining as a participant?')}
      </span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'rgba(76,25,77,.45)', pointerEvents: 'none', zIndex: 1 }}>#</span>
        <input
          type="text"
          placeholder={t('homepage.participant.placeholder', 'Enter code here')}
          className="wn-participant-input"
          value={participantCode}
          onChange={(e) => onParticipantCodeChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && hasCode) onParticipantJoin(); }}
          style={{
            background: '#fff',
            border: '1px solid rgba(76,25,77,.18)',
            borderRadius: 8,
            height: 32,
            width: 170,
            paddingLeft: 26,
            paddingRight: 10,
            fontSize: 13,
            color: C.purpleDeep,
            outline: 'none',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        />
      </div>
      <button
        type="button"
        className="wn-participant-join"
        disabled={!hasCode}
        onClick={onParticipantJoin}
        style={{
          height: 32, padding: '0 16px',
          background: C.purpleDeep, color: '#fff',
          border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: hasCode ? 'pointer' : 'default',
          opacity: hasCode ? 1 : 0.5,
          transition: 'opacity .2s ease, transform .2s ease',
        }}
      >
        {t('homepage.participant.join', 'Join')}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Press logo strip pinned to the bottom of the hero
   ───────────────────────────────────────────────────────────── */
function LogoStrip() {
  const media = [
    { src: '/logos/business-insider.svg', alt: 'Business Insider', h: 22 },
    { src: '/logos/digital-journal.svg', alt: 'Digital Journal', h: 22 },
    { src: '/logos/big-news-network.svg', alt: 'Big News Network', h: 22 },
    { src: '/logos/techbullion.svg', alt: 'TechBullion', h: 22 },
    { src: '/logos/ips.svg', alt: 'IPS', h: 22 },
    { src: '/logos/starkville.svg', alt: 'Starkville Daily News', h: 22 },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTop: '1px solid rgba(76,25,77,.15)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 60px', display: 'flex', alignItems: 'center', gap: 40, color: 'rgba(76,25,77,.5)', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.22em', flexShrink: 0 }}>As seen in</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {media.map((m) => (
            <img key={m.alt} src={m.src} alt={m.alt} style={{ height: m.h, width: 'auto', maxWidth: 140, objectFit: 'contain', opacity: 0.8, filter: 'grayscale(100%)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero — "Confetti Burst v2" (nav rendered separately as sticky)
   ───────────────────────────────────────────────────────────── */
function Hero({
  onGetStarted,
  onSecondary,
  participantCode,
  onParticipantCodeChange,
  onParticipantJoin,
}: {
  onGetStarted: () => void;
  onSecondary: () => void;
  participantCode: string;
  onParticipantCodeChange: (v: string) => void;
  onParticipantJoin: () => void;
}) {
  return (
    <div className="hero-v2" style={{ position: 'relative', width: '100%', background: C.cream, overflow: 'hidden', fontFamily: '"Space Grotesk", sans-serif' }}>
      {/* texture grain */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(rgba(76,25,77,.6) 1px, transparent 1px)', backgroundSize: '4px 4px', pointerEvents: 'none' }} />

      <ParticipantBar
        topOffset={0}
        participantCode={participantCode}
        onParticipantCodeChange={onParticipantCodeChange}
        onParticipantJoin={onParticipantJoin}
      />

      {/* Content row — capped at 1440 and centered; stacks at ≤1024 */}
      <div className="hero-inner">
        {/* Headline column */}
        <div className="hero-text">
          <Pill bg={C.orange} fg="#fff">Networking rounds</Pill>
          <h1
            className="hero-head hp-h1"
            style={{
              margin: '22px 0 0 0',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(46px, 5.4vw, 84px)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              color: C.purpleDeep,
            }}
          >
            Enrich <Italic>your event</Italic><br />
            by bringing<br />
            <Italic>people together</Italic>
          </h1>
          <p className="hp-hero-sub" style={{ maxWidth: 560, marginTop: 28, fontSize: 18, lineHeight: 1.5, color: '#3a2e34' }}>
            {HERO_SUB}
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onGetStarted}
              style={{
                background: C.orange, color: '#fff', border: 'none',
                padding: '18px 28px', borderRadius: 14,
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: 17, fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 12,
                boxShadow: '0 12px 24px rgba(221,83,28,.35)',
                width: 'auto',
                justifyContent: 'flex-start',
              }}
            >
              <CalIcon /> {HERO_CTA} <Arrow />
            </button>
            <span
              role="button"
              tabIndex={0}
              onClick={onSecondary}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSecondary(); } }}
              style={{ color: C.purpleDeep, fontWeight: 600, fontSize: 16, cursor: 'pointer', borderBottom: `2px solid ${C.purpleDeep}` }}
            >
              Try the demo →
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 28px', marginTop: 30, color: C.purpleDeep, fontSize: 14, fontWeight: 500 }}>
            {HERO_BADGES.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={14} color={C.orange} fill />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Hero illustration — live-site SVG (16:9) */}
        <div className="hero-art">
          <div className="hero-art-glow" />
          <img src="/Wonderelo-hero-section-networking-rounds.svg" alt="Wonderelo networking" className="hero-art-img" />
        </div>
      </div>

      <LogoStrip />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. THE PROBLEM
   ───────────────────────────────────────────────────────────── */
function ProblemSection() {
  const items = [
    { img: '/reality-closed-circles.png', title: 'Groups stay\nclosed', text: 'People arrive with their team and rarely break out.', zoom: 1.2, focus: 'center 55%' },
    { img: '/reality-solo.png', title: 'Solo attendees stuck on the sidelines', text: 'Solo-goers end up scrolling phone instead of meeting anyone.', zoom: 1, focus: 'center' },
    { img: '/reality-waiting.png', title: 'Socializing happens by chance', text: 'A connection usually sparks if you happen to queue for schnitzel.', zoom: 1, focus: 'center' },
  ];

  return (
    <section style={{ background: C.paperDeep, padding: '120px 60px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '8%', top: 80, width: 18, height: 18, background: C.orange, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', right: '10%', top: 140, width: 14, height: 14, background: C.purpleDeep, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', left: '14%', bottom: 100, width: 22, height: 22, background: C.purpleDeep, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', right: '6%', bottom: 60, width: 16, height: 16, background: C.orange, transform: 'rotate(45deg)' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <SectionTitle>
          <Italic>9 out of 10</Italic> people go to events to meet someone new
        </SectionTitle>
        <Lede>But here&rsquo;s what actually happens at most events:</Lede>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                background: C.paper,
                borderRadius: 24,
                padding: 28,
                border: '1px solid rgba(76,25,77,.10)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
                minHeight: 320,
              }}
            >
              <div style={{ width: '100%', aspectRatio: '16 / 10', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.6)', borderRadius: 16, overflow: 'hidden' }}>
                <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: it.focus, transform: `scale(${it.zoom})`, transformOrigin: 'center' }} />
              </div>
              <h3
                className="hp-card-title"
                style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: C.purpleDeep, textAlign: 'center', textWrap: 'balance', whiteSpace: 'pre-line' } as CSSProperties}
              >
                {it.title}
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: C.ink, lineHeight: 1.5, textAlign: 'center', textWrap: 'pretty' } as CSSProperties}>{it.text}</p>
            </div>
          ))}
        </div>

        {/* Closing line — visually weighted callout, framed by diamonds */}
        <div style={{ marginTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <span aria-hidden style={{ width: 14, height: 14, background: C.orange, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <p
            className="hp-callout"
            style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: 36,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: C.purpleDeep,
              textAlign: 'center',
              textWrap: 'balance',
            } as CSSProperties}
          >
            Too many attendees leave{' '}
            <Italic>without new connections</Italic>
            <span style={{ color: C.orange }}>.</span>
          </p>
          <span aria-hidden style={{ width: 14, height: 14, background: C.orange, transform: 'rotate(45deg)', flexShrink: 0 }} />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. HOW IT WORKS — 5 alternating steps
   ───────────────────────────────────────────────────────────── */
function HowItWorksSection({ onGetStarted }: { onGetStarted: () => void }) {
  const steps = [
    { n: 1, title: 'Organizer promotes his Wonderelo event page', body: 'Share your Event page link — show it on slides, screens, or roll-ups using a QR code or the event hashtag.', img: '/how-it-works-1.png', contain: false, position: null as string | null },
    { n: 2, title: 'Participants register to rounds', body: 'People choose their time and optionally topic or group. Zero attendee setup for the organizer.', img: '/Hand-with-phone.png', contain: true, position: null },
    { n: 3, title: 'Then they confirm attendance', body: 'SMS notification sent 5 minutes before the round reminds them to do so.', img: '/how-it-works-3.png', contain: false, position: 'calc(50% + 55px) calc(50% + 7px)' },
    { n: 4, title: 'Participants meet & network', body: 'Wonderelo shows every participant their designated meeting point and match partners. They find each other using a unique Wonderimage™. Ice breakers handle the smooth start.', img: '/Wonderelo-step4.png', contain: false, position: null },
    { n: 5, title: 'Finally they decide whether to exchange contacts', body: 'If both parties agree, contacts are exchanged 15 minutes after the round. New contacts are made, new worlds emerge.', img: '/how-it-works-5.png', contain: true, position: null },
  ];

  return (
    <section id="how-it-works" style={{ background: C.cream, padding: '140px 60px', position: 'relative', scrollMarginTop: 80 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: C.purple, fontSize: 12, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase' }}>
            <span style={{ width: 28, height: 1, background: C.purple }} />
            Stop leaving socializing to chance
            <span style={{ width: 28, height: 1, background: C.purple }} />
          </div>
          <SectionTitle>
            Organize <Italic>networking rounds!</Italic>
          </SectionTitle>
          <Lede>Give your attendees what they came for — new connections.</Lede>
        </div>

        {/* Vertical rail with steps */}
        <div style={{ position: 'relative' }}>
          {/* center rail line — clipped so it doesn't extend past the first/last node */}
          <div style={{ position: 'absolute', left: '50%', top: 200, bottom: 200, width: 2, background: `repeating-linear-gradient(to bottom, ${C.purpleDeep} 0 6px, transparent 6px 14px)`, opacity: 0.25, transform: 'translateX(-50%)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
            {steps.map((s, i) => {
              const reversed = i % 2 === 1;
              return (
                <div key={s.n} className="fx-step-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative' }}>
                  {/* number node on rail */}
                  <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 56, height: 56, borderRadius: '50%', background: C.cream, border: `2px solid ${C.purpleDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 22, color: C.purpleDeep, zIndex: 2 }}>
                    {s.n}
                  </div>

                  {/* image */}
                  <div style={{ gridColumn: reversed ? 2 : 1, gridRow: 1 }}>
                    <div style={{ aspectRatio: '16/10', background: C.paperDeep, borderRadius: 28, border: '1px solid rgba(76,25,77,.10)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(76,25,77,.10)' }}>
                      <img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: s.contain ? 'contain' : 'cover', objectPosition: s.position || 'center' }} />
                    </div>
                  </div>

                  {/* text */}
                  <div style={{ gridColumn: reversed ? 1 : 2, gridRow: 1, paddingRight: reversed ? 60 : 0, paddingLeft: reversed ? 0 : 60 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: C.orange, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 22 }}>
                      Step {s.n.toString().padStart(2, '0')}
                    </div>
                    <h3 className="hp-step-title" style={{ margin: '10px 0 16px', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.025em', color: C.purpleDeep }}>{s.title}</h3>
                    <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: C.ink, maxWidth: 480 }}>{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 96 }}>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: C.orange, color: '#fff', border: 'none',
              padding: '18px 28px', borderRadius: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 17, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
              boxShadow: '0 12px 24px rgba(221,83,28,.35)',
            }}
          >
            Let&rsquo;s make your event better! <ArrowS />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   4a. Featured "Conferences" tile — people-as-circles regrouping animation
   ───────────────────────────────────────────────────────────── */
function ConferencesTile({ type, onNavigate }: { type: (typeof EVENT_TYPES)[number]; onNavigate: (p: string) => void }) {
  const N = 12;
  const groupings = useMemo(
    () => [
      { groups: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]], centers: [[80, 70], [230, 70], [80, 200], [230, 200]] },
      { groups: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]], centers: [[80, 90], [230, 90], [155, 210]] },
      { groups: [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]], centers: [[90, 140], [220, 140]] },
      { groups: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]], centers: [[60, 70], [155, 70], [250, 70], [60, 210], [155, 210], [250, 210]] },
    ],
    [],
  );
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % groupings.length), 2400);
    return () => clearInterval(t);
  }, [groupings.length]);

  const W = 310, H = 280;
  const positions = useMemo(() => {
    const cfg = groupings[step];
    const arr = new Array<{ x: number; y: number; gi: number }>(N);
    cfg.groups.forEach((indices, gi) => {
      const [cx, cy] = cfg.centers[gi];
      const r = indices.length <= 2 ? 14 : indices.length <= 3 ? 18 : indices.length <= 4 ? 22 : 28;
      indices.forEach((idx, k) => {
        const ang = (k / indices.length) * Math.PI * 2 - Math.PI / 2;
        arr[idx] = { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, gi };
      });
    });
    return arr;
  }, [step, groupings]);

  const groupColor = (gi: number) => ['#fff', '#ffd9c2', '#fff', '#ffd9c2', '#fff', '#ffd9c2'][gi % 6];

  return (
    <div
      className="fx-stagger hp-tile-dark hp-on-dark"
      style={{ gridColumn: 'span 6', gridRow: 'span 2', background: C.orange, borderRadius: 28, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 420, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 22, color: 'rgba(255,255,255,.85)' }}>01</div>
        <h3 className="hp-tile-title-light" style={{ margin: '10px 0 16px', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.03em', color: '#fff' }}>{type.title}</h3>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,.9)', maxWidth: 420 }}>{type.desc}</p>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate(type.path)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(type.path); } }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 600, fontSize: 15, borderBottom: '1.5px solid #fff', alignSelf: 'flex-start', paddingBottom: 4, position: 'relative', zIndex: 2, cursor: 'pointer' }}
      >
        Learn more <ArrowS size={14} />
      </div>
      {/* People-as-circles regrouping animation */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', right: -10, bottom: -10, width: 360, height: 220, pointerEvents: 'none', zIndex: 1, opacity: 0.9 }}
      >
        {groupings[step].centers.map((c, gi) => (
          <circle
            key={`h${step}-${gi}`}
            cx={c[0]}
            cy={c[1]}
            r={groupings[step].groups[gi].length <= 2 ? 22 : groupings[step].groups[gi].length <= 3 ? 28 : groupings[step].groups[gi].length <= 4 ? 34 : 42}
            fill="rgba(255,255,255,.10)"
            style={{ transition: 'all .9s cubic-bezier(.4,0,.2,1)' }}
          />
        ))}
        {positions.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill={groupColor(p.gi)} style={{ transition: 'cx 1.1s cubic-bezier(.4,0,.2,1), cy 1.1s cubic-bezier(.4,0,.2,1), fill .9s ease' }} />
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. WHO IS IT FOR — editorial bento layout (dark purple section)
   ───────────────────────────────────────────────────────────── */
function WhoIsItForSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <section id="who-is-it-for" className="hp-dark" style={{ background: C.purpleDeep, padding: '140px 60px', color: '#fff', position: 'relative', overflow: 'hidden', scrollMarginTop: 80 }}>
      {/* big italic background word */}
      <div aria-hidden style={{ position: 'absolute', left: '-2%', bottom: -80, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 280, color: 'rgba(255,255,255,.04)', lineHeight: 1, fontWeight: 400, letterSpacing: '-0.04em', pointerEvents: 'none' }}>unforgettable</div>

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 className="hp-h2-light hp-on-dark" style={{ margin: '16px auto 0', maxWidth: 900, textAlign: 'center', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.035em', color: '#fff', textWrap: 'balance' } as CSSProperties}>
            Every gathering becomes unforgettable when <Italic color={C.orangeBright}>people connect</Italic>
          </h2>
          <p className="hp-lede-light hp-on-dark" style={{ margin: '20px auto 0', maxWidth: 640, textAlign: 'center', fontSize: 18, lineHeight: 1.55, color: 'rgba(255,255,255,.7)' }}>Make yours one of them!</p>
        </div>

        {/* Editorial 3-2-2 layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
          {/* Featured (large) tile */}
          <ConferencesTile type={EVENT_TYPES[0]} onNavigate={onNavigate} />

          {/* Other 6 tiles */}
          {EVENT_TYPES.slice(1).map((t, i) => {
            const isLight = i === 1;
            return (
              <div
                key={t.path}
                className={`fx-stagger ${isLight ? 'hp-tile-light' : 'hp-tile-dark hp-on-dark'}`}
                role="button"
                tabIndex={0}
                onClick={() => onNavigate(t.path)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(t.path); } }}
                style={{
                  gridColumn: 'span 3',
                  background: isLight ? C.cream : 'rgba(255,255,255,.05)',
                  color: isLight ? C.purpleDeep : '#fff',
                  borderRadius: 22,
                  padding: 24,
                  border: isLight ? 'none' : '1px solid rgba(255,255,255,.10)',
                  minHeight: 200,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 18, color: isLight ? C.orange : C.orangeBright, marginBottom: 8 }}>0{i + 2}</div>
                  <h4 className={isLight ? 'hp-tile-title' : 'hp-tile-title-light'} style={{ margin: '0 0 10px', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.02em', color: isLight ? C.purpleDeep : '#fff' }}>{t.title}</h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: isLight ? C.ink : 'rgba(255,255,255,.7)' }}>{t.desc}</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: isLight ? C.orange : C.orangeBright, marginTop: 12 }}>
                  Learn more <ArrowS size={12} />
                </div>
              </div>
            );
          })}

          {/* Photo tile filling bottom-right of the bento grid */}
          <div className="fx-stagger" style={{ gridColumn: 'span 6', borderRadius: 22, overflow: 'hidden', position: 'relative', minHeight: 380, border: '1px solid rgba(255,255,255,.10)' }}>
            <img src="/images/photo7.png" alt="People connecting at a conference" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', objectPosition: 'center 35%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(76,25,77,.65) 0%, rgba(76,25,77,.10) 45%, rgba(76,25,77,.0) 100%)' }} />
            <div style={{ position: 'absolute', left: 32, bottom: 32, color: '#fff', maxWidth: 360 }}>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 20, color: 'rgba(255,255,255,.85)', marginBottom: 8 }}>Real connections</div>
              <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em' }}>Whoever your audience is — Wonderelo helps them meet.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. FEATURES — bento grid of illustrated tiles
   ───────────────────────────────────────────────────────────── */

/* Shared state so the Duration slider and the Flip Clock stay in sync. */
const durationStore = { val: 10, listeners: new Set<(v: number) => void>() };
function setDurationVal(v: number) {
  durationStore.val = v;
  durationStore.listeners.forEach((l) => l(v));
}
function useDurationVal(): [number, (v: number) => void] {
  const [v, setV] = useState(durationStore.val);
  useEffect(() => {
    durationStore.listeners.add(setV);
    return () => { durationStore.listeners.delete(setV); };
  }, []);
  return [v, setDurationVal];
}

function FlipDigit({ digit }: { digit: string }) {
  const [prev, setPrev] = useState(digit);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (prev !== digit) {
      setAnimKey((k) => k + 1);
      const id = setTimeout(() => setPrev(digit), 580);
      return () => clearTimeout(id);
    }
  }, [digit, prev]);
  const flipping = prev !== digit;
  return (
    <div className="fc-cell">
      {/* Static halves — show NEW digit (bottom static stays as PREV until flip ends) */}
      <div className="fc-half fc-top"><span>{digit}</span></div>
      <div className="fc-half fc-bot"><span>{flipping ? prev : digit}</span></div>
      <div className="fc-hinge" />
      {flipping && (
        <>
          {/* Top flap: shows OLD digit, rotates 0 → -90 (origin bottom) */}
          <div key={`t${animKey}`} className="fc-flap fc-flap-top"><span>{prev}</span></div>
          {/* Bottom flap: shows NEW digit, rotates 90 → 0 (origin top, delayed) */}
          <div key={`b${animKey}`} className="fc-flap fc-flap-bot"><span>{digit}</span></div>
        </>
      )}
    </div>
  );
}

function HomepageFlipClock() {
  const [minutes] = useDurationVal();
  const total = Math.max(1, minutes) * 60;
  const [s, setS] = useState(total);
  useEffect(() => { setS(total); }, [total]);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v <= 1 ? total : v - 1)), 1000);
    return () => clearInterval(t);
  }, [total]);
  const m = Math.floor(s / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const [m1, m2] = pad(m).split('');
  const [s1, s2] = pad(sec).split('');
  return (
    <div className="fc-clock" aria-label="Round timer">
      <FlipDigit digit={m1} />
      <FlipDigit digit={m2} />
      <span className="fc-colon">:</span>
      <FlipDigit digit={s1} />
      <FlipDigit digit={s2} />
    </div>
  );
}

function FeatureTile({
  span, tall, label, title, desc, visual, bg, fg, topLeftBadge,
}: {
  span: number; tall?: boolean; label: string; title: string; desc: string;
  visual: ReactNode; bg: string; fg: string; topLeftBadge?: ReactNode;
}) {
  const isLightBg = bg === C.paper || bg === C.paperDeep;
  return (
    <div
      className={`fx-feature-tile ${fg === '#fff' ? 'hp-tile-dark hp-on-dark' : 'hp-tile-light'}`}
      style={{
        gridColumn: `span ${span}`,
        gridRow: tall ? 'span 2' : 'span 1',
        background: bg,
        color: fg,
        borderRadius: 28,
        padding: 28,
        minHeight: tall ? 460 : 280,
        display: 'flex', flexDirection: 'column',
        gap: 16,
        border: isLightBg ? '1px solid rgba(76,25,77,.10)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: fg === '#fff' ? 'rgba(255,255,255,.7)' : 'rgba(76,25,77,.5)', marginTop: topLeftBadge ? 8 : 0 }}>{label}</span>
        {topLeftBadge}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: tall ? 220 : 100, position: 'relative' }}>
        {visual}
      </div>

      <div>
        <h3
          className={fg === '#fff' ? 'hp-tile-title-light' : 'hp-tile-title'}
          style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: tall ? 28 : 20, lineHeight: 1.05, letterSpacing: '-0.025em', color: fg }}
        >
          {title}
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: tall ? 15 : 13, lineHeight: 1.5, color: fg === '#fff' ? 'rgba(255,255,255,.85)' : C.ink, opacity: fg === '#fff' ? 1 : 0.85 }}>{desc}</p>
      </div>
    </div>
  );
}

function DurationVisual() {
  const MIN = 3;
  const MAX = 60;
  const stops = [3, 15, 30, 60];
  const [val, setVal] = useDurationVal();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const pct = ((val - MIN) / (MAX - MIN)) * 100;

  const updateFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setVal(Math.round(MIN + ratio * (MAX - MIN)));
  }, [setVal]);

  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    updateFromClientX(e.clientX);
    const onMove = (ev: PointerEvent) => updateFromClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const activeChip = val <= 5 ? 0 : val <= 20 ? 1 : val <= 40 ? 2 : 3;

  return (
    <div style={{ width: '100%', padding: '12px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, opacity: 0.85, fontSize: 12, fontWeight: 600 }}>
        {stops.map((s) => <span key={s} style={{ color: '#fff' }}>{s} min</span>)}
      </div>
      {/* track */}
      <div ref={trackRef} onPointerDown={onPointerDown} style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,.25)', cursor: 'pointer', touchAction: 'none' }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, top: 0, bottom: 0, borderRadius: 999, background: '#fff' }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', background: '#fff', border: `4px solid ${C.purpleDeep}`, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: -34, transform: 'translateX(-50%)', background: '#fff', color: C.purpleDeep, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{val} min</div>
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { l: 'Speed chat · 3 min', v: 3 },
          { l: 'Standard · 10 min', v: 10 },
          { l: 'Long form · 30 min', v: 30 },
          { l: 'Panel · 60 min', v: 60 },
        ].map((c, i) => {
          const on = i === activeChip;
          return (
            <span
              key={i}
              className="duration-chip"
              onClick={() => setVal(c.v)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVal(c.v); } }}
              tabIndex={0}
              style={{
                background: on ? '#fff' : 'rgba(255,255,255,.12)',
                color: on ? C.purpleDeep : '#fff',
                border: on ? 'none' : '1px solid rgba(255,255,255,.3)',
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                userSelect: 'none',
                transition: 'background .15s ease, color .15s ease, transform .15s ease',
              }}
            >
              {c.l}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function GroupSizeVisual() {
  const Avatar = ({ c = C.orange, s = 18 }: { c?: string; s?: number }) => (
    <div style={{ width: s, height: s, borderRadius: '50%', background: c, border: `2px solid ${C.cream}`, flexShrink: 0 }} />
  );

  const Row = ({ active, label, count, palette }: { active?: boolean; label: string; count: number; palette: string[] }) => (
    <div style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: active ? C.purpleDeep : 'rgba(76,25,77,.08)', color: active ? '#fff' : C.purpleDeep, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: count }).map((_, i) => <Avatar key={i} c={palette[i % palette.length]} />)}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, opacity: active ? 1 : 0.6, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row active label="Pairs" count={2} palette={[C.orange, '#fff']} />
      <Row label="Trios" count={3} palette={[C.orange, C.purpleDeep, C.orange]} />
      <Row label="Quads" count={4} palette={[C.orange, C.purpleDeep, C.orange, C.purpleDeep]} />
    </div>
  );
}

function TopicsVisual() {
  const tags = ['#startups', '#design', '#ai', '#climate', '#travel', '#parenting'];
  const [active, setActive] = useState<Record<number, boolean>>({ 0: true, 3: true });
  const toggle = (i: number) => setActive((a) => ({ ...a, [i]: !a[i] }));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
      {tags.map((t, i) => {
        const on = !!active[i];
        return (
          <span
            key={t}
            role="button"
            tabIndex={0}
            className="wn-topic-tag"
            onClick={() => toggle(i)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
            style={{
              background: on ? C.orange : 'rgba(255,255,255,.08)',
              color: '#fff',
              border: on ? '1px solid transparent' : '1px solid rgba(255,255,255,.2)',
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              fontFamily: '"Space Grotesk", sans-serif',
              userSelect: 'none',
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

function MatchingVisual() {
  const [mode, setMode] = useState<'within' | 'across'>('across');

  const Dot = ({ cx, cy, c }: { cx: number; cy: number; c: string }) => (
    <circle cx={cx} cy={cy} r="6" fill={c} stroke={C.cream} strokeWidth="2" />
  );

  const A = [{ x: 60, y: 40 }, { x: 36, y: 70 }, { x: 84, y: 70 }, { x: 60, y: 100 }];
  const B = [{ x: 160, y: 40 }, { x: 136, y: 70 }, { x: 184, y: 70 }, { x: 160, y: 100 }];
  const withinPairs: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

  const tabBase: CSSProperties = {
    flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 999,
    fontSize: 11, fontWeight: 700, cursor: 'pointer', userSelect: 'none',
    transition: 'background .15s ease, color .15s ease, opacity .15s ease',
  };
  const tabActive: CSSProperties = { background: C.purpleDeep, color: '#fff' };
  const tabIdle: CSSProperties = { color: C.purpleDeep, opacity: 0.55 };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* mode toggle */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(76,25,77,.08)', borderRadius: 999 }}>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setMode('within')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode('within'); } }}
          style={{ ...tabBase, ...(mode === 'within' ? tabActive : tabIdle) }}
        >
          Within
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setMode('across')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode('across'); } }}
          style={{ ...tabBase, ...(mode === 'across' ? tabActive : tabIdle) }}
        >
          Across
        </span>
      </div>

      {/* canvas with two circles + connections */}
      <div style={{ position: 'relative', width: '100%', height: 150, background: C.cream, borderRadius: 14, border: '1px solid rgba(76,25,77,.12)', overflow: 'hidden' }}>
        <svg viewBox="0 0 220 140" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="60" cy="70" r="38" fill="none" stroke={C.orange} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="160" cy="70" r="38" fill="none" stroke={C.purpleDeep} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />

          {mode === 'across' ? (
            <g>
              {A.map((a, i) => (
                <line key={i} x1={a.x} y1={a.y} x2={B[i].x} y2={B[i].y} stroke={C.purpleDeep} strokeOpacity=".5" strokeWidth="1.4" />
              ))}
              <line x1={A[0].x} y1={A[0].y} x2={B[3].x} y2={B[3].y} stroke={C.orange} strokeOpacity=".5" strokeWidth="1.4" />
              <line x1={A[3].x} y1={A[3].y} x2={B[0].x} y2={B[0].y} stroke={C.orange} strokeOpacity=".5" strokeWidth="1.4" />
            </g>
          ) : (
            <g>
              {withinPairs.map(([i, j], k) => (
                <line key={`aw${k}`} x1={A[i].x} y1={A[i].y} x2={A[j].x} y2={A[j].y} stroke={C.orange} strokeOpacity=".55" strokeWidth="1.4" />
              ))}
              {withinPairs.map(([i, j], k) => (
                <line key={`bw${k}`} x1={B[i].x} y1={B[i].y} x2={B[j].x} y2={B[j].y} stroke={C.purpleDeep} strokeOpacity=".55" strokeWidth="1.4" />
              ))}
            </g>
          )}

          {A.map((p, i) => <Dot key={`a${i}`} cx={p.x} cy={p.y} c={C.orange} />)}
          {B.map((p, i) => <Dot key={`b${i}`} cx={p.x} cy={p.y} c={C.purpleDeep} />)}
        </svg>
      </div>
    </div>
  );
}

function MeetingPointsVisual() {
  const Card = ({ src, alt, label, num }: { src: string; alt: string; label: string; num: string }) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* label tab — height/padding mirror the Within/Across toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 10px', background: 'rgba(76,25,77,.08)', borderRadius: 999 }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.orange, color: '#fff', fontSize: 9, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{num}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.purpleDeep, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      {/* image card — height matches Matching's canvas */}
      <div style={{ width: '100%', height: 150, borderRadius: 14, border: '1px solid rgba(76,25,77,.12)', overflow: 'hidden', background: '#f3c9cc' }}>
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', display: 'flex', gap: 8 }}>
      <Card num="1" label="Table" src="/meeting-table.png" alt="Cocktail table with a flower vase" />
      <Card num="2" label="Tree" src="/meeting-tree.png" alt="Chair beside a tree" />
      <Card num="3" label="Bar" src="/meeting-bar.png" alt="Bar counter with a stool" />
    </div>
  );
}

function IcebreakersVisual() {
  const questions = [
    "What's a good movie you've seen lately?",
    'If you could swap jobs with anyone for a day, who?',
    "What's a small thing that recently made you happy?",
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', padding: '0 8px' }}>
      {questions.map((q, i) => (
        <div
          key={i}
          style={{
            background: i === 0 ? C.orange : 'rgba(255,255,255,.08)',
            color: '#fff',
            border: i === 0 ? 'none' : '1px solid rgba(255,255,255,.18)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 14,
          }}
        >
          <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#fff' : 'rgba(255,255,255,.15)', color: i === 0 ? C.orange : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 14 }}>?</div>
          <span style={{ fontStyle: 'italic', fontFamily: '"Instrument Serif", serif', fontSize: 17, lineHeight: 1.3 }}>&quot;{q}&quot;</span>
        </div>
      ))}
    </div>
  );
}

function MemoryVisual() {
  return (
    <div style={{ width: '100%', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { name: 'Sara M.', met: true },
        { name: 'Tom K.', met: true },
        { name: 'Lukas H.', met: false },
      ].map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,.12)',
            padding: '10px 12px', borderRadius: 12,
            textDecoration: r.met ? 'line-through' : 'none',
            opacity: r.met ? 0.55 : 1,
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, flex: 1 }}>{r.name}</span>
          {r.met
            ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>met</span>
            : <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, background: 'rgba(255,255,255,.2)', padding: '3px 8px', borderRadius: 999 }}>NEXT</span>}
        </div>
      ))}
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ background: C.cream, padding: '140px 60px', position: 'relative', scrollMarginTop: 80 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <SectionTitle>Tailor each round to <Italic>fit your event</Italic></SectionTitle>
          <Lede>Every event is different. Configure each networking round to match your audience, format, and goals.</Lede>
        </div>

        {/* Bento grid: featured first row (wide+narrow), then 3+3 standard tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20 }}>
          <FeatureTile
            span={4}
            tall
            label="01 · Duration"
            title="Flexible duration"
            desc="Choose the right length for each session — from 3-minute speed chats to hour-long deep dives."
            visual={<DurationVisual />}
            topLeftBadge={<HomepageFlipClock />}
            bg={C.orange}
            fg="#fff"
          />
          <FeatureTile
            span={2}
            tall
            label="02 · Size"
            title="Group size"
            desc="Set anything from intimate one-on-ones to larger group brainstorms — whatever the moment calls for."
            visual={<GroupSizeVisual />}
            bg={C.paper}
            fg={C.purpleDeep}
          />
          <FeatureTile
            span={2}
            label="03 · Topics"
            title="Discussion topics"
            desc="Match people who share the same interests so every conversation starts on common ground."
            visual={<TopicsVisual />}
            bg={C.purpleDeep}
            fg="#fff"
          />
          <FeatureTile
            span={2}
            label="04 · Matching"
            title="Group matching"
            desc="Great for companies. Matching within groups builds the teams. Matching across groups sparks cross-department collaboration."
            visual={<MatchingVisual />}
            bg={C.paper}
            fg={C.purpleDeep}
          />
          <FeatureTile
            span={2}
            label="05 · Locations"
            title="Meeting points"
            desc="You can use distinctive spots already in your venue — so people always know exactly where to go, no extra signage required."
            visual={<MeetingPointsVisual />}
            bg={C.paperDeep}
            fg={C.purpleDeep}
          />
          <FeatureTile
            span={4}
            label="06 · Conversation"
            title="Ice breakers"
            desc="Optional starter questions help even the shyest attendees begin a real conversation."
            visual={<IcebreakersVisual />}
            bg={C.purpleDeep}
            fg="#fff"
          />
          <FeatureTile
            span={2}
            label="07 · Memory"
            title="Matching memory"
            desc="Rounds remember past pairings — people always meet someone new."
            visual={<MemoryVisual />}
            bg={C.orange}
            fg="#fff"
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. TESTIMONIALS
   ───────────────────────────────────────────────────────────── */
function CyclingPhoto({ sources, interval = 4500, objectPosition = 'center', className, style }: {
  sources: string[]; interval?: number; objectPosition?: string; className?: string; style?: CSSProperties;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % sources.length), interval);
    return () => clearInterval(t);
  }, [sources.length, interval]);
  return (
    <div className={className} style={style}>
      {sources.map((src, k) => (
        <img
          key={src}
          src={src}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', objectPosition, opacity: i === k ? 1 : 0, transition: 'opacity 1.2s ease' }}
        />
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const ts = [
    { q: 'It was the first event where we felt confident nobody was left out of networking.', a: 'Anna Müller', e: 'TechFuture Conference', color: C.orange },
    { q: 'Our attendees used to stick to their own groups. Wonderelo changed that in one evening.', a: 'David Novak', e: 'CreativeMinds Meetup', color: C.purpleDeep },
    { q: 'At our company offsite, the sales and manufacturing departments finally found their way to each other.', a: 'Sophie Laurent', e: 'BrightPath Consulting', color: C.orange },
    { q: "Mixing the bride's team and the groom's team led to a massive party.", a: 'Marko & Elena', e: 'Wedding in Vienna', color: C.purpleDeep },
    { q: 'People laughed, made new friends, and kept asking when the next quiz night would be.', a: 'Lucia Rossi', e: 'Caffè Centrale', color: C.orange },
    { q: 'Setup took 5 minutes and participants figured it out on their own. Zero stress.', a: 'Jan Horváth', e: 'EuroSummit Bratislava', color: C.purpleDeep },
  ];

  const initials = (name: string) => name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const diamonds: Array<[number, number, number, string]> = [
    [120, 200, 36, 'o'], [340, 140, 18, 'p'], [580, 220, 28, 'p'], [820, 150, 14, 'o'], [1080, 200, 44, 'o'], [1280, 160, 20, 'p'],
    [200, 1100, 24, 'p'], [460, 1180, 40, 'o'], [700, 1080, 16, 'p'], [960, 1160, 30, 'o'], [1220, 1100, 22, 'p'],
    [80, 700, 32, 'o'], [1340, 720, 18, 'p'],
    [260, 480, 12, 'p'], [620, 560, 22, 'o'], [980, 480, 16, 'p'], [1340, 540, 26, 'o'],
    [180, 920, 14, 'o'], [780, 880, 20, 'p'], [1140, 920, 12, 'o'],
  ];

  return (
    <section style={{ background: C.paperDeep, padding: '140px 60px', position: 'relative', overflow: 'hidden' }}>
      {/* Diamond field — varied sizes scattered across the section as bg pattern */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 1440 1400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
          {diamonds.map(([x, y, s, c], i) => (
            <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} transform={`rotate(45 ${x} ${y})`} fill={c === 'o' ? C.orange : C.purpleDeep} />
          ))}
          {/* connection lines */}
          <g stroke={C.orange} strokeWidth="2" strokeDasharray="4 6" fill="none" opacity=".5">
            <path d="M 120 230 Q 230 100 340 170" />
            <path d="M 580 250 Q 700 180 820 180" />
            <path d="M 1080 230 Q 1180 160 1280 190" />
            <path d="M 200 1130 Q 330 1180 460 1210" />
            <path d="M 700 1110 Q 830 1160 960 1190" />
          </g>
        </svg>
      </div>

      {/* Diamond accents — varied sizes scattered through the section background */}
      <div style={{ position: 'absolute', left: '4%', top: 80, width: 28, height: 28, background: C.orange, transform: 'rotate(45deg)', opacity: 0.9 }} />
      <div style={{ position: 'absolute', left: '12%', top: 220, width: 12, height: 12, background: C.purpleDeep, transform: 'rotate(45deg)', opacity: 0.55 }} />
      <div style={{ position: 'absolute', left: '8%', bottom: 160, width: 18, height: 18, background: C.orange, transform: 'rotate(45deg)', opacity: 0.35 }} />
      <div style={{ position: 'absolute', left: '22%', bottom: 60, width: 8, height: 8, background: C.purpleDeep, transform: 'rotate(45deg)', opacity: 0.7 }} />
      <div style={{ position: 'absolute', right: '6%', top: 110, width: 22, height: 22, background: C.purpleDeep, transform: 'rotate(45deg)', opacity: 0.8 }} />
      <div style={{ position: 'absolute', right: '16%', top: 260, width: 10, height: 10, background: C.orange, transform: 'rotate(45deg)', opacity: 0.55 }} />
      <div style={{ position: 'absolute', right: '4%', bottom: 90, width: 32, height: 32, background: C.orange, transform: 'rotate(45deg)', opacity: 0.35 }} />
      <div style={{ position: 'absolute', right: '20%', bottom: 200, width: 14, height: 14, background: C.purpleDeep, transform: 'rotate(45deg)', opacity: 0.45 }} />

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        {/* Photo strip above the title */}
        <CyclingPhoto
          className="fx-stagger"
          style={{ marginBottom: 64, borderRadius: 24, overflow: 'hidden', position: 'relative', aspectRatio: '16/5', border: '1px solid rgba(76,25,77,.10)' }}
          sources={['/images/photo2.png', '/images/photo4.png', '/images/photo5.png']}
          objectPosition="center 35%"
          interval={4500}
        />

        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <SectionTitle>Here&rsquo;s what happened when organizers <Italic>used Wonderelo</Italic></SectionTitle>
          <Lede>New friendships, deeper connections and lots of fun</Lede>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {ts.map((t, i) => (
            <div
              key={i}
              className="fx-testimonial-card"
              style={{ background: C.paper, borderRadius: 22, padding: 28, border: '1px solid rgba(76,25,77,.10)', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 280, position: 'relative' }}
            >
              <div className="fx-testimonial-stars" style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2, 3, 4].map((k) => <StarS key={k} size={16} color={C.orange} />)}
              </div>
              <p className="hp-quote" style={{ margin: 0, fontSize: 17, lineHeight: 1.45, color: C.purpleDeep, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: '-0.01em', flex: 1 }}>
                &quot;{t.q}&quot;
              </p>
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(76,25,77,.10)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', flexShrink: 0 }}>{initials(t.a)}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.purpleDeep }}>{t.a}</div>
                  <div style={{ fontSize: 13, color: C.ink, opacity: 0.7, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>{t.e}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured testimonial + cycling photo below the cards */}
        <div className="fx-stagger" style={{ marginTop: 80, display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 24, alignItems: 'stretch' }}>
          <div
            className="fx-testimonial-card hp-quote-dark hp-on-dark"
            style={{ background: C.purpleDeep, color: '#fff', borderRadius: 24, padding: '36px 36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,.08)', position: 'relative', overflow: 'hidden' }}
          >
            <div aria-hidden style={{ position: 'absolute', top: -24, right: -10, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 200, lineHeight: 1, color: 'rgba(255,255,255,.06)' }}>&quot;</div>
            <div className="fx-testimonial-stars" style={{ display: 'flex', gap: 4, position: 'relative' }}>
              {[0, 1, 2, 3, 4].map((k) => <StarS key={k} size={18} color={C.orange} />)}
            </div>
            <p style={{ margin: '20px 0 0', fontSize: 22, lineHeight: 1.35, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: '-0.015em', position: 'relative', color: '#fff' }}>
              &quot;We organized a 200-person company offsite — by the second round, the office was buzzing like a festival. Wonderelo turned awkward small talk into the highlight of our year.&quot;
            </p>
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', flexShrink: 0 }}>KP</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Klára Petrová</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>Head of People · Bright Holding</div>
              </div>
            </div>
          </div>
          <CyclingPhoto
            style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', border: '1px solid rgba(76,25,77,.10)', minHeight: 360 }}
            sources={['/images/photo3.png', '/images/photo4.png', '/images/photo6.png']}
            objectPosition="center 40%"
            interval={4500}
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. TRUSTED BY — real customer/event logos
   ───────────────────────────────────────────────────────────── */
function TrustedBySection() {
  const logos = [
    { src: '/logos/ecommercebridge.svg', alt: 'Ecommerce Bridge', h: 32 },
    { src: '/logos/upterdam.svg', alt: 'Upterdam', h: 14 },
    { src: '/logos/bezcyklenia.png', alt: 'Bez Cyklenia', h: 30 },
    { src: '/logos/blanc-academy.svg', alt: 'Blanc Academy', h: 28 },
    { src: '/logos/web-summit.svg', alt: 'Web Summit', h: 20 },
    { src: '/logos/sxsw.svg', alt: 'SXSW', h: 22 },
    { src: '/logos/slush.svg', alt: 'Slush', h: 20 },
    { src: '/logos/collision.svg', alt: 'Collision', h: 18 },
    { src: '/logos/techcrunch-disrupt.svg', alt: 'TechCrunch Disrupt', h: 30 },
    { src: '/logos/tnw.svg', alt: 'TNW', h: 22 },
    { src: '/logos/ces.svg', alt: 'CES', h: 22 },
    { src: '/logos/founders-summit.svg', alt: 'Founders Summit', h: 28 },
  ];

  return (
    <section style={{ background: C.cream, padding: '100px 60px', borderBottom: '1px solid rgba(76,25,77,.10)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.26em', color: 'rgba(76,25,77,.55)', textTransform: 'uppercase' }}>Trusted by event organizers at</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '40px 48px', marginTop: 48, alignItems: 'center', justifyItems: 'center' }}>
          {logos.map((l) => (
            <img key={l.alt} src={l.src} alt={l.alt} style={{ height: l.h, width: 'auto', maxWidth: 140, objectFit: 'contain', opacity: 0.85 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. BLOG
   ───────────────────────────────────────────────────────────── */
function BlogSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <section style={{ background: C.cream, padding: '140px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 60, gap: 40 }}>
          <div>
            <h2 className="hp-h2" style={{ margin: '16px 0 0', maxWidth: 700, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.035em', color: C.purpleDeep, textWrap: 'balance' } as CSSProperties}>
              Discover the <Italic>magic</Italic> of networking
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            style={{ background: 'transparent', color: C.purpleDeep, border: `1.5px solid ${C.purpleDeep}`, padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}
          >
            All articles <ArrowS />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {BLOG_POSTS.map((p, i) => (
            <article
              key={p.slug}
              className="fx-article-card"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(`/blog/${p.slug}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(`/blog/${p.slug}`); } }}
              style={{ background: C.paper, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(76,25,77,.10)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              <div className="fx-article-img" style={{ aspectRatio: '16/10', background: `linear-gradient(135deg, ${i === 0 ? C.orange : i === 1 ? C.purpleDeep : '#c44a17'}, ${i === 0 ? '#ff8a4a' : i === 1 ? '#7a3d8a' : C.orange})`, position: 'relative', overflow: 'hidden' }}>
                {/* abstract illustration */}
                <div style={{ position: 'absolute', left: '20%', top: '30%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.18)' }} />
                <div style={{ position: 'absolute', right: '15%', bottom: '20%', width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,.22)', transform: 'rotate(20deg)' }} />
                <div style={{ position: 'absolute', left: '55%', top: '55%', width: 30, height: 30, background: 'rgba(255,255,255,.25)', transform: 'rotate(45deg)' }} />
              </div>
              <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: C.orange }}>{p.tag}</span>
                  <span style={{ fontSize: 12, color: 'rgba(76,25,77,.55)' }}>{p.time}</span>
                </div>
                <h3 className="hp-card-title" style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.purpleDeep, textWrap: 'balance' } as CSSProperties}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: C.ink }}>{p.desc}</p>
                <div style={{ marginTop: 'auto', paddingTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: C.orange }}>
                  Read article <span className="fx-article-arrow"><ArrowS size={14} /></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. CTA — bold finale (orange section)
   ───────────────────────────────────────────────────────────── */
function CtaSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="hp-cta hp-on-dark" style={{ background: C.orange, padding: '140px 60px', position: 'relative', overflow: 'hidden', color: '#fff' }}>
      {/* decorative diamonds */}
      <div style={{ position: 'absolute', left: '8%', top: 80, width: 22, height: 22, background: C.purpleDeep, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', left: '20%', bottom: 100, width: 14, height: 14, background: '#fff', transform: 'rotate(45deg)', opacity: 0.4 }} />
      <div style={{ position: 'absolute', right: '10%', top: 120, width: 18, height: 18, background: C.purpleDeep, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', right: '22%', bottom: 80, width: 16, height: 16, background: '#fff', transform: 'rotate(45deg)', opacity: 0.5 }} />
      <div style={{ position: 'absolute', left: '45%', top: 50, width: 10, height: 10, background: '#fff', transform: 'rotate(45deg)', opacity: 0.5 }} />

      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <h2
          className="hp-h2-light hp-on-dark"
          style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 88, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#fff', textWrap: 'balance' } as CSSProperties}
        >
          Ready to make your event <Italic color={C.purpleDeep}>unforgettable?</Italic>
        </h2>
        <p className="hp-lede-light hp-on-dark" style={{ margin: '28px auto 0', maxWidth: 420, fontSize: 19, lineHeight: 1.5, color: 'rgba(255,255,255,.9)' }}>
          Set up your first networking round in 5 minutes. No credit card required
        </p>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: '#fff', color: C.orange, border: 'none',
              padding: '20px 32px', borderRadius: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 17, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
              boxShadow: '0 16px 32px rgba(0,0,0,.15)',
            }}
          >
            Start for free <ArrowS />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   10. LEAD MAGNET — mock shell, real form
   ───────────────────────────────────────────────────────────── */
function LeadMagnetSection({
  leadName, leadEmail, leadEventType, leadParticipantCount, leadSubmitting, leadSubmitted,
  onLeadNameChange, onLeadEmailChange, onLeadEventTypeChange, onLeadParticipantCountChange, onLeadSubmit,
}: {
  leadName: string; leadEmail: string; leadEventType: string; leadParticipantCount: string;
  leadSubmitting: boolean; leadSubmitted: boolean;
  onLeadNameChange: (v: string) => void; onLeadEmailChange: (v: string) => void;
  onLeadEventTypeChange: (v: string) => void; onLeadParticipantCountChange: (v: string) => void;
  onLeadSubmit: (e: FormEvent) => void;
}) {
  const bullets = [
    'How to structure networking sessions',
    'Ice breaker questions that actually work',
    'Timing and group size best practices',
    'Post-event follow-up templates',
  ];

  /* Same box as the mock's placeholder field divs, but on real <input>/<select>
     (the mock ships static divs — the live page needs the working form). */
  const fieldStyle: CSSProperties = {
    width: '100%',
    height: 46,
    border: '1.5px solid rgba(76,25,77,.18)',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: 14,
    color: C.purpleDeep,
    background: C.paper,
    fontFamily: '"Space Grotesk", sans-serif',
    outline: 'none',
  };
  const labelStyle: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: C.purpleDeep, marginBottom: 6 };

  return (
    <section style={{ background: C.cream, padding: '140px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <h2 className="hp-h2" style={{ margin: '16px 0 0', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 52, lineHeight: 1.0, letterSpacing: '-0.035em', color: C.purpleDeep, textWrap: 'balance' } as CSSProperties}>
            The Ultimate Guide to <Italic>Event Networking</Italic>
          </h2>
          <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.55, color: C.ink, maxWidth: 440 }}>
            Learn proven strategies to turn networking from an afterthought into the highlight of your event. Includes templates, timelines, and real examples.
          </p>
          <ul style={{ margin: '32px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: C.purpleDeep, fontWeight: 500 }}>
                <CheckS size={18} /> {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: 28, padding: 40, boxShadow: '0 30px 60px rgba(76,25,77,.12)', border: '1px solid rgba(76,25,77,.08)' }}>
          {leadSubmitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <CheckS size={48} color={C.orange} />
              </div>
              <h3 className="hp-card-title" style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', color: C.purpleDeep }}>Check your inbox!</h3>
              <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: C.ink }}>
                We&rsquo;ve sent the guide to <strong>{leadEmail}</strong>. Enjoy!
              </p>
            </div>
          ) : (
            <form onSubmit={onLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="hp-lead-name">Name</label>
                <input
                  id="hp-lead-name"
                  className="hp-lead-field"
                  type="text"
                  placeholder="Your name"
                  value={leadName}
                  onChange={(e) => onLeadNameChange(e.target.value)}
                  required
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="hp-lead-email">Email</label>
                <input
                  id="hp-lead-email"
                  className="hp-lead-field"
                  type="email"
                  placeholder="you@example.com"
                  value={leadEmail}
                  onChange={(e) => onLeadEmailChange(e.target.value)}
                  required
                  style={fieldStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle} htmlFor="hp-lead-type">Event type</label>
                  <select
                    id="hp-lead-type"
                    className="hp-lead-field"
                    value={leadEventType}
                    onChange={(e) => onLeadEventTypeChange(e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Select</option>
                    <option value="conference">Conference or barcamp</option>
                    <option value="meetup">Community meetup</option>
                    <option value="company">Company event</option>
                    <option value="university">University or school</option>
                    <option value="party">Party or festival</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="hp-lead-count">Participants</label>
                  <select
                    id="hp-lead-count"
                    className="hp-lead-field"
                    value={leadParticipantCount}
                    onChange={(e) => onLeadParticipantCountChange(e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Select</option>
                    <option value="10-30">10–30</option>
                    <option value="30-100">30–100</option>
                    <option value="100-500">100–500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={leadSubmitting || !leadName.trim() || !leadEmail.trim()}
                style={{
                  marginTop: 8, width: '100%',
                  background: C.purpleDeep, color: '#fff', border: 'none',
                  padding: '16px 24px', borderRadius: 12,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: 15, fontWeight: 700,
                  cursor: leadSubmitting ? 'default' : 'pointer',
                  opacity: leadSubmitting || !leadName.trim() || !leadEmail.trim() ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                {leadSubmitting ? 'Sending…' : <>Get the free guide <ArrowS /></>}
              </button>
              <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'rgba(76,25,77,.55)' }}>No spam, ever. We only send useful content.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   11. FOOTER (dark)
   ───────────────────────────────────────────────────────────── */
function FooterSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const cols: Array<{ title: string; links: Array<{ label: string; action: () => void }> }> = [
    {
      title: 'Product',
      links: [
        { label: 'Features', action: () => scrollTo('features') },
        { label: 'How it works', action: () => scrollTo('how-it-works') },
        { label: 'Pricing', action: () => onNavigate('/pricing') },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'Our story', action: () => onNavigate('/our-story') },
        { label: 'Newsroom', action: () => onNavigate('/blog') },
        { label: 'Contact us', action: () => { window.location.href = 'mailto:hello@wonderelo.com'; } },
      ],
    },
    { title: 'Support', links: [{ label: 'Help center', action: () => onNavigate('/help') }] },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of use', action: () => onNavigate('/terms') },
        { label: 'Privacy policy', action: () => onNavigate('/privacy') },
      ],
    },
  ];

  const socials = [
    { label: 'Twitter', href: 'https://twitter.com', path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
    { label: 'YouTube', href: 'https://youtube.com', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { label: 'LinkedIn', href: 'https://linkedin.com', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { label: 'Instagram', href: 'https://instagram.com', path: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z' },
  ];

  const createdInEurope = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik' || tz === 'Atlantic/Faroe' || tz === 'Atlantic/Canary' || tz === 'Atlantic/Madeira' || tz === 'Atlantic/Azores'
        ? ' Created in Europe.'
        : '';
    } catch {
      return '';
    }
  })();

  return (
    <footer className="wn-footer hp-on-dark" style={{ background: C.purpleInk, color: 'rgba(255,255,255,.7)', padding: '80px 60px 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 60, marginBottom: 60 }}>
          <div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onNavigate('/'); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('/'); } }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}
            >
              <img src="/Wonderelo-logo-symbol.png" alt="" style={{ width: 96, height: 96, transform: 'rotate(-6deg)' }} />
              <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>wonderelo</span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 18 }}>{c.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.links.map((l) => (
                  <li
                    key={l.label}
                    className="wn-footer-link"
                    role="button"
                    tabIndex={0}
                    onClick={l.action}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); l.action(); } }}
                    style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', cursor: 'pointer', transition: 'color .2s ease, transform .2s ease', width: 'fit-content' }}
                  >
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="wn-footer-copy" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
            © {new Date().getFullYear()} Wonderelo. All rights reserved.{createdInEurope}
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, color: 'rgba(255,255,255,.6)' }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────
   Props
   ───────────────────────────────────────────────────────────── */
interface HomepageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onResetPassword?: () => void;
  isOrganizerAuthenticated?: boolean;
}

export interface HomepageViewProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onNavigate: (path: string) => void;
  participantCode: string;
  onParticipantCodeChange: (v: string) => void;
  onParticipantJoin: () => void;
  leadName: string;
  leadEmail: string;
  leadEventType: string;
  leadParticipantCount: string;
  leadSubmitting: boolean;
  leadSubmitted: boolean;
  onLeadNameChange: (v: string) => void;
  onLeadEmailChange: (v: string) => void;
  onLeadEventTypeChange: (v: string) => void;
  onLeadParticipantCountChange: (v: string) => void;
  onLeadSubmit: (e: FormEvent) => void;
  /* Legacy carousel props — the redesigned page has no carousels. Kept optional
     so existing call sites (AdminPagePreview) keep compiling untouched. */
  testimonialApi?: unknown;
  testimonialCurrent?: number;
  testimonialCount?: number;
  onSetTestimonialApi?: (api: unknown) => void;
  blogApi?: unknown;
  blogCurrent?: number;
  blogCount?: number;
  onSetBlogApi?: (api: unknown) => void;
}

/* ─────────────────────────────────────────────────────────────
   Container — all pre-existing logic preserved verbatim
   ───────────────────────────────────────────────────────────── */
export function Homepage({ onGetStarted, onSignIn, onResetPassword: _onResetPassword, isOrganizerAuthenticated }: HomepageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [participantCode, setParticipantCode] = useState('');

  // Lead magnet form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadEventType, setLeadEventType] = useState('');
  const [leadParticipantCount, setLeadParticipantCount] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !leadName.trim()) return;

    setLeadSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/public/lead-magnet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: leadEmail.trim(),
          name: leadName.trim(),
          eventType: leadEventType || undefined,
          participantCount: leadParticipantCount || undefined,
        }),
      });

      if (response.ok) {
        setLeadSubmitted(true);
        debugLog('Lead magnet submitted successfully');
      }
    } catch (err) {
      debugLog('Error submitting lead magnet:', err);
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Check authentication and redirect logic
  useEffect(() => {
    const allowBrowsing = sessionStorage.getItem('allow_participant_browsing');
    const token = localStorage.getItem('participant_token');

    debugLog('🔍 Homepage useEffect triggered');
    debugLog('  - isOrganizerAuthenticated:', isOrganizerAuthenticated);
    debugLog('  - allowBrowsing:', allowBrowsing);
    debugLog('  - participantToken:', token);

    // Priority 1: Redirect authenticated organizer to dashboard
    if (isOrganizerAuthenticated) {
      debugLog('🔄 Organizer authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Priority 2: Allow participant browsing
    if (allowBrowsing === 'true') {
      sessionStorage.removeItem('allow_participant_browsing');
      debugLog('✅ Participant is browsing events - no redirect');
      return;
    }

    // Priority 3: Redirect participant to their dashboard
    if (token) {
      debugLog('🔄 Participant token found, redirecting to dashboard:', token);
      navigate(`/p/${token}`, { replace: true });
      return;
    }

    debugLog('ℹ️  No authentication - showing public homepage');
  }, [navigate, location, isOrganizerAuthenticated]);

  return (
    <HomepageView
      onGetStarted={onGetStarted}
      onSignIn={onSignIn}
      onNavigate={(path) => navigate(path)}
      participantCode={participantCode}
      onParticipantCodeChange={setParticipantCode}
      onParticipantJoin={() => {
        if (participantCode.trim()) {
          const cleanCode = participantCode.trim().toLowerCase();
          navigate(`/${cleanCode}`);
        }
      }}
      leadName={leadName}
      leadEmail={leadEmail}
      leadEventType={leadEventType}
      leadParticipantCount={leadParticipantCount}
      leadSubmitting={leadSubmitting}
      leadSubmitted={leadSubmitted}
      onLeadNameChange={setLeadName}
      onLeadEmailChange={setLeadEmail}
      onLeadEventTypeChange={setLeadEventType}
      onLeadParticipantCountChange={setLeadParticipantCount}
      onLeadSubmit={handleLeadSubmit}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   View — FullHomepage from the mock's app.js
   ───────────────────────────────────────────────────────────── */
export function HomepageView({
  onGetStarted,
  onSignIn,
  onNavigate,
  participantCode,
  onParticipantCodeChange,
  onParticipantJoin,
  leadName,
  leadEmail,
  leadEventType,
  leadParticipantCount,
  leadSubmitting,
  leadSubmitted,
  onLeadNameChange,
  onLeadEmailChange,
  onLeadEventTypeChange,
  onLeadParticipantCountChange,
  onLeadSubmit,
}: HomepageViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useHomepageFx(rootRef);

  // `font-family` mirrors the mock's `body { font-family: "Space Grotesk" }` — the
  // scoped CSS puts that on `.wonderelo .home-page`, a descendant selector that
  // can't match this root because both classes sit on the same element.
  return (
    <div className="wonderelo w-public home-page" ref={rootRef} style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <div style={{ width: '100%', background: C.cream }}>
        {/* Sticky top nav — sits above the hero and stays pinned while scrolling */}
        <Nav onGetStarted={onGetStarted} onSignIn={onSignIn} onNavigate={onNavigate} logoSize={120} />

        {/* Hero — responsive, manages its own height */}
        <Hero
          onGetStarted={onGetStarted}
          onSecondary={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          participantCode={participantCode}
          onParticipantCodeChange={onParticipantCodeChange}
          onParticipantJoin={onParticipantJoin}
        />

        {/* Everything below the hero */}
        <div style={{ width: '100%', fontFamily: '"Space Grotesk", sans-serif', background: C.cream }}>
          <ProblemSection />
          <HowItWorksSection onGetStarted={onGetStarted} />
          <WhoIsItForSection onNavigate={onNavigate} />
          <FeaturesSection />
          <TestimonialsSection />
          <TrustedBySection />
          <BlogSection onNavigate={onNavigate} />
          <CtaSection onGetStarted={onGetStarted} />
          <LeadMagnetSection
            leadName={leadName}
            leadEmail={leadEmail}
            leadEventType={leadEventType}
            leadParticipantCount={leadParticipantCount}
            leadSubmitting={leadSubmitting}
            leadSubmitted={leadSubmitted}
            onLeadNameChange={onLeadNameChange}
            onLeadEmailChange={onLeadEmailChange}
            onLeadEventTypeChange={onLeadEventTypeChange}
            onLeadParticipantCountChange={onLeadParticipantCountChange}
            onLeadSubmit={onLeadSubmit}
          />
          <FooterSection onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
