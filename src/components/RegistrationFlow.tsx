import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ArrowLeft, ArrowRight, Check, Mail, Link2, Users, Briefcase, HelpCircle } from 'lucide-react';
import { ServiceType } from '../App';
import { validateEmail } from '../utils/validation';

interface RegistrationData {
  email: string;
  customUrl: string;
  howDidYouHear: string;
  role: string;
  companySize: string;
}

interface RegistrationFlowProps {
  serviceType: ServiceType;
  onComplete: (data: RegistrationData) => void;
  onBack: () => void;
}

export function RegistrationFlow({ serviceType, onComplete, onBack }: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    customUrl: '',
    howDidYouHear: '',
    role: '',
    companySize: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.email && validateEmail(formData.email);
      case 2:
        return formData.customUrl && formData.customUrl.length >= 3;
      case 3:
        return formData.howDidYouHear;
      case 4:
        return formData.role;
      case 5:
        return formData.companySize;
      default:
        return false;
    }
  };

  const generateUrlSuggestion = () => {
    if (formData.email) {
      const emailPrefix = formData.email.split('@')[0];
      const suggestion = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (suggestion && suggestion.length >= 3) {
        updateFormData('customUrl', suggestion);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2>What's your email address?</h2>
              <p className="text-muted-foreground">
                We'll use this to send you important updates about your {serviceType}s
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Link2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2>Choose your custom URL</h2>
              <p className="text-muted-foreground">
                This will be your unique link that participants use to join your networking sessions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customUrl">Custom URL</Label>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">wonderelo.com/</span>
                <Input
                  id="customUrl"
                  placeholder="my-awesome-event"
                  value={formData.customUrl}
                  onChange={(e) => updateFormData('customUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  autoFocus
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Use letters, numbers, and hyphens only. Minimum 3 characters.
              </p>
              {!formData.customUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateUrlSuggestion}
                  className="mt-2"
                >
                  Suggest based on email
                </Button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2>How did you hear about us?</h2>
              <p className="text-muted-foreground">
                Help us understand how people discover Oliwonder
              </p>
            </div>
            <RadioGroup
              value={formData.howDidYouHear}
              onValueChange={(value) => updateFormData('howDidYouHear', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="google" />
                <Label htmlFor="google">Google search</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="social-media" id="social-media" />
                <Label htmlFor="social-media">Social media</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="referral" id="referral" />
                <Label htmlFor="referral">Friend or colleague referral</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conference" id="conference" />
                <Label htmlFor="conference">Conference or event</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blog" id="blog" />
                <Label htmlFor="blog">Blog or article</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2>What's your role?</h2>
              <p className="text-muted-foreground">
                This helps us customize your experience
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event-organizer">Event organizer</SelectItem>
                  <SelectItem value="marketing-manager">Marketing manager</SelectItem>
                  <SelectItem value="community-manager">Community manager</SelectItem>
                  <SelectItem value="venue-owner">Venue owner</SelectItem>
                  <SelectItem value="restaurant-manager">Restaurant manager</SelectItem>
                  <SelectItem value="hr-manager">HR manager</SelectItem>
                  <SelectItem value="ceo-founder">CEO / Founder</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2>How many people work at your organization?</h2>
              <p className="text-muted-foreground">
                This helps us understand your needs better
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Company size</Label>
              <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="just-me">Just me</SelectItem>
                  <SelectItem value="2-10">2-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Progress value={progress} className="mb-4" />
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎯</span>
              Oliwonder
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!isStepValid()}
              >
                {currentStep === totalSteps ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account? <Button variant="link" className="p-0" onClick={onBack}>Sign in</Button>
        </div>
      </div>
    </div>
  );
}