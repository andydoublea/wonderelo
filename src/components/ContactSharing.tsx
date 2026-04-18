import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { WondereloHeader } from './WondereloHeader';

const FEEDBACK_OPTIONS = [
  { id: 'nice-talk', label: 'Nice talk', icon: '💬' },
  { id: 'very-interesting', label: 'Very interesting person', icon: '✨' },
  { id: 'continue-chat', label: "I'd like to continue the chat", icon: '🔄' },
  { id: 'very-nice', label: "You're very nice", icon: '😊' },
  { id: 'not-my-type', label: 'Not quite my type', icon: '🤷' },
  { id: 'awkward', label: 'A bit awkward', icon: '😬' },
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

  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-12">
        {/* Headline */}
        <h1 className="text-4xl font-bold mb-4">
          How was your conversation?
        </h1>

        {/* Psychological insight */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 max-w-md mx-auto text-left">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Did you know?</span> Research shows we consistently underestimate how much others enjoyed talking to us. If you enjoyed the conversation, let the other person know — they probably feel the same way!
          </p>
        </div>

        {/* Partner cards with feedback + contact sharing */}
        <div className="space-y-6 max-w-md mx-auto">
          {networkingData.partners.map((partner) => (
            <div
              key={partner.id}
              className="border-2 rounded-2xl overflow-hidden"
            >
              {/* Partner header */}
              <div className="p-4 pb-3">
                <p className="text-xl font-bold text-left">
                  {partner.firstName} {partner.lastName}
                </p>
              </div>

              {/* Feedback buttons */}
              <div className="px-4 pb-3">
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

              {/* Custom feedback */}
              <div className="px-4 pb-3">
                <Textarea
                  placeholder="Write your own feedback (optional)"
                  value={customFeedback[partner.id] || ''}
                  onChange={(e) => setCustomFeedback(prev => ({ ...prev, [partner.id]: e.target.value }))}
                  className="text-sm resize-none h-16"
                />
              </div>

              {/* Contact sharing toggle */}
              <div className="px-4 pb-4 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium">Share my contact</p>
                    <p className="text-xs text-muted-foreground">Both must agree to exchange contacts</p>
                  </div>
                  <Switch
                    checked={contactSharing[partner.id] || false}
                    onCheckedChange={() => handleContactSharingToggle(partner.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info box about feedback & contacts delivery */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 mt-8 max-w-md mx-auto text-left">
          <p className="text-sm text-muted-foreground">
            Feedback and contacts will be shared after 15 minutes.
          </p>
        </div>

        {/* Wonderelo feedback section */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4">How was your Wonderelo experience?</h2>

            <div className="flex justify-center gap-4 mb-4">
              {[
                { id: 'sad', emoji: '😞', label: 'Not great' },
                { id: 'neutral', emoji: '😐', label: 'Okay' },
                { id: 'happy', emoji: '😊', label: 'Great!' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setWondereloRating(wondereloRating === option.id ? null : option.id)}
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
              onChange={(e) => setWondereloFeedback(e.target.value)}
              className="text-sm resize-none h-20"
            />
          </div>
        </div>

        {/* Finish button (not sticky) */}
        <div className="mt-8 max-w-md mx-auto">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Finish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
