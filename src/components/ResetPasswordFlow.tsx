import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface ResetPasswordFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

export function ResetPasswordFlow({ onComplete, onBack }: ResetPasswordFlowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    debugLog('=== RESET PASSWORD FLOW (OLIWONDER) ===');
    debugLog('Token from URL:', token);
    
    if (!token) {
      debugLog('❌ No reset token in URL');
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    debugLog('✅ Reset token found');
    setResetToken(token);
    
    // Clean URL (remove token from visible URL for security)
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('token');
    window.history.replaceState({}, document.title, cleanUrl.toString());
  }, []);



  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const isFormValid = () => {
    return formData.password && 
           formData.confirmPassword && 
           formData.password === formData.confirmPassword &&
           formData.password.length >= 6;
  };

  const getPasswordError = () => {
    if (!formData.password) return '';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    if (!resetToken) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/reset-password-with-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: resetToken,
            newPassword: formData.password
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      errorLog('Password reset error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 cursor-pointer hover:text-primary/80 transition-colors" onClick={onBack}>
              Wonderelo
            </h1>
            <p className="text-muted-foreground">
              Password updated successfully
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Password updated!</CardTitle>
              <CardDescription>
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-center">
                    <Check className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="mb-2">Success!</h3>
                    <p className="text-sm text-muted-foreground">
                      You can now sign in with your new password
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4">
                  <Button onClick={onComplete} className="w-full">
                    Continue to sign in
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 cursor-pointer hover:text-primary/80 transition-colors" onClick={onBack}>
            Wonderelo
          </h1>
          <p className="text-muted-foreground">
            Create your new password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
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
                  {getPasswordError() && (
                    <p className="text-sm text-destructive">{getPasswordError()}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={isLoading}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <Button type="submit" disabled={!isFormValid() || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}