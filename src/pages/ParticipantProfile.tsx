import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PdNav } from '../components/redesign/PdNav';
import { ParticipantLayout } from '../components/ParticipantLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Mail, Phone, Loader2, Check, X, ArrowLeft, User, ChevronsUpDown, Linkedin, Instagram, Globe } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';
import { COUNTRY_CODES, flagForPrefix } from '../utils/countryCodes';

export interface ParticipantProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  linkedinUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  otherSocial: string;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface ParticipantProfileViewProps {
  formData: ParticipantProfileFormData;
  error: string;
  success: string;
  saving: boolean;
  hasChanges: boolean;
  phoneCountryOpen: boolean;
  onPhoneCountryOpenChange: (open: boolean) => void;
  onFieldChange: (field: keyof ParticipantProfileFormData, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  onBack: () => void;
}

export function ParticipantProfileView({
  formData,
  error,
  success,
  saving,
  hasChanges,
  phoneCountryOpen,
  onPhoneCountryOpenChange,
  onFieldChange,
  onSave,
  onCancel,
  onBack,
}: ParticipantProfileViewProps) {
  const Ico = {
    back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/></svg>,
    mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>,
    linkedin: <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3s-2.3 1.57-2.3 3.2V21H9z"/></svg>,
    instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>,
    globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>,
    other: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  const field = (key: keyof ParticipantProfileFormData, label: string, icon: JSX.Element, type: string, placeholder: string, full: boolean, hint?: string) => (
    <div className={`ac-field${full ? ' full' : ''}`}>
      <label className="ac-label">{label}</label>
      <div className="ac-input">{icon}<input type={type} placeholder={placeholder} value={formData[key] || ''} onChange={(e) => onFieldChange(key, e.target.value)} disabled={saving} /></div>
      {hint && <span className="ac-hint">{hint}</span>}
    </div>
  );
  return (
    <div className="wonderelo pa-page" data-active="profile">
      <div className="ac-shell">
        <PdNav
          firstName={formData.firstName}
          lastName={formData.lastName}
          onBrandClick={onBack}
          onDashboard={onBack}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="profile">
          <button className="ac-back" type="button" onClick={onBack}>{Ico.back}Back to dashboard</button>
          <div className="ac-head">
            <span className="ac-eyebrow">Your account</span>
            <h1 className="ac-title">Profile <em>settings</em></h1>
            <p className="ac-sub">Update the contact details we use to match you and that you can share with the people you meet.</p>
          </div>
          <form className="ac-card" onSubmit={onSave}>
            <h2 className="ac-card-title">Personal information</h2>
            <p className="ac-card-note">Your name is shown when we match you with other participants — please use your real name.</p>
            <div className="ac-grid2">
              {field('firstName', 'First name', Ico.user, 'text', 'Andy', false)}
              {field('lastName', 'Last name', Ico.user, 'text', 'Abel', false)}
              {field('email', 'Email address', Ico.mail, 'email', 'you@gmail.com', true, 'You can share this with your match if you choose to.')}
              <div className="ac-field full">
                <label className="ac-label">Phone number</label>
                <div className="ac-input is-focus"><span className="prefix">{flagForPrefix(formData.phoneCountry)} {formData.phoneCountry}</span><input type="tel" placeholder="903 555 218" value={formData.phone || ''} onChange={(e) => onFieldChange('phone', e.target.value)} disabled={saving} /></div>
                <span className="ac-hint">We send a reminder 5 minutes before the round starts.</span>
              </div>
            </div>
            <div className="ac-section-label">Social links <span style={{ fontWeight: 500, color: 'rgba(43,24,16,.45)', fontSize: 12 }}>— optional</span></div>
            <p className="ac-card-note" style={{ marginTop: 4 }}>If you add these, they're shared along with your email and phone when you and a partner exchange contacts.</p>
            <div className="ac-grid2">
              {field('linkedinUrl', 'LinkedIn', Ico.linkedin, 'url', 'linkedin.com/in/…', true)}
              {field('instagramUrl', 'Instagram', Ico.instagram, 'url', 'instagram.com/…', true)}
              {field('websiteUrl', 'Website', Ico.globe, 'url', 'https://…', false)}
              {field('otherSocial', 'Other', Ico.other, 'text', '@handle or URL', false)}
            </div>
            {error && <p className="ac-hint" style={{ color: 'var(--w-destructive)' }}>{error}</p>}
            {success && <p className="ac-hint" style={{ color: 'var(--w-success)' }}>{success}</p>}
            <div className="ac-actions">
              <button className="ac-btn is-outline" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
              <button className="ac-btn is-primary" type="submit" disabled={saving || !hasChanges}>{Ico.check}{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
        <footer className="ac-footer">
          <a className="ac-brand"><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
          <p className="tagline">Break your bubble, meet new people</p>
          <p className="copy">© 2026 Wonderelo</p>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

export default function ParticipantProfile() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem(`participant_profile_${token}`);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          phoneCountry: data.phoneCountry || '+421',
          linkedinUrl: data.linkedinUrl || '',
          instagramUrl: data.instagramUrl || '',
          websiteUrl: data.websiteUrl || '',
          otherSocial: data.otherSocial || '',
          hasCache: true
        };
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneCountry: '+421',
      linkedinUrl: '',
      instagramUrl: '',
      websiteUrl: '',
      otherSocial: '',
      hasCache: false
    };
  };

  const cachedProfile = getCachedProfile();

  const [loading, setLoading] = useState(!cachedProfile.hasCache);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);

