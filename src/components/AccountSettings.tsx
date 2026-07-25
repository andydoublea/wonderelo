import { useState, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { C, PageShell, PageHead, Italic } from './redesign/organizerAtoms';

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
  isSaving: boolean;
  isChangingPassword: boolean;
  isChangingEmail: boolean;
  showEmailChangeForm: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;
  emailChangePassword: string;
  onOrganizerNameChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNewEmailChange: (value: string) => void;
  onEmailChangePasswordChange: (value: string) => void;
  onToggleEmailChangeForm: () => void;
  onCancelEmailChange: () => void;
  onSave: () => void;
  onPasswordChange: () => void;
  onEmailChange: () => void;
}

// ============================================================
// Redesigned field atoms
// Ported from design/v06/project/pages/screen-account-billing.jsx
// (AccountSettingsScreen). Defined at module scope so controlled
// inputs keep focus across re-renders.
// ============================================================

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: 'block', fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </span>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p style={{ margin: '7px 0 0', fontSize: 11.5, color: C.ink, opacity: .6 }}>{children}</p>;
}

function LinkBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'block', marginTop: 8, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: C.fontBody, fontSize: 12.5, fontWeight: 600, color: C.orange,
    }}>{children}</button>
  );
}

function ActionBtn({ children, outline, onClick, disabled }: { children: ReactNode; outline?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', padding: '9px 16px', borderRadius: 10,
      background: 'transparent',
      color: C.purpleDeep,
      border: outline ? `1.5px solid ${C.hairStrong}` : '1px solid transparent',
      opacity: disabled ? .55 : (outline ? 1 : .8),
    }}>{children}</button>
  );
}

function InlineForm({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 380, marginTop: 16, padding: 18, borderRadius: 12, background: 'rgba(76,25,77,.04)', border: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  );
}

// Controlled input styled to match the mock's <Field>. Focus state is real
// (drives the orange ring), unlike the static `focused` prop in the mock.
function TextField({ value, onChange, placeholder, type = 'text', disabled = false }: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused && !disabled;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11,
      background: disabled ? C.cream : '#fff',
      border: `1.5px solid ${active ? C.orange : C.hairStrong}`,
      boxShadow: active ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
      transition: 'border-color .15s, box-shadow .15s',
    }}>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: C.fontBody, fontSize: 14, color: disabled ? 'rgba(58,46,52,.55)' : C.ink, minWidth: 0,
        }}
      />
    </div>
  );
}

