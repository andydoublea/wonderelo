import { NetworkingSession } from '../App';
import {
  Copy, QrCode, ArrowLeft, ArrowRight, AlertTriangle, Presentation, Check,
  ExternalLink, Calendar,
} from 'lucide-react';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { SessionDisplayCard } from './SessionDisplayCard';
import { C, Italic, Btn } from './redesign/organizerAtoms';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

const GREEN = '#1f8a5b';

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface SessionSuccessViewProps {
  session: NetworkingSession;
  eventUrl: string;
  presenterSlideUrl: string;
  blogPostUrl: string;
  copied: boolean;
  onCopyUrl: () => void;
  onDownloadQR: () => void;
  onOpenPresenterSlide: () => void;
  onBack: () => void;
  // Optional extras — wired by the container, omitted by the admin preview.
  eventName?: string;
  qrDataUrl?: string;
  onCreateAnother?: () => void;
  onScheduleRound?: () => void;
}

// Derive a human-ish event name from the event-page URL slug when the caller
// doesn't provide one (e.g. the admin preview): last path segment, hyphens → spaces.
function deriveEventName(url: string): string {
  try {
    const seg = url.replace(/^https?:\/\//, '').split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() || '';
    const name = seg.replace(/[-_]+/g, ' ').trim();
    return name || 'Your event';
  } catch {
    return 'Your event';
  }
}

export function SessionSuccessView({
  session,
  eventUrl,
  blogPostUrl,
  copied,
  onCopyUrl,
  onDownloadQR,
  onOpenPresenterSlide,
  onBack,
  eventName,
  qrDataUrl,
  onCreateAnother,
  onScheduleRound,
}: SessionSuccessViewProps) {
  const isDraft = session.status === 'draft';
  const displayEvent = eventName || deriveEventName(eventUrl);
  const urlLabel = eventUrl.replace(/^https?:\/\//, '');

  // Decorative QR motif — only used as a fallback when no real QR is supplied.
  const qrMotif = useMemo(() => {
    const n = 21; const cells: boolean[] = [];
    let s = 1337; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c > n - 8) || (r > n - 8 && c < 7);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (finder(r, c)) {
        const rr = r < 7 ? r : r - (n - 7), cc = c < 7 ? c : c - (n - 7);
        const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        cells.push(ring || core);
      } else cells.push(rnd() > 0.56);
    }
    return { n, cells };
  }, []);

  // Static confetti scatter — base state reads even when entrance animation is stripped.
  const confettiScatter = [
    { l: '8%',  t: 38,  c: C.orange,       s: 13, r: 18 },  { l: '17%', t: 96,  c: C.purple,       s: 9,  r: -12 },
    { l: '26%', t: 20,  c: C.orangeBright, s: 10, r: 30 },  { l: '40%', t: 120, c: GREEN,          s: 8,  r: 8 },
    { l: '60%', t: 118, c: C.orange,       s: 9,  r: -20 }, { l: '74%', t: 24,  c: GREEN,          s: 11, r: 14 },
    { l: '83%', t: 92,  c: C.purple,       s: 9,  r: 22 },  { l: '92%', t: 44,  c: C.orangeBright, s: 13, r: -8 },
    { l: '50%', t: 8,   c: C.orange,       s: 8,  r: 0 },   { l: '34%', t: 70,  c: C.purple,       s: 7,  r: -24 },
    { l: '66%', t: 64,  c: C.orangeBright, s: 8,  r: 16 },
  ];

  const ShareBtn = ({ icon, children, onClick, active }: {
    icon: ReactNode; children: ReactNode; onClick?: () => void; active?: boolean;
  }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
      padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
      fontFamily: C.fontBody, fontSize: 14, fontWeight: 600,
      background: active ? 'rgba(31,138,91,.10)' : '#fff',
      border: `1.5px solid ${active ? 'rgba(31,138,91,.4)' : C.hairStrong}`,
      color: active ? GREEN : C.purpleDeep,
    }}>
      {icon}{children}
    </button>
  );

  return (
    <div className="wonderelo" style={{ fontFamily: C.fontBody, color: C.ink }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* ── Celebration header ── */}
        <div style={{ position: 'relative', textAlign: 'center', paddingTop: 18 }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: '0 -40px', pointerEvents: 'none' }}>
            {confettiScatter.map((d, i) => (
              <i key={i} style={{ position: 'absolute', left: d.l, top: d.t, width: d.s, height: d.s, background: d.c, transform: `rotate(45deg)`, opacity: .9, borderRadius: 1 }} />
            ))}
          </div>

          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 34px rgba(31,138,91,.34)' }}>
            <Check size={42} strokeWidth={3} color="#fff" />
          </div>

          <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
            <span style={{ width: 22, height: 1, background: C.orange }} />{displayEvent}<span style={{ width: 22, height: 1, background: C.orange }} />
          </div>
          <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 46, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.purpleDeep }}>
            Round created <Italic>successfully.</Italic>
          </h1>
          <p style={{ margin: '14px auto 0', maxWidth: 440, fontSize: 15.5, lineHeight: 1.55, color: C.ink, opacity: .8 }}>
            {isDraft
              ? 'Your round is saved as a draft. Schedule it to make it visible on your event page.'
              : `${session.name} is live on your event page. Share it to start filling those rounds.`}
          </p>
        </div>

        {/* ── Created round card (real brand card, real session data) ── */}
        <div style={{ marginTop: 34 }}>
          <SessionDisplayCard
            session={session}
            adminMode={true}
            variant="default"
          />
        </div>

        {/* ── Draft notice OR share card ── */}
        {isDraft ? (
          <div style={{ marginTop: 18, display: 'flex', gap: 14, alignItems: 'flex-start', padding: '20px 22px', borderRadius: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.30)' }}>
            <span style={{ color: '#d98a0b', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><AlertTriangle size={22} /></span>
            <div>
              <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 16, color: C.purpleDeep }}>This round is in draft mode</div>
              <p style={{ margin: '5px 0 14px', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .75 }}>Participants can’t see or register for it yet. Schedule it to publish it on your event page.</p>
              <span onClick={onScheduleRound} style={{ display: 'inline-flex' }}>
                <Btn variant="primary" leadingIcon={<Calendar size={15} />}>Schedule round</Btn>
              </span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 26, boxShadow: '0 10px 26px rgba(75,29,81,.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
              {/* QR — real code when available, decorative motif otherwise */}
              <div style={{ width: 132, padding: 12, borderRadius: 14, background: C.cream, border: `1px solid ${C.hair}` }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Event page QR code" style={{ width: '100%', display: 'block', borderRadius: 4 }} />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${qrMotif.n}, 1fr)`, gap: 1, aspectRatio: '1 / 1' }}>
                    {qrMotif.cells.map((on, i) => <span key={i} style={{ background: on ? C.purpleInk : 'transparent', borderRadius: .5 }} />)}
                  </div>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep }}>Share your event</h3>
                <p style={{ margin: '6px 0 14px', fontSize: 13.5, lineHeight: 1.5, color: C.ink, opacity: .72 }}>Your round is live — promote it to get participants registered.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: C.cream, border: `1px solid ${C.hairStrong}` }}>
                  <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex', flexShrink: 0 }}><ExternalLink size={15} /></span>
                  <code style={{ flex: 1, fontFamily: C.fontMono, fontSize: 13, color: C.purpleDeep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urlLabel}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
              <ShareBtn icon={copied ? <Check size={16} /> : <Copy size={16} />} active={copied} onClick={onCopyUrl}>{copied ? 'Copied!' : 'Copy URL'}</ShareBtn>
              <ShareBtn icon={<QrCode size={16} />} onClick={onDownloadQR}>QR code</ShareBtn>
              <ShareBtn icon={<Presentation size={16} />} onClick={onOpenPresenterSlide}>Promo slide</ShareBtn>
            </div>

            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <a href={blogPostUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.orange, textDecoration: 'none', cursor: 'pointer' }}>
                How to promote your event <ArrowRight size={13} />
              </a>
            </div>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
          <span onClick={onBack} style={{ display: 'inline-flex' }}>
            <Btn variant="ghost" leadingIcon={<ArrowLeft size={15} />}>Back to rounds</Btn>
          </span>
          <span onClick={onCreateAnother} style={{ display: 'inline-flex' }}>
            <Btn variant="secondary" trailingIcon={<ArrowRight size={14} />}>Create another round</Btn>
          </span>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

