/* Wonderelo — flip-clock countdown (Claude Design `.fc-clock`).
   Ticks down from `seconds`; `hours` renders HH:MM:SS (else MM:SS). */
import { useEffect, useState } from 'react';

export function FlipClock({ seconds, hours = false, mini = false }: { seconds: number; hours?: boolean; mini?: boolean }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor(seconds)));
  useEffect(() => { setRemaining(Math.max(0, Math.floor(seconds))); }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining > 0]);

  let cells: string[];
  if (hours) {
    const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    cells = [hh[0], hh[1], ':', mm[0], mm[1], ':', ss[0], ss[1]];
  } else {
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    cells = [mm[0], mm[1], ':', ss[0], ss[1]];
  }

  return (
    <div className={`fc-clock${mini ? ' is-mini' : ''}`} data-flip-clock>
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
  );
}