export function AccountSettingsView({
  userEmail,
  organizerName,
  isLoading,
  isSaving,
  isChangingPassword,
  isChangingEmail,
  showEmailChangeForm,
  currentPassword,
  newPassword,
  confirmPassword,
  newEmail,
  emailChangePassword,
  onOrganizerNameChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onNewEmailChange,
  onEmailChangePasswordChange,
  onToggleEmailChangeForm,
  onCancelEmailChange,
  onSave,
  onPasswordChange,
  onEmailChange,
}: AccountSettingsViewProps) {
  // View-local toggle for the collapsible change-password form (matches the
  // mock). Email uses the prop-driven showEmailChangeForm toggle from the parent.
  const [showPass, setShowPass] = useState(false);

  return (
    // nav={false}: the route (AccountSettingsRoute) and AdminPagePreview already
    // render their own top nav — a second OrgNav here would double the chrome.
    <div className="wonderelo">
      <PageShell nav={false} navActive="Account">
        <PageHead eyebrow="Your account" title={<>Account <Italic>settings</Italic></>} />

        <div style={{ maxWidth: 760 }}>
          <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 28 }}>
            <h3 style={{ margin: '0 0 24px', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Account information</h3>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {[0, 1].map((i) => (
                  <div key={i} style={{ maxWidth: 380 }}>
                    <div style={{ width: 120, height: 11, borderRadius: 6, background: C.hair, marginBottom: 10 }} />
                    <div style={{ height: 44, borderRadius: 11, background: C.hair }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Your name */}
                <div style={{ maxWidth: 380 }}>
                  <FieldLabel>Your name</FieldLabel>
                  <TextField value={organizerName} onChange={onOrganizerNameChange} placeholder="John Doe" />
                </div>

                {/* Email — disabled, with collapsible change form (prop-driven toggle) */}
                <div>
                  <div style={{ maxWidth: 380 }}>
                    <FieldLabel>Email</FieldLabel>
                    <TextField value={userEmail} disabled />
                  </div>
                  <LinkBtn onClick={onToggleEmailChangeForm}>{showEmailChangeForm ? 'Cancel' : 'Change email'}</LinkBtn>

                  {showEmailChangeForm && (
                    <InlineForm>
                      <p style={{ margin: 0, fontSize: 13, color: C.ink, opacity: .7, lineHeight: 1.5 }}>
                        For security, we'll send a verification email to your new address and notify your current email
                      </p>
                      <div>
                        <FieldLabel>New email</FieldLabel>
                        <TextField type="email" value={newEmail} onChange={onNewEmailChange} placeholder="Enter new email" />
                      </div>
                      <div>
                        <FieldLabel>Current password</FieldLabel>
                        <TextField type="password" value={emailChangePassword} onChange={onEmailChangePasswordChange} placeholder="Enter current password" />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionBtn outline onClick={onEmailChange} disabled={isChangingEmail}>{isChangingEmail ? 'Changing…' : 'Change email'}</ActionBtn>
                        <ActionBtn onClick={onCancelEmailChange}>Cancel</ActionBtn>
                      </div>
                    </InlineForm>
                  )}
                </div>

                {/* Password — masked, with collapsible change form (view-local toggle) */}
                <div>
                  <div style={{ maxWidth: 380 }}>
                    <FieldLabel>Password</FieldLabel>
                    <TextField value="••••••••" disabled />
                  </div>
                  <LinkBtn onClick={() => setShowPass((v) => !v)}>{showPass ? 'Cancel' : 'Change password'}</LinkBtn>

                  {showPass && (
                    <InlineForm>
                      <div>
                        <FieldLabel>Current password</FieldLabel>
                        <TextField type="password" value={currentPassword} onChange={onCurrentPasswordChange} placeholder="Enter current password" />
                      </div>
                      <div>
                        <FieldLabel>New password</FieldLabel>
                        <TextField type="password" value={newPassword} onChange={onNewPasswordChange} placeholder="Enter new password" />
                        <Hint>At least 6 characters</Hint>
                      </div>
                      <div>
                        <FieldLabel>Confirm new password</FieldLabel>
                        <TextField type="password" value={confirmPassword} onChange={onConfirmPasswordChange} placeholder="Confirm new password" />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionBtn outline onClick={onPasswordChange} disabled={isChangingPassword}>{isChangingPassword ? 'Changing…' : 'Change password'}</ActionBtn>
                        <ActionBtn onClick={() => setShowPass(false)}>Cancel</ActionBtn>
                      </div>
                    </InlineForm>
                  )}
                </div>

                {/* Save (persists the organizer name via onSave — preserves original logic) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button type="button" onClick={onSave} disabled={isSaving} style={{
                    fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, cursor: isSaving ? 'default' : 'pointer',
                    padding: '11px 20px', borderRadius: 12, border: '1px solid transparent',
                    background: C.orange, color: '#fff', boxShadow: '0 6px 16px rgba(221,83,28,.25)', opacity: isSaving ? .7 : 1,
                  }}>{isSaving ? 'Saving…' : 'Save changes'}</button>
                </div>

              </div>
            )}
          </section>
        </div>
      </PageShell>
    </div>
  );
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
    <AccountSettingsView
      userEmail={userEmail}
      organizerName={organizerName}
      isLoading={isLoading}
      isSaving={isSaving}
      isChangingPassword={isChangingPassword}
      isChangingEmail={isChangingEmail}
      showEmailChangeForm={showEmailChangeForm}
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      newEmail={newEmail}
      emailChangePassword={emailChangePassword}
      onOrganizerNameChange={setOrganizerName}
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
      onSave={handleSave}
      onPasswordChange={handlePasswordChange}
      onEmailChange={handleEmailChange}
    />
  );
}

