/* Wonderelo — Public event page: sessions + rounds picker (redesign View).
   Presentational only. Rebuilt 1:1 from the Claude Design mock
   (design/v05/project/pages/Event Page.html → .ev-sessions / .ev-round).
   All data + handlers come from SessionRegistration via props. */
import { useEffect, useState } from 'react';
import type { NetworkingSession } from '../../App';

type RoundTimeState = 'open' | 'live' | 'wrapped' | 'closed';

interface RoundSelectionData {
  team?: string;
  topic?: string;
  topics?: string[];
}

export interface EventSessionsViewProps {
  availableSessions: NetworkingSession[];
  eventName?: string;
  selectedRounds: Map<string, Set<string>>;
  roundSelections: Map<string, RoundSelectionData>;
  registeredRoundsPerSession: Map<string, Set<string>>;
  participantStatusMap: Map<string, string>;
  isRoundRegisterable: (session: NetworkingSession, round: any) => boolean;
  getRoundTimeState: (session: NetworkingSession, round: any) => RoundTimeState;
  getRoundCloseSeconds: (session: NetworkingSession, round: any) => number | null;
  canContinue: boolean;
  errorMessage: string;
  selectedCount: number;
  hideStickyBar?: boolean;
  onRoundSelect: (session: NetworkingSession, roundId: string) => void;
  onTeamSelect: (roundId: string, team: string) => void;
  onTopicSelect: (roundId: string, topic: string) => void;
  onMultipleTopicsSelect: (roundId: string, topic: string) => void;
  onShowMeetingPoints: (sessionId: string) => void;
  onShowRoundRules: (open: boolean, sessionName?: string) => void;
  onContinue: () => void;
}

// ── Icons (inline, matching the mock) ──────────────────────────────────
const I = {
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  topic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  group: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
};

