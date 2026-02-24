import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Save, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { Footer } from './Footer';

interface AccountSettingsProps {
  accessToken: string;
  userEmail: string;
  onBack: () => void;
  onProfileUpdate?: (updates: { organizerName?: string }) => void;
}

export function AccountSettings({ accessToken, userEmail, onBack, onProfileUpdate }: AccountSettingsProps) {
  const [organizerName, setOrganizerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      debugLog('Loading account settings...');
      debugLog('Access token present:', !!accessToken);
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch('/profile', {}, accessToken);

      debugLog('Profile response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        debugLog('Profile data received:', result);
        debugLog('Organizer name:', result.profile?.organizerName);
        setOrganizerName(result.profile?.organizerName || '');
      } else {
        const errorText = await response.text();
        errorLog('Failed to load settings:', response.status, errorText);
        toast.error(`Failed to load settings: ${response.status}`);
      }
    } catch (error) {
      errorLog('Error loading settings:', error);
      toast.error('Error loading settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate before saving
    if (!organizerName) {
      toast.error('Organizer name is required');
      return;
    }

    setIsSaving(true);
    try {
      debugLog('Saving account settings...');
      debugLog('Organizer name to save:', organizerName);
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            organizerName,
          }),
        },
        accessToken
      );

      debugLog('Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        debugLog('Save successful:', result);
        toast.success('Settings saved successfully');
        
        // Update current user in localStorage
        const currentUser = localStorage.getItem('oliwonder_current_user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          userData.organizerName = organizerName;
          localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));
        }
        
        // Notify parent component of profile update
        if (onProfileUpdate) {
          onProfileUpdate({ organizerName });
        }
      } else {
        const errorText = await response.text();
        errorLog('Failed to save settings:', response.status, errorText);
        toast.error(`Failed to save settings: ${response.status}`);
      }
    } catch (error) {
      errorLog('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate before changing password
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      debugLog('Changing password...');
      
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const response = await fetch(
        `${apiBaseUrl}/change-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (response.ok) {
        toast.success('Password changed successfully');
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await response.json();
        errorLog('Failed to change password:', errorData);
        toast.error(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      errorLog('Error changing password:', error);
      toast.error('Error changing password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    // Validate before changing email
    if (!newEmail || !emailChangePassword) {
      toast.error('All fields are required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('Invalid email format');
      return;
    }

    setIsChangingEmail(true);
    try {
      debugLog('Changing email...');
      
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const response = await fetch(
        `${apiBaseUrl}/change-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: emailChangePassword,
            newEmail,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success('Verification email sent', {
          description: result.message || 'Please check your new email to confirm the change'
        });
        // Clear email fields and hide form
        setNewEmail('');
        setEmailChangePassword('');
        setShowEmailChangeForm(false);
      } else {
        const errorData = await response.json();
        errorLog('Failed to change email:', errorData);
        toast.error(errorData.error || 'Failed to change email');
      }
    } catch (error) {
      errorLog('Error changing email:', error);
      toast.error('Error changing email. Please try again.');
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-2">Account settings</h1>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizerName">Your name</Label>
                <div className="max-w-sm">
                  <Input 
                    id="organizerName"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div>
                <Label>Email</Label>
                <div className="max-w-sm">
                  <Input 
                    value={userEmail} 
                    disabled 
                    className="mt-2 bg-muted"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailChangeForm(!showEmailChangeForm)}
                  className="text-xs text-primary hover:underline mt-1 block"
                >
                  {showEmailChangeForm ? 'Cancel' : 'Change email'}
                </button>
                
                {/* Inline Email Change Form */}
                {showEmailChangeForm && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      For security, we'll send a verification email to your new address and notify your current email
                    </p>
                    <div>
                      <Label htmlFor="newEmail">New email</Label>
                      <Input 
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emailChangePassword">Current password</Label>
                      <Input 
                        id="emailChangePassword"
                        type="password"
                        value={emailChangePassword}
                        onChange={(e) => setEmailChangePassword(e.target.value)}
                        placeholder="Enter current password"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleEmailChange} 
                        disabled={isChangingEmail}
                        variant="outline"
                        size="sm"
                      >
                        {isChangingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change email'
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowEmailChangeForm(false);
                          setNewEmail('');
                          setEmailChangePassword('');
                        }} 
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="max-w-sm">
                  <Input 
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">New password</Label>
                <div className="max-w-sm">
                  <Input 
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  At least 6 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="max-w-sm">
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isChangingPassword}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing password...
                    </>
                  ) : (
                    'Change password'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
        )}
      </div>

      <Footer />
    </div>
  );
}