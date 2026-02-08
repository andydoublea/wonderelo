import { Users } from 'lucide-react';
import { Card } from './ui/card';

interface OrganizerHeaderProps {
  profileImageUrl?: string;
  eventName?: string;
  organizerName?: string;
  variant?: 'default' | 'boxed';
  size?: 'default' | 'small';
}

export function OrganizerHeader({ 
  profileImageUrl, 
  eventName, 
  organizerName,
  variant = 'default',
  size = 'default'
}: OrganizerHeaderProps) {
  const imageSize = size === 'small' ? 'h-12 w-12' : 'h-16 w-16';
  const iconSize = size === 'small' ? 'h-6 w-6' : 'h-8 w-8';
  const textSize = size === 'small' ? 'text-sm' : 'text-base';
  const gap = size === 'small' ? 'gap-3' : 'gap-4';
  const padding = size === 'small' ? 'mb-4' : 'mb-6';
  
  const content = (
    <>
      {/* Profile image - centered above text */}
      {profileImageUrl ? (
        <img 
          src={profileImageUrl} 
          alt={organizerName || 'Event organizer'}
          className={`${imageSize} rounded-full object-cover border-2 border-border flex-shrink-0`}
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className={`${imageSize} bg-muted rounded-full flex items-center justify-center flex-shrink-0 ${profileImageUrl ? 'hidden' : ''}`}
      >
        <Users className={`${iconSize} text-muted-foreground`} />
      </div>
      
      {/* Text - centered */}
      <div className="text-center">
        <p className={`${textSize} text-muted-foreground`}>
          Wonderelo networking rounds hosted by
        </p>
        <p className={`${textSize} font-medium text-foreground`}>
          {eventName || organizerName || 'Event organizer'}
        </p>
      </div>
    </>
  );

  if (variant === 'boxed') {
    return (
      <Card className="bg-muted/30">
        <div className="flex flex-col items-center gap-4 p-4">
          {content}
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-2">
      <div className={`flex flex-col items-center ${gap} ${padding}`}>
        {content}
      </div>
    </div>
  );
}