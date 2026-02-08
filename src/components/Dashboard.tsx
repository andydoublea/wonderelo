import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { SessionDisplayCard } from './SessionDisplayCard';
import { SessionList } from './SessionList';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { PlusCircle, Download, QrCode, Copy, Search, ExternalLink, Check, Edit, Play, CheckCircle, X, Presentation } from 'lucide-react';
import { Input } from './ui/input';
import { NetworkingSession } from '../App';
import { toast } from 'sonner@2.0.3';
import { debugLog } from '../utils/debug';

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
  const [copied, setCopied] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      <Card>
        <CardHeader>
          <CardTitle>Your event page URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-muted rounded-md text-sm font-mono break-all hover:bg-muted/80 transition-colors flex items-center gap-2 group"
            >
              <span className="flex-1">{publicUrl}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={downloadQRCode}
              disabled={downloadingQR}
              title="Download QR code"
            >
              {downloadingQR ? (
                <Download className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              QR code
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/event-promo')}
              title="Event promo page"
            >
              <Presentation className="h-4 w-4 mr-2" />
              Promo page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoadingSessions ? (
          <>
            {['Draft', 'Scheduled', 'Published on event page', 'Completed'].map((status) => (
              <Card key={status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=draft')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Draft</CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{draftSessions.length}</div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=scheduled')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Scheduled</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{scheduledSessions.length}</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=published')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Published on event page</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{publishedSessions.length}</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/rounds?status=completed')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{completedSessions.length}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Published on Event Page Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Published on event page</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={() => navigate('/rounds')} variant="outline">
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
  );
}