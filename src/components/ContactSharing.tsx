import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { Check, X, Heart, MessageCircle, Sparkles, ThumbsUp } from 'lucide-react';

const FEEDBACK_OPTIONS = [
  { id: 'nice-talk', label: 'Nice talk', icon: '💬' },
  { id: 'very-interesting', label: 'Very interesting person', icon: '✨' },
  { id: 'continue-chat', label: "I'd like to continue the chat", icon: '🔄' },
  { id: 'very-nice', label: "You're very nice", icon: '😊' },
];

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NetworkingData {
  matchId: string;
  partners: Partner[];
  myContactSharing: Record<string, boolean>;
}

export function ContactSharing() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [networkingData, setNetworkingData] = useState<NetworkingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactSharing, setContactSharing] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string[]>>({});
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

  const handleSave = async () => {
    if (!token || !networkingData) return;

    setIsSubmitting(true);
    try {
      debugLog('[ContactSharing] Saving preferences:', contactSharing, 'feedback:', feedback);

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
            feedback,
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    );
  }

  if (isSaved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-2">Saved!</h1>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-32">
        {/* Headline */}
        <h1 className="text-4xl font-bold mb-4">
          How was your conversation?
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Share a quick reaction and decide whether to exchange contacts.
        </p>

        {/* Psychological insight */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-10 max-w-md mx-auto text-left">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Did you know?</span> Research shows we consistently underestimate how much others enjoyed talking to us. Your conversation partner probably liked you more than you think!
          </p>
        </div>

        {/* Partner cards with feedback + contact sharing */}
        <div className="space-y-6 max-w-md mx-auto">
          {networkingData.partners.map((partner) => (
            <div
              key={partner.id}
              className="border-2 rounded-2xl overflow-hidden"
            >
              {/* Partner header with contact toggle */}
              <div className="flex items-center justify-between p-4">
                <div className="text-left">
                  <p className="text-xl font-bold">
                    {partner.firstName} {partner.lastName}
                  </p>
                </div>

                <button
                  onClick={() => handleContactSharingToggle(partner.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                    contactSharing[partner.id]
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-muted text-muted-foreground border-2 border-border'
                  }`}
                >
                  {contactSharing[partner.id] ? (
                    <>
                      <Check className="h-5 w-5" />
                      Share contact
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5" />
                      Don't share
                    </>
                  )}
                </button>
              </div>

              {/* Feedback buttons */}
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2 text-left">Send a quick reaction (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_OPTIONS.map((option) => {
                    const isSelected = (feedback[partner.id] || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleFeedbackToggle(partner.id, option.id)}
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
            </div>
          ))}
        </div>

        {/* Note about contact sharing */}
        <p className="text-sm text-muted-foreground mt-8 max-w-md mx-auto">
          Contacts will only be shared if <strong>both</strong> of you agree. Shared contacts will become visible after 15 minutes.
        </p>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 shadow-lg z-10">
        <div className="max-w-md mx-auto">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
}
