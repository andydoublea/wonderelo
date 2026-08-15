import { useEffect } from 'react';
import { MeetingPoint } from '../App';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { C } from './redesign/organizerAtoms';

interface MeetingPointsManagerProps {
  meetingPoints: MeetingPoint[];
  onChange: (meetingPoints: MeetingPoint[]) => void;
}

export function MeetingPointsManager({ meetingPoints, onChange }: MeetingPointsManagerProps) {
  // Initialize with one empty meeting point if none exist
  useEffect(() => {
    if (meetingPoints.length === 0) {
      const initialPoint: MeetingPoint = {
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: '',
        imageUrl: undefined
      };
      onChange([initialPoint]);
    }
  }, []);

  // Normalize meeting points to always be objects
  const normalizedPoints: MeetingPoint[] = meetingPoints.map((point, index) => {
    if (typeof point === 'string') {
      return {
        id: `mp_legacy_${index}`,
        name: point,
        imageUrl: undefined
      };
    }
    return point;
  });

  const addMeetingPoint = () => {
    onChange([
      ...normalizedPoints,
      {
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: '',
        imageUrl: undefined
      }
    ]);
  };

  const removeMeetingPoint = (index: number) => {
    onChange(normalizedPoints.filter((_, i) => i !== index));
  };

  const moveMeetingPoint = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= normalizedPoints.length) return;
    const next = [...normalizedPoints];
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    onChange(next);
  };

  const updateMeetingPointName = (index: number, name: string) => {
    const updated = [...normalizedPoints];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  // ── styling helpers (mock: editable list / round-form field language) ──
  const fieldInput: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {normalizedPoints.length === 0 ? (
        <p style={{ fontSize: 13, color: C.ink, opacity: 0.6 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {normalizedPoints.map((point, index) => (
            <div key={point.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Name row — plain editable list with reorder (matches design) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}>
                  <input
                    placeholder="e.g. Main entrance"
                    value={point.name}
                    onChange={(e) => updateMeetingPointName(index, e.target.value)}
                    style={fieldInput}
                  />
                  <span style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
                    <span
                      onClick={() => moveMeetingPoint(index, -1)}
                      role="button"
                      aria-label="Move meeting point up"
                      style={{ color: index === 0 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: index === 0 ? 'default' : 'pointer', display: 'inline-flex' }}
                    >
                      <ChevronUp width={15} height={15} />
                    </span>
                    <span
                      onClick={() => moveMeetingPoint(index, 1)}
                      role="button"
                      aria-label="Move meeting point down"
                      style={{ color: index === normalizedPoints.length - 1 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: index === normalizedPoints.length - 1 ? 'default' : 'pointer', display: 'inline-flex' }}
                    >
                      <ChevronDown width={15} height={15} />
                    </span>
                    <span
                      onClick={() => removeMeetingPoint(index)}
                      role="button"
                      aria-label="Remove meeting point"
                      style={{ color: '#c0392b', cursor: 'pointer', display: 'inline-flex' }}
                    >
                      <X width={15} height={15} />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addMeetingPoint}
        style={{
          width: '100%', padding: '11px 14px', background: 'transparent', borderRadius: 11,
          border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          fontFamily: C.fontBody,
        }}
      >
        <Plus width={15} height={15} />
        Add meeting point
      </button>
    </div>
  );
}
