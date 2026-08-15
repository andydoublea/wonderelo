import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { WondereloHeader } from './WondereloHeader';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';
import { cachedRoundNames } from './MatchInfo';
import { StatePlaceholder, Skeleton, SkeletonRow, Spinner, StateButton, RefreshIcon, Italic } from './redesign/StatePlaceholder';

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
  /** Current participant's first name — shown in the nav. */
  myName?: string;
}

type Page = 'partner-feedback' | 'wonderelo-feedback';

// ============================================================
// Pure view components (shared with AdminPagePreview)
// ============================================================

export interface ContactSharingPartnerFeedbackViewProps {
  firstName?: string;
  eventName?: string;
  sessionName?: string;
  partners: ContactSharingPartner[];
  feedback: Record<string, string[]>;
  customFeedback: Record<string, string>;
  contactSharing: Record<string, boolean>;
  onFeedbackToggle: (partnerId: string, feedbackId: string) => void;
  onCustomFeedbackChange: (partnerId: string, text: string) => void;
  onContactToggle: (partnerId: string) => void;
  onNext: () => void;
  onBrandClick?: () => void;
  onDashboard?: () => void;
  onProfile?: () => void;
  onAddressBook?: () => void;
}

export function ContactSharingPartnerFeedbackView({
  firstName,
  eventName,
  sessionName,
  partners,
  feedback,
  customFeedback,
  contactSharing,
  onFeedbackToggle,
  onCustomFeedbackChange,
  onContactToggle,
  onNext,
  onBrandClick,
  onDashboard,
  onProfile,
  onAddressBook,
}: ContactSharingPartnerFeedbackViewProps) {
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  return (
    <div className="wonderelo pm-page" data-active="contact-sharing">
      <div className="pm-shell">
        <PdNav
          firstName={firstName}
          onBrandClick={onBrandClick}
          onDashboard={onDashboard}
          onProfile={onProfile}
          onAddressBook={onAddressBook}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="contact-sharing">
          <div className="pm-warm">
            <div className="pm-band">
              <div className="pm-eventrow"><div className="pm-event"><span className="name">{eventName || 'Your round'}</span><span className="org">{sessionName || 'Speed networking'}</span></div><span className="pm-state is-quiet"><span className="dot" /> Round done</span></div>
            </div>
            <div className="pm-center" style={{ paddingTop: 4 }}>
              <div className="eyebrow" style={{ color: 'var(--w-orange)', justifyContent: 'center' }}>Time is up!</div>
              <h1 className="pm-h1" style={{ marginTop: 10 }}>Enjoyed the conversation? Tell them!</h1>
            </div>
            {partners.map((p) => {
              const isAdding = adding[p.id] || !!customFeedback[p.id];
              return (
              <div className={`cs-pcard${isAdding ? ' is-adding' : ''}`} key={p.id} style={{ marginTop: 18 }}>
                <div className="cs-pname">{p.firstName} {p.lastName}</div>
                <div className="pm-chips" style={{ marginTop: 12 }}>
                  {FEEDBACK_OPTIONS.map((o) => {
                    const on = (feedback[p.id] || []).includes(o.id);
                    return <button type="button" key={o.id} className={`pm-chip${on ? ' is-on' : ''}`} onClick={() => onFeedbackToggle(p.id, o.id)}>{o.icon} {o.label}</button>;
                  })}
                  <button className="pm-addown" type="button" data-addown onClick={() => setAdding((a) => ({ ...a, [p.id]: true }))}>+ Add your own…</button>
                </div>
                <div className="pm-addown-field"><textarea className="pm-textarea" style={{ minHeight: 56 }} placeholder="Your reaction…" value={customFeedback[p.id] || ''} onChange={(e) => onCustomFeedbackChange(p.id, e.target.value)} /></div>
                <div className="cs-share">
                  <div><div className="t">Share my contact</div><div className="s">Both must agree to exchange</div></div>
                  <button type="button" className={`pm-switch${contactSharing[p.id] ? ' is-on' : ''}`} aria-pressed={!!contactSharing[p.id]} onClick={() => onContactToggle(p.id)}><span className="knob" /></button>
                </div>
              </div>
            );})}
          </div>
          <p className="pm-muted" style={{ margin: '16px 2px 0', fontSize: '11.5px', opacity: .6, textAlign: 'center' }}>Feedback and contacts are shared 15 minutes after the round ends.</p>
          <button className="pm-btn is-primary" type="button" style={{ marginTop: 16 }} onClick={onNext}>Next</button>
        </div>
        <PmFooter />
      </div>
    </div>
  );
}

export interface ContactSharingWondereloFeedbackViewProps {
  firstName?: string;
  eventName?: string;
  sessionName?: string;
  wondereloRating: string | null;
  wondereloFeedback: string;
  isSubmitting: boolean;
  onRatingChange: (rating: string | null) => void;
  onFeedbackChange: (text: string) => void;
  onSave: () => void;
  onBack: () => void;
  onProfile?: () => void;
  onAddressBook?: () => void;
}

