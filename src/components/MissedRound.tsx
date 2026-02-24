import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Clock, ArrowLeft, Send } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface MissedRoundProps {
  participantToken: string;
  roundId: string;
  roundName?: string;
  onBackToDashboard: () => void;
}

export function MissedRound({ participantToken, roundId, roundName, onBackToDashboard }: MissedRoundProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      debugLog('[MissedRound] Submitting feedback');
      const response = await fetch(
        `${apiBaseUrl}/participant/${participantToken}/missed-feedback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roundId, feedback: feedback.trim() }),
        }
      );
      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (err) {
      errorLog('[MissedRound] Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-destructive" />
              </div>

              {/* Headline */}
              <div>
                <h2 className="text-2xl font-bold mb-2">You didn't make it in time</h2>
                {roundName && (
                  <p className="text-muted-foreground text-sm">{roundName}</p>
                )}
              </div>

              {/* Message */}
              <p className="text-muted-foreground text-sm">
                Your conversation partner was waiting for you at the meeting point. Please try to be on time for your next round — it means a lot to the person expecting you.
              </p>

              {/* Feedback */}
              {!isSubmitted ? (
                <div className="w-full space-y-3 mt-2">
                  <p className="text-sm text-left font-medium">What happened?</p>
                  <Textarea
                    placeholder="Tell us why you couldn't make it (optional)..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  {feedback.trim() && (
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting}
                      variant="outline"
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send feedback'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 w-full">
                  <p className="text-sm text-green-700 dark:text-green-300">Thanks for letting us know!</p>
                </div>
              )}

              {/* Back button */}
              <Button onClick={onBackToDashboard} className="w-full mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
