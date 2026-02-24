import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

export function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verificationType = searchParams.get('type') || 'registration';
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [participantToken, setParticipantToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link - no token provided');
      return;
    }

    verifyEmail();
  }, [token, verificationType]);

  const verifyEmail = async () => {
    try {
      debugLog('=== EMAIL VERIFICATION ===');
      debugLog('Type:', verificationType);
      debugLog('Token:', token);

      // Choose endpoint based on verification type
      const endpoint = verificationType === 'email_change'
        ? '/verify-email-change'
        : '/verify-participant-email';

      const response = await fetch(
        `${apiBaseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verificationToken: token
          })
        }
      );

      debugLog('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        errorLog('Verification failed:', errorData);
        
        setStatus('error');
        setMessage(errorData.error || 'Failed to verify email');
        return;
      }

      const data = await response.json();
      debugLog('Verification success:', data);

      // Store participant token in localStorage (global, not per organizer)
      if (data.token) {
        localStorage.setItem('participant_token', data.token);
        setParticipantToken(data.token);
        debugLog('✅ Participant token saved to localStorage');
      }

      setStatus('success');
      
      if (verificationType === 'email_change') {
        setMessage('Email changed successfully! Your new email address is now active.');
      } else {
        setMessage('Email verified successfully! Your registration is now complete.');
      }

      // Redirect to participant dashboard after 3 seconds
      setTimeout(() => {
        if (data.token) {
          navigate(`/p/${data.token}`);
        } else {
          navigate('/');
        }
      }, 3000);

    } catch (error) {
      errorLog('Error verifying email:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'verifying' && 'Verifying your email'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        {status === 'success' && (
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Redirecting you to your rounds...
            </p>
            <Button
              onClick={() => {
                if (participantToken) {
                  navigate(`/p/${participantToken}`);
                } else {
                  navigate('/');
                }
              }}
              className="w-full"
            >
              Go to my rounds
            </Button>
          </CardContent>
        )}

        {status === 'error' && (
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {message.includes('most recent verification email') 
                  ? 'Please check your email inbox for the latest verification link and use that one instead.'
                  : 'The verification link may have expired or is invalid. Please try registering again.'}
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Return to homepage
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}