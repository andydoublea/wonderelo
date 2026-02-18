import { NetworkingSession } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Copy, QrCode, ArrowLeft, AlertTriangle, ExternalLink, Presentation, BookOpen, LayoutDashboard, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { SessionDisplayCard } from './SessionDisplayCard';
import { debugLog } from '../utils/debug';
import QRCode from 'qrcode';

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
  onGoToDashboard,
  onManageParticipants
}: SessionSuccessPageProps) {
  const isDraft = session.status === 'draft';
  const isPublished = session.status === 'published';
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const eventUrl = `${window.location.origin}/${eventSlug}`;
  const presenterSlideUrl = `${window.location.origin}/promo/${eventSlug}`;
  const blogPostUrl = 'https://wonderelo.com/blog/how-to-promote-event'; // placeholder

  // Generate QR code on mount
  useEffect(() => {
    if (qrCanvasRef.current && eventUrl) {
      QRCode.toCanvas(qrCanvasRef.current, eventUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [eventUrl]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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
    <div className="pt-[32px] pr-[24px] pb-[24px] pl-[33px] space-y-8">
      <div className="text-center space-y-8">
        {/* Success Icon and Message */}
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2>Round created successfully!</h2>
        </div>

        {/* Session Details */}
        <div className="flex justify-center">
          <div className="w-full md:w-1/2 xl:w-1/3">
            <SessionDisplayCard
              session={session}
              adminMode={true}
              variant="default"
            />
          </div>
        </div>

        {/* Draft Warning */}
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

        {/* Published: Share your event section */}
        {!isDraft && (
          <div className="flex justify-center">
            <div className="w-full md:w-2/3 xl:w-1/2">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Share your event with participants</h3>
                    <p className="text-sm text-muted-foreground">Your round is live! Promote it to get participants registered.</p>
                  </div>

                  {/* Event URL */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your event page URL</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm break-all">{eventUrl}</code>
                      <Button variant="outline" size="sm" onClick={handleCopyUrl} className="shrink-0">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <canvas ref={qrCanvasRef} className="rounded-lg" />
                    <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Download QR code
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open(presenterSlideUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Presentation className="h-4 w-4" />
                      Open Presenter Slide
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(blogPostUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      How to promote your event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to rounds
          </Button>
          {onGoToDashboard && (
            <Button onClick={onGoToDashboard} className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
