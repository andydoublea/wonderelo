import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { OrganizerHeader } from './OrganizerHeader';
import { UserPublicPage } from './UserPublicPage';
import { Footer } from './Footer';
import { ArrowRight, Eye, X, Loader2 } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

export function DemoPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'slide' | 'event'>('slide');
  const [showBanner, setShowBanner] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(true);
  const [setupError, setSetupError] = useState('');

  // QR code
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  useEffect(() => {
    const generateQR = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = `${window.location.origin}/demo`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrCodeUrl(qrDataUrl);
      } catch {
        // QR code generation failed, not critical
      }
    };
    generateQR();
  }, []);

  // Call backend to ensure demo data is ready
  useEffect(() => {
    const setup = async () => {
      try {
        setIsSettingUp(true);
        setSetupError('');
        const res = await fetch(`${apiBaseUrl}/demo/setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!data.success) {
          setSetupError(data.error || 'Failed to set up demo');
        }
      } catch (err) {
        setSetupError('Could not connect to backend');
      } finally {
        setIsSettingUp(false);
      }
    };
    setup();

    // Refresh demo data every 2 minutes to keep rounds in the future
    const interval = setInterval(setup, 120_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky demo banner */}
      {showBanner && (
        <div className="sticky top-0 z-[60] bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">
                This is a demo — explore how participants experience Wonderelo networking rounds.
              </span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-primary-foreground/20 rounded transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Phase: Slide (what's projected at the event) */}
      {phase === 'slide' && (
        <>
          <div className="flex-1 flex flex-col">
            <div className="container mx-auto max-w-7xl px-6 py-12 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
                {/* Left Side - QR Code */}
                <div className="flex flex-col items-center justify-center space-y-8">
                  <div className="text-center space-y-3">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                      Join the networking
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      Scan the QR code to register for speed networking rounds
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-lg">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Demo QR Code"
                        className="w-full h-full max-w-[300px]"
                      />
                    ) : (
                      <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded">
                        <p className="text-muted-foreground">Generating QR code...</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-semibold text-primary wonderelo-logo">Wonderelo</h2>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                      <span className="text-xl font-mono font-semibold text-primary">
                        wonderelo.com/demo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Event info */}
                <div className="flex flex-col items-center space-y-6">
                  <OrganizerHeader
                    eventName="Demo Event"
                    organizerName="Wonderelo Demo"
                    variant="boxed"
                  />

                  <div className="w-full max-w-md bg-muted/50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Speed Networking</h3>
                    <p className="text-muted-foreground text-sm">
                      5 rounds of 1-on-1 networking, each lasting 7 minutes.
                      Get matched with someone new each round!
                    </p>
                    {isSettingUp && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing demo...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA to continue to event page */}
            <div className="container mx-auto max-w-7xl px-6 pb-12">
              <div className="text-center">
                <Button
                  size="lg"
                  className="gap-2 text-lg px-8 py-6"
                  disabled={isSettingUp}
                  onClick={() => {
                    setPhase('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Setting up demo...
                    </>
                  ) : (
                    <>
                      See the participant view
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
                {setupError && (
                  <p className="text-sm text-destructive mt-3">{setupError}</p>
                )}
                <p className="text-sm text-muted-foreground mt-3">
                  This is what gets projected on the screen at your event.
                  <br />
                  Click to see what participants see on their phone after scanning.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Phase: Event page (what the participant sees on their phone) */}
      {phase === 'event' && (
        <div className="flex-1">
          {/* Back to slide button */}
          <div className="container mx-auto max-w-2xl px-6 pt-6 pb-2">
            <button
              onClick={() => {
                setPhase('slide');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to projection slide
            </button>
          </div>

          {/* Real event page powered by backend */}
          <UserPublicPage userSlug="demo" />
        </div>
      )}

      <Footer />
    </div>
  );
}
