import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, ArrowRight, Mail, Link2, PartyPopper } from 'lucide-react';
import { ServiceType } from '../App';
import confetti from 'canvas-confetti';

interface RegistrationData {
  email: string;
  customUrl: string;
  howDidYouHear: string;
  role: string;
  companySize: string;
}

interface RegistrationSuccessProps {
  registrationData: RegistrationData;
  serviceType: ServiceType;
  onContinue: () => void;
}

export function RegistrationSuccess({ registrationData, serviceType, onContinue }: RegistrationSuccessProps) {
  // Fire confetti on mount
  const confettiFired = useRef(false);
  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Welcome to Wonderelo! 🎉</CardTitle>
            <p className="text-muted-foreground">
              Your account has been created successfully
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Your email</p>
                  <p>{registrationData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Your custom URL</p>
                  <p className="text-primary">wonderelo.com/{registrationData.customUrl}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3>What happens next?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs mt-0.5">1</span>
                  <p>Check your email for account verification</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs mt-0.5">2</span>
                  <p>Set up your first networking round</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs mt-0.5">3</span>
                  <p>Share your URL with participants</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Badge variant="secondary" className="mb-4">
                {serviceType === 'event' ? 'Event organizer' : 'Venue owner'} • {registrationData.role}
              </Badge>
              
              <Button 
                className="w-full" 
                onClick={onContinue}
              >
                Continue to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Need help? <Button variant="link" className="p-0">Contact support</Button>
        </div>
      </div>
    </div>
  );
}