  const [profile, setProfile] = useState<ParticipantProfileFormData>({
    firstName: cachedProfile.firstName,
    lastName: cachedProfile.lastName,
    email: cachedProfile.email,
    phone: cachedProfile.phone,
    phoneCountry: cachedProfile.phoneCountry,
    linkedinUrl: cachedProfile.linkedinUrl,
    instagramUrl: cachedProfile.instagramUrl,
    websiteUrl: cachedProfile.websiteUrl,
    otherSocial: cachedProfile.otherSocial,
  });

  const [formData, setFormData] = useState<ParticipantProfileFormData>({
    firstName: cachedProfile.firstName,
    lastName: cachedProfile.lastName,
    email: cachedProfile.email,
    phone: cachedProfile.phone,
    phoneCountry: cachedProfile.phoneCountry,
    linkedinUrl: cachedProfile.linkedinUrl,
    instagramUrl: cachedProfile.instagramUrl,
    websiteUrl: cachedProfile.websiteUrl,
    otherSocial: cachedProfile.otherSocial,
  });

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const loadProfile = async () => {
    try {
      if (!cachedProfile.hasCache) {
        setLoading(true);
      }
      setError('');

      const response = await fetch(
        `${apiBaseUrl}/p/${token}/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();

      if (data.success) {
        const loaded = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          phoneCountry: data.phoneCountry || '+421',
          linkedinUrl: data.linkedinUrl || '',
          instagramUrl: data.instagramUrl || '',
          websiteUrl: data.websiteUrl || '',
          otherSocial: data.otherSocial || '',
        };
        setProfile(loaded);
        setFormData(loaded);
        localStorage.setItem(`participant_profile_${token}`, JSON.stringify(data));
      }
    } catch (err) {
      errorLog('Error loading profile:', err);
      if (!cachedProfile.hasCache) {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.phone) {
      setError('Phone number is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${apiBaseUrl}/p/${token}/update-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            phoneCountry: formData.phoneCountry,
            linkedinUrl: formData.linkedinUrl,
            instagramUrl: formData.instagramUrl,
            websiteUrl: formData.websiteUrl,
            otherSocial: formData.otherSocial,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setProfile({ ...formData });

      const updatedCache = {
        ...JSON.parse(localStorage.getItem(`participant_profile_${token}`) || '{}'),
        ...formData,
      };
      localStorage.setItem(`participant_profile_${token}`, JSON.stringify(updatedCache));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      errorLog('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    formData.firstName !== profile.firstName ||
    formData.lastName !== profile.lastName ||
    formData.email !== profile.email ||
    formData.phone !== profile.phone ||
    formData.phoneCountry !== profile.phoneCountry ||
    formData.linkedinUrl !== profile.linkedinUrl ||
    formData.instagramUrl !== profile.instagramUrl ||
    formData.websiteUrl !== profile.websiteUrl ||
    formData.otherSocial !== profile.otherSocial;

  const handleFieldChange = (field: keyof ParticipantProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (loading) {
    return (
      <div className="wonderelo pa-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--w-orange)' }} />
      </div>
    );
  }

  return (
    <ParticipantProfileView
      formData={formData}
      error={error}
      success={success}
      saving={saving}
      hasChanges={hasChanges}
      phoneCountryOpen={phoneCountryOpen}
      onPhoneCountryOpenChange={setPhoneCountryOpen}
      onFieldChange={handleFieldChange}
      onSave={handleSave}
      onCancel={() => {
        setFormData({ ...profile });
        setError('');
      }}
      onBack={() => navigate(`/p/${token}`)}
    />
  );
}
