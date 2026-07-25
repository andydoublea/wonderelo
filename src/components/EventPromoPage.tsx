import { useState, useEffect, useRef } from 'react';
import { NetworkingSession } from '../App';
import { errorLog } from '../utils/debug';
import { C, Italic, Diamond, Logo } from './redesign/organizerAtoms';

interface EventPromoPageProps {
  eventSlug: string;
  sessions: NetworkingSession[];
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
  displaySlug?: string;
  onBack?: () => void;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface EventPromoPageViewProps {
  eventSlug: string;
  qrCodeUrl: string;
  displayName: string;
  publishedSessions: NetworkingSession[];
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
  displaySlug?: string;
  onBack?: () => void;
}

// Fixed stage dimensions — this slide is projected at the venue and scaled to fit.
const STAGE_W = 1920;
const STAGE_H = 1080;

// The slide cycles through the 3 "how it works" steps, one every 5s.
const STEP_DURATION_MS = 5000;

// The 3 universal product steps. Headline + eyebrow + lede change per step;
// the mini-list on the left stays constant and only highlights the active step.
const STEPS = [
  {
    n: '01',
    tag: 'pick a time',
    title: 'Pick a time to meet',
    desc: 'SMS reminds you 5 min before start.',
    head: (<>Pick a <Italic color={C.orangeBright}>time</Italic><br />to meet.</>),
    lede: (<>Choose a slot that suits you — we&apos;ll text a reminder <strong style={{ color: '#fff', fontWeight: 600 }}>5 minutes</strong> before it starts.</>),
  },
  {
    n: '02',
    tag: 'find your match',
    title: 'Find your meeting match',
    desc: 'Look for the Wonderimage on your screen.',
    head: (<>Spot your<br /><Italic color={C.orangeBright}>match</Italic> in the<br />crowd.</>),
    lede: (<>A unique <strong style={{ color: '#fff', fontWeight: 600 }}>Wonderimage™</strong> on your phone helps you find each other — no awkward &quot;are you Anna?&quot;</>),
  },
  {
    n: '03',
    tag: 'connect',
    title: 'Talk & exchange contacts',
    desc: 'Only if both of you agree.',
    head: (<>Talk, then<br /><Italic color={C.orangeBright}>exchange</Italic><br />contacts.</>),
    lede: (<>Swap details only if you <strong style={{ color: '#fff', fontWeight: 600 }}>both agree</strong> — new connections live in your Wonderelo profile.</>),
  },
];

export function EventPromoPageView({
  eventSlug,
  qrCodeUrl,
  displayName,
  publishedSessions,
  displaySlug,
  onBack,
}: EventPromoPageViewProps) {
  // Scale the fixed 1920×1080 stage to fit whatever container we're rendered in.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // Fall back to a width-derived height when the container is unbounded.
      const usableH = h > 0 ? h : (w * STAGE_H) / STAGE_W;
      const k = Math.min(w / STAGE_W, usableH / STAGE_H);
      if (k > 0 && Number.isFinite(k)) setScale(k);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Auto-cycle the active step every STEP_DURATION_MS (starts on step 02).
  const [activeStep, setActiveStep] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), STEP_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  const step = STEPS[activeStep];
  const slug = displaySlug || eventSlug;
  const host = (typeof window !== 'undefined' && window.location?.host)
    ? window.location.host.replace(/^www\./, '')
    : 'wonderelo.com';
  const roundCount = publishedSessions.length;

