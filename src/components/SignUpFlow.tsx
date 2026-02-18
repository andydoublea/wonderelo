import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ServiceType } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface SignUpData {
  email: string;
  password: string;
  serviceType: ServiceType;
  urlSlug: string;
  discoverySource: string;
  companySize: string;
  userRole: string;
  organizerName: string;
  eventType: string;
  eventTypeOther: string;
}

interface SignUpFlowProps {
  onComplete: (data: SignUpData) => void;
  onBack: () => void;
  onSwitchToSignIn?: () => void;
}

const companySizeOptions = [
  { value: '1', label: 'Just me' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' }
];

const roleOptions = [
  { value: 'founder', label: 'Founder/Co-founder' },
  { value: 'ceo', label: 'CEO/Executive' },
  { value: 'marketing', label: 'Marketing manager' },
  { value: 'events', label: 'Events manager' },
  { value: 'operations', label: 'Operations manager' },
  { value: 'business-dev', label: 'Business development' },
  { value: 'community', label: 'Community manager' },
  { value: 'other', label: 'Other' }
];

const eventTypeOptions = [
  { value: 'conference', label: 'Conference or barcamp' },
  { value: 'community-meetup', label: 'Community meetup' },
  { value: 'student-hall', label: 'Student hall networking' },
  { value: 'party', label: 'Party' },
  { value: 'festival', label: 'Festival' },
  { value: 'company-event', label: 'Company event' },
  { value: 'company-team', label: 'Company team networking' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'dating', label: 'Dating' },
  { value: 'bar-cafe', label: 'Bar or Café event (e.g. board game night)' },
  { value: 'other', label: 'Other (please describe)' }
];

const discoveryOptions = [
  { value: 'search', label: 'Google search' },
  { value: 'social', label: 'Social media' },
  { value: 'referral', label: 'Friend/colleague referral' },
  { value: 'conference', label: 'Conference/event' },
  { value: 'blog', label: 'Blog/article' },
  { value: 'partner', label: 'Partner/integration' },
  { value: 'other', label: 'Other' }
];

export function SignUpFlow({ onComplete, onBack, onSwitchToSignIn }: SignUpFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const emailTimeoutRef = useRef<NodeJS.Timeout>();
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    serviceType: 'event',
    urlSlug: '',
    discoverySource: '',
    companySize: '',
    userRole: '',
    organizerName: '',
    eventType: '',
    eventTypeOther: ''
  });

  const totalSteps = 4;

  // Function to remove diacritics and convert to URL-friendly slug
  const removeDiacritics = (str: string): string => {
    const diacriticsMap: { [key: string]: string } = {
      'á': 'a', 'ä': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
      'č': 'c', 'ç': 'c', 'ć': 'c',
      'ď': 'd', 'đ': 'd',
      'é': 'e', 'ě': 'e', 'ë': 'e', 'è': 'e', 'ê': 'e',
      'í': 'i', 'ï': 'i', 'ì': 'i', 'î': 'i',
      'ľ': 'l', 'ĺ': 'l', 'ł': 'l',
      'ň': 'n', 'ñ': 'n', 'ń': 'n',
      'ó': 'o', 'ö': 'o', 'ô': 'o', 'ò': 'o', 'õ': 'o', 'ø': 'o',
      'ř': 'r', 'ŕ': 'r',
      'š': 's', 'ś': 's',
      'ť': 't',
      'ú': 'u', 'ů': 'u', 'ü': 'u', 'ù': 'u', 'û': 'u',
      'ý': 'y', 'ÿ': 'y',
      'ž': 'z', 'ź': 'z', 'ż': 'z',
      'Á': 'a', 'Ä': 'a', 'À': 'a', 'Â': 'a', 'Ã': 'a', 'Å': 'a',
      'Č': 'c', 'Ç': 'c', 'Ć': 'c',
      'Ď': 'd', 'Đ': 'd',
      'É': 'e', 'Ě': 'e', 'Ë': 'e', 'È': 'e', 'Ê': 'e',
      'Í': 'i', 'Ï': 'i', 'Ì': 'i', 'Î': 'i',
      'Ľ': 'l', 'Ĺ': 'l', 'Ł': 'l',
      'Ň': 'n', 'Ñ': 'n', 'Ń': 'n',
      'Ó': 'o', 'Ö': 'o', 'Ô': 'o', 'Ò': 'o', 'Õ': 'o', 'Ø': 'o',
      'Ř': 'r', 'Ŕ': 'r',
      'Š': 's', 'Ś': 's',
      'Ť': 't',
      'Ú': 'u', 'Ů': 'u', 'Ü': 'u', 'Ù': 'u', 'Û': 'u',
      'Ý': 'y', 'Ÿ': 'y',
      'Ž': 'z', 'Ź': 'z', 'Ż': 'z'
    };

    return str
      .split('')
      .map(char => diacriticsMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/\s+/g, '') // Remove spaces completely
      .replace(/[^a-z0-9]/g, '') // Remove all special characters
      .trim(); // Remove leading/trailing whitespace
  };

  const updateFormData = (field: keyof SignUpData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check URL slug availability when it changes
    if (field === 'urlSlug' && value.length >= 3) {
      checkSlugAvailability(value);
    } else if (field === 'urlSlug') {
      setSlugCheckStatus('idle');
    }

    // Check email availability when it changes (with debounce)
    if (field === 'email') {
      // Clear previous timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
      
      // Reset status immediately
      setEmailCheckStatus('idle');
      
      // Check if email format is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && emailRegex.test(value)) {
        // Set debounced check
        emailTimeoutRef.current = setTimeout(() => {
          checkEmailAvailability(value);
        }, 500); // 500ms debounce
      }
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    setSlugCheckStatus('checking');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/check-slug/${slug}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSlugCheckStatus(result.available ? 'available' : 'taken');
      } else {
        errorLog('Failed to check slug availability');
        setSlugCheckStatus('idle');
      }
    } catch (error) {
      errorLog('Error checking slug availability:', error);
      setSlugCheckStatus('idle');
    }
  };

  const checkEmailAvailability = async (email: string) => {
    setEmailCheckStatus('checking');
    try {
      debugLog('Checking email availability:', email);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/check-email/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      debugLog('Email check response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        debugLog('Email check result:', result);
        setEmailCheckStatus(result.available ? 'available' : 'taken');
      } else {
        const errorText = await response.text();
        errorLog('Failed to check email availability:', response.status, errorText);
        setEmailCheckStatus('idle');
      }
    } catch (error) {
      errorLog('Error checking email availability:', error);
      setEmailCheckStatus('idle');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // Email must be available, password must be valid, and organizer name must be provided
        const emailValid = formData.email && emailCheckStatus === 'available';
        const passwordValid = formData.password.length >= 6;
        const organizerNameValid = formData.organizerName && formData.organizerName.trim().length > 0;
        return emailValid && passwordValid && organizerNameValid;
      case 2:
        return formData.urlSlug && formData.urlSlug.length >= 3 && slugCheckStatus === 'available';
      case 3:
        return formData.discoverySource;
      case 4:
        const eventTypeValid = formData.eventType && (formData.eventType !== 'other' || formData.eventTypeOther.trim().length > 0);
        return formData.companySize && formData.userRole && eventTypeValid;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        onComplete(formData);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      errorLog('Sign up error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Create your account';
      case 2: return 'Choose your URL';
      case 3: return 'How did you hear about us?';
      case 4: return 'About your organization';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Get started with your Oliwonder account';
      case 2: return 'Your unique URL for participants to join';
      case 3: return 'Help us understand how you discovered Oliwonder';
      case 4: return 'Tell us about your organization and role';
      default: return '';
    }
  };

  // Auto-populate URL slug from organizer name when entering Step 2
  useEffect(() => {
    if (currentStep === 2 && !formData.urlSlug && formData.organizerName) {
      const suggestedSlug = removeDiacritics(formData.organizerName);
      if (suggestedSlug) {
        updateFormData('urlSlug', suggestedSlug);
      }
    }
  }, [currentStep]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h2 className="text-primary cursor-pointer" onClick={onBack}>Oliwonder</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                Back to home
              </Button>
              {onSwitchToSignIn && (
                <Button variant="outline" onClick={onSwitchToSignIn}>
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2">
              Sign up
            </h1>
            <div className="flex justify-center space-x-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                    />
                    {formData.email && (
                      <div className="text-sm">
                        {emailCheckStatus === 'checking' && (
                          <p className="text-muted-foreground flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Checking availability...
                          </p>
                        )}
                        {emailCheckStatus === 'available' && (
                          <p className="text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Email is available
                          </p>
                        )}
                        {emailCheckStatus === 'taken' && (
                          <p className="text-destructive flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            Email is already registered
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formData.password && formData.password.length < 6 && (
                      <p className="text-sm text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerName">Your name</Label>
                    <Input
                      id="organizerName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.organizerName}
                      onChange={(e) => updateFormData('organizerName', e.target.value)}
                    />
                    {formData.organizerName && formData.organizerName.trim().length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Name is required
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="urlSlug">URL slug</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground text-sm">wonderelo.com/</span>
                      <Input
                        id="urlSlug"
                        placeholder="my-awesome-venue"
                        value={formData.urlSlug}
                        onChange={(e) => updateFormData('urlSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="flex-1"
                      />
                    </div>
                    {formData.urlSlug && formData.urlSlug.length < 3 && (
                      <p className="text-sm text-muted-foreground">
                        URL must be at least 3 characters
                      </p>
                    )}
                    {formData.urlSlug && formData.urlSlug.length >= 3 && (
                      <div className="text-sm">
                        {slugCheckStatus === 'checking' && (
                          <p className="text-muted-foreground flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Checking availability...
                          </p>
                        )}
                        {slugCheckStatus === 'available' && (
                          <p className="text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            wonderelo.com/{formData.urlSlug} is available
                          </p>
                        )}
                        {slugCheckStatus === 'taken' && (
                          <p className="text-destructive flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            wonderelo.com/{formData.urlSlug} is already taken
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <RadioGroup
                    value={formData.discoverySource}
                    onValueChange={(value) => updateFormData('discoverySource', value)}
                    className="space-y-2"
                  >
                    {discoveryOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 rounded-lg border p-2 hover:bg-accent/50 transition-colors"
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer flex-1">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">What best describes what you organise?</Label>
                    <Select value={formData.eventType} onValueChange={(value) => updateFormData('eventType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.eventType === 'other' && (
                      <Input
                        placeholder="Please describe your event type"
                        value={formData.eventTypeOther}
                        onChange={(e) => updateFormData('eventTypeOther', e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company size</Label>
                    <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Your role</Label>
                    <Select value={formData.userRole} onValueChange={(value) => updateFormData('userRole', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button onClick={nextStep} disabled={!isStepValid()}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!isStepValid() || isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}