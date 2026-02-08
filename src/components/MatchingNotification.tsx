import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Users, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Match {
  id: string;
  roundId: string;
  sessionId: string;
  participantIds: string[];
  meetingPointId: string;
  identificationImageUrl: string;
  status: string;
  checkIns: any[];
  createdAt: string;
}

interface MatchingNotificationProps {
  roundId: string;
  participantId: string;
  match: Match;
  roundName: string;
  startTime: string;
  onProceedToMeetingPoint: () => void;
}

export function MatchingNotification({
  roundId,
  participantId,
  match,
  roundName,
  startTime,
  onProceedToMeetingPoint
}: MatchingNotificationProps) {
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  useEffect(() => {
    // Calculate time until start
    const calculateTimeRemaining = () => {
      const now = new Date();
      const [hours, minutes] = startTime.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const diff = startDate.getTime() - now.getTime();
      setTimeUntilStart(Math.max(0, Math.floor(diff / 1000)));
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You've been matched!</CardTitle>
          <CardDescription>
            Find your group at the meeting point
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Identification image */}
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Show this image to find your group
            </p>
            <div className="relative aspect-square rounded-lg overflow-hidden border-4 border-primary">
              <ImageWithFallback
                src={match.identificationImageUrl}
                alt="Group identification"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Everyone in your group will see the same image
            </p>
          </div>

          {/* Meeting point */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Meeting point</p>
            </div>
            <p className="text-lg">{match.meetingPointId}</p>
          </div>

          {/* Group info */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Group size</p>
            </div>
            <p className="text-lg">{match.participantIds.length} participants</p>
          </div>

          {/* Time remaining */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <p className="text-sm">Time until round starts</p>
            </div>
            <div className="text-3xl tabular-nums">
              {formatTime(timeUntilStart)}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm">Instructions</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Go to the meeting point within 3 minutes</li>
                  <li>• Look for people with the same image</li>
                  <li>• Scan QR codes to confirm your meeting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button
            onClick={onProceedToMeetingPoint}
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            I'm on my way
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
