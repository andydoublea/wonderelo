import { useState, useEffect } from 'react';
import { IceBreaker } from '../App';
import { RefreshCw } from 'lucide-react';
import { C } from './redesign/organizerAtoms';
import { errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface IceBreakersManagerProps {
  iceBreakers: IceBreaker[];
  onChange: (iceBreakers: IceBreaker[]) => void;
}

export function IceBreakersManager({ iceBreakers, onChange }: IceBreakersManagerProps) {
  const [availableIceBreakers, setAvailableIceBreakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAvailableIceBreakers();
  }, []);

  const fetchAvailableIceBreakers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/ice-breakers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableIceBreakers(data.iceBreakers || []);
      } else {
        errorLog('Failed to fetch ice breakers, status:', response.status);
      }
    } catch (error) {
      errorLog('Error fetching ice breakers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomIceBreaker = (excludeQuestions: string[]): string => {
    if (availableIceBreakers.length === 0) {
      return '';
    }

    const available = availableIceBreakers.filter(
      (q) => !excludeQuestions.includes(q)
    );

    if (available.length === 0) {
      // If all questions are already used, pick from all
      const randomIndex = Math.floor(Math.random() * availableIceBreakers.length);
      return availableIceBreakers[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  };

  const shuffleIceBreaker = (index: number) => {
    // Get questions from other ice breakers (not the current one)
    const otherQuestions = iceBreakers
      .filter((_, i) => i !== index)
      .map(ib => ib.question);

    const newQuestion = getRandomIceBreaker(otherQuestions);

    // Only update if we got a valid question
    if (newQuestion && newQuestion.trim() !== '') {
      const updated = [...iceBreakers];
      updated[index] = { ...updated[index], question: newQuestion };
      onChange(updated);
    }
  };

  const updateIceBreaker = (index: number, question: string) => {
    const updated = [...iceBreakers];
    updated[index] = { ...updated[index], question };
    onChange(updated);
  };

  const regenDisabled = isLoading || availableIceBreakers.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: C.ink, opacity: 0.65, lineHeight: 1.5 }}>
        Strong connections happen when people talk about deep topics — their views, values, and stories. Help them skip the weather talk with our ice breakers or add your own.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {iceBreakers.map((iceBreaker, index) => (
          <div
            key={iceBreaker.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}
          >
            <input
              placeholder="e.g. What's a skill you'd like to learn?"
              value={iceBreaker.question}
              onChange={(e) => updateIceBreaker(index, e.target.value)}
              maxLength={60}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
              }}
            />
            <button
              type="button"
              onClick={() => shuffleIceBreaker(index)}
              title="Get random ice breaker"
              aria-label="Get random ice breaker"
              disabled={regenDisabled}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: 32, height: 32, borderRadius: 9, cursor: regenDisabled ? 'not-allowed' : 'pointer',
                background: 'rgba(221,83,28,.08)', border: '1.5px solid rgba(221,83,28,.3)',
                color: C.orange, opacity: regenDisabled ? 0.5 : 1,
              }}
            >
              <RefreshCw width={15} height={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
