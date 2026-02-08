import { Mail } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface EmailVerificationWaitingProps {
  email?: string;
}

export function EmailVerificationWaiting({ email }: EmailVerificationWaitingProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-center mb-2">Continue from your email</h1>
            <p className="text-center text-muted-foreground">
              To verify it's you just click on button in your email
            </p>
            {email && (
              <p className="text-sm text-center text-muted-foreground mt-4">
                We sent the email to <span className="font-medium">{email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Check your inbox and spam folder
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
