import { SessionDisplayCard } from './SessionDisplayCard';
import { NetworkingSession } from '../App';
import { OrganizerHeader } from './OrganizerHeader';

interface SessionPreviewProps {
  formData: Partial<NetworkingSession>;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  userSlug?: string;
}

export function SessionPreview({ formData, userEmail = 'user@example.com', organizerName, profileImageUrl, userSlug }: SessionPreviewProps) {
  const generateRounds = () => {
    if (!formData.roundDuration || !formData.numberOfRounds) {
      return [];
    }

    const rounds = [];
    
    // If no startTime is provided, generate preview rounds with To be set
    if (!formData.startTime || !formData.date) {
      for (let i = 0; i < formData.numberOfRounds; i++) {
        rounds.push({
          id: `round-${i + 1}`,
          name: 'To be set',
          startTime: 'To be set',
          date: formData.date || '',
          duration: formData.roundDuration
        });
      }
      return rounds;
    }
    
    // Generate actual rounds with times when startTime is provided
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    let currentTime = startHours * 60 + startMinutes; // Convert to minutes since midnight
    
    // Parse the base session date
    const baseDate = new Date(formData.date);

    for (let i = 0; i < formData.numberOfRounds; i++) {
      // Calculate day offset (how many days past the base date)
      const dayOffset = Math.floor(currentTime / 1440); // 1440 minutes = 24 hours
      const timeInDay = currentTime % 1440; // Time within the current day
      
      const roundStartHours = Math.floor(timeInDay / 60);
      const roundStartMinutes = timeInDay % 60;
      const roundStartTime = `${roundStartHours.toString().padStart(2, '0')}:${roundStartMinutes.toString().padStart(2, '0')}`;
      
      // Calculate the actual date for this round
      const roundDate = new Date(baseDate);
      roundDate.setDate(baseDate.getDate() + dayOffset);
      const roundDateString = roundDate.toISOString().split('T')[0]; // YYYY-MM-DD

      rounds.push({
        id: `round-${i + 1}`,
        name: roundStartTime,
        startTime: roundStartTime,
        date: roundDateString,
        duration: formData.roundDuration
      });

      // Add round duration and gap for next round
      currentTime += formData.roundDuration + (formData.gapBetweenRounds || 0);
    }

    return rounds;
  };

  // Use actual rounds if they exist, otherwise generate preview rounds
  const rounds = (formData.rounds && formData.rounds.length > 0) 
    ? formData.rounds 
    : generateRounds();

  return (
    <div className="sticky top-20">
      <div className="space-y-4">
        {/* Preview Title Box */}
        <div className="text-center p-3 border rounded-lg bg-muted/30">
          <h3>Event page preview</h3>
        </div>

        {/* Header Box */}
        <OrganizerHeader
          profileImageUrl={profileImageUrl}
          organizerName={organizerName}
          variant="boxed"
        />

        {/* Session Card */}
        <SessionDisplayCard
          userSlug={userSlug}
          session={{
            id: 'preview',
            name: formData.name || 'Session name',
            date: formData.date || '',
            startTime: formData.startTime || '',
            endTime: formData.endTime || '',
            roundDuration: formData.roundDuration || 10,
            numberOfRounds: formData.numberOfRounds || 1,
            gapBetweenRounds: formData.gapBetweenRounds || 10,
            limitParticipants: formData.limitParticipants || false,
            maxParticipants: formData.maxParticipants || 20,
            groupSize: formData.groupSize || 2,
            limitGroups: formData.limitGroups || false,
            maxGroups: formData.maxGroups || 10,
            status: formData.status || 'draft',
            isRecurring: formData.isRecurring || false,
            frequency: formData.frequency || 'weekly',
            rounds: rounds,
            enableTeams: formData.enableTeams || false,
            allowMultipleTeams: formData.allowMultipleTeams || false,
            matchingType: formData.matchingType || 'within-team',
            teams: formData.teams || [],
            enableTopics: formData.enableTopics || false,
            allowMultipleTopics: formData.allowMultipleTopics || false,
            topics: formData.topics || [],
            meetingPoints: formData.meetingPoints || []
          }}
          showSelectionMode={true}
          variant={formData.status === 'running' ? 'running' : formData.status === 'scheduled' ? 'scheduled' : 'default'}
        />
      </div>
    </div>
  );
}