import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MapPin } from 'lucide-react';
import { MeetingPoint, NetworkingSession } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ScrollArea } from './ui/scroll-area';

export interface SessionWithMeetingPoints {
  sessionId: string;
  sessionName: string;
  meetingPoints: MeetingPoint[];
  date?: string; // Optional for sorting
  rounds?: any[]; // Optional for sorting
}

interface MeetingPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingPoints?: MeetingPoint[]; // Legacy support
  sessionsWithMeetingPoints?: SessionWithMeetingPoints[]; // New grouped format
}

export function MeetingPointsDialog({ open, onOpenChange, meetingPoints = [], sessionsWithMeetingPoints }: MeetingPointsDialogProps) {
  // If we have grouped sessions, use that, otherwise fall back to flat list
  const useGroupedView = sessionsWithMeetingPoints && sessionsWithMeetingPoints.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        {/* Sticky Header */}
        <div className="px-6 pt-6 pb-4 border-b bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Meeting points
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">Stay close to these spots before your round to be on time</p>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 pb-6">
            {useGroupedView ? (
              // Grouped by session
              <div className="space-y-8">
                {sessionsWithMeetingPoints.map((session) => (
                  <div key={session.sessionId}>
                    {/* Session Headline */}
                    <h2 className="mb-3">{session.sessionName}</h2>
                    
                    {/* Meeting Points Box for this session */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      {session.meetingPoints.length > 0 ? (
                        <div className="space-y-4">
                          {session.meetingPoints.map((point) => (
                            <div key={point.id} className="space-y-3">
                              {point.imageUrl && (
                                <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                  <ImageWithFallback
                                    src={point.imageUrl}
                                    alt={point.name || 'Meeting point'}
                                    className="w-full h-auto object-cover"
                                  />
                                </div>
                              )}
                              <p>{point.name}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No meeting points for this session.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Legacy flat list
              <div className="space-y-4">
                {meetingPoints.length > 0 ? (
                  <>
                    {meetingPoints.map((point) => (
                      <div key={point.id} className="border rounded-lg p-4 space-y-3">
                        {point.imageUrl && (
                          <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                            <ImageWithFallback
                              src={point.imageUrl}
                              alt={point.name || 'Meeting point'}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        <p>{point.name}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No meeting points added yet.</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}