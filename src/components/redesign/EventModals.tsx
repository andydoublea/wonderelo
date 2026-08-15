/* Wonderelo — Public event page: Meeting points + Round rules bottom-sheets.
   Rebuilt 1:1 from the Claude Design mock (Event Page.html → .ev-modal).
   Presentational; data + open state come from SessionRegistration via props. */
import { useEffect } from 'react';
import { getParametersOrDefault } from '../../utils/systemParameters';
import type { MeetingPoint } from '../../App';

export interface SessionWithMeetingPoints {
  sessionId: string;
  sessionName: string;
  meetingPoints: MeetingPoint[];
  date?: string;
  rounds?: any[];
}

export interface RoundRule {
  headline: string;
  text: string;
}

interface EventModalsProps {
  eventName?: string;
  sessionName?: string;
  meetingPointsOpen: boolean;
  roundRulesOpen: boolean;
  onClose: () => void;
  sessionsWithMeetingPoints: SessionWithMeetingPoints[];
  roundRules: RoundRule[];
}

const closeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

function defaultRules(): RoundRule[] {
  return [
    { headline: 'Initiate deep talks', text: 'Skip the weather talk — meaningful relationships emerge when you share views, values, and stories. Use our ice breakers if you want to.' },
    { headline: 'End round on time', text: 'It prevents you from getting stuck in one conversation and helps you reach your next round without delay.' },
    { headline: 'Do not ask for contacts', text: `After the round, you'll be asked if you want to exchange contacts. Sharing happens ${getParametersOrDefault().defaultRoundDuration || 10} minutes later, only if both parties agree.` },
  ];
}

export function EventModals({ eventName, sessionName, meetingPointsOpen, roundRulesOpen, onClose, sessionsWithMeetingPoints, roundRules }: EventModalsProps) {
  const anyOpen = meetingPointsOpen || roundRulesOpen;

  // Close on Escape.
  useEffect(() => {
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOpen, onClose]);

  const rules = (Array.isArray(roundRules) ? roundRules.filter((r: any) => r && r.headline) : []);
  const displayRules = rules.length > 0 ? rules : defaultRules();

  const contextEl = (eventName || sessionName) ? (
    <div className="ev-modal-context">
      <span className="text">
        {eventName ? <strong>{eventName}</strong> : null}
        {eventName && sessionName ? <span className="sep">·</span> : null}
        {sessionName ? <span className="session">{sessionName}</span> : null}
      </span>
    </div>
  ) : null;

  return (
    <>
      <div className={`ev-modal-backdrop${anyOpen ? ' is-open' : ''}`} onClick={onClose} />

      {/* Meeting points */}
      <aside className={`ev-modal${meetingPointsOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Meeting points">
        <div className="ev-modal-handle" />
        <header className="ev-modal-head">
          <div>
            <div className="title">Meeting <em>points</em></div>
            <div className="sub">Stay close to these spots before your round to be on time. Each round may use a different point.</div>
          </div>
          <button className="ev-modal-close" type="button" onClick={onClose} aria-label="Close">{closeIcon}</button>
        </header>
        <div className="ev-modal-body">
          {contextEl}
          {sessionsWithMeetingPoints.map((session) => (
            <div className="ev-mp-session-block" key={session.sessionId}>
              {/* Design shows the session name once (via the context chip) when a single
                  session is visible; the per-block header only appears with multiple sessions. */}
              {sessionsWithMeetingPoints.length > 1 ? <div className="ev-mp-session">{session.sessionName}</div> : null}
              <div className="ev-mp-list">
                {session.meetingPoints.map((point) => (
                  <div className="ev-mp-card" key={point.id}>
                    {point.imageUrl
                      ? <div className="ev-mp-img" style={{ backgroundImage: `url(${point.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      : null}
                    <div className="ev-mp-name">{point.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Round rules */}
      <aside className={`ev-modal${roundRulesOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Round rules">
        <div className="ev-modal-handle" />
        <header className="ev-modal-head">
          <div>
            <div className="title">Round <em>rules</em></div>
          </div>
          <button className="ev-modal-close" type="button" onClick={onClose} aria-label="Close">{closeIcon}</button>
        </header>
        <div className="ev-modal-body">
          {contextEl}
          <div className="ev-rules-list">
            {displayRules.map((rule, i) => (
              <div className="ev-rules-item" key={i}>
                <div>
                  <div className="ev-rules-title">{rule.headline}</div>
                  {rule.text ? <div className="ev-rules-desc">{rule.text}</div> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
