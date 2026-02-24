import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { UserX, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { errorLog } from '../utils/debug';

interface NoShowReportProps {
  roundId: string;
  sessionId: string;
  participantId: string;
  noShowParticipantId: string;
  onReportSubmitted: (newMatch?: any) => void;
  onCancel: () => void;
}

export function NoShowReport({
  roundId,
  sessionId,
  participantId,
  noShowParticipantId,
  onReportSubmitted,
  onCancel
}: NoShowReportProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/rounds/${roundId}/no-show`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId,
            noShowParticipantId,
            sessionId,
            notes
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setIsSubmitted(true);
        toast.success('Report submitted. Finding you a new group...');
        
        setTimeout(() => {
          onReportSubmitted(result.newMatch);
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit report');
      }
    } catch (error) {
      errorLog('Error submitting report:', error);
      toast.error('Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Report submitted</CardTitle>
            <CardDescription>
              We're finding you a new group
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please wait while we match you with other available participants...
            </p>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mt-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
            <UserX className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Report no-show</CardTitle>
          <CardDescription>
            Let us know your partner didn't show up
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">What happens next?</p>
            <ul className="text-sm space-y-1">
              <li>• We'll mark this participant as no-show</li>
              <li>• You'll be matched with a new group</li>
              <li>• The round organizer will be notified</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Submit report
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This action cannot be undone. Please make sure your partner had enough time to arrive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}