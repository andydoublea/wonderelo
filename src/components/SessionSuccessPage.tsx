import { NetworkingSession } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Share2, QrCode, ArrowLeft, AlertTriangle, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { SessionDisplayCard } from './SessionDisplayCard';
import { debugLog } from '../utils/debug';

interface SessionSuccessPageProps {
  session: NetworkingSession;
  eventUrl: string;
  onBack: () => void;
  onCopyUrl: () => void;
  onDownloadQR: () => void;
}

export function SessionSuccessPage({
  session,
  eventUrl,
  onBack,
  onCopyUrl,
  onDownloadQR
}: SessionSuccessPageProps) {
  const isDraft = session.status === 'draft';
  const [copied, setCopied] = useState(false);

  // Debug session data for success page
  debugLog('🎉 SUCCESS PAGE CARD DEBUG:', {
    sessionName: session.name,
    sessionId: session.id,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    enableTeams: session.enableTeams,
    teams: session.teams,
    teamsLength: session.teams?.length || 0,
    enableTopics: session.enableTopics,
    topics: session.topics,
    topicsLength: session.topics?.length || 0,
    isDraft: isDraft,
    eventUrl: eventUrl
  });
  
  // Debug teams rendering condition
  debugLog('🏷️ SUCCESS PAGE teams condition check:', {
    enableTeams: session.enableTeams,
    hasTeams: !!(session.teams && session.teams.length > 0),
    teams: session.teams,
    willRenderTeams: session.enableTeams && session.teams && session.teams.length > 0
  });
  
  // Debug topics rendering condition  
  debugLog('#️⃣ SUCCESS PAGE topics condition check:', {
    enableTopics: session.enableTopics,
    hasTopics: !!(session.topics && session.topics.length > 0),
    topics: session.topics,
    willRenderTopics: session.enableTopics && session.topics && session.topics.length > 0
  });

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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-[32px] pr-[24px] pb-[24px] pl-[33px] space-y-8">
      <div className="text-center space-y-8">
        {/* Success Icon and Message */}
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="h-16 w-16" />
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
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span>Round is in draft mode - schedule it to make it visible on your event page</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
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