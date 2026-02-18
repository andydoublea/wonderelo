import { useState, useEffect } from 'react';
import { SessionRegistration } from './SessionRegistration';
import { OrganizerHeader } from './OrganizerHeader';
import { NetworkingSession } from '../App';
import { errorLog } from '../utils/debug';

interface EventPromoPageProps {
  eventSlug: string;
  sessions: NetworkingSession[];
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
  onBack: () => void;
}

export function EventPromoPage({ eventSlug, sessions, organizerName, eventName, profileImageUrl, onBack }: EventPromoPageProps) {
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

  // Filter to only published sessions for the promo page
  const publishedSessions = sessions.filter(s => s.status === 'published');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - QR Code */}
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* QR Code */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Event QR Code"
                  className="w-full h-full max-w-[400px]"
                />
              ) : (
                <div className="w-[400px] h-[400px] flex items-center justify-center bg-muted rounded">
                  <p className="text-muted-foreground">Generating QR code...</p>
                </div>
              )}
            </div>

            {/* Logo below QR Code - Larger */}
            <div className="text-center">
              <h2 className="text-4xl font-semibold text-primary">Wonderelo</h2>
            </div>

            {/* Slug Display */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-mono font-semibold text-primary">
                  #{eventSlug}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Session Cards */}
          <div className="space-y-4">
            {/* Organizer Header */}
            <OrganizerHeader
              profileImageUrl={profileImageUrl}
              eventName={eventName}
              organizerName={organizerName}
              variant="boxed"
            />

            {publishedSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming sessions available</p>
              </div>
            ) : (
              <SessionRegistration
                sessions={publishedSessions}
                userSlug={eventSlug}
                eventName={displayName}
                noWrapper={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Back to Dashboard Link - At the bottom, centered */}
      <div className="pb-8">
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
