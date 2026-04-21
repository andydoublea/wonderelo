import { NetworkingSession } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { CheckCircle, Copy, QrCode, ArrowLeft, AlertTriangle, Presentation, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { SessionDisplayCard } from './SessionDisplayCard';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface SessionSuccessPageProps {
  session: NetworkingSession;
  eventSlug: string;
  onBack: () => void;
  onGoToDashboard?: () => void;
  onManageParticipants?: () => void;
}

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
}

export function SessionSuccessView({
  session,
  eventUrl,
  presenterSlideUrl,
  blogPostUrl,
  copied,
  onCopyUrl,
  onDownloadQR,
  onOpenPresenterSlide,
  onBack,
}: SessionSuccessViewProps) {
  const isDraft = session.status === 'draft';

  return (
    <div className="pt-[32px] pr-[24px] pb-[24px] pl-[33px] space-y-8">
      <div className="text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2>Round created successfully!</h2>
        </div>

        <div className="flex justify-center">
          <div className="w-full md:w-1/2 xl:w-1/3">
            <SessionDisplayCard
              session={session}
              adminMode={true}
              variant="default"
            />
          </div>
        </div>

        {isDraft && (
          <div className="flex justify-center">
            <div className="w-full md:w-1/2 xl:w-1/3">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground">Round is in draft mode — schedule it to make it visible on your event page</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isDraft && (
          <div className="flex justify-center">
            <div className="w-full md:w-1/2 xl:w-1/3">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Share your event with participants</h3>
                    <p className="text-sm text-muted-foreground">Your round is live! Promote it to get participants registered.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your event page URL</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm break-all">{eventUrl}</code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={onCopyUrl} className="flex items-center justify-center gap-2 w-full">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy URL'}
                    </Button>
                    <Button variant="outline" onClick={onDownloadQR} className="flex items-center justify-center gap-2 w-full">
                      <QrCode className="h-4 w-4" />
                      Download QR code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onOpenPresenterSlide}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      <Presentation className="h-4 w-4" />
                      Open Promo Slide
                    </Button>
                  </div>

                  <div className="text-center">
                    <a
                      href={blogPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      How to promote your event →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to rounds
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

export function SessionSuccessPage({
  session,
  eventSlug,
  onBack,
}: SessionSuccessPageProps) {
  const [copied, setCopied] = useState(false);

  const eventUrl = `${window.location.origin}/${eventSlug}`;
  const presenterSlideUrl = `${window.location.origin}/event-promo`;
  const blogPostUrl = 'https://wonderelo.com/blog/how-to-promote-event';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ff6b35', '#ffd700', '#ff4500', '#32cd32', '#1e90ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ff6b35', '#ffd700', '#ff4500', '#32cd32', '#1e90ff'],
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
    />
  );
}