  return (
    <div
      ref={wrapRef}
      className="wonderelo"
      style={{
        width: '100%', height: '100%', minHeight: '100dvh',
        background: C.purpleInk, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Keyframes for the active step's progress fill */}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes wPromoFill{from{width:0}to{width:100%}}' }} />

      {/* Fixed 1920×1080 stage, scaled to fit */}
      <div style={{
        width: STAGE_W, height: STAGE_H, flexShrink: 0,
        transform: `scale(${scale})`, transformOrigin: 'center',
        background: C.purpleDeep, color: '#fff', fontFamily: C.fontBody,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative diamonds */}
        <Diamond size={28} color={C.orange} style={{ position: 'absolute', left: '8%', top: '12%' }} />
        <Diamond size={18} color="rgba(255,255,255,.35)" style={{ position: 'absolute', right: '24%', top: '8%' }} />
        <Diamond size={36} color="rgba(255,255,255,.08)" style={{ position: 'absolute', left: '20%', bottom: '14%' }} />
        <Diamond size={22} color={C.orangeBright} style={{ position: 'absolute', right: '8%', bottom: '20%' }} />

        {/* Big italic backdrop word */}
        <span style={{
          position: 'absolute', left: -80, bottom: -260,
          fontFamily: C.fontSerif, fontStyle: 'italic',
          fontSize: 880, color: 'rgba(255,255,255,.04)',
          lineHeight: 1, pointerEvents: 'none', letterSpacing: '-0.04em',
        }}>meet</span>

        {/* Top bar */}
        <div style={{
          padding: '40px 64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo size={42} dark />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '14px 22px', borderRadius: 999,
            background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)',
            fontFamily: C.fontMono, fontSize: 18, fontWeight: 600,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 4px rgba(74,222,128,.18)' }} />
            <strong style={{ color: '#fff', fontWeight: 700, fontFamily: C.fontDisplay, letterSpacing: '-0.01em' }}>{displayName}</strong>
            {roundCount > 0 && (
              <span style={{ color: C.orangeBright, fontWeight: 700 }}>
                · {roundCount} round{roundCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {/* Big body — split layout */}
        <div style={{
          padding: '40px 80px 0',
          display: 'grid', gridTemplateColumns: '1.1fr 1fr',
          gap: 96, alignItems: 'start',
        }}>

          {/* Left — copy + steps */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              padding: '10px 18px', borderRadius: 999,
              background: 'rgba(221,83,28,.18)', color: C.orangeBright,
              fontSize: 16, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
            }}>
              <Diamond size={9} color={C.orangeBright} /> Step {step.n} · {step.tag}
            </div>

            <h1 style={{
              margin: '34px 0 0', fontFamily: C.fontDisplay, fontWeight: 800,
              fontSize: 160, lineHeight: 0.92, letterSpacing: '-0.04em',
              color: '#fff', textWrap: 'balance', minHeight: 440,
            }}>
              {step.head}
            </h1>

            <p style={{
              margin: '40px 0 0', maxWidth: 720,
              fontSize: 30, lineHeight: 1.4, color: 'rgba(255,255,255,.78)',
            }}>
              {step.lede}
            </p>

            {/* Step pager */}
            <div style={{ marginTop: 64, display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 18, color: 'rgba(255,255,255,.55)', letterSpacing: '.04em', minWidth: 70 }}>{step.n} / 0{STEPS.length}</span>
              <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 360 }}>
                {STEPS.map((s, i) => (
                  <div key={s.n} style={{
                    flex: 1, height: 5, borderRadius: 3, position: 'relative', overflow: 'hidden',
                    background: i === activeStep ? C.orangeBright : 'rgba(255,255,255,.20)',
                  }}>
                    {i === activeStep && (
                      <div
                        key={activeStep}
                        style={{
                          position: 'absolute', inset: 0, background: '#fff',
                          animation: `wPromoFill ${STEP_DURATION_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps mini-list */}
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 660 }}>
              {STEPS.map((s, i) => {
                const on = i === activeStep;
                return (
                  <div key={s.n} style={{
                    display: 'flex', alignItems: 'center', gap: 22,
                    padding: '14px 18px', borderRadius: 16,
                    background: on ? 'rgba(255,255,255,.10)' : 'transparent',
                    border: on ? '1px solid rgba(255,255,255,.20)' : '1px solid transparent',
                    transition: 'background .3s, border-color .3s',
                  }}>
                    <span style={{
                      fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28,
                      color: on ? C.orangeBright : 'rgba(255,255,255,.35)',
                      letterSpacing: '-0.025em', minWidth: 48,
                    }}>{s.n}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 22, color: on ? '#fff' : 'rgba(255,255,255,.5)', letterSpacing: '-0.015em' }}>{s.title}</div>
                      <div style={{ marginTop: 4, fontSize: 16, color: on ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)' }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — phone with the Wonderimage example */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            {/* "Wonderimage" sample — a big colorful tile */}
            <div style={{
              width: 460, aspectRatio: '3/4', borderRadius: 36,
              background: `linear-gradient(140deg, ${C.orange} 0%, ${C.orangeBright} 100%)`,
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,.40)',
              border: '3px solid rgba(255,255,255,.20)',
            }}>
              <svg width="100%" height="100%" viewBox="0 0 100 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                <polygon points="0,0 40,0 0,40" fill="rgba(255,255,255,.20)" />
                <polygon points="100,130 60,130 100,90" fill="rgba(0,0,0,.18)" />
                <circle cx="80" cy="28" r="14" fill="rgba(255,255,255,.22)" />
                <polygon points="50,60 75,100 25,100" fill="rgba(255,255,255,.16)" />
                <rect x="10" y="92" width="38" height="8" rx="4" fill="rgba(0,0,0,.20)" />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 280,
                color: '#fff', letterSpacing: '-0.04em',
                textShadow: '0 8px 24px rgba(0,0,0,.25)',
              }}>07</div>

              {/* Caption strip */}
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: '16px 24px',
                background: 'rgba(0,0,0,.30)', backdropFilter: 'blur(6px)',
                borderTop: '1px solid rgba(255,255,255,.18)',
                fontFamily: C.fontDisplay, fontWeight: 700, color: '#fff', fontSize: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                letterSpacing: '-0.02em',
              }}>
                <span>Anna</span>
                <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.cream, fontWeight: 400, fontSize: 24 }}>Coffee bar · A</span>
              </div>
            </div>

            {/* Mini partner card floating beside */}
            <div style={{
              position: 'absolute', right: -8, bottom: 60, width: 240,
              padding: '16px 18px', borderRadius: 20,
              background: '#fff', color: C.purpleDeep,
              boxShadow: '0 20px 50px rgba(0,0,0,.35)',
              border: `2px solid ${C.orangeBright}`,
              transform: 'rotate(3deg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(140deg, ${C.purpleDeep}, ${C.purple})`, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22,
                }}>38</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .7, textTransform: 'uppercase' }}>Your match</div>
                  <div style={{ marginTop: 2, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>Marek</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '6px 10px', borderRadius: 7, background: 'rgba(34,197,94,.12)', color: '#1f7a40', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} /> Already at the spot
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-right · QR + URL (real QR + real slug) */}
        <div style={{
          position: 'absolute', bottom: 48, right: 64,
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '20px 24px',
          background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)',
          borderRadius: 22,
        }}>
          <div style={{
            width: 140, height: 140, borderRadius: 12, background: '#fff',
            padding: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Event QR code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 11, color: C.purpleDeep, fontFamily: C.fontMono, textAlign: 'center' }}>Generating QR…</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: C.orangeBright }}>Scan to join</div>
            <div style={{ marginTop: 10, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: '#fff' }}>
              {host}<br /><span style={{ color: 'rgba(255,255,255,.5)', fontFamily: C.fontMono, fontWeight: 400, fontSize: 30 }}>/</span><span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.orangeBright, fontWeight: 400 }}>{slug}</span>
            </div>
          </div>
        </div>

        {/* Subtle back affordance — preserves the onBack prop; hidden on the projected slide otherwise */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute', left: 64, bottom: 48,
              padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)',
              color: 'rgba(255,255,255,.75)', fontFamily: C.fontBody, fontSize: 14, fontWeight: 600,
            }}
          >
            ← Back to dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export function EventPromoPage({ eventSlug, sessions, organizerName, eventName, profileImageUrl, displaySlug, onBack }: EventPromoPageProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const publicUrl = `${window.location.origin}/${eventSlug}`;

  useEffect(() => {
    generateQRCode();
  }, [eventSlug]);

  const generateQRCode = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      errorLog('Error generating QR code:', error);
    }
  };

  const displayName = eventName || organizerName || eventSlug;
  const publishedSessions = sessions.filter(s => s.status === 'published');

  return (
    <EventPromoPageView
      eventSlug={eventSlug}
      qrCodeUrl={qrCodeUrl}
      displayName={displayName}
      publishedSessions={publishedSessions}
      organizerName={organizerName}
      eventName={eventName}
      profileImageUrl={profileImageUrl}
      displaySlug={displaySlug}
      onBack={onBack}
    />
  );
}
