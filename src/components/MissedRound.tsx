import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Clock, ArrowLeft, Send } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';

interface MissedRoundProps {
  participantToken: string;
  roundId: string;
  roundName?: string;
  /** Current participant's first name — shown in the nav. */
  firstName?: string;
  /** Event name (organizer.event_name) — bold primary in the event row. */
  eventName?: string;
  /** Session name (session.name) — light subtitle in the event row. */
  sessionName?: string;
  onBackToDashboard: () => void;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface MissedRoundViewProps {
  roundName?: string;
  firstName?: string;
  eventName?: string;
  sessionName?: string;
  feedback: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onFeedbackChange: (value: string) => void;
  onSubmitFeedback: () => void;
  onBackToDashboard: () => void;
}

export function MissedRoundView({
  roundName,
  firstName,
  eventName,
  sessionName,
  feedback,
  isSubmitting,
  isSubmitted,
  onFeedbackChange,
  onSubmitFeedback,
  onBackToDashboard,
}: MissedRoundViewProps) {
  return (
    <div className="wonderelo pm-page" data-active="missed-round" data-feedback={isSubmitted ? 'sent' : 'form'}>
      <div className="pm-shell">
        <PdNav
          firstName={firstName}
          onBrandClick={onBackToDashboard}
          onDashboard={onBackToDashboard}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="missed-round">
          <div className="pm-band">
            <div className="pm-eventrow">
              <div className="pm-event"><span className="name">{eventName || sessionName || 'Your round'}</span><span className="org">{sessionName || 'Speed networking'}</span></div>
              <span className="pm-state is-quiet"><span className="dot" /> Round closed</span>
            </div>
            <div className="pm-center" style={{ paddingTop: 4 }}>
              <div className="pm-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h1 className="pm-h1" style={{ marginTop: 16 }}>You didn't make it in time</h1>
            </div>
          </div>
          <div className="pm-body">
            {!isSubmitted ? (
              <div>
                <p className="pm-muted pm-center" style={{ margin: '0 auto', maxWidth: 320, fontSize: '13.5px', lineHeight: 1.55 }}>Your conversation partner was waiting for you at the meeting point. Please try to be on time for your next round — it means a lot to the person expecting you.</p>
                <p className="pm-fieldlabel" style={{ margin: '22px 0 8px' }}>What happened?</p>
                <textarea className="pm-textarea" placeholder="Tell us why you couldn't make it (optional)..." value={feedback} onChange={(e) => onFeedbackChange(e.target.value)} />
                <button className="pm-btn is-primary" type="button" style={{ marginTop: 12 }} onClick={onSubmitFeedback} disabled={isSubmitting || !feedback.trim()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  {isSubmitting ? 'Sending…' : 'Send feedback'}
                </button>
                <div className="pm-center"><button className="pm-link" type="button" onClick={onBackToDashboard} style={{ marginTop: 14 }}>Back to dashboard</button></div>
              </div>
            ) : (
              <div className="pm-center" style={{ padding: '10px 0 4px' }}>
                <div className="pm-badge is-ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="pm-h1 is-sent" style={{ marginTop: 16, fontSize: 22 }}>Thanks for letting us know</h2>
                <p className="pm-muted" style={{ margin: '10px auto 0', maxWidth: 300, fontSize: '13.5px', lineHeight: 1.55 }}>We've passed your note to the organizer. Your spot for the next round is still open — please try to arrive on time.</p>
                <div className="pm-center"><button className="pm-link" type="button" onClick={onBackToDashboard} style={{ marginTop: 18 }}>Back to dashboard</button></div>
              </div>
            )}
          </div>
        </div>
        <PmFooter onBrandClick={onBackToDashboard} />
      </div>
    </div>
  );
}

// ============================================================
// Container
// ============================================================

export function MissedRound({ participantToken, roundId, roundName, firstName, eventName, sessionName, onBackToDashboard }: MissedRoundProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      debugLog('[MissedRound] Submitting feedback');
      const response = await fetch(
        `${apiBaseUrl}/participant/${participantToken}/missed-feedback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roundId, feedback: feedback.trim() }),
        }
      );
      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (err) {
      errorLog('[MissedRound] Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MissedRoundView
      roundName={roundName}
      firstName={firstName}
      eventName={eventName}
      sessionName={sessionName}
      feedback={feedback}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      onFeedbackChange={setFeedback}
      onSubmitFeedback={handleSubmitFeedback}
      onBackToDashboard={onBackToDashboard}
    />
  );
}
