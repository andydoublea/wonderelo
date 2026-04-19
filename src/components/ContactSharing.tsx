import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { WondereloHeader } from './WondereloHeader';

export const FEEDBACK_OPTIONS = [
  { id: 'nice-talk', label: 'Nice talk', icon: '💬' },
  { id: 'very-interesting', label: 'Very interesting person', icon: '✨' },
  { id: 'continue-chat', label: "I'd like to continue the chat", icon: '🔄' },
  { id: 'very-nice', label: "You're very nice", icon: '😊' },
  { id: 'not-my-type', label: 'Not quite my type', icon: '🤷' },
  { id: 'awkward', label: 'A bit awkward', icon: '😬' },
];

export interface ContactSharingPartner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
// Alias kept for existing local usage
type Partner = ContactSharingPartner;

interface NetworkingData {
  matchId: string;
  partners: Partner[];
  myContactSharing: Record<string, boolean>;
}

type Page = 'partner-feedback' | 'wonderelo-feedback';

// ============================================================
// Pure view components (shared with AdminPagePreview)
// ============================================================

export interface ContactSharingPartnerFeedbackViewProps {
  partners: ContactSharingPartner[];
  feedback: Record<string, string[]>;
  customFeedback: Record<string, string>;
  contactSharing: Record<string, boolean>;
  onFeedbackToggle: (partnerId: string, feedbackId: string) => void;
  onCustomFeedbackChange: (partnerId: string, text: string) => void;
  onContactToggle: (partnerId: string) => void;
  onNext: () => void;
}

