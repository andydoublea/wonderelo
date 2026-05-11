import { useState, useEffect, useRef, useCallback } from 'react';
import { errorLog } from '../utils/debug';
import './event-promo.css';

interface EventPromoPageProps {
  eventSlug: string;
  displaySlug?: string;
  onBack?: () => void;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface EventPromoPageViewProps {
  eventSlug: string;
  qrCodeUrl: string;
  displaySlug?: string;
  onBack?: () => void;
}

interface PromoStep {
  num: string;
  title: string;
  desc: string;
  imgSrc: string;
  imgAlt: string;
  artKey?: string; // optional data-art for image positioning
}

const PROMO_STEPS: PromoStep[] = [
  {
    num: '01',
    title: 'Pick a time to meet',
    desc: 'SMS reminds you 5 minutes before start',
    imgSrc: '/Hand-with-phone.png',
    imgAlt: '',
  },
  {
    num: '02',
    title: 'Find your meeting match',
    desc: 'A unique Wonderimage™ helps you spot each other in the crowd',
    imgSrc: '/Wonderelo-step4.png',
    imgAlt: '',
    artKey: 'meet',
  },
  {
    num: '03',
    title: 'Talk & exchange contacts',
    desc: 'Only if both parties agree',
    imgSrc: '/Wonderelo-hero-section-networking-rounds.svg',
    imgAlt: '',
  },
];

const STEP_DURATION_MS = 5000;
const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

export function EventPromoPageView({
  qrCodeUrl,
  eventSlug,
  displaySlug,
  onBack,
}: EventPromoPageViewProps) {
  const [active, setActive] = useState(0);
  const stageHostRef = useRef<HTMLDivElement | null>(null);
  const stageCanvasRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Cycling — restart timer whenever active changes (so manual click resets the clock)
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setActive(prev => (prev + 1) % PROMO_STEPS.length);
    }, STEP_DURATION_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [active]);

  // Auto-scale 1920x1080 stage to fit its host container
  useEffect(() => {
    const host = stageHostRef.current;
    const canvas = stageCanvasRef.current;
    if (!host || !canvas) return;

    const fit = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const sx = w / STAGE_WIDTH;
      const sy = h / STAGE_HEIGHT;
      const s = Math.min(sx, sy);
      const tx = (w - STAGE_WIDTH * s) / 2;
      const ty = (h - STAGE_HEIGHT * s) / 2;
      canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  const handleStepClick = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  const hashtag = `wonderelo.com/${displaySlug || eventSlug}`;

  return (
    <div className="ep-stage-host" ref={stageHostRef}>
      <div className="ep-stage-canvas" ref={stageCanvasRef}>
        <div className="ep-page">
          {/* HEADER */}
          <header className="ep-header">
            <div className="ep-lockup">
              <div className="ep-mark">
                <img src="/Wonderelo-logo-symbol.png" alt="" />
              </div>
              <div className="ep-word">wonderelo</div>
            </div>
            <div className="ep-header-right">
              {onBack && (
                <button type="button" className="ep-header-link" onClick={onBack}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M11 5l-7 7 7 7" />
                  </svg>
                  Back to dashboard
                </button>
              )}
            </div>
          </header>

          {/* MAIN */}
          <main className="ep-main">
            {/* LEFT: headline + QR */}
            <section className="ep-left-col">
              <h1 className="ep-heading" style={{ width: 750 }}>
                Break your bubble,<br />
                <em>meet</em> new people
              </h1>

              <div className="ep-qr-block">
                <div className="ep-qr-title-row">
                  <div className="ep-qr-title">Scan to join</div>
                  <div className="ep-qr-hashtag">{hashtag}</div>
                </div>
                <div className="ep-qr-thumb" aria-label="Scan to join">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Event QR Code" />
                  ) : null}
                </div>
              </div>
            </section>

            <div className="ep-col-divider" aria-hidden="true" />

            {/* RIGHT: numbered steps */}
            <section className="ep-right-col">
              <ol className="ep-steps">
                {PROMO_STEPS.map((step, idx) => {
                  const isActive = idx === active;
                  const isDone = idx < active;
                  const classes = [
                    'ep-step',
                    isActive ? 'ep-is-active' : '',
                    isDone ? 'ep-is-done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        className={classes}
                        data-art={step.artKey}
                        onClick={() => handleStepClick(idx)}
                      >
                        <div className="ep-num">{step.num}</div>
                        <div className="ep-title">{step.title}</div>
                        <div className="ep-desc">{step.desc}</div>
                        <div className="ep-step-art" aria-hidden="true">
                          <img src={step.imgSrc} alt={step.imgAlt} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export function EventPromoPage({ eventSlug, displaySlug, onBack }: EventPromoPageProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const publicUrl = `${window.location.origin}/${eventSlug}`;

  useEffect(() => {
    generateQRCode();
  }, [eventSlug]);

  const generateQRCode = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      // Match the design: white modules on purple-ink background.
      // The QR thumb container also has #2D1133 background, so the QR's
      // light color blends with the surrounding "frame" naturally.
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 560,
        margin: 1,
        color: {
          dark: '#FFFFFF',
          light: '#2D1133',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      errorLog('Error generating QR code:', error);
    }
  };

  return (
    <EventPromoPageView
      eventSlug={eventSlug}
      qrCodeUrl={qrCodeUrl}
      displaySlug={displaySlug}
      onBack={onBack}
    />
  );
}
