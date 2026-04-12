import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { SessionDisplayCard } from './SessionDisplayCard';
import { SessionList } from './SessionList';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { PlusCircle, Download, QrCode, Copy, Search, ExternalLink, Check, Edit, Play, CheckCircle, X, Presentation, CalendarClock } from 'lucide-react';
import { Input } from './ui/input';
import { NetworkingSession } from '../App';
import { OnboardingChecklist } from './OnboardingChecklist';
import { OnboardingTour } from './OnboardingTour';
// import { DownloadableAssets } from './DownloadableAssets';
import { toast } from 'sonner@2.0.3';
import { debugLog } from '../utils/debug';
import { useApp } from '../AppRouter';
import { authenticatedFetch } from '../utils/supabase/apiClient';

interface DashboardProps {
  eventSlug: string;
  sessions: NetworkingSession[];
  isLoadingSessions: boolean;
  onUpdateSession: (id: string, updates: Partial<NetworkingSession>) => void;
  onDeleteSession: (id: string) => void;
}

export function Dashboard({
  eventSlug,
  sessions,
  isLoadingSessions,
  onUpdateSession,
  onDeleteSession,
}: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, accessToken, setCurrentUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTour, setShowTour] = useState(false);
  const [checklistVisible, setChecklistVisible] = useState(
    () => !currentUser?.onboardingCompletedAt
  );

  // Show onboarding tour for first-time users
  useEffect(() => {
    if (!currentUser?.onboardingCompletedAt && !isLoadingSessions) {
      // Small delay to let the page render fully
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingSessions, currentUser?.onboardingCompletedAt]);

  // Debug logging on mount and when sessions change
  useEffect(() => {
    debugLog('📊 Dashboard sessions updated:', {
      eventSlug,
      sessionsCount: sessions.length,
      isLoadingSessions,
      sessionNames: sessions.map(s => s.name),
      sessionStatuses: sessions.map(s => ({ name: s.name, status: s.status }))
    });
  }, [sessions, isLoadingSessions, eventSlug]);

  // Helper function to remove diacritics
  const removeDiacritics = (text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filter by search query
  const filteredSessions = searchQuery
    ? sessions.filter(session => {
        const normalizedQuery = removeDiacritics(searchQuery.toLowerCase());
        const normalizedName = removeDiacritics(session.name.toLowerCase());
        return normalizedName.includes(normalizedQuery);
      })
    : sessions;

  // Helper: Check if session has any rounds that haven't ended yet
  const hasActiveRounds = (session: any) => {
    if (!session.rounds || session.rounds.length === 0) return false;
    if (!session.date) return false;
    
    const now = new Date();
    return session.rounds.some((round: any) => {
      if (!round.startTime) return false;
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date);
      roundStart.setHours(hours, minutes, 0, 0);
      // Calculate round end time (start + duration)
      const duration = round.duration || session.roundDuration || 0;
      const roundEnd = new Date(roundStart.getTime() + duration * 60 * 1000);
      // Round is active if it hasn't ended yet
      return now < roundEnd;
    });
  };

  // Calculate statistics
  const draftSessions = filteredSessions.filter(session => session.status === 'draft');
  const scheduledSessions = filteredSessions.filter(session => session.status === 'scheduled');
  // Only count published sessions that have active rounds (visible on event page)
  const publishedSessions = filteredSessions.filter(session => 
    session.status === 'published' && hasActiveRounds(session)
  );
  const completedSessions = filteredSessions.filter(session => session.status === 'completed');

  const publicUrl = `${window.location.origin}/${eventSlug}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const downloadQRCode = async () => {
    setDownloadingQR(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const link = document.createElement('a');
      link.download = `${eventSlug}-qr-code.png`;
      link.href = qrDataUrl;
      link.click();

      toast.success('QR code downloaded');
    } catch (err) {
      toast.error('Failed to generate QR code');
    } finally {
      setDownloadingQR(false);
    }
  };

  const handleEditSession = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}`);
  };

  const handleDuplicateSession = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}/duplicate`);
  };

  const handleManageSession = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}/manage`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Event Page URL Section */}
      <Card data-tour="event-page-url" className="overflow-hidden">
        <CardContent className="py-4 space-y-3">
          <h3 className="text-base">Your event page</h3>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block min-w-0 px-3 py-2 bg-muted rounded-md text-sm flex items-center hover:bg-muted/80 transition-colors group"
            title={publicUrl}
          >
            <span className="truncate flex-1">{`wonderelo.com/${eventSlug}`}</span>
            <ExternalLink className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              title="Copy URL"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              disabled={downloadingQR}
              title="Download QR code"
            >
              {downloadingQR ? (
                <Download className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-1" />
              )}
              QR code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/event-page-settings')}
              title="Edit event page"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/event-promo')}
              title="Promo slide"
            >
              <Presentation className="h-4 w-4 mr-1" />
              Slide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics — only shown on desktop and when user has more than the sample round */}
      {sessions.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=draft')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Draft</span>
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold">{draftSessions.length}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=scheduled')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Scheduled</span>
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold">{scheduledSessions.length}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=published')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Published</span>
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold">{publishedSessions.length}</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=completed')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Completed</span>
                <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold">{completedSessions.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onboarding Checklist (left) + Published on Event Page (right) */}
      <div className={`grid grid-cols-1 gap-6 ${checklistVisible ? 'md:grid-cols-2' : ''}`}>
        {/* Onboarding Checklist - shown for new organizers */}
        {checklistVisible && (
          <div data-tour="onboarding-checklist">
            <OnboardingChecklist eventSlug={eventSlug} sessions={sessions} onVisibilityChange={setChecklistVisible} onDismiss={async () => {
              try {
                const now = new Date().toISOString();
                await authenticatedFetch('/profile', {
                  method: 'PUT',
                  body: JSON.stringify({ onboardingCompletedAt: now }),
                });
                setCurrentUser({ ...currentUser, onboardingCompletedAt: now });
              } catch (e) {
                // Silently fail
              }
            }} />
          </div>
        )}

        {/* Published on Event Page Section */}
        <Card data-tour="session-card">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <CardTitle>Published on event page</CardTitle>
              <div className="flex flex-wrap items-center gap-2" data-tour="manage-rounds">
                <Button data-checklist="create-round-btn" onClick={() => navigate('/rounds/new')} variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create new round
                </Button>
                <Button data-checklist="show-all-rounds-btn" onClick={() => navigate('/rounds')} variant="outline" size="sm">
                  Show all rounds
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {publishedSessions.length === 0 && !isLoadingSessions ? (
              <div className="text-center py-12 text-muted-foreground">
                No published rounds yet
              </div>
            ) : (
              <SessionList
                sessions={publishedSessions}
                isLoading={isLoadingSessions}
                onEditSession={handleEditSession}
                onDeleteSession={onDeleteSession}
                onDuplicateSession={handleDuplicateSession}
                onUpdateSession={onUpdateSession}
                onManageSession={handleManageSession}
                groupBy="date"
                hideEmptySections={false}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour onComplete={async () => {
          setShowTour(false);
          // Persist to server so it doesn't show on other devices
          try {
            const now = new Date().toISOString();
            await authenticatedFetch('/profile', {
              method: 'PUT',
              body: JSON.stringify({ onboardingCompletedAt: now }),
            });
            setCurrentUser({ ...currentUser, onboardingCompletedAt: now });
          } catch (e) {
            // Silently fail — tour won't repeat this session anyway
          }
        }} />
      )}

    </div>
  );
}