interface SessionSuccessPageProps {
  session: NetworkingSession;
  eventSlug: string;
  onBack: () => void;
  onGoToDashboard?: () => void;
  onManageParticipants?: () => void;
}

export function SessionSuccessPage({
  session,
  eventSlug,
  onBack,
  onManageParticipants,
}: SessionSuccessPageProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const eventUrl = `${window.location.origin}/${eventSlug}`;
  const presenterSlideUrl = `${window.location.origin}/event-promo`;
  const blogPostUrl = 'https://wonderelo.com/blog/how-to-promote-event';
  const eventName = eventSlug ? eventSlug.replace(/[-_]+/g, ' ').trim() : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Generate a real, scannable QR for the event page (shown inside the share card).
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(eventUrl, { width: 300, margin: 1, color: { dark: '#2d1133', light: '#00000000' } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { /* fall back to the decorative motif */ });
    return () => { cancelled = true; };
  }, [eventUrl]);

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#dd531c', '#ff6a2a', '#5C2277', '#1f8a5b', '#f5b301'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#dd531c', '#ff6a2a', '#5C2277', '#1f8a5b', '#f5b301'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success('Event URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const handleDownloadQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(eventUrl, {
        width: 600,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      const link = document.createElement('a');
      link.download = `qr-${eventSlug}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('QR code downloaded!');
    } catch (err) {
      toast.error('Failed to download QR code');
    }
  };

  return (
    <SessionSuccessView
      session={session}
      eventUrl={eventUrl}
      presenterSlideUrl={presenterSlideUrl}
      blogPostUrl={blogPostUrl}
      copied={copied}
      onCopyUrl={handleCopyUrl}
      onDownloadQR={handleDownloadQR}
      onOpenPresenterSlide={() => window.open(presenterSlideUrl, '_blank')}
      onBack={onBack}
      eventName={eventName}
      qrDataUrl={qrDataUrl || undefined}
      onCreateAnother={() => navigate('/rounds/new')}
      onScheduleRound={onManageParticipants || onBack}
    />
  );
}
