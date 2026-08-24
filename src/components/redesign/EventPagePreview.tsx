/* Wonderelo — shared "Event page preview" body.
   A faithful miniature of the public event page (design/v08 Event Page.html →
   `.ev-*` look). Reuses the global `.ev-*` classes (imported app-wide via
   wonderelo-event-page.css) so it tracks the real page 1:1.

   Used by:
   • SessionForm.tsx        — reflects the round CURRENTLY being edited (formData).
   • EventPageSettings.tsx   — no round data → shows the real `.ev-empty` state.

   Presentation only — every control is inert (pointerEvents disabled). */
import type { NetworkingSession } from '../../App';
import { C } from './organizerAtoms';

const EV_ICONS = {
  cal: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  topic: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  group: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  manage: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
};

export const EvIcon = ({ d, size = 13 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);

function evFormatDate(date?: string): string {
  if (!date) return 'Date to be set';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date to be set';
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return 'Date to be set'; }
}

// Derive the round start-times from live form data (mirrors SessionPreview's
// generateRounds): first round at startTime, then + duration + gap each step.
export function evBuildRounds(fd: Partial<NetworkingSession>): { time: string; state: string }[] {
  const n = Math.max(1, fd.numberOfRounds || 1);
  const dur = fd.roundDuration || 10;
  const gap = fd.gapBetweenRounds || 0;
  // Prefer explicit rounds if the form already carries them.
  if (fd.rounds && fd.rounds.length > 0) {
    return fd.rounds.map((r: any) => ({ time: r.startTime || r.name || 'To be set', state: 'Open' }));
  }
  if (!fd.startTime) {
    return Array.from({ length: n }, () => ({ time: 'To be set', state: 'Open' }));
  }
  const [h, m] = fd.startTime.split(':').map(Number);
  let cur = (h || 0) * 60 + (m || 0);
  const out: { time: string; state: string }[] = [];
  for (let i = 0; i < n; i++) {
    const t = ((cur % 1440) + 1440) % 1440;
    out.push({ time: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, state: 'Open' });
    cur += dur + gap;
  }
  return out;
}

// Real `.ev-empty` state (design/v08 Event Page.html → `.ev-empty`). Shown when
// the preview has no round to render (e.g. the Event page settings screen).
function EvEmptyState({ eventName }: { eventName?: string }) {
  return (
    <section className="ev-empty" aria-label="No rounds published">
      <div className="ev-empty-art" aria-hidden="true">
        <span className="d d1" />
        <span className="d d2" />
        <span className="d d3" />
        <span className="ring" />
        <svg className="ev-empty-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
          <line x1="3" y1="9.5" x2="21" y2="9.5" />
          <line x1="8" y1="2.5" x2="8" y2="6.5" />
          <line x1="16" y1="2.5" x2="16" y2="6.5" />
          <circle cx="12" cy="15" r="0.6" fill="currentColor" />
          <circle cx="8" cy="15" r="0.6" fill="currentColor" />
          <circle cx="16" cy="15" r="0.6" fill="currentColor" />
        </svg>
      </div>
      <h2 className="ev-empty-title">No rounds <em>published yet</em></h2>
      <p className="ev-empty-sub">
        Rounds you publish{eventName ? <> for <strong>{eventName}</strong></> : null} will appear right here — exactly as attendees will see them.
      </p>
    </section>
  );
}

export interface EventPagePreviewProps {
  /** The round currently being edited. When omitted, the real `.ev-empty` state renders. */
  formData?: Partial<NetworkingSession> | null;
  /** The EVENT name shown in the `.ev-org` hero (never the organizer/person name). */
  eventName?: string;
  profileImageUrl?: string;
}

