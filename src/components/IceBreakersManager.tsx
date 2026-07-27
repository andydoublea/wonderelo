import { useState, useEffect } from 'react';
import { IceBreaker } from '../App';
import { RefreshCw, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
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

  const updateIceBreaker = (index: number, question: string) => {
    const updated = [...iceBreakers];
    updated[index] = { ...updated[index], question };
    onChange(updated);
  };

  const addIceBreaker = () => {
    const newIceBreaker: IceBreaker = {
      id: `ib_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      question: '',
    };
    onChange([...iceBreakers, newIceBreaker]);
  };

  const removeIceBreaker = (index: number) => {
    onChange(iceBreakers.filter((_, i) => i !== index));
  };

  const moveIceBreaker = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= iceBreakers.length) return;
    const next = [...iceBreakers];
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    onChange(next);
  };

  // Regenerate the whole set — replace every prompt with a fresh random one,
  // avoiding duplicates within the set. Uses the fetched pool (generate logic).
  const regenerateAll = () => {
    if (availableIceBreakers.length === 0) return;
    const picked: string[] = [];
    const updated = iceBreakers.map((ib) => {
      const q = getRandomIceBreaker(picked);
      if (q) picked.push(q);
      return { ...ib, question: q || ib.question };
    });
    onChange(updated);
  };

  const regenDisabled = isLoading || availableIceBreakers.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {iceBreakers.map((iceBreaker, index) => (
        <div
          key={iceBreaker.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}
        >
          <input
            placeholder="Write a prompt…"
            value={iceBreaker.question}
            onChange={(e) => updateIceBreaker(index, e.target.value)}
            maxLength={60}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
            }}
          />
          <span style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
            <span
              onClick={() => moveIceBreaker(index, -1)}
              role="button"
              aria-label="Move ice breaker up"
              style={{ color: index === 0 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: index === 0 ? 'default' : 'pointer', display: 'inline-flex' }}
            >
              <ChevronUp width={15} height={15} />
            </span>
            <span
              onClick={() => moveIceBreaker(index, 1)}
              role="button"
              aria-label="Move ice breaker down"
              style={{ color: index === iceBreakers.length - 1 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: index === iceBreakers.length - 1 ? 'default' : 'pointer', display: 'inline-flex' }}
            >
              <ChevronDown width={15} height={15} />
            </span>
            <span
              onClick={() => removeIceBreaker(index)}
              role="button"
              aria-label="Remove ice breaker"
              style={{ color: '#c0392b', cursor: 'pointer', display: 'inline-flex' }}
            >
              <X width={15} height={15} />
            </span>
          </span>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={addIceBreaker}
          style={{
            flex: 1, padding: '11px 14px', background: 'transparent', borderRadius: 11,
            border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
            fontFamily: C.fontBody,
          }}
        >
          <Plus width={15} height={15} /> Add ice breaker
        </button>
        <button
          type="button"
          onClick={regenerateAll}
          disabled={regenDisabled}
          style={{
            padding: '11px 16px', background: 'rgba(221,83,28,.08)', borderRadius: 11,
            border: '1.5px solid rgba(221,83,28,.3)', color: C.orange, fontSize: 13.5, fontWeight: 700,
            cursor: regenDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: C.fontBody, opacity: regenDisabled ? 0.5 : 1,
          }}
        >
          <RefreshCw width={15} height={15} /> Regenerate
        </button>
      </div>
    </div>
  );
}