export function ContactSharingPartnerFeedbackView({
  partners,
  feedback,
  customFeedback,
  contactSharing,
  onFeedbackToggle,
  onCustomFeedbackChange,
  onContactToggle,
  onNext,
}: ContactSharingPartnerFeedbackViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-12">
        <h1 className="text-4xl font-bold mb-2">Time is up!</h1>
        <p className="text-xl text-muted-foreground mb-6">How was your conversation?</p>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 max-w-md mx-auto text-left">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Research shows we consistently underestimate how much others enjoyed talking to us. If you enjoyed the conversation, let the other person know.
          </p>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          {partners.map((partner) => (
            <div key={partner.id} className="border-2 rounded-2xl overflow-hidden">
              <div className="p-4 pb-3">
                <p className="text-xl font-bold text-left">
                  {partner.firstName} {partner.lastName}
                </p>
              </div>

              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground mb-2 text-left">Send a quick reaction (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_OPTIONS.map((option) => {
                    const isSelected = (feedback[partner.id] || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => onFeedbackToggle(partner.id, option.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border ${
                          isSelected
                            ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 pb-3">
                <Textarea
                  placeholder="Write your own feedback (optional)"
                  value={customFeedback[partner.id] || ''}
                  onChange={(e) => onCustomFeedbackChange(partner.id, e.target.value)}
                  className="text-sm resize-none h-16"
                />
              </div>

              <div className="px-4 pb-4 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-sm font-medium">Share my contact</p>
                    <p className="text-xs text-muted-foreground">Both must agree to exchange contacts</p>
                    <p className="text-xs text-muted-foreground mt-1">Feedback and contacts will be shared after 15 minutes.</p>
                  </div>
                  <Switch
                    checked={contactSharing[partner.id] || false}
                    onCheckedChange={() => onContactToggle(partner.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <Button size="lg" className="w-full" onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface ContactSharingWondereloFeedbackViewProps {
  wondereloRating: string | null;
  wondereloFeedback: string;
  isSubmitting: boolean;
  onRatingChange: (rating: string | null) => void;
  onFeedbackChange: (text: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function ContactSharingWondereloFeedbackView({
  wondereloRating,
  wondereloFeedback,
  isSubmitting,
  onRatingChange,
  onFeedbackChange,
  onSave,
  onBack,
}: ContactSharingWondereloFeedbackViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-12">
        <h1 className="text-4xl font-bold mb-10">How was your Wonderelo experience?</h1>

        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-4 mb-6">
            {[
              { id: 'sad', emoji: '😞', label: 'Not great' },
              { id: 'neutral', emoji: '😐', label: 'Okay' },
              { id: 'happy', emoji: '😊', label: 'Great!' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onRatingChange(wondereloRating === option.id ? null : option.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2 ${
                  wondereloRating === option.id
                    ? 'border-primary bg-primary/5 scale-110'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-xs text-muted-foreground">{option.label}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us more (optional)"
            value={wondereloFeedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            className="text-sm resize-none h-24"
          />
        </div>

        <div className="mt-8 max-w-md mx-auto space-y-3">
          <Button size="lg" className="w-full" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Finish'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContactSharing() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<Page>('partner-feedback');
  const [networkingData, setNetworkingData] = useState<NetworkingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactSharing, setContactSharing] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string[]>>({});
  const [customFeedback, setCustomFeedback] = useState<Record<string, string>>({});
  const [wondereloRating, setWondereloRating] = useState<string | null>(null);
  const [wondereloFeedback, setWondereloFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) {
      setError('Invalid participant token');
      setIsLoading(false);
      return;
    }

    try {
      debugLog('[ContactSharing] Loading networking data');

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/networking`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[ContactSharing] Data loaded:', data);

      setNetworkingData(data);

      // Initialize contact sharing preferences
      const initialSharing: Record<string, boolean> = {};
      data.partners.forEach((partner: Partner) => {
        initialSharing[partner.id] = data.myContactSharing?.[partner.id] ?? false;
      });
      setContactSharing(initialSharing);

      setIsLoading(false);
    } catch (err) {
      errorLog('[ContactSharing] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsLoading(false);
    }
  };

  const handleContactSharingToggle = (partnerId: string) => {
    setContactSharing(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  };

  const handleFeedbackToggle = (partnerId: string, feedbackId: string) => {
    setFeedback(prev => {
      const current = prev[partnerId] || [];
      const updated = current.includes(feedbackId)
        ? current.filter(f => f !== feedbackId)
        : [...current, feedbackId];
      return { ...prev, [partnerId]: updated };
    });
  };

  const handleNext = async () => {
    // Save partner feedback + contact sharing preferences NOW (before Wonderelo feedback page),
    // so that even if participant leaves without finishing the Wonderelo rating,
    // their contact-sharing consent still counts. Wonderelo feedback will be saved later on Finish.
    if (!token || !networkingData) {
      setCurrentPage('wonderelo-feedback');
      return;
    }
    try {
      const mergedFeedback: Record<string, string[]> = { ...feedback };
      for (const [partnerId, text] of Object.entries(customFeedback)) {
        if (text.trim()) {
          mergedFeedback[partnerId] = [...(mergedFeedback[partnerId] || []), `custom:${text.trim()}`];
        }
      }
      await fetch(`${apiBaseUrl}/participant/${token}/contact-sharing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: networkingData.matchId,
          preferences: contactSharing,
          feedback: mergedFeedback,
        }),
      });
      debugLog('[ContactSharing] Partner preferences saved on Next');
    } catch (err) {
      errorLog('[ContactSharing] Error saving preferences on Next:', err);
      // Still navigate — we'll retry on Finish
    }
    setCurrentPage('wonderelo-feedback');
  };

  const handleBack = () => {
    setCurrentPage('partner-feedback');
  };

  const handleSave = async () => {
    if (!token || !networkingData) return;

    setIsSubmitting(true);
    try {
      // Merge custom feedback into feedback arrays
      const mergedFeedback: Record<string, string[]> = { ...feedback };
      for (const [partnerId, text] of Object.entries(customFeedback)) {
        if (text.trim()) {
          mergedFeedback[partnerId] = [...(mergedFeedback[partnerId] || []), `custom:${text.trim()}`];
        }
      }

      debugLog('[ContactSharing] Saving preferences:', contactSharing, 'feedback:', mergedFeedback, 'wonderelo:', { wondereloRating, wondereloFeedback });

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/contact-sharing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: networkingData.matchId,
            preferences: contactSharing,
            feedback: mergedFeedback,
            wondereloFeedback: wondereloRating || wondereloFeedback ? {
              rating: wondereloRating,
              text: wondereloFeedback.trim() || undefined,
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save: ${errorText}`);
      }

      debugLog('[ContactSharing] Preferences saved');
      setIsSaved(true);

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate(`/p/${token}?from=match`);
      }, 1500);

    } catch (err) {
      errorLog('[ContactSharing] Error saving:', err);
      alert('Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground mb-6">{error || 'Failed to load data'}</p>
              <Button onClick={() => navigate(`/p/${token}?from=match`)}>
                Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Saved!</h1>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'partner-feedback') {
    return (
      <ContactSharingPartnerFeedbackView
        partners={networkingData.partners}
        feedback={feedback}
        customFeedback={customFeedback}
        contactSharing={contactSharing}
        onFeedbackToggle={handleFeedbackToggle}
        onCustomFeedbackChange={(partnerId, text) =>
          setCustomFeedback(prev => ({ ...prev, [partnerId]: text }))
        }
        onContactToggle={handleContactSharingToggle}
        onNext={handleNext}
      />
    );
  }

  return (
    <ContactSharingWondereloFeedbackView
      wondereloRating={wondereloRating}
      wondereloFeedback={wondereloFeedback}
      isSubmitting={isSubmitting}
      onRatingChange={setWondereloRating}
      onFeedbackChange={setWondereloFeedback}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
