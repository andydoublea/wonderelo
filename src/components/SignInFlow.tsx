import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertCircle, 
  ArrowLeft, 
  UserCircle, 
  Shield, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  X 
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface SignInData {
  email: string;
  password: string;
}

interface SignInFlowProps {
  onComplete: (userData: any, sessionData?: any) => void;
  onBack: () => void;
  onSwitchToSignUp: () => void;
}

export function SignInFlow({ onComplete, onBack, onSwitchToSignUp }: SignInFlowProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [lastResetRequestTime, setLastResetRequestTime] = useState<number>(0);
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: ''
  });
  
  // Participant magic link state
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState('');
  const [participantSuccess, setParticipantSuccess] = useState(false);
  
  // Track active tab
  const [activeTab, setActiveTab] = useState<'participant' | 'organizer'>('participant');

  const updateFormData = (field: keyof SignInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const isFormValid = () => {
    return formData.email && formData.password;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isFormValid()) return;

    setIsLoading(true);
    setError('');

    try {
      // Use Supabase client directly for authentication
      const { supabase } = await import('../utils/supabase/client');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        errorLog('Sign in error:', signInError);
        setError(signInError.message || 'Failed to sign in');
        return;
      }

      if (!data.session || !data.user) {
        setError('Failed to create session');
        return;
      }

      // Fetch user profile from backend
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
        {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let userProfile = null;
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        userProfile = profileResult.profile;
      }

      // Create user object for onComplete
      const userData = {
        id: data.user.id,
        email: data.user.email,
        ...userProfile
      };

      onComplete(userData, data.session);
    } catch (error) {
      errorLog('Sign in error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(formData.email); // Pre-fill with current email if available
    setResetError('');
    setResetSuccess(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) return;

    // Check if user tried too soon
    const now = Date.now();
    const timeSinceLastRequest = now - lastResetRequestTime;
    const RATE_LIMIT_MS = 60000; // 60 seconds

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      setResetError(`Please wait ${remainingSeconds} seconds before requesting another reset email`);
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      // Mark that we initiated a reset password flow
      localStorage.setItem('oliwonder_reset_password_initiated', 'true');
      localStorage.setItem('oliwonder_reset_password_email', resetEmail);
      localStorage.setItem('oliwonder_reset_password_timestamp', Date.now().toString());

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: resetEmail }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setResetSuccess(true);
        setLastResetRequestTime(now);
      } else {
        errorLog('Password reset error:', result);
        
        // Show user-friendly message for rate limit
        if (response.status === 429) {
          setResetError('Please wait 60 seconds before requesting another reset email');
          setLastResetRequestTime(now);
        } else {
          setResetError(result.error || 'Failed to send reset email');
        }
        
        // Clear localStorage on error
        localStorage.removeItem('oliwonder_reset_password_initiated');
        localStorage.removeItem('oliwonder_reset_password_email');
        localStorage.removeItem('oliwonder_reset_password_timestamp');
      }
    } catch (error) {
      errorLog('Password reset error:', error);
      setResetError('Network error. Please try again.');
      // Clear localStorage on error
      localStorage.removeItem('oliwonder_reset_password_initiated');
      localStorage.removeItem('oliwonder_reset_password_email');
      localStorage.removeItem('oliwonder_reset_password_timestamp');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  const handleParticipantMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participantEmail) return;

    setParticipantLoading(true);
    setParticipantError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/send-magic-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: participantEmail }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setParticipantSuccess(true);
      } else {
        errorLog('Magic link error:', result);
        setParticipantError(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      errorLog('Magic link error:', error);
      setParticipantError('Network error. Please try again.');
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleParticipantQuickLogin = async (email: string) => {
    setParticipantLoading(true);
    setParticipantError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/quick-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success && result.token) {
        debugLog('Quick login successful, redirecting to:', `/p/${result.token}`);
        // Redirect to participant dashboard
        navigate(`/p/${result.token}`);
      } else {
        errorLog('Quick login error:', result);
        setParticipantError(result.error || 'Failed to login');
      }
    } catch (error) {
      errorLog('Quick login error:', error);
      setParticipantError('Network error. Please try again.');
    } finally {
      setParticipantLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border">
          <div className="container mx-auto max-w-6xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h2 className="text-primary wonderelo-logo cursor-pointer" onClick={onBack}>Wonderelo</h2>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={onBack}>
                  Back to home
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="mb-2">
                Reset your password
              </h1>
              <p className="text-muted-foreground">
                {resetSuccess 
                  ? "Check your email for reset instructions"
                  : "Enter your email and we'll send you a reset link"
                }
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardContent>
                  {resetSuccess 
                    ? "Check your email for reset instructions"
                    : "Enter your email and we'll send you a reset link"
                  }
                </CardContent>
              </CardHeader>
              <CardContent>
                {resetSuccess ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-center">
                        <Mail className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                        <h3 className="mb-2">Email sent!</h3>
                        <p className="text-sm text-muted-foreground">
                          We've sent a password reset link to<br />
                          <span className="font-medium">{resetEmail}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handleBackToSignIn}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to sign in
                      </Button>
                      <Button onClick={onBack}>
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    {resetError && (
                      <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <X className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{resetError}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email address</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={resetLoading}
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handleBackToSignIn} disabled={resetLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to sign in
                      </Button>

                      <Button type="submit" disabled={!resetEmail || resetLoading}>
                        {resetLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending email...
                          </>
                        ) : (
                          'Send reset email'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal text-primary"
                  onClick={onSwitchToSignUp}
                  disabled={resetLoading}
                >
                  Sign up for free
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h2 className="text-primary wonderelo-logo cursor-pointer" onClick={onBack}>Wonderelo</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                Back to home
              </Button>
              <Button onClick={onSwitchToSignUp}>
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2">
              Sign in
            </h1>
            <p className="text-muted-foreground">
              Access your networking sessions
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardContent>
                Choose how you want to sign in
              </CardContent>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="participant" className="w-full" onValueChange={(value) => setActiveTab(value as 'participant' | 'organizer')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="participant" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    Participant
                  </TabsTrigger>
                  <TabsTrigger value="organizer" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Organizer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="participant" className="space-y-6">
                  {participantSuccess ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-center">
                          <Mail className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                          <h3 className="mb-2">Check your email</h3>
                          <p className="text-sm text-muted-foreground">
                            We've sent a magic link to<br />
                            <span className="font-medium">{participantEmail}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Click the link in the email to access your rounds
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setParticipantSuccess(false);
                            setParticipantEmail('');
                          }}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                        <Button onClick={onBack}>
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleParticipantMagicLink} className="space-y-6">
                      {participantError && (
                        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <X className="h-4 w-4 text-destructive" />
                          <p className="text-sm text-destructive">{participantError}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="participantEmail">Email address</Label>
                        <Input
                          id="participantEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={participantEmail}
                          onChange={(e) => {
                            setParticipantEmail(e.target.value);
                            if (participantError) setParticipantError('');
                          }}
                          disabled={participantLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          We'll send you a magic link to access your rounds
                        </p>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onBack();
                          }} 
                          disabled={participantLoading}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>

                        <Button type="submit" disabled={!participantEmail || participantLoading}>
                          {participantLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending link...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send magic link
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Test Login Button for Participant */}
                      <div className="space-y-2 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Quick test logins:</p>
                        <Button 
                          type="button"
                          variant="secondary" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleParticipantQuickLogin('andy.double.a+ma@gmail.com');
                          }}
                          disabled={participantLoading}
                          className="text-xs w-full"
                        >
                          {participantLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            'Quick test login (Andre Breton)'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="organizer" className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <X className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isFormValid() && !isLoading) {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubmit();
                            }
                          }}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-sm font-normal text-primary"
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                            type="button"
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => updateFormData('password', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isFormValid() && !isLoading) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSubmit();
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onBack();
                        }} 
                        disabled={isLoading}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>

                      <Button type="submit" disabled={!isFormValid() || isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign in'
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Test Login Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Quick test logins:</p>
                    <Button 
                      variant="secondary" 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData({
                          email: 'andy.double.a+3@gmail.com',
                          password: 'Rukuku'
                        });
                        setError('');
                        
                        // Auto-submit after a short delay
                        setTimeout(() => {
                          handleSubmit();
                        }, 100);
                      }}
                      disabled={isLoading}
                      className="text-xs w-full"
                    >
                      Quick test login (andy.double.a+3@gmail.com)
                    </Button>

                    <Button 
                      variant="secondary" 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData({
                          email: 'admin@oliwonder.com',
                          password: 'Rukuku'
                        });
                        setError('');
                        
                        // Auto-submit after a short delay
                        setTimeout(() => {
                          handleSubmit();
                        }, 100);
                      }}
                      disabled={isLoading}
                      className="text-xs w-full"
                    >
                      Quick test login (admin@oliwonder.com)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            {activeTab === 'participant' ? (
              <p className="text-sm text-muted-foreground">
                Are you an organizer?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal text-primary"
                  onClick={() => setActiveTab('organizer')}
                  disabled={isLoading || participantLoading}
                >
                  Sign in here
                </Button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Need to create an organizer account?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal text-primary"
                  onClick={onSwitchToSignUp}
                  disabled={isLoading || participantLoading}
                >
                  Sign up for free
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}