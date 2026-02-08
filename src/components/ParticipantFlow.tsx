import { useState, useEffect } from 'react';
import { ParticipantConfirmation } from './ParticipantConfirmation';
import { MatchingNotification } from './MatchingNotification';
import { QRScanner } from './QRScanner';
import { NoShowReport } from './NoShowReport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Clock } from 'lucide-react';
import { errorLog } from '../utils/debug';

type FlowStep = 'waiting' | 'confirmation' | 'matched' | 'check-in' | 'no-show-report' | 'completed';

interface ParticipantFlowProps {
  roundId: string;
  sessionId: string;
  participantId: string;
  roundName: string;
  startTime: string;
  onComplete?: () => void;
}

export function ParticipantFlow({
  roundId,
  sessionId,
  participantId,
  roundName,
  startTime,
  onComplete
}: ParticipantFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('waiting');
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [noShowParticipantId, setNoShowParticipantId] = useState<string>('');

  // Check participant status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        
        // Check if participant has been matched
        const matchResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/rounds/${roundId}/participant/${participantId}/match`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          setMatch(matchData.match);
          
          // Determine current step based on participant status
          const participant = matchData.participant;
          
          if (participant.status === 'matched') {
            setCurrentStep('matched');
          } else if (participant.status === 'checked-in') {
            setCurrentStep('completed');
          }
        }
      } catch (error) {
        errorLog('Error checking status:', error);
      }
    };

    checkStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, [roundId, participantId]);

  const handleConfirmed = () => {
    setCurrentStep('waiting');
    // Wait for matching to complete (will be picked up by status check)
  };

  const handleDeclined = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleProceedToMeetingPoint = () => {
    setCurrentStep('check-in');
  };

  const handleCheckInComplete = () => {
    setCurrentStep('completed');
    if (onComplete) {
      setTimeout(() => onComplete(), 2000);
    }
  };

  const handleReportNoShow = () => {
    // In production, you'd select which participant didn't show
    // For now, we'll use a placeholder
    setNoShowParticipantId('placeholder_id');
    setCurrentStep('no-show-report');
  };

  const handleNoShowReportSubmitted = (newMatch?: any) => {
    if (newMatch) {
      setMatch(newMatch);
      setCurrentStep('matched');
    } else {
      setCurrentStep('waiting');
    }
  };

  const handleCancelNoShowReport = () => {
    setCurrentStep('check-in');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentStep === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Waiting for round to start</CardTitle>
            <CardDescription>
              You're registered for {roundName}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Start time: {startTime}
            </p>
            <p className="text-sm text-muted-foreground">
              You'll receive a notification 5 minutes before the round starts to confirm your participation.
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <ParticipantConfirmation
        sessionId={sessionId}
        roundId={roundId}
        participantId={participantId}
        roundName={roundName}
        startTime={startTime}
        onConfirmed={handleConfirmed}
        onDeclined={handleDeclined}
      />
    );
  }

  if (currentStep === 'matched' && match) {
    return (
      <MatchingNotification
        roundId={roundId}
        participantId={participantId}
        match={match}
        roundName={roundName}
        startTime={startTime}
        onProceedToMeetingPoint={handleProceedToMeetingPoint}
      />
    );
  }

  if (currentStep === 'check-in' && match) {
    return (
      <QRScanner
        roundId={roundId}
        participantId={participantId}
        match={match}
        onCheckInComplete={handleCheckInComplete}
        onReportNoShow={handleReportNoShow}
      />
    );
  }

  if (currentStep === 'no-show-report') {
    return (
      <NoShowReport
        roundId={roundId}
        sessionId={sessionId}
        participantId={participantId}
        noShowParticipantId={noShowParticipantId}
        onReportSubmitted={handleNoShowReportSubmitted}
        onCancel={handleCancelNoShowReport}
      />
    );
  }

  if (currentStep === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Round in progress</CardTitle>
            <CardDescription>
              Enjoy your networking session!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Have a great conversation. The round will end automatically at the scheduled time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}