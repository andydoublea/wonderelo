import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';

interface ParticipantConfirmationProps {
  sessionId: string;
  roundId: string;
  participantId: string;
  roundName: string;
  startTime: string;
  onConfirmed: () => void;
  onDeclined: () => void;
}

export function ParticipantConfirmation({
  sessionId,
  roundId,
  participantId,
  roundName,
  startTime,
  onConfirmed,
  onDeclined
}: ParticipantConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute countdown

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDeclined(); // Auto-decline if time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
      
      debugLog('[ParticipantConfirmation] Confirming participation for roundId:', roundId, 'participantId:', participantId);
      
      const response = await fetch(
        `${apiBaseUrl}/rounds/${roundId}/confirm/${participantId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        }
      );

      debugLog('[ParticipantConfirmation] Response status:', response.status);

      if (response.ok) {
        toast.success('Participation confirmed!');
        onConfirmed();
      } else {
        const error = await response.text();
        errorLog('[ParticipantConfirmation] Confirmation failed:', error);
        toast.error(`Failed to confirm participation: ${response.status}`);
      }
    } catch (error) {
      errorLog('[ParticipantConfirmation] Error confirming:', error);
      toast.error(`Error confirming participation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = () => {
    toast.info('You have declined to participate');
    onDeclined();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your participation</CardTitle>
        <CardDescription>Round starting in 5 minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Round details */}
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Round</p>
            <p>{roundName}</p>
            <p className="text-sm text-muted-foreground">Start time</p>
            <p>{startTime}</p>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Time remaining to confirm</p>
            <div className="text-4xl tabular-nums">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isConfirming}
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you don't confirm within 1 minute, you'll be automatically removed from this round.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}