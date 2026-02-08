import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ParticipantLayout } from '../components/ParticipantLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Mail, Phone, Loader2, Check, X, ArrowLeft, User, ChevronsUpDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

// Country codes with phone prefixes and placeholder formats
const COUNTRY_CODES = [
  { code: 'SK', name: 'Slovakia', prefix: '+421', placeholder: '912 345 678' },
  { code: 'CZ', name: 'Czech Republic', prefix: '+420', placeholder: '601 234 567' },
  { code: 'AT', name: 'Austria', prefix: '+43', placeholder: '664 1234567' },
  { code: 'DE', name: 'Germany', prefix: '+49', placeholder: '151 23456789' },
  { code: 'PL', name: 'Poland', prefix: '+48', placeholder: '601 234 567' },
  { code: 'HU', name: 'Hungary', prefix: '+36', placeholder: '20 123 4567' },
  { code: 'US', name: 'United States', prefix: '+1', placeholder: '(555) 123-4567' },
  { code: 'GB', name: 'United Kingdom', prefix: '+44', placeholder: '7400 123456' },
  { code: 'FR', name: 'France', prefix: '+33', placeholder: '6 12 34 56 78' },
  { code: 'ES', name: 'Spain', prefix: '+34', placeholder: '612 34 56 78' },
  { code: 'IT', name: 'Italy', prefix: '+39', placeholder: '312 345 6789' },
  { code: 'NL', name: 'Netherlands', prefix: '+31', placeholder: '6 12345678' },
  { code: 'BE', name: 'Belgium', prefix: '+32', placeholder: '470 12 34 56' },
  { code: 'CH', name: 'Switzerland', prefix: '+41', placeholder: '78 123 45 67' },
  { code: 'SE', name: 'Sweden', prefix: '+46', placeholder: '70 123 45 67' },
  { code: 'NO', name: 'Norway', prefix: '+47', placeholder: '406 12 345' },
  { code: 'DK', name: 'Denmark', prefix: '+45', placeholder: '32 12 34 56' },
  { code: 'FI', name: 'Finland', prefix: '+358', placeholder: '40 1234567' },
  { code: 'IE', name: 'Ireland', prefix: '+353', placeholder: '85 123 4567' }
];

export default function ParticipantProfile() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Initialize from cached data in localStorage for instant display
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
      hasCache: false
    };
  };
  
  const cachedProfile = getCachedProfile();
  
  // Only show loading if we don't have cached data
  const [loading, setLoading] = useState(!cachedProfile.hasCache);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: cachedProfile.firstName,
    lastName: cachedProfile.lastName,
    email: cachedProfile.email,
    phone: cachedProfile.phone,
    phoneCountry: cachedProfile.phoneCountry
  });
  
  const [formData, setFormData] = useState({
    firstName: cachedProfile.firstName,
    lastName: cachedProfile.lastName,
    email: cachedProfile.email,
    phone: cachedProfile.phone,
    phoneCountry: cachedProfile.phoneCountry
  });

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const loadProfile = async () => {
    try {
      // Don't show loading spinner if we have cached data - just refresh in background
      if (!cachedProfile.hasCache) {
        setLoading(true);
      }
      setError('');

      // OPTIMIZATION: Use dashboard endpoint for faster loading
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/dashboard`,
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
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          phoneCountry: data.phoneCountry || '+421'
        });
        
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          phoneCountry: data.phoneCountry || '+421'
        });
        
        // Cache the profile data in localStorage
        localStorage.setItem(`participant_profile_${token}`, JSON.stringify(data));
      }
    } catch (err) {
      errorLog('Error loading profile:', err);
      // Only show error if we don't have cached data to fall back on
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
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/update-profile`,
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
            phoneCountry: formData.phoneCountry
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry
      });
      
      // Update cache
      const updatedCache = {
        ...JSON.parse(localStorage.getItem(`participant_profile_${token}`) || '{}'),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry
      };
      localStorage.setItem(`participant_profile_${token}`, JSON.stringify(updatedCache));
      
      // Clear success message after 3 seconds
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
    formData.phoneCountry !== profile.phoneCountry;

  if (loading) {
    return (
      <ParticipantLayout
        participantToken={token}
        firstName={profile.firstName}
        lastName={profile.lastName}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout
      participantToken={token}
      firstName={profile.firstName}
      lastName={profile.lastName}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/p/${token}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Profile settings</h1>
          <p className="text-muted-foreground">
            Update your contact information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* First Name and Last Name - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (error) setError('');
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your name is shown when we match you with other participants. Please use your real name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (error) setError('');
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (error) setError('');
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can share this contact with your match if you choose to.
                  </p>
                </div>
                <div></div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number *</Label>
                  <div className="flex gap-2">
                    <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={phoneCountryOpen}
                          className="w-[120px] justify-between"
                          disabled={saving}
                          type="button"
                        >
                          {formData.phoneCountry}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {COUNTRY_CODES.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={`${country.name} ${country.prefix}`}
                                  onSelect={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      phoneCountry: country.prefix
                                    }));
                                    setPhoneCountryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      formData.phoneCountry === country.prefix
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex items-center justify-between w-full">
                                    <span>{country.name}</span>
                                    <span className="text-muted-foreground ml-2">{country.prefix}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={COUNTRY_CODES.find(c => c.prefix === formData.phoneCountry)?.placeholder || '123 456 789'}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (error) setError('');
                        }}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We send a reminder 5 minutes before the round. You can share this contact with your match if you choose to.
                  </p>
                </div>
                <div></div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      phone: profile.phone,
                      phoneCountry: profile.phoneCountry
                    });
                    setError('');
                  }}
                  disabled={!hasChanges || saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!hasChanges || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ParticipantLayout>
  );
}