function formatDate(date?: string): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// ── Flip-clock countdown ("Closes in MM:SS") ───────────────────────────
function EvFlipClock({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor(seconds)));
  useEffect(() => { setRemaining(Math.max(0, Math.floor(seconds))); }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining > 0]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const cells = [mm[0], mm[1], ':', ss[0], ss[1]];
  return (
    <div className="ev-countdown">
      <span className="lbl">Closes in</span>
      <div className="fc-clock" data-flip-clock>
        {cells.map((d, i) => d === ':'
          ? <span className="fc-colon" key={i}>:</span>
          : (
            <div className="fc-cell" key={i}>
              <div className="fc-half fc-top"><span>{d}</span></div>
              <div className="fc-half fc-bot"><span>{d}</span></div>
              <div className="fc-hinge" />
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Match note (derived from matchingType + teams + selected team) ──────
export function matchNote(session: any, team?: string): { within: boolean; eyebrow: string; text: JSX.Element } | null {
  if (!session?.enableTeams || !session?.teams?.length || !team) return null;
  const teams: string[] = session.teams;
  if (session.matchingType === 'within-team') {
    return { within: true, eyebrow: 'Matching within your group', text: <>You'll be paired with other <strong>{team}</strong>.</> };
  }
  const others = teams.filter((t) => t !== team);
  if (teams.length === 2 && others[0]) {
    return { within: false, eyebrow: 'Matching across groups', text: <>You'll be paired with <strong>{others[0]}s</strong> — not other {team}s.</> };
  }
  return { within: false, eyebrow: 'Matching across groups', text: <>You'll be paired with someone from a <strong>different group</strong>.</> };
}

const MatchIcon = ({ within }: { within: boolean }) => within ? (
  <svg className="ev-mn-icon" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="15" fill="none" stroke="#4b1d51" strokeWidth="1.4" strokeDasharray="2 2.5" opacity=".55"/>
    <line x1="13" y1="20" x2="27" y2="20" stroke="#4b1d51" strokeWidth="1.4"/>
    <circle cx="13" cy="20" r="3.5" fill="#4b1d51"/><circle cx="27" cy="20" r="3.5" fill="#4b1d51"/>
  </svg>
) : (
  <svg className="ev-mn-icon" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="11" cy="20" r="8.5" fill="none" stroke="#4b1d51" strokeWidth="1.4" strokeDasharray="2 2.5" opacity=".55"/>
    <circle cx="29" cy="20" r="8.5" fill="none" stroke="#dd531c" strokeWidth="1.4" strokeDasharray="2 2.5" opacity=".75"/>
    <line x1="14" y1="20" x2="26" y2="20" stroke="#dd531c" strokeWidth="1.4"/>
    <circle cx="11" cy="20" r="3.2" fill="#4b1d51"/><circle cx="29" cy="20" r="3.2" fill="#dd531c"/>
  </svg>
);

export function EventSessionsView(props: EventSessionsViewProps) {
  const {
    availableSessions, eventName, selectedRounds, roundSelections, registeredRoundsPerSession,
    participantStatusMap, isRoundRegisterable, getRoundTimeState, getRoundCloseSeconds,
    canContinue, errorMessage, selectedCount, hideStickyBar,
    onRoundSelect, onTeamSelect, onTopicSelect, onMultipleTopicsSelect,
    onShowMeetingPoints, onShowRoundRules, onContinue,
  } = props;

  // Empty state — organizer hasn't published any rounds yet (design v06).
  if (availableSessions.length === 0) {
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
          The organizer hasn't opened any networking rounds{eventName ? <> for <strong>{eventName}</strong></> : null} yet. As soon as they do, you'll pick your rounds right here.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="ev-sessions">
        {availableSessions.map((session) => {
          const sessionSelected = selectedRounds.get(session.id) || new Set<string>();
          const registeredSet = registeredRoundsPerSession.get(session.id) || new Set<string>();
          const groupSizeLabel = session.groupSize === 2 ? 'Pairs of 2' : `Groups of ${session.groupSize}`;

          return (
            <article className="ev-session" key={session.id}>
              <div className="ev-session-date-wrap">
                <span className="ev-session-date">{I.cal}{formatDate(session.date)}</span>
              </div>
              <h3>{session.name}</h3>
              <div className="ev-session-meta">
                <span>{I.clock}{session.roundDuration} min rounds</span>
                <span>{I.users}{groupSizeLabel}</span>
                {session.enableTopics && <span>{I.topic}Topic</span>}
                {session.enableTeams && <span>{I.group}Group</span>}
                <button type="button" onClick={() => onShowMeetingPoints(session.id)}>{I.pin}Meeting points</button>
                <button type="button" onClick={() => onShowRoundRules(true, session.name)}>{I.file}Round rules</button>
              </div>

              <div className="ev-rounds">
                {(session.rounds || []).map((round: any) => {
                  const isRegistered = registeredSet.has(round.id);
                  const status = isRegistered ? participantStatusMap.get(round.id) : undefined;
                  if (status === 'no-match') return null;

                  const isSelected = sessionSelected.has(round.id) && !isRegistered;
                  const timeState = getRoundTimeState(session, round);
                  const disabled = timeState === 'wrapped' || timeState === 'live';
                  const sel = roundSelections.get(round.id) || {};
                  const hasTeams = !!(session.enableTeams && session.teams?.length);
                  const hasTopics = !!(session.enableTopics && session.topics?.length);
                  const hasOptions = !disabled && (hasTeams || hasTopics);
                  const closeSeconds = isSelected ? getRoundCloseSeconds(session, round) : null;

                  const cls = ['ev-round'];
                  if (disabled) cls.push('is-disabled');
                  if (isSelected) cls.push('is-selected');
                  if (isRegistered) cls.push('is-registered');
                  if (hasOptions) cls.push('has-options');

                  const stateLabel = isRegistered ? 'Registered'
                    : timeState === 'wrapped' ? 'Wrapped'
                    : timeState === 'live' ? 'Live'
                    : timeState === 'closed' ? 'Closed' : 'Open';

                  const note = hasTeams ? matchNote(session, sel.team) : null;

                  return (
                    <div
                      className={cls.join(' ')}
                      key={round.id}
                      aria-disabled={disabled || undefined}
                      onClick={() => { if (!disabled) onRoundSelect(session, round.id); }}
                    >
                      <span className="ev-cb">{(isSelected || isRegistered) && I.check}</span>
                      <div className="ev-rt"><span>{round.startTime}</span></div>

                      {isSelected && closeSeconds != null
                        ? <EvFlipClock seconds={closeSeconds} />
                        : <span className={`ev-state${timeState === 'live' ? ' is-live' : ''}`}>
                            {timeState === 'live' && <span className="dot" />}{stateLabel}
                          </span>}

                      {hasOptions && (
                        <div className="ev-expand" onClick={(e) => e.stopPropagation()}>
                          {hasTopics && (
                            <div className="ev-expand-section" data-field="topic">
                              <div className="ev-expand-label"><span className="l">I want to <em>talk about</em></span></div>
                              <div className="ev-chips" role={session.allowMultipleTopics ? 'group' : 'radiogroup'}>
                                {session.topics.map((topic: string) => {
                                  const active = session.allowMultipleTopics
                                    ? (sel.topics || []).includes(topic)
                                    : sel.topic === topic;
                                  return (
                                    <button type="button" key={topic}
                                      className={`ev-chip is-topic${active ? ' is-active' : ''}`}
                                      onClick={() => session.allowMultipleTopics
                                        ? onMultipleTopicsSelect(round.id, topic)
                                        : onTopicSelect(round.id, topic)}>
                                      {topic}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {hasTeams && (
                            <div className="ev-expand-section" data-field="group">
                              <div className="ev-expand-label"><span className="l">I belong to <em>the group</em></span></div>
                              <div className="ev-chips" role="radiogroup">
                                {session.teams.map((team: string) => (
                                  <button type="button" key={team}
                                    className={`ev-chip is-group${sel.team === team ? ' is-active' : ''}`}
                                    onClick={() => onTeamSelect(round.id, team)}>
                                    {team}
                                  </button>
                                ))}
                              </div>
                              {note && (
                                <div className={`ev-match-note${note.within ? ' is-within' : ''}`}>
                                  <MatchIcon within={note.within} />
                                  <div className="ev-mn-body">
                                    <div className="ev-mn-eyebrow">{note.eyebrow}</div>
                                    <div className="ev-mn-text">{note.text}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}

      </section>

      {!hideStickyBar && (
        <div className="ev-sticky">
          <div className="ev-sticky-inner">
            <button className="ev-continue" type="button" disabled={selectedCount === 0 || !canContinue} onClick={onContinue}>
              Continue {I.arrow}
            </button>
            {selectedCount === 0
              ? <div className="ev-count">Select at least one round</div>
              : errorMessage
                ? <div className="ev-count">{errorMessage}</div>
                : <div className="ev-count"><em>{selectedCount} {selectedCount === 1 ? 'round' : 'rounds'}</em> selected</div>}
          </div>
        </div>
      )}
    </>
  );
}
