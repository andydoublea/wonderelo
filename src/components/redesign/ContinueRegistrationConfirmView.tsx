/* Wonderelo — Continue Registration, confirm/meeting-points step (Claude Design v06).
   Presentational; data + handlers come from SessionRegistration via props.
   Maps to Continue Registration.html `data-view="confirm"` (data-state="confirm"):
   shared nav (from UserPublicPageView `.ev-nav`) + topbar + meeting-point cards + fixed Finalise sticky. */

const I = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m23 7-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

interface MeetingPoint {
  id: string;
  name?: string;
  imageUrl?: string;
  type?: string;
}
interface MPSession {
  sessionId: string;
  sessionName: string;
  meetingPoints: MeetingPoint[];
}
interface Props {
  eventName?: string;
  selectedCount: number;
  sessions: MPSession[];
  showSessionName: boolean;
  finaliseLabel: string;
  isSubmitting: boolean;
  processingDots: number;
  onFinalise: () => void;
  onBack: () => void;
}

export function ContinueRegistrationConfirmView(p: Props) {
  return (
    <div className="wonderelo cr-page" data-state="confirm">
      <div className="cr-shell">
      <div className="cr-topbar">
        <a className="cr-back" role="button" tabIndex={0} onClick={p.onBack}>{I.back}<span>Round selection</span></a>
        <div className="cr-recap">
          <strong>{p.selectedCount} {p.selectedCount === 1 ? 'round' : 'rounds'}</strong>
          <span className="dot">·</span>
          <span>{p.eventName}</span>
        </div>
      </div>

      <section>
        <div className="cr-head cr-confirm-head">
          <h1>Know your <em className="w-italic">meeting points</em></h1>
          <p className="lede">Take a moment to find these spots now — when your round goes live, you'll head straight there, no searching.</p>
        </div>

        {p.sessions.length > 0 ? (
          p.sessions.map((s) => (
            <div className="cr-mp-session-block" key={s.sessionId}>
              {p.showSessionName && <div className="cr-mp-session">{s.sessionName}</div>}
              <div className="cr-mp-list">
                {s.meetingPoints.map((pt) => {
                  const hasImg = !!pt.imageUrl && (!pt.type || pt.type === 'physical');
                  return (
                    <div className="cr-mp-card" key={pt.id}>
                      {hasImg && (
                        <div className="cr-mp-img">
                          <img src={pt.imageUrl} alt={pt.name || 'Meeting point'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div className="cr-mp-row">
                        {pt.type === 'virtual' ? I.video : I.pin}
                        <span className="cr-mp-name">{pt.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="cr-country-empty">No meeting points added yet.</div>
        )}
      </section>
      </div>

      <div className="cr-sticky">
        <div className="cr-sticky-inner">
          <button className="cr-sticky-back" type="button" aria-label="Back" onClick={p.onBack}>{I.back}</button>
          <button className="cr-sticky-cta" type="button" onClick={p.onFinalise} disabled={p.isSubmitting}>
            {p.isSubmitting ? <>Processing{'.'.repeat(p.processingDots)}</> : <>{p.finaliseLabel}{I.check}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
