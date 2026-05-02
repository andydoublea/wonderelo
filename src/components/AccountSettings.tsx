import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';

interface AccountSettingsProps {
  accessToken: string;
  userEmail: string;
  onBack: () => void;
  onProfileUpdate?: (updates: { organizerName?: string }) => void;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface AccountSettingsViewProps {
  userEmail: string;
  organizerName: string;
  isLoading: boolean;
  isSavingName: boolean;
  isChangingPassword: boolean;
  isChangingEmail: boolean;
  showEmailChangeForm: boolean;
  showPasswordChangeForm: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;
  emailChangePassword: string;
  onOrganizerNameChange: (value: string) => void;
  onOrganizerNameBlur: () => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNewEmailChange: (value: string) => void;
  onEmailChangePasswordChange: (value: string) => void;
  onToggleEmailChangeForm: () => void;
  onCancelEmailChange: () => void;
  onTogglePasswordChangeForm: () => void;
  onCancelPasswordChange: () => void;
  onPasswordChange: () => void;
  onEmailChange: () => void;
}

export function AccountSettingsView({
  userEmail,
  organizerName,
  isLoading,
  isSavingName,
  isChangingPassword,
  isChangingEmail,
  showEmailChangeForm,
  showPasswordChangeForm,
  currentPassword,
  newPassword,
  confirmPassword,
  newEmail,
  emailChangePassword,
  onOrganizerNameChange,
  onOrganizerNameBlur,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onNewEmailChange,
  onEmailChangePasswordChange,
  onToggleEmailChangeForm,
  onCancelEmailChange,
  onTogglePasswordChangeForm,
  onCancelPasswordChange,
  onPasswordChange,
  onEmailChange,
}: AccountSettingsViewProps) {
  return (
    <div className="flex-1">
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
          <Card>
            <CardHeader>
              <CardTitle>Account information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizerName">Your name</Label>
                <div className="max-w-sm relative">
                  <Input
                    id="organizerName"
                    value={organizerName}
                    onChange={(e) => onOrganizerNameChange(e.target.value)}
                    onBlur={onOrganizerNameBlur}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                  {isSavingName && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Saves automatically</p>
              </div>

              <div>
                <Label>Email</Label>
                <div className="max-w-sm">
                  <Input value={userEmail} disabled className="mt-2 bg-muted" />
                </div>
                <button
                  type="button"
                  onClick={onToggleEmailChangeForm}
                  className="text-xs text-primary hover:underline mt-1 block"
                >
                  {showEmailChangeForm ? 'Cancel' : 'Change email'}
                </button>

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
                        onChange={(e) => onNewEmailChange(e.target.value)}
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
                        onChange={(e) => onEmailChangePasswordChange(e.target.value)}
                        placeholder="Enter current password"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={onEmailChange} disabled={isChangingEmail} variant="outline" size="sm">
                        {isChangingEmail ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing...</>
                        ) : (
                          'Change email'
                        )}
                      </Button>
                      <Button onClick={onCancelEmailChange} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Password</Label>
                <div className="max-w-sm">
                  <Input value="••••••••" disabled className="mt-2 bg-muted" />
                </div>
                <button
                  type="button"
                  onClick={onTogglePasswordChangeForm}
                  className="text-xs text-primary hover:underline mt-1 block"
                >
                  {showPasswordChangeForm ? 'Cancel' : 'Change password'}
                </button>

                {showPasswordChangeForm && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => onCurrentPasswordChange(e.target.value)}
                        placeholder="Enter current password"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => onNewPasswordChange(e.target.value)}
                        placeholder="Enter new password"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm new password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => onConfirmPasswordChange(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={onPasswordChange} disabled={isChangingPassword} variant="outline" size="sm">
                        {isChangingPassword ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing...</>
                        ) : (
                          'Change password'
                        )}
                      </Button>
                      <Button onClick={onCancelPasswordChange} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}

export function AccountSettings({ accessToken, userEmail, onBack, onProfileUpdate }: AccountSettingsProps) {
  const [organizerName, setOrganizerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const lastSavedNameRef = useRef<string>('');

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
        const loadedName = result.profile?.organizerName || '';
        setOrganizerName(loadedName);
        lastSavedNameRef.current = loadedName;
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

  const handleNameBlur = async () => {
    const trimmed = organizerName.trim();
    if (trimmed === lastSavedNameRef.current) return;
    if (!trimmed) {
      toast.error('Name is required');
      setOrganizerName(lastSavedNameRef.current);
      return;
    }

    setIsSavingName(true);
    try {
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify({ organizerName: trimmed }),
        },
        accessToken
      );

      if (response.ok) {
        lastSavedNameRef.current = trimmed;
        if (trimmed !== organizerName) setOrganizerName(trimmed);
        toast.success('Name saved');

        const currentUser = localStorage.getItem('oliwonder_current_user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          userData.organizerName = trimmed;
          localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));
        }
        if (onProfileUpdate) onProfileUpdate({ organizerName: trimmed });
      } else {
        const errorText = await response.text();
        errorLog('Failed to save name:', response.status, errorText);
        toast.error('Failed to save name');
        setOrganizerName(lastSavedNameRef.current);
      }
    } catch (error) {
      errorLog('Error saving name:', error);
      toast.error('Error saving name. Please try again.');
      setOrganizerName(lastSavedNameRef.current);
    } finally {
      setIsSavingName(false);
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
        // Clear password fields and collapse the form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChangeForm(false);
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
    <AccountSettingsView
      userEmail={userEmail}
      organizerName={organizerName}
      isLoading={isLoading}
      isSavingName={isSavingName}
      isChangingPassword={isChangingPassword}
      isChangingEmail={isChangingEmail}
      showEmailChangeForm={showEmailChangeForm}
      showPasswordChangeForm={showPasswordChangeForm}
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      newEmail={newEmail}
      emailChangePassword={emailChangePassword}
      onOrganizerNameChange={setOrganizerName}
      onOrganizerNameBlur={handleNameBlur}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onNewEmailChange={setNewEmail}
      onEmailChangePasswordChange={setEmailChangePassword}
      onToggleEmailChangeForm={() => setShowEmailChangeForm(!showEmailChangeForm)}
      onCancelEmailChange={() => {
        setShowEmailChangeForm(false);
        setNewEmail('');
        setEmailChangePassword('');
      }}
      onTogglePasswordChangeForm={() => {
        setShowPasswordChangeForm(!showPasswordChangeForm);
        if (showPasswordChangeForm) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }}
      onCancelPasswordChange={() => {
        setShowPasswordChangeForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }}
      onPasswordChange={handlePasswordChange}
      onEmailChange={handleEmailChange}
    />
  );
}