export function EventPagePreview({ formData, eventName, profileImageUrl }: EventPagePreviewProps) {
  const heroName = eventName?.trim() || 'Your event';
  const roundName = formData?.name?.trim() || 'Round name';
  const groupSize = formData?.groupSize || 2;
  const groupSizeLabel = groupSize === 2 ? 'Pairs of 2' : `Groups of ${groupSize}`;
  const allRounds = formData ? evBuildRounds(formData) : [];
  const MAX_ROWS = 5;
  const rounds = allRounds.slice(0, MAX_ROWS);
  const overflow = allRounds.length - rounds.length;
  const capacity = formData?.limitParticipants && formData?.maxParticipants ? formData.maxParticipants : null;

  return (
    <div
      className="wonderelo rf-evpreview"
      // Inert preview — swallow all interaction so it reads, but never acts.
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <style>{`
        .rf-evpreview { padding: 0 20px; overflow: hidden; background: var(--w-paper); }
        /* We don't use .ev-shell here, so re-pin the nav to the top of THIS scroller
           and drop the 640px rounded-corner treatment that would peek cream. */
        .rf-evpreview .ev-nav { position: static; border-radius: 0; }
        .rf-evpreview .ev-title { margin: 24px 0 20px; font-size: 30px; }
        .rf-evpreview .ev-org { padding: 30px 20px 26px; }
        .rf-evpreview .ev-event-name { font-size: 20px; }
      `}</style>

      {/* Top nav (mirrors UserPublicPage <nav class="ev-nav"> guest variant) */}
      <nav className="ev-nav">
        <a className="ev-brand">
          <span className="mark"><span className="inner" /></span>
          <span className="word">wond<em>e</em>relo</span>
        </a>
        <span className="ev-nav-cta ev-nav-guest">
          <EvIcon d={EV_ICONS.manage} />
          Manage my rounds
        </span>
      </nav>

      {/* Organizer banner (ev-org) */}
      <section className="ev-org">
        <div className="av" aria-label="Organizer photo">
          {profileImageUrl
            ? <img src={profileImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="lbl">photo</span>}
        </div>
        <div className="ev-event-name">{heroName}</div>
        <span className="ev-how-link">
          <EvIcon d={EV_ICONS.help} size={14} />
          How rounds work
        </span>
      </section>

      {/* H1 */}
      <h1 className="ev-title">when can we <span className="w-italic">mix</span> you in?</h1>

      {/* Sessions — a single card mirroring the round being edited, or the empty state. */}
      {formData ? (
        <section className="ev-sessions">
          <article className="ev-session">
            <div className="ev-session-date-wrap">
              <span className="ev-session-date"><EvIcon d={EV_ICONS.cal} size={12} />{evFormatDate(formData.date)}</span>
            </div>
            <h3>{roundName}</h3>
            <div className="ev-session-meta">
              <span><EvIcon d={EV_ICONS.clock} />{formData.roundDuration || 10} min rounds</span>
              <span><EvIcon d={EV_ICONS.users} />{groupSizeLabel}</span>
              {formData.enableTopics && <span><EvIcon d={EV_ICONS.topic} />Topic</span>}
              {formData.enableTeams && <span><EvIcon d={EV_ICONS.group} />Group</span>}
              <button type="button" tabIndex={-1}><EvIcon d={EV_ICONS.pin} />Meeting points</button>
              <button type="button" tabIndex={-1}><EvIcon d={EV_ICONS.file} />Round rules</button>
            </div>
            {capacity != null && (
              <div className="ev-session-cap"><EvIcon d={EV_ICONS.users} />Up to {capacity} {capacity === 1 ? 'person' : 'people'}</div>
            )}

            <div className="ev-rounds">
              {rounds.map((r, i) => (
                <div className="ev-round" key={i}>
                  <span className="ev-cb" />
                  <div className="ev-rt"><span>{r.time}</span></div>
                  <span className="ev-state">{r.state}</span>
                </div>
              ))}
              {overflow > 0 && (
                <div style={{ textAlign: 'center', padding: '4px 0 2px', fontFamily: C.fontMono, fontSize: 11, letterSpacing: '.04em', color: C.ink, opacity: .5 }}>
                  + {overflow} more {overflow === 1 ? 'round' : 'rounds'}
                </div>
              )}
            </div>
          </article>
        </section>
      ) : (
        <EvEmptyState eventName={eventName} />
      )}
    </div>
  );
}
