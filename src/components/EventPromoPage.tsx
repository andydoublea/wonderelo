import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { SessionRegistration } from './SessionRegistration';
import { OrganizerHeader } from './OrganizerHeader';
import { NetworkingSession } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface EventPromoPageProps {
  eventSlug: string;
  onBack: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  urlSlug: string;
  organizerName?: string;
  eventName?: string;
  profileImageUrl?: string;
}

export function EventPromoPage({ eventSlug, onBack }: EventPromoPageProps) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<NetworkingSession[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const publicUrl = `${window.location.origin}/${eventSlug}`;

  useEffect(() => {
    fetchUserData();
    generateQRCode();
  }, [eventSlug]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/public/user/${eventSlug}`;
      debugLog('EventPromoPage - Fetching from URL:', url);
      debugLog('EventPromoPage - Project ID:', projectId);
      debugLog('EventPromoPage - Public Anon Key:', publicAnonKey ? 'Present' : 'Missing');
      
      // Fetch user profile and sessions using the existing public endpoint
      const response = await fetch(url,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      debugLog('EventPromoPage - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        errorLog('Failed to fetch user data:', errorData);
        return;
      }

      const data = await response.json();
      setUserProfile(data.user);
      
      // Filter only published sessions with upcoming rounds
      const upcomingSessions = data.sessions || [];
      setSessions(upcomingSessions);
      debugLog('Loaded sessions for promo page:', upcomingSessions);
    } catch (error) {
      errorLog('Error fetching user data:', error);
      debugLog('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const displayName = userProfile?.eventName || userProfile?.organizerName || eventSlug;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-6 py-12 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
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
                profileImageUrl={userProfile?.profileImageUrl}
                eventName={userProfile?.eventName}
                organizerName={userProfile?.organizerName}
                variant="boxed"
              />
              
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No upcoming sessions available</p>
                </div>
              ) : (
                <SessionRegistration
                  sessions={sessions}
                  userSlug={eventSlug}
                  eventName={displayName}
                  noWrapper={true}
                />
              )}
            </div>
          </div>
        )}
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