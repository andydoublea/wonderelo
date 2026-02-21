import { Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface EmailVerificationWaitingProps {
  email?: string;
}

// Detect email provider and return a link to open it
function getEmailProviderLink(email?: string): { name: string; url: string } | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { name: 'Open Gmail', url: 'https://mail.google.com' };
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    return { name: 'Open Outlook', url: 'https://outlook.live.com' };
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.co.uk') {
    return { name: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' };
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return { name: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' };
  }
  if (domain === 'protonmail.com' || domain === 'proton.me' || domain === 'pm.me') {
    return { name: 'Open Proton Mail', url: 'https://mail.proton.me' };
  }
  return null;
}

export function EmailVerificationWaiting({ email }: EmailVerificationWaitingProps) {
  const emailProvider = getEmailProviderLink(email);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-center mb-2">Check your email</h1>
            <p className="text-center text-muted-foreground">
              Click the link in your email to verify and continue
            </p>
          </div>
        </div>

        {/* Content */}
        <div>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>

                {email && (
                  <p className="text-sm text-center text-muted-foreground">
                    We sent the email to <span className="font-medium text-foreground">{email}</span>
                  </p>
                )}

                {emailProvider && (
                  <Button
                    variant="default"
                    className="mt-2"
                    onClick={() => window.open(emailProvider.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {emailProvider.name}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground mt-2">
                  Don't see it? Check your spam folder.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