export function ContactSharingWondereloFeedbackView({
  firstName,
  eventName,
  sessionName,
  wondereloRating,
  wondereloFeedback,
  isSubmitting,
  onRatingChange,
  onFeedbackChange,
  onSave,
  onBack,
  onProfile,
  onAddressBook,
}: ContactSharingWondereloFeedbackViewProps) {
  const faces = [
    { id: 'sad', emoji: '😞', label: 'Not great' },
    { id: 'neutral', emoji: '😐', label: 'Okay' },
    { id: 'happy', emoji: '😊', label: 'Great!' },
  ];
  return (
    <div className="wonderelo pm-page" data-active="wonderelo-feedback">
      <div className="pm-shell">
        <PdNav
          firstName={firstName}
          onBrandClick={onBack}
          onDashboard={onBack}
          onProfile={onProfile}
          onAddressBook={onAddressBook}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="wonderelo-feedback">
          <div className="pm-warm">
            <div className="pm-band">
              <div className="pm-eventrow"><div className="pm-event"><span className="name">{eventName || 'Your round'}</span><span className="org">{sessionName || 'Speed networking'}</span></div><span className="pm-state is-quiet"><span className="dot" /> Last step</span></div>
            </div>
            <div className="pm-focuscard" style={{ marginTop: 6, padding: '22px 18px', textAlign: 'left' }}>
              <span className="eyebrow">Last step</span>
              <h1 style={{ margin: '9px 0 0', fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 25, letterSpacing: '-.02em', color: '#fff' }}>How was your <em style={{ fontFamily: 'var(--w-font-serif)', fontStyle: 'italic', fontWeight: 400, color: '#ff8855' }}>Wonderelo</em> experience?</h1>
              <div className="pm-faces" style={{ marginTop: 20 }}>
                {faces.map((f) => (
                  <button type="button" key={f.id} className={`pm-face${wondereloRating === f.id ? ' is-on' : ''}`} onClick={() => onRatingChange(wondereloRating === f.id ? null : f.id)}>
                    <span className="emoji">{f.emoji}</span><span className="lbl">{f.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}><textarea className="pm-textarea" placeholder="Tell us more (optional)" value={wondereloFeedback} onChange={(e) => onFeedbackChange(e.target.value)} /></div>
            </div>
          </div>
          <button className="pm-btn is-primary" type="button" style={{ marginTop: 20 }} onClick={onSave} disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Finish'}</button>
          <div className="pm-center"><button className="pm-link" type="button" style={{ marginTop: 14 }} onClick={onBack}>Back to dashboard</button></div>
        </div>
        <PmFooter onBrandClick={onBack} />
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

  const backToDashboard = () => navigate(`/p/${token}`);
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    loadData();
  };

  // Loading state — skeleton in the shape of the partner-feedback list.
  if (isLoading) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="62%" height={26} />
            <Skeleton width="84%" height={12} />
            <SkeletonRow />
            <SkeletonRow />
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Spinner />
            <span style={{ fontFamily: 'var(--w-font-mono)', fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em', color: 'var(--w-ink)', opacity: 0.72 }}>Loading your partner…</span>
          </div>
          <div style={{ marginTop: 22, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
          </div>
        </div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell">
          <StatePlaceholder
            variant="error"
            glyphSize={74}
            glyph={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
            eyebrow="Something went wrong"
            title={<>We couldn't load <Italic>contact sharing</Italic></>}
            body="Nothing was shared yet. Try again — sharing only happens if you both agree."
            actions={<>
              <StateButton variant="primary" leadingIcon={<RefreshIcon />} onClick={handleRetry}>Try again</StateButton>
              <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
            </>}
            errorId="error · contactsharing"
          />
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

  const names = cachedRoundNames(token);

  if (currentPage === 'partner-feedback') {
    return (
      <ContactSharingPartnerFeedbackView
        firstName={networkingData?.myName}
        eventName={names.event}
        sessionName={names.session}
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
        onBrandClick={backToDashboard}
        onDashboard={backToDashboard}
        onProfile={() => navigate(`/p/${token}/profile`)}
        onAddressBook={() => navigate(`/p/${token}/address-book`)}
      />
    );
  }

  return (
    <ContactSharingWondereloFeedbackView
      firstName={networkingData?.myName}
      eventName={names.event}
      sessionName={names.session}
      wondereloRating={wondereloRating}
      wondereloFeedback={wondereloFeedback}
      isSubmitting={isSubmitting}
      onRatingChange={setWondereloRating}
      onFeedbackChange={setWondereloFeedback}
      onSave={handleSave}
      onBack={backToDashboard}
      onProfile={() => navigate(`/p/${token}/profile`)}
      onAddressBook={() => navigate(`/p/${token}/address-book`)}
    />
  );
}
