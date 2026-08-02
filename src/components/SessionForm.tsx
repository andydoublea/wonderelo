import { useState, useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';
import { NetworkingSession } from '../App';
import { C } from './redesign/organizerAtoms';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Users, Clock, Calendar, Settings, Plus, X, MapPin, ChevronUp, ChevronDown, GripVertical, HelpCircle, Play, MessageCircle, Sparkles, Loader2, Coins, CreditCard, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { SessionPreview } from './SessionPreview';
import { TimePicker } from './TimePicker';
import { DatePicker } from './DatePicker';
import { MeetingPointsManager } from './MeetingPointsManager';
import { IceBreakersManager } from './IceBreakersManager';
import { DEFAULT_ICE_BREAKERS } from '../utils/defaultIceBreakers';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { debugLog, errorLog } from '../utils/debug';
import { fetchSystemParameters, type SystemParameters } from '../utils/systemParameters';
import { useIsDesktop } from '../hooks/useResponsive';
import { getAccessToken } from '../utils/supabase/getAccessToken';
import { useNavigate } from 'react-router';
import { PRICING_TIERS, getTierForCapacity, formatPrice, type CapacityTier } from '../config/pricing';
// Slider removed — capacity uses free-form input now
// CAPACITY_OPTIONS import removed — slider replaced with free-form input

interface SessionFormProps {
  initialData?: NetworkingSession | null;
  onSubmit: (session: Omit<NetworkingSession, 'id'>) => void;
  onCancel?: () => void;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  userSlug?: string;
  isDuplicate?: boolean;
}

// ============================================================
// Redesign primitives (ported 1:1 from design/v06 screen-round-form.jsx).
// Pure presentation — every one is wired to the existing form state/handlers.
// ============================================================
const RF_ICONS: Record<string, string> = {
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  down: '<polyline points="6 9 12 15 18 9"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  loader: '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
};

const RfIcon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);

const rfFieldBox = (error?: boolean, focused?: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 11, background: '#fff',
  border: `1.5px solid ${error ? '#c0392b' : focused ? C.orange : C.hairStrong}`,
  boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
});
const rfBareInput: CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0 };

const RfCard = ({ icon, title, hint, hintList, children, error }: { icon: string; title: string; hint?: string; hintList?: string[]; children?: ReactNode; error?: boolean }) => (
  <section style={{ background: '#fff', border: `1px solid ${error ? '#c0392b' : C.hair}`, borderRadius: 18, padding: 26, marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: hint || hintList ? 10 : 20 }}>
      <span style={{ color: C.orange, display: 'inline-flex' }}><RfIcon d={icon} size={19} /></span>
      <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, letterSpacing: '-.02em', color: C.purpleDeep }}>{title}</h3>
    </div>
    {hint && <p style={{ margin: '0 0 18px', fontSize: 12.5, color: C.ink, opacity: .65 }}>{hint}</p>}
    {hintList && <ul style={{ margin: '0 0 20px', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: C.ink, opacity: .65 }}>{hintList.map((h, i) => <li key={i}>{h}</li>)}</ul>}
    {children}
  </section>
);

const RfLbl = ({ children, help }: { children?: ReactNode; help?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase' }}>
    {children}
    {help && <span title={help} style={{ color: 'rgba(75,29,81,.4)', display: 'inline-flex', cursor: 'help' }}><RfIcon d={RF_ICONS.help} size={14} /></span>}
  </span>
);

const RfToggle = ({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <span onClick={() => !disabled && onChange(!on)} style={{ width: 42, height: 24, borderRadius: 999, background: on ? C.orange : 'rgba(76,25,77,.18)', position: 'relative', flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
  </span>
);

const RfToggleRow = ({ label, help, on, onChange, note, disabled }: { label: string; help?: string; on: boolean; onChange: (v: boolean) => void; note?: string; disabled?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div><RfLbl help={help}>{label}</RfLbl>{note && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.ink, opacity: .6 }}>{note}</p>}</div>
    <RfToggle on={on} onChange={onChange} disabled={disabled} />
  </div>
);

const RfSeparator = () => <div style={{ height: 1, background: C.hair, margin: '22px 0' }} />;

// Editable string list (teams / topics) — wired to the existing add/update/move/remove handlers.
function RfEditableList({ rows, onUpdate, onRemove, onMoveUp, onMoveDown, onAdd, placeholder, addLabel }: {
  rows: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onAdd: () => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((val, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}>
          <input value={val} placeholder={placeholder} onChange={(e) => onUpdate(i, e.target.value)} style={rfBareInput} />
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <span onClick={() => onMoveUp(i)} style={{ color: i === 0 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: i === 0 ? 'default' : 'pointer', display: 'inline-flex' }}><RfIcon d={RF_ICONS.up} size={15} /></span>
            <span onClick={() => onMoveDown(i)} style={{ color: i === rows.length - 1 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: i === rows.length - 1 ? 'default' : 'pointer', display: 'inline-flex' }}><RfIcon d={RF_ICONS.down} size={15} /></span>
            <span onClick={() => onRemove(i)} style={{ color: '#c0392b', cursor: 'pointer', display: 'inline-flex' }}><RfIcon d={RF_ICONS.x} size={15} /></span>
          </span>
        </div>
      ))}
      <button type="button" onClick={onAdd} style={{ padding: '11px 14px', background: 'transparent', borderRadius: 11, border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontFamily: C.fontBody }}>
        <RfIcon d={RF_ICONS.plus} size={15} /> {addLabel}
      </button>
    </div>
  );
}

// Within / Across matching illustration — wired to formData.matchingType.
function RfMatchingCard({ mode, label, desc, active, onSelect }: { mode: 'within-team' | 'across-teams'; label: string; desc: string; active: boolean; onSelect: () => void }) {
  const O = C.orange, P = C.purpleDeep, cream = C.cream;
  const A = [{ x: 60, y: 40 }, { x: 36, y: 70 }, { x: 84, y: 70 }, { x: 60, y: 100 }];
  const B = [{ x: 160, y: 40 }, { x: 136, y: 70 }, { x: 184, y: 70 }, { x: 160, y: 100 }];
  const withinPairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const Dot = ({ p, c }: { p: { x: number; y: number }; c: string }) => <circle cx={p.x} cy={p.y} r="6" fill={c} stroke={cream} strokeWidth="2" />;
  return (
    <div onClick={onSelect} style={{ cursor: 'pointer', borderRadius: 14, padding: 14, background: active ? 'rgba(221,83,28,.05)' : '#fff', border: `2px solid ${active ? C.orange : C.hairStrong}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative', width: '100%', height: 130, background: cream, borderRadius: 11, border: `1px solid rgba(76,25,77,.12)`, overflow: 'hidden' }}>
        <svg viewBox="0 0 220 140" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="60" cy="70" r="38" fill="none" stroke={O} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="160" cy="70" r="38" fill="none" stroke={P} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
          {mode === 'across-teams' ? (
            <g>
              {A.map((a, i) => <line key={i} x1={a.x} y1={a.y} x2={B[i].x} y2={B[i].y} stroke={P} strokeOpacity=".5" strokeWidth="1.4" />)}
              <line x1={A[0].x} y1={A[0].y} x2={B[3].x} y2={B[3].y} stroke={O} strokeOpacity=".5" strokeWidth="1.4" />
              <line x1={A[3].x} y1={A[3].y} x2={B[0].x} y2={B[0].y} stroke={O} strokeOpacity=".5" strokeWidth="1.4" />
            </g>
          ) : (
            <g>
              {withinPairs.map(([i, j], k) => <line key={'a' + k} x1={A[i].x} y1={A[i].y} x2={A[j].x} y2={A[j].y} stroke={O} strokeOpacity=".55" strokeWidth="1.4" />)}
              {withinPairs.map(([i, j], k) => <line key={'b' + k} x1={B[i].x} y1={B[i].y} x2={B[j].x} y2={B[j].y} stroke={P} strokeOpacity=".55" strokeWidth="1.4" />)}
            </g>
          )}
          {A.map((p, i) => <Dot key={'a' + i} p={p} c={O} />)}
          {B.map((p, i) => <Dot key={'b' + i} p={p} c={P} />)}
        </svg>
        {active && <span style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: C.orange, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>}
      </div>
      <div>
        <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14.5, color: active ? C.purpleDeep : C.ink }}>{label}</div>
        <div style={{ marginTop: 3, fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  );
}

// Styled number/text input row — controlled, wired to the caller's onChange.
function RfNumField({ label, help, value, onChange, suffix, min, max, width, id, inputRef, placeholder, error, type = 'number', disabled }: {
  label: string; help?: string; value: any; onChange: (e: any) => void; suffix?: string;
  min?: number | string; max?: number | string; width?: number | string; id?: string;
  inputRef?: Ref<HTMLInputElement>; placeholder?: string; error?: boolean; type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width, opacity: disabled ? .55 : 1 }}>
      <RfLbl help={help}>{label}</RfLbl>
      <div style={rfFieldBox(error)}>
        <input ref={inputRef} id={id} type={type} min={min} max={max} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled} style={rfBareInput} />
        {suffix && <span style={{ fontSize: 13, color: C.ink, opacity: .55 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function SessionForm({ initialData, onSubmit, onCancel, userEmail, organizerName, profileImageUrl, userSlug, isDuplicate }: SessionFormProps) {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [availableIceBreakers, setAvailableIceBreakers] = useState<string[]>([]);
  const [systemParams, setSystemParams] = useState<SystemParameters | null>(null);
  const [useCustomTimes, setUseCustomTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditCheckLoading, setCreditCheckLoading] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{
    hasSubscription: boolean;
    credits: { balance: number; capacityTier: string }[];
    totalCredits: number;
    requiredTier: CapacityTier;
    eventCapacity: number;
  } | null>(null);
  const [pendingSessionData, setPendingSessionData] = useState<Omit<NetworkingSession, 'id'> | null>(null);

  // Check if first round has already started or passed
  const hasFirstRoundStarted = (): boolean => {
    if (!initialData || isDuplicate) return false;
    
    const now = new Date();
    
    // If session has rounds array, check the first round
    if (initialData.rounds && initialData.rounds.length > 0) {
      const firstRound = initialData.rounds[0];
      if (firstRound.date && firstRound.startTime) {
        const [hours, minutes] = firstRound.startTime.split(':').map(Number);
        const roundStart = new Date(firstRound.date);
        roundStart.setHours(hours, minutes, 0, 0);
        return now >= roundStart;
      }
    }
    
    // If no rounds array, check based on session date and startTime
    if (initialData.date && initialData.startTime) {
      const [hours, minutes] = initialData.startTime.split(':').map(Number);
      const sessionStart = new Date(initialData.date);
      sessionStart.setHours(hours, minutes, 0, 0);
      return now >= sessionStart;
    }
    
    return false;
  };
  
  // Count how many rounds have already started or passed
  const getStartedRoundsCount = (): number => {
    if (!initialData || isDuplicate) return 0;
    
    const now = new Date();
    let startedCount = 0;
    
    // If session has rounds array, count started rounds
    if (initialData.rounds && initialData.rounds.length > 0) {
      for (const round of initialData.rounds) {
        if (round.date && round.startTime) {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date);
          roundStart.setHours(hours, minutes, 0, 0);
          if (now >= roundStart) {
            startedCount++;
          }
        }
      }
    }
    
    return startedCount;
  };
  
  const firstRoundStarted = hasFirstRoundStarted();
  const minRoundsAllowed = getStartedRoundsCount();
  
  // Fetch system parameters (includes all defaults and constraints)
  useEffect(() => {
    const loadParams = async () => {
      try {
        const params = await fetchSystemParameters();
        setSystemParams(params);
      } catch (error) {
        errorLog('Error fetching system parameters:', error);
      }
    };
    loadParams();
  }, []);
  
  // Fetch available ice breakers from API
  useEffect(() => {
    const fetchIceBreakers = async () => {
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
          setAvailableIceBreakers(data.iceBreakers || DEFAULT_ICE_BREAKERS);
        } else {
          setAvailableIceBreakers(DEFAULT_ICE_BREAKERS);
        }
      } catch (error) {
        errorLog('Error fetching ice breakers:', error);
        setAvailableIceBreakers(DEFAULT_ICE_BREAKERS);
      }
    };
    fetchIceBreakers();
  }, []);

  // Helper function to get 3 random default ice breakers
  const getDefaultIceBreakers = (questions: string[] = availableIceBreakers) => {
    if (questions.length === 0) return [];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((question, index) => ({
      id: `ib_default_${Date.now()}_${index}`,
      question
    }));
  };

  const [formData, setFormData] = useState<Omit<NetworkingSession, 'id'>>({
    name: initialData?.name || '',
    date: initialData?.date || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    roundDuration: initialData?.roundDuration || (systemParams?.defaultRoundDuration ?? 10),
    numberOfRounds: initialData?.numberOfRounds || (systemParams?.defaultNumberOfRounds ?? 1),
    gapBetweenRounds: initialData?.gapBetweenRounds || (systemParams?.defaultGapBetweenRounds ?? 10),
    limitParticipants: initialData?.limitParticipants ?? true,
    maxParticipants: initialData?.maxParticipants || 50,
    groupSize: initialData?.groupSize || (systemParams?.defaultGroupSize ?? 2),
    limitGroups: initialData?.limitGroups ?? (systemParams?.defaultLimitGroups ?? false),
    maxGroups: initialData?.maxGroups || 10,
    status: initialData?.status || 'draft',
    registrationStart: initialData?.registrationStart,
    isRecurring: initialData?.isRecurring || false,
    frequency: initialData?.frequency || 'weekly',
    rounds: initialData?.rounds || [],
    enableTeams: initialData?.enableTeams || false,
    allowMultipleTeams: initialData?.allowMultipleTeams || false,
    matchingType: initialData?.matchingType || 'within-team',
    teams: initialData?.teams || [],
    enableTopics: initialData?.enableTopics || false,
    allowMultipleTopics: initialData?.allowMultipleTopics || false,
    topics: initialData?.topics || [],
    meetingPoints: initialData?.meetingPoints?.length ? initialData.meetingPoints : [],
    iceBreakers: initialData?.iceBreakers && initialData.iceBreakers.length > 0 ? initialData.iceBreakers : []
  });

  // Update formData when systemParams are loaded (only for new sessions)
  useEffect(() => {
    if (systemParams && !initialData) {
      setFormData(prev => ({
        ...prev,
        roundDuration: systemParams.defaultRoundDuration ?? prev.roundDuration,
        numberOfRounds: systemParams.defaultNumberOfRounds ?? prev.numberOfRounds,
        gapBetweenRounds: systemParams.defaultGapBetweenRounds ?? prev.gapBetweenRounds,
        limitParticipants: prev.limitParticipants,
        maxParticipants: prev.maxParticipants,
        groupSize: systemParams.defaultGroupSize ?? prev.groupSize,
        limitGroups: systemParams.defaultLimitGroups ?? prev.limitGroups,
      }));
    }
  }, [systemParams, initialData]);

  // Initialize ice breakers when availableIceBreakers is loaded (only for new sessions or duplicates)
  useEffect(() => {
    const shouldInitialize = availableIceBreakers.length > 0 && 
                             formData.iceBreakers.length === 0 && 
                             (!initialData || isDuplicate);
    
    if (shouldInitialize) {
      setFormData(prev => ({
        ...prev,
        iceBreakers: getDefaultIceBreakers(availableIceBreakers)
      }));
    }
  }, [availableIceBreakers, isDuplicate]);

  const [timeError, setTimeError] = useState('');
  const [roundDurationError, setRoundDurationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: boolean;
    date?: boolean;
    startTime?: boolean;
    groupSize?: boolean;
    meetingPoints?: boolean;
  }>({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [gapBetweenRoundsError, setGapBetweenRoundsError] = useState('');

  // Live validation for schedule making live
  useEffect(() => {
    if (!showScheduleDialog) return;
    
    if (!scheduleDate || !scheduleTime) {
      setScheduleError('');
      return;
    }
    
    const now = new Date();
    // Reset seconds and milliseconds for comparison
    now.setSeconds(0, 0);
    
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    // Check if time is in the past
    if (scheduledDateTime < now) {
      setScheduleError('Time cannot be in the past');
      return;
    }
    
    // Check if time is later than 10 minutes before first round
    if (formData.date && formData.startTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const sessionDate = new Date(formData.date);
      const firstRoundTime = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), startHour, startMinute);
      const minTimeBuffer = (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000;
      const timeBeforeFirstRound = new Date(firstRoundTime.getTime() - minTimeBuffer);
      
      if (scheduledDateTime > timeBeforeFirstRound) {
        setScheduleError(`Time cannot be later than ${systemParams?.minimalTimeToFirstRound || 10} minutes before time of first round`);
        return;
      }
    }
    
    setScheduleError('');
  }, [scheduleDate, scheduleTime, showScheduleDialog, formData.date, formData.startTime]);

  // Refs for scrolling to error fields
  const nameRef = useRef<HTMLInputElement>(null);
  const groupSizeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const meetingPointsRef = useRef<HTMLDivElement>(null);

  // Live validation for round duration
  useEffect(() => {
    if (!systemParams) return;
    
    const duration = formData.roundDuration;
    
    if (duration < systemParams.minimalRoundDuration) {
      setRoundDurationError(`Round duration must be at least ${systemParams.minimalRoundDuration} minutes`);
    } else if (duration > systemParams.maximalRoundDuration) {
      setRoundDurationError(`Round duration cannot exceed ${systemParams.maximalRoundDuration} minutes`);
    } else {
      setRoundDurationError('');
    }
  }, [formData.roundDuration, systemParams]);

  // Live validation for gap between rounds
  useEffect(() => {
    if (!systemParams) return;
    
    const gap = formData.gapBetweenRounds;
    
    if (gap < systemParams.minimalGapBetweenRounds) {
      setGapBetweenRoundsError(`Gap must be at least ${systemParams.minimalGapBetweenRounds} minutes`);
    } else {
      setGapBetweenRoundsError('');
    }
  }, [formData.gapBetweenRounds, systemParams]);

  const validateForm = () => {
    // Collect all validation errors first
    const errors: typeof fieldErrors = {};
    let firstErrorField: HTMLElement | null = null;
    
    // Check validation constraints from system parameters
    if (roundDurationError) {
      toast.error(roundDurationError);
      return false;
    }
    
    if (gapBetweenRoundsError) {
      toast.error(gapBetweenRoundsError);
      return false;
    }
    
    // Validate required fields in order of appearance
    if (!formData.name?.trim()) {
      errors.name = true;
      if (!firstErrorField) firstErrorField = nameRef.current;
    }
    
    if (!formData.groupSize || formData.groupSize < 2) {
      errors.groupSize = true;
      if (!firstErrorField) firstErrorField = groupSizeRef.current;
    }
    
    // Validate meeting points - at least one must be filled
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    if (validMeetingPoints.length === 0) {
      errors.meetingPoints = true;
      if (!firstErrorField) firstErrorField = meetingPointsRef.current;
    }
    
    // Set all errors at once
    setFieldErrors(errors);
    
    // If there are errors, show toast for first error and scroll
    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        toast.error('Please enter a round name');
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else if (errors.groupSize) {
        toast.error('Please enter a valid group size (minimum 2)');
        groupSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        groupSizeRef.current?.focus();
      } else if (errors.meetingPoints) {
        toast.error('Please add at least one meeting point');
        meetingPointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    return true;
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams 
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics 
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'draft' as const,
      registrationStart: undefined
    };

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(sessionData));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeLive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    debugLog('🚀 handleMakeLive called');
    debugLog('Form data:', formData);
    
    // Collect ALL validation errors at once (basic + publish-specific)
    const allErrors: typeof fieldErrors = {};
    const missingFields: string[] = [];
    
    // Validate basic required fields
    if (!formData.name?.trim()) {
      allErrors.name = true;
      missingFields.push('Round name');
    }
    
    if (!formData.groupSize || formData.groupSize < 2) {
      allErrors.groupSize = true;
      missingFields.push('Group size');
    }
    
    // Validate date and time for making live
    if (!formData.date) {
      allErrors.date = true;
      missingFields.push('Date');
    }
    
    // Only validate startTime if first round hasn't started yet
    if (!firstRoundStarted && !formData.startTime) {
      allErrors.startTime = true;
      missingFields.push('Time of first round');
    }
    
    // Validate meeting points - at least one must be filled
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    if (validMeetingPoints.length === 0) {
      allErrors.meetingPoints = true;
      missingFields.push('Meeting points');
    }
    
    // Check if date is in past (only if date is filled)
    if (formData.date && isDateInPast) {
      allErrors.date = true;
      // Replace the generic "Date" message if it exists
      const dateIndex = missingFields.indexOf('Date');
      if (dateIndex !== -1) {
        missingFields[dateIndex] = 'Date (cannot be in the past)';
      } else {
        missingFields.push('Date (cannot be in the past)');
      }
    }
    
    // Check if time has error (only if time is filled and first round hasn't started)
    if (!firstRoundStarted && formData.startTime && timeError) {
      allErrors.startTime = true;
      // Replace the generic "Time" message if it exists
      const timeIndex = missingFields.indexOf('Time of first round');
      if (timeIndex !== -1) {
        missingFields[timeIndex] = 'Time of first round (fix validation errors)';
      } else {
        missingFields.push('Time of first round (fix validation errors)');
      }
    }
    
    // Re-validate that time is still in the future (only if first round hasn't started)
    if (!firstRoundStarted && formData.date && formData.startTime && !allErrors.date && !allErrors.startTime) {
      const scheduledDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const now = new Date();
      const timeBuffer = (systemParams?.minimalTimeToFirstRound || 10) - 1;
      const minTimeFromNow = new Date(now.getTime() + timeBuffer * 60 * 1000);
      
      if (scheduledDateTime < minTimeFromNow) {
        allErrors.startTime = true;
        const minTime = new Date(now.getTime() + (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        missingFields.push(`Time of first round (must be at least ${systemParams?.minimalTimeToFirstRound || 10} minutes in the future, earliest: ${minTime})`);
      }
    }
    
    // Also validate that endTime is in the future
    if (formData.date && calculatedEndTime && !allErrors.date && !allErrors.startTime) {
      const sessionEndDateTime = new Date(`${formData.date}T${calculatedEndTime}:00`);
      const now = new Date();
      
      if (sessionEndDateTime <= now) {
        allErrors.startTime = true;
        missingFields.push('Session end time is in the past (please adjust start time or reduce duration)');
      }
    }
    
    // Set all errors at once
    setFieldErrors(allErrors);
    
    // If there are errors, show comprehensive error message and scroll to first field
    if (Object.keys(allErrors).length > 0) {
      // Create error message
      const errorMessage = missingFields.length > 0 
        ? `Please fill in: ${missingFields.join(', ')}`
        : 'Please fix validation errors';
      
      toast.error(errorMessage);
      
      // Scroll to first error field in order
      if (allErrors.name) {
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else if (allErrors.groupSize) {
        groupSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        groupSizeRef.current?.focus();
      } else if (allErrors.date) {
        dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (allErrors.startTime) {
        startTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (allErrors.meetingPoints) {
        meetingPointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    if (roundDurationError) {
      toast.error(roundDurationError);
      return;
    }
    
    // Set registrationStart to now ONLY if session is not already published
    const isAlreadyPublished = formData.status === 'published';
    const now = new Date();
    const registrationStartISO = isAlreadyPublished && formData.registrationStart 
      ? formData.registrationStart // Keep existing registrationStart
      : now.toISOString(); // Set new registrationStart for first-time publish
    
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'published' as const,
      registrationStart: registrationStartISO
    };

    // If session is already published (update) or in free tier, skip credit dialog
    const isAlreadyLive = formData.status === 'published' || formData.status === 'scheduled';
    const maxParticipants = formData.maxParticipants || 5;
    const isFreeEvent = maxParticipants <= 5;

    if (isAlreadyLive || isFreeEvent) {
      setIsSubmitting(true);
      try {
        await Promise.resolve(onSubmit(sessionData));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // First-time publish with paid tier: check subscription/credits
    setPendingSessionData(sessionData);
    setCreditCheckLoading(true);
    setShowCreditDialog(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        // Can't check — let backend handle it
        onSubmit(sessionData);
        setShowCreditDialog(false);
        return;
      }

      const [subRes, credRes] = await Promise.all([
        fetch(`${apiBaseUrl}/subscription`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/credits`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const subData = subRes.ok ? await subRes.json() : { hasSubscription: false };
      const credData = credRes.ok ? await credRes.json() : { credits: [] };

      const hasActiveSub = subData.hasSubscription && subData.subscription?.status === 'active';
      const creditsList = Array.isArray(credData.credits) ? credData.credits.filter((c: any) => c.balance > 0) : [];
      const totalCredits = creditsList.reduce((sum: number, c: any) => sum + c.balance, 0);

      const requiredTier = getTierForCapacity(maxParticipants);

      if (hasActiveSub) {
        // Has subscription — show the dialog with the subscription-covered
        // confirmation state (design shows this instead of skipping the dialog).
        setCreditInfo({
          hasSubscription: true,
          credits: creditsList,
          totalCredits,
          requiredTier,
          eventCapacity: maxParticipants,
        });
        return;
      }

      setCreditInfo({
        hasSubscription: false,
        credits: creditsList,
        totalCredits,
        requiredTier,
        eventCapacity: maxParticipants,
      });
    } catch (err) {
      errorLog('Error checking credits:', err);
      // On error, still let user try — backend will reject if no credits
      onSubmit(sessionData);
      setShowCreditDialog(false);
    } finally {
      setCreditCheckLoading(false);
    }
  };

  const handleConfirmPublish = () => {
    if (pendingSessionData) {
      onSubmit(pendingSessionData);
    }
    setShowCreditDialog(false);
    setPendingSessionData(null);
    setCreditInfo(null);
  };

  const handleSaveDraftAndBuyCredit = () => {
    if (pendingSessionData) {
      onSubmit({ ...pendingSessionData, status: 'draft' as const });
    }
    setShowCreditDialog(false);
    setPendingSessionData(null);
    setCreditInfo(null);
    navigate('/billing');
  };

  const handleScheduleMakingLive = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Validate date and time
    if (!formData.date || !formData.startTime) {
      toast.error('Please set date and time before scheduling');
      return;
    }
    
    if (isDateInPast) {
      toast.error('Date cannot be in the past');
      return;
    }
    
    if (timeError) {
      toast.error('Please fix time validation errors');
      return;
    }
    
    // Pre-populate with current time (Now) - without rounding
    const now = new Date();
    
    // Format date and time for input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
    setScheduleError('');
    setShowScheduleDialog(true);
  };

  const confirmScheduleMakingLive = () => {
    // Validation is now done live via useEffect, just check if there's an error
    if (scheduleError) {
      return;
    }
    
    // Validate that date and time are set
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please set date and time');
      return;
    }
    
    // Create the scheduled date-time
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams 
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics 
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'scheduled' as const,
      registrationStart: scheduledDateTime.toISOString()
    };

    onSubmit(sessionData);
    setShowScheduleDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default submit behavior - save as draft
    handleSaveDraft(e);
    
    if (!initialData) {
      // Reset form only if creating new session
      setFormData({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        roundDuration: 10,
        numberOfRounds: 1,
        gapBetweenRounds: 10,
        limitParticipants: true,
        maxParticipants: 50,
        groupSize: 2,
        status: 'draft',
        registrationStart: undefined,
        isRecurring: false,
        frequency: 'weekly',
        rounds: [],
        enableTeams: false,
        allowMultipleTeams: false,
        matchingType: 'within-team',
        teams: [],
        enableTopics: false,
        allowMultipleTopics: false,
        topics: [],
        meetingPoints: ['']
      });

    }
  };

  const estimatedGroups = formData.limitParticipants && formData.maxParticipants 
    ? Math.ceil(formData.maxParticipants / formData.groupSize)
    : null;

  // Calculate session duration from rounds
  const calculateSessionDuration = (): number => {
    if (formData.numberOfRounds === 1) {
      return formData.roundDuration;
    }
    const totalRoundTime = formData.numberOfRounds * formData.roundDuration;
    const totalGapTime = (formData.numberOfRounds - 1) * (formData.gapBetweenRounds || 0);
    return totalRoundTime + totalGapTime;
  };

  // Calculate end time from start time and session duration
  const calculateEndTime = (): string => {
    if (!formData.startTime) return '';
    
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + calculateSessionDuration();
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const sessionDuration = calculateSessionDuration();
  const calculatedEndTime = calculateEndTime();
  
  // Check if date is in the past
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const isDateInPast = formData.date && formData.date < today;

  // Generate rounds for session
  const generateRounds = () => {
    if (!formData.roundDuration || !formData.numberOfRounds) {
      return [];
    }

    const rounds = [];
    
    // If no startTime or date is provided, return empty array (no rounds to generate for actual session)
    if (!formData.startTime || !formData.date) {
      return [];
    }
    
    const now = new Date();
    
    // If editing an existing session with rounds, preserve rounds that have already started
    if (initialData && !isDuplicate && initialData.rounds && initialData.rounds.length > 0) {
      let lastStartedRoundIndex = -1;
      let nextRoundStartTime = 0; // in minutes since midnight
      
      // Find all rounds that have already started and preserve them
      for (let i = 0; i < initialData.rounds.length; i++) {
        const round = initialData.rounds[i];
        if (round.date && round.startTime) {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date);
          roundStart.setHours(hours, minutes, 0, 0);
          
          // If this round has started, keep it as is
          if (now >= roundStart && i < formData.numberOfRounds) {
            rounds.push({
              ...round,
              // Keep original times and duration for started rounds
            });
            lastStartedRoundIndex = i;
            
            // Calculate when the next round should start (after this round ends + new gap)
            const roundDate = new Date(round.date);
            const roundTimeMinutes = hours * 60 + minutes;
            const daysSinceBase = Math.floor((roundDate.getTime() - new Date(formData.date).getTime()) / (1000 * 60 * 60 * 24));
            
            // Use the ORIGINAL duration for the started round, but NEW gap for next round
            nextRoundStartTime = roundTimeMinutes + (round.duration || formData.roundDuration) + (formData.gapBetweenRounds || 0);
            nextRoundStartTime += daysSinceBase * 1440; // Add days offset
          }
        }
      }
      
      // Generate remaining rounds starting from after the last started round
      const startIndex = lastStartedRoundIndex + 1;
      
      if (startIndex < formData.numberOfRounds) {
        let currentTime = nextRoundStartTime;
        
        // If no rounds have started yet, use the original start time
        if (lastStartedRoundIndex === -1) {
          const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
          currentTime = startHours * 60 + startMinutes;
        }
        
        for (let i = startIndex; i < formData.numberOfRounds; i++) {
          // Calculate day offset (how many days past the base date)
          const dayOffset = Math.floor(currentTime / 1440); // 1440 minutes = 24 hours
          const timeInDay = currentTime % 1440; // Time within the current day
          
          const roundStartHours = Math.floor(timeInDay / 60);
          const roundStartMinutes = timeInDay % 60;
          const roundStartTime = `${roundStartHours.toString().padStart(2, '0')}:${roundStartMinutes.toString().padStart(2, '0')}`;
          
          // Calculate the actual date for this round
          const roundDate = new Date(formData.date);
          roundDate.setDate(formData.date ? new Date(formData.date).getDate() + dayOffset : 0);
          const roundDateString = roundDate.toISOString().split('T')[0]; // YYYY-MM-DD

          rounds.push({
            id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i + 1}`,
            name: roundStartTime,
            startTime: roundStartTime,
            date: roundDateString,
            duration: formData.roundDuration
          });

          // Add NEW round duration and gap for next round
          currentTime += formData.roundDuration + (formData.gapBetweenRounds || 0);
        }
      }
      
      return rounds;
    }
    
    // For new sessions or duplicates, generate all rounds from scratch
    // Generate actual rounds with times when startTime is provided
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    let currentTime = startHours * 60 + startMinutes; // Convert to minutes since midnight
    
    // Parse the base session date
    const baseDate = new Date(formData.date);

    for (let i = 0; i < formData.numberOfRounds; i++) {
      // Calculate day offset (how many days past the base date)
      const dayOffset = Math.floor(currentTime / 1440); // 1440 minutes = 24 hours
      const timeInDay = currentTime % 1440; // Time within the current day
      
      const roundStartHours = Math.floor(timeInDay / 60);
      const roundStartMinutes = timeInDay % 60;
      const roundStartTime = `${roundStartHours.toString().padStart(2, '0')}:${roundStartMinutes.toString().padStart(2, '0')}`;
      
      // Calculate the actual date for this round
      const roundDate = new Date(baseDate);
      roundDate.setDate(baseDate.getDate() + dayOffset);
      const roundDateString = roundDate.toISOString().split('T')[0]; // YYYY-MM-DD

      rounds.push({
        id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i + 1}`,
        name: roundStartTime,
        startTime: roundStartTime,
        date: roundDateString,
        duration: formData.roundDuration
      });

      // Add round duration and gap for next round
      currentTime += formData.roundDuration + (formData.gapBetweenRounds || 0);
    }

    return rounds;
  };

  // Update rounds when relevant fields change for live preview (only in auto mode)
  useEffect(() => {
    if (!useCustomTimes && formData.startTime && formData.roundDuration && formData.numberOfRounds && formData.date) {
      const newRounds = generateRounds();
      // Only update if rounds actually changed to avoid infinite loop
      if (JSON.stringify(newRounds) !== JSON.stringify(formData.rounds)) {
        setFormData(prev => ({ ...prev, rounds: newRounds }));
      }
    }
  }, [formData.startTime, formData.roundDuration, formData.numberOfRounds, formData.gapBetweenRounds, formData.date, useCustomTimes]);

  // Validate time whenever date or time changes
  useEffect(() => {
    // Only validate if both date and time are filled
    if (!formData.date || !formData.startTime) {
      setTimeError('');
      return;
    }
    
    // Validate that minutes are multiple of the configured interval
    const interval = systemParams?.timePickerIntervalMinutes || 5;
    const [hours, minutes] = formData.startTime.split(':');
    if (parseInt(minutes) % interval !== 0) {
      setTimeError(`Time must be in ${interval}-minute intervals.`);
      return;
    }

    // Check if scheduled time is at least minimalTimeToFirstRound minutes from now (internal validation)
    const scheduledDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const now = new Date();
    const timeBuffer = (systemParams?.minimalTimeToFirstRound || 10) - 1;
    const minTimeFromNow = new Date(now.getTime() + timeBuffer * 60 * 1000);

    // Round minTimeFromNow to next interval for comparison
    const minMinutes = minTimeFromNow.getMinutes();
    const roundedMinutes = Math.ceil(minMinutes / interval) * interval;
    minTimeFromNow.setMinutes(roundedMinutes);
    minTimeFromNow.setSeconds(0);
    minTimeFromNow.setMilliseconds(0);

    // Normalize scheduledDateTime to remove milliseconds
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);

    if (scheduledDateTime < minTimeFromNow) {
      // Show user-friendly message with minimalTimeToFirstRound minutes
      const displayTime = new Date(now.getTime() + (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000);
      const displayMinutes = displayTime.getMinutes();
      const displayRoundedMinutes = Math.ceil(displayMinutes / interval) * interval;
      displayTime.setMinutes(displayRoundedMinutes);
      displayTime.setSeconds(0);
      displayTime.setMilliseconds(0);
      
      const minTime = displayTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      setTimeError(`Time must be at least ${systemParams?.minimalTimeToFirstRound || 10} minutes in the future (earliest: ${minTime}).`);
      return;
    }
    
    // If we get here, validation passed
    setTimeError('');
  }, [formData.date, formData.startTime]);

  // Round duration validation is handled by the useEffect with sessionDefaults (lines 221-234)

  // Generate time-based name for rounds (only start time)
  const generateRoundName = (startTime: string, duration: number): string => {
    if (!startTime) return 'Round';
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const formatTime = (hours: number, minutes: number) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return formatTime(startHours, startMinutes);
  };

  // Generate full time display with duration (for preview)
  const generateRoundTimeDisplay = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + duration;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    const formatTime = (hours: number, minutes: number) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const formattedStart = formatTime(startHours, startMinutes);
    const formattedEnd = formatTime(endHours, endMinutes);
    
    return `${formattedStart} - ${formattedEnd}`;
  };







  // Team management functions
  const addTeam = () => {
    setFormData({
      ...formData,
      teams: [...(formData.teams || []), '']
    });
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...(formData.teams || [])];
    newTeams[index] = value;
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const removeTeam = (index: number) => {
    const newTeams = (formData.teams || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const moveTeamUp = (index: number) => {
    if (index === 0) return;
    const newTeams = [...(formData.teams || [])];
    [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const moveTeamDown = (index: number) => {
    const teams = formData.teams || [];
    if (index === teams.length - 1) return;
    const newTeams = [...teams];
    [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  // Topic management functions
  const addTopic = () => {
    setFormData({
      ...formData,
      topics: [...(formData.topics || []), '']
    });
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...(formData.topics || [])];
    newTopics[index] = value;
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const removeTopic = (index: number) => {
    const newTopics = (formData.topics || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const moveTopicUp = (index: number) => {
    if (index === 0) return;
    const newTopics = [...(formData.topics || [])];
    [newTopics[index - 1], newTopics[index]] = [newTopics[index], newTopics[index - 1]];
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const moveTopicDown = (index: number) => {
    const topics = formData.topics || [];
    if (index === topics.length - 1) return;
    const newTopics = [...topics];
    [newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]];
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const rfGhostBtn: CSSProperties = { fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: C.purpleDeep, border: `1px solid ${C.hairStrong}` };
  const rfErr: CSSProperties = { margin: '8px 0 0', fontSize: 12.5, color: '#c0392b' };
  const previewSlug = userSlug || 'your-event';

  return (
    <div style={{ fontFamily: C.fontBody, color: C.ink }}>
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0,1fr) 440px' : '1fr', gap: 28, alignItems: 'start' }}>
        {/* Form column */}
        <form onSubmit={handleSubmit} style={{ minWidth: 0 }}>

          {/* Event capacity */}
          <RfCard icon={RF_ICONS.users} title="Event capacity">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, marginBottom: 18, background: 'rgba(31,138,77,.08)', border: '1px solid rgba(31,138,77,.25)' }}>
              <span style={{ color: '#1f8a4d', display: 'inline-flex' }}><RfIcon d={RF_ICONS.spark} size={16} /></span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#176b3c' }}>Events up to 5 participants free for testing purposes</span>
            </div>
            <RfNumField
              label="Expected number of participants"
              value={formData.maxParticipants}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setFormData({ ...formData, maxParticipants: '' as any, limitParticipants: false });
                } else {
                  const parsedValue = parseInt(value);
                  if (!isNaN(parsedValue)) {
                    setFormData({ ...formData, maxParticipants: parsedValue, limitParticipants: true });
                  }
                }
              }}
              suffix="participants" min={2} max={10000} width={260} id="eventCapacity" placeholder="e.g. 50"
            />
            <p style={{ margin: '8px 0 0', fontSize: 11.5, color: C.ink, opacity: .55 }}>This determines the pricing tier for your event</p>
          </RfCard>

          {/* Basic information */}
          <RfCard icon={RF_ICONS.cal} title="Basic information">
            <div style={{ marginBottom: 16 }}>
              <RfNumField
                type="text"
                label="Round name"
                inputRef={nameRef}
                id="name"
                value={formData.name}
                error={fieldErrors.name}
                placeholder="e.g. Morning Networking for IT Professionals"
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: false }));
                }}
              />
            </div>
            <RfNumField
              label="Group size"
              help="Number of participants in a networking group. For a one-on-one meeting, enter 2. Smaller groups allow for deeper networking and increase the likelihood of finding a group to join."
              inputRef={groupSizeRef}
              id="groupSize"
              value={formData.groupSize}
              error={fieldErrors.groupSize}
              min={2}
              max={20}
              width={200}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setFormData({ ...formData, groupSize: '' as any });
                } else {
                  const parsedValue = parseInt(value);
                  if (!isNaN(parsedValue)) {
                    setFormData({ ...formData, groupSize: parsedValue });
                  }
                }
              }}
            />
          </RfCard>

          {/* Rounds */}
          <RfCard
            icon={RF_ICONS.clock}
            title="Rounds"
            hintList={[
              `First round must be at least ${systemParams?.minimalTimeToFirstRound || 10} minutes in the future`,
              `Participants receive SMS notification ${systemParams?.confirmationWindowMinutes || 5} minutes before the round to confirm attendance`,
              `Time must be rounded to ${systemParams?.timePickerIntervalMinutes || 5} minutes`,
            ]}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div ref={dateRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <RfLbl>Date of first round</RfLbl>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => {
                    setFormData({ ...formData, date });
                    if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: false }));
                  }}
                  placeholder="dd-mm-yyyy"
                  minDate={new Date().toISOString().split('T')[0]}
                  className={fieldErrors.date || isDateInPast ? 'border-destructive' : ''}
                  disabled={firstRoundStarted}
                />
                {isDateInPast && <p style={rfErr}>Date cannot be in the past</p>}
              </div>

              <div ref={startTimeRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <RfLbl>Time of first round</RfLbl>
                <TimePicker
                  value={formData.startTime}
                  onChange={(time) => {
                    setFormData({ ...formData, startTime: time });
                    if (fieldErrors.startTime) setFieldErrors(prev => ({ ...prev, startTime: false }));
                  }}
                  error={!firstRoundStarted && (!!timeError || fieldErrors.startTime)}
                  disabled={firstRoundStarted}
                  asapMinutesOffset={systemParams?.minimalTimeToFirstRound || 10}
                  minuteInterval={systemParams?.timePickerIntervalMinutes || 5}
                />
                {timeError && !firstRoundStarted && <p style={rfErr}>{timeError}</p>}
              </div>
            </div>

            <div style={{ height: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <RfNumField
                label="Number of rounds"
                value={formData.numberOfRounds}
                min={minRoundsAllowed > 0 ? minRoundsAllowed : 1}
                max={20}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, numberOfRounds: '' as any });
                  } else {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue)) {
                      const minValue = minRoundsAllowed > 0 ? minRoundsAllowed : 1;
                      const finalValue = Math.max(parsedValue, minValue);
                      setFormData({ ...formData, numberOfRounds: finalValue });
                    }
                  }
                }}
              />
              <div>
                <RfNumField
                  label="Round duration"
                  value={formData.roundDuration}
                  suffix="min"
                  min={systemParams?.minimalRoundDuration ?? 5}
                  max={systemParams?.maximalRoundDuration ?? 240}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData({ ...formData, roundDuration: '' as any });
                    } else {
                      const parsedValue = parseInt(value);
                      if (!isNaN(parsedValue)) {
                        setFormData({ ...formData, roundDuration: parsedValue });
                      }
                    }
                  }}
                />
                {roundDurationError && <p style={rfErr}>{roundDurationError}</p>}
              </div>
            </div>

            {formData.numberOfRounds > 1 && (
              <>
                <div style={{ height: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <RfNumField
                      label="Gap between rounds"
                      value={formData.gapBetweenRounds || 10}
                      suffix="min"
                      min={systemParams?.minimalGapBetweenRounds ?? 10}
                      max={60}
                      onChange={(e) => {
                        const value = e.target.value;
                        const minGap = systemParams?.minimalGapBetweenRounds ?? 10;
                        if (value === '') {
                          setFormData({ ...formData, gapBetweenRounds: minGap });
                        } else {
                          const parsedValue = parseInt(value);
                          if (!isNaN(parsedValue)) {
                            setFormData({ ...formData, gapBetweenRounds: parsedValue });
                          }
                        }
                      }}
                    />
                    {gapBetweenRoundsError && <p style={rfErr}>{gapBetweenRoundsError}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Custom Times Toggle */}
            {formData.numberOfRounds > 1 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
                <RfToggleRow
                  label="Custom round times"
                  note="Set individual start times for each round"
                  on={useCustomTimes}
                  onChange={(checked) => {
                    setUseCustomTimes(checked);
                    if (!checked) {
                      const newRounds = generateRounds();
                      setFormData(prev => ({ ...prev, rounds: newRounds }));
                    }
                  }}
                />
              </div>
            )}

          {/* Custom Round Times Editor — HIDDEN to match design (only the toggle
              is shown, no editor body). Logic preserved via the false guard. */}
          {false && useCustomTimes && formData.rounds.length > 0 && (
            <div className="space-y-3 pt-2">
              <Label>Round start times</Label>
              <div className="space-y-2">
                {formData.rounds.map((round, idx) => (
                  <div key={round.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground w-20">Round {idx + 1}</span>
                    <Input
                      type="time"
                      value={round.startTime}
                      className="w-32"
                      step="300"
                      onChange={(e) => {
                        const newTime = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          rounds: prev.rounds.map((r, i) =>
                            i === idx ? { ...r, startTime: newTime, name: newTime } : r
                          ),
                        }));
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="240"
                        value={round.duration}
                        className="w-20 pr-8"
                        onChange={(e) => {
                          const dur = parseInt(e.target.value) || formData.roundDuration;
                          setFormData(prev => ({
                            ...prev,
                            rounds: prev.rounds.map((r, i) =>
                              i === idx ? { ...r, duration: dur } : r
                            ),
                          }));
                        }}
                      />
                      <span className="text-xs text-muted-foreground -ml-7">min</span>
                    </div>
                    {formData.rounds.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            numberOfRounds: prev.numberOfRounds - 1,
                            rounds: prev.rounds.filter((_, i) => i !== idx),
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastRound = formData.rounds[formData.rounds.length - 1];
                  const [h, m] = (lastRound?.startTime || '10:00').split(':').map(Number);
                  const nextTime = h * 60 + m + (lastRound?.duration || 10) + (formData.gapBetweenRounds || 10);
                  const nh = Math.floor((nextTime % 1440) / 60);
                  const nm = nextTime % 60;
                  const newTime = `${nh.toString().padStart(2, '0')}:${(nm - nm % 5).toString().padStart(2, '0')}`;
                  setFormData(prev => ({
                    ...prev,
                    numberOfRounds: prev.numberOfRounds + 1,
                    rounds: [...prev.rounds, {
                      id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                      name: newTime,
                      startTime: newTime,
                      date: formData.date,
                      duration: formData.roundDuration,
                    }],
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add round
              </Button>
            </div>
          )}
          </RfCard>

          {/* Meeting points */}
          <RfCard icon={RF_ICONS.pin} title="Meeting points" hint="Enter locations that are distinctive and easy to recognize" error={fieldErrors.meetingPoints}>
            <div ref={meetingPointsRef}>
              <MeetingPointsManager
                meetingPoints={formData.meetingPoints || []}
                onChange={(meetingPoints) => {
                  setFormData(prev => ({ ...prev, meetingPoints }));
                  if (fieldErrors.meetingPoints) setFieldErrors(prev => ({ ...prev, meetingPoints: false }));
                }}
              />
            </div>
          </RfCard>

          {/* Ice breakers */}
          <RfCard icon={RF_ICONS.msg} title="Ice breakers">
            <IceBreakersManager
              iceBreakers={formData.iceBreakers || []}
              onChange={(iceBreakers) => setFormData({ ...formData, iceBreakers })}
            />
          </RfCard>

          {/* Advanced */}
          <RfCard icon={RF_ICONS.settings} title="Advanced">
            <RfToggleRow
              label="Limit number of groups"
              help="Useful if you have a dedicated table or meeting room for each group"
              on={!!formData.limitGroups}
              onChange={(checked) => setFormData({ ...formData, limitGroups: checked })}
            />
            {formData.limitGroups && (
              <div style={{ marginTop: 16 }}>
                <RfNumField
                  label="Maximum groups"
                  value={formData.maxGroups}
                  min={1}
                  max={100}
                  width={200}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData({ ...formData, maxGroups: '' as any });
                    } else {
                      const parsedValue = parseInt(value);
                      if (!isNaN(parsedValue)) {
                        setFormData({ ...formData, maxGroups: parsedValue });
                      }
                    }
                  }}
                />
              </div>
            )}

            <RfSeparator />

            <RfToggleRow
              label="Enable teams"
              help="Can be used for networking between or within departments. Also useful for events like weddings where Team bride meets Team groom"
              on={!!formData.enableTeams}
              onChange={(checked) => {
                const newFormData = { ...formData, enableTeams: checked };
                if (checked && (!formData.teams || formData.teams.length === 0)) {
                  newFormData.teams = [''];
                }
                setFormData(newFormData);
              }}
            />
            {formData.enableTeams && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <RfLbl>Team names</RfLbl>
                <RfEditableList
                  rows={formData.teams || []}
                  onUpdate={updateTeam}
                  onRemove={removeTeam}
                  onMoveUp={moveTeamUp}
                  onMoveDown={moveTeamDown}
                  onAdd={addTeam}
                  placeholder="e.g. Sales, Marketing, Team Bride, …"
                  addLabel="Add team"
                />
                <div style={{ marginTop: 6 }}>
                  <RfLbl>Matching type</RfLbl>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <RfMatchingCard mode="within-team" label="Within the team" desc="Members meet others on their own team." active={formData.matchingType === 'within-team'} onSelect={() => setFormData({ ...formData, matchingType: 'within-team' })} />
                    <RfMatchingCard mode="across-teams" label="Across teams" desc="Members meet people from other teams." active={formData.matchingType === 'across-teams'} onSelect={() => setFormData({ ...formData, matchingType: 'across-teams' })} />
                  </div>
                </div>
              </div>
            )}

            <RfSeparator />

            <RfToggleRow
              label="Enable topics"
              help="If you want participants to be matched by topic. Use carefully - best networking results happen when people meet outside their bubbles"
              on={!!formData.enableTopics}
              onChange={(checked) => {
                const newFormData = { ...formData, enableTopics: checked };
                if (checked && (!formData.topics || formData.topics.length === 0)) {
                  newFormData.topics = [''];
                }
                setFormData(newFormData);
              }}
            />
            {formData.enableTopics && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <RfLbl>Topic names</RfLbl>
                <RfEditableList
                  rows={formData.topics || []}
                  onUpdate={updateTopic}
                  onRemove={removeTopic}
                  onMoveUp={moveTopicUp}
                  onMoveDown={moveTopicDown}
                  onAdd={addTopic}
                  placeholder="Topic name"
                  addLabel="Add topic"
                />
                <label
                  onClick={() => setFormData({ ...formData, allowMultipleTopics: !formData.allowMultipleTopics })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 13.5, color: C.ink, cursor: 'pointer' }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: formData.allowMultipleTopics ? C.orange : '#fff', border: formData.allowMultipleTopics ? 'none' : `1.5px solid ${C.hairStrong}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    {formData.allowMultipleTopics && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </span>
                  Participant can select multiple topics
                </label>
              </div>
            )}
          </RfCard>

          {/* Mobile preview — before action buttons */}
          {!isDesktop && (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <SessionPreview formData={formData} userEmail={userEmail} organizerName={organizerName} profileImageUrl={profileImageUrl} userSlug={userSlug} />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
            {onCancel ? (
              <button type="button" onClick={onCancel} style={rfGhostBtn}>Cancel</button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <button type="button" onClick={handleSaveDraft} disabled={isSubmitting} style={{ ...rfGhostBtn, opacity: isSubmitting ? 0.6 : 1 }}>Save as draft</button>
              <div style={{ display: 'inline-flex', alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={handleMakeLive}
                  disabled={!!roundDurationError || isSubmitting}
                  style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, border: 'none', cursor: (!!roundDurationError || isSubmitting) ? 'not-allowed' : 'pointer', background: C.orange, color: '#fff', padding: '11px 16px', borderRadius: '12px 0 0 12px', boxShadow: '0 6px 16px rgba(221,83,28,.25)', opacity: (!!roundDurationError || isSubmitting) ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Publishing...</>
                  ) : (
                    formData.status === 'published' ? 'Update on event page' : 'Publish to event page'
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More publish options"
                      disabled={!!roundDurationError}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: !!roundDurationError ? 'not-allowed' : 'pointer', background: C.orange, color: '#fff', padding: '0 11px', borderRadius: '0 12px 12px 0', borderLeft: '1px solid rgba(255,255,255,.30)', boxShadow: '0 6px 16px rgba(221,83,28,.25)' }}
                    >
                      <RfIcon d={RF_ICONS.down} size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleScheduleMakingLive}>
                      Schedule
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
    </form>

    {/* Schedule Dialog */}
    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule making live</DialogTitle>
          <DialogDescription>
            Choose when this round becomes visible on the event page. Time must be at least {systemParams?.minimalTimeToFirstRound || 10} minutes in the future to give participants time to register.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <DatePicker
                value={scheduleDate}
                onChange={setScheduleDate}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <TimePicker
                value={scheduleTime}
                onChange={setScheduleTime}
                placeholder="Select time"
                asapButtonText="Now"
                useNowForAsap={true}
                minuteInterval={systemParams?.timePickerIntervalMinutes || 5}
              />
            </div>
          </div>
          {scheduleError && (
            <p className="text-sm text-destructive">{scheduleError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
            Cancel
          </Button>
          <Button onClick={confirmScheduleMakingLive}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Credit Confirmation Dialog */}
    <Dialog open={showCreditDialog} onOpenChange={(open) => {
      if (!open) {
        setShowCreditDialog(false);
        setPendingSessionData(null);
        setCreditInfo(null);
      }
    }}>
      <DialogContent style={{ maxWidth: '420px' }}>
        <DialogHeader>
          <DialogTitle>Publish event</DialogTitle>
          <DialogDescription>
            {formData.name?.trim() || 'This round'} will go live on your event page.
          </DialogDescription>
        </DialogHeader>
        {creditCheckLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : creditInfo?.hasSubscription ? (
          <div style={{ display: 'flex', gap: 11, padding: '14px 16px', borderRadius: 12, background: 'rgba(31,138,77,.08)', border: '1px solid rgba(31,138,77,.25)' }}>
            <Check className="h-[17px] w-[17px]" style={{ color: '#1f8a4d', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>
              <strong style={{ color: C.purpleDeep }}>Unlimited events</strong> — your subscription covers this round. No credit needed.
            </div>
          </div>
        ) : creditInfo ? (() => {
          const requiredTierCapacity = PRICING_TIERS[creditInfo.requiredTier].capacity;
          // Exact match — credit for the same tier as the event
          const exactCredit = creditInfo.credits.find(c => c.capacityTier === creditInfo.requiredTier && c.balance > 0);
          // Any usable credit (equal or higher tier)
          const usableCredit = creditInfo.credits.find(c => {
            const tierCap = PRICING_TIERS[c.capacityTier as CapacityTier]?.capacity || 0;
            return tierCap >= requiredTierCapacity && c.balance > 0;
          });
          // Higher-tier credit available but no exact match
          const isUsingHigherTier = !exactCredit && !!usableCredit;
          const hasUsableCredit = !!usableCredit;
          // Price of the matching tier credit (for the suggestion)
          const requiredTierPrice = PRICING_TIERS[creditInfo.requiredTier]?.singleEventPrice || 0;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Credits per tier */}
              {creditInfo.credits.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  {creditInfo.credits.map((c) => {
                    const tierCap = PRICING_TIERS[c.capacityTier as CapacityTier]?.capacity || 0;
                    const isUsable = tierCap >= requiredTierCapacity;
                    return (
                      <div
                        key={c.capacityTier}
                        className="flex items-center justify-between"
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--border)',
                          background: isUsable ? '#f0fdf4' : undefined,
                        }}
                      >
                        <span className="text-sm">
                          Up to {tierCap} participants
                        </span>
                        <span className={`text-sm font-medium ${isUsable ? 'text-green-700' : 'text-muted-foreground'}`}>
                          {c.balance} {c.balance === 1 ? 'credit' : 'credits'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {hasUsableCredit && !isUsingHigherTier ? (
                /* Exact tier match — simple message */
                <p className="text-sm text-muted-foreground">
                  1 credit (up to {PRICING_TIERS[usableCredit!.capacityTier as CapacityTier]?.capacity} participants) will be used.
                </p>
              ) : isUsingHigherTier ? (
                /* No exact match but higher tier available — suggest cheaper option */
                <div className="p-3 border rounded-lg" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <div className="text-sm" style={{ color: '#1e40af' }}>
                    You don't have a credit for up to {requiredTierCapacity} participants ({formatPrice(requiredTierPrice)}), but you can use your <span className="font-medium">up to {PRICING_TIERS[usableCredit!.capacityTier as CapacityTier]?.capacity}</span> credit instead.
                  </div>
                  <div className="text-xs" style={{ color: '#3b82f6', marginTop: '4px' }}>
                    Tip: A credit for up to {requiredTierCapacity} participants costs only {formatPrice(requiredTierPrice)}.
                  </div>
                </div>
              ) : creditInfo.credits.length > 0 ? (
                /* Has credits but none usable for this tier */
                <div className="p-3 border rounded-lg border-amber-200" style={{ background: '#fffbeb' }}>
                  <div className="text-sm font-medium" style={{ color: '#92400e' }}>
                    No credits for this tier
                  </div>
                  <div className="text-xs" style={{ color: '#a16207' }}>
                    You need a credit for up to {requiredTierCapacity} participants ({formatPrice(requiredTierPrice)}). Purchase on the Billing page.
                  </div>
                </div>
              ) : (
                /* No credits at all */
                <div className="p-3 border rounded-lg border-amber-200" style={{ background: '#fffbeb' }}>
                  <div className="text-sm font-medium" style={{ color: '#92400e' }}>
                    No credits available
                  </div>
                  <div className="text-xs" style={{ color: '#a16207' }}>
                    Purchase credits or subscribe for unlimited events on the Billing page.
                  </div>
                </div>
              )}
            </div>
          );
        })() : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setShowCreditDialog(false);
            setPendingSessionData(null);
            setCreditInfo(null);
          }}>
            Cancel
          </Button>
          {creditInfo?.hasSubscription ? (
            <Button onClick={handleConfirmPublish}>
              Publish
            </Button>
          ) : creditInfo && (() => {
            const requiredCap = PRICING_TIERS[creditInfo.requiredTier].capacity;
            const exactMatch = creditInfo.credits.some(c => c.capacityTier === creditInfo.requiredTier && c.balance > 0);
            const hasUsable = creditInfo.credits.some(c => {
              const tierCap = PRICING_TIERS[c.capacityTier as CapacityTier]?.capacity || 0;
              return tierCap >= requiredCap && c.balance > 0;
            });
            const usingHigherTier = !exactMatch && hasUsable;
            return hasUsable ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {usingHigherTier && (
                  <Button variant="outline" onClick={handleSaveDraftAndBuyCredit}>
                    Save as draft & buy credit
                  </Button>
                )}
                <Button onClick={handleConfirmPublish}>
                  {usingHigherTier ? 'Use this credit' : 'Publish'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleSaveDraftAndBuyCredit}>
                Save as draft & buy credit
              </Button>
            );
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Live event page preview column */}
    {isDesktop && (
      <div style={{ position: 'sticky', top: 96 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: C.orange, transform: 'rotate(45deg)', display: 'inline-block' }} />
          <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.purpleDeep }}>Event page preview</span>
        </div>
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.hairStrong}`, background: '#fff', boxShadow: '0 22px 48px rgba(75,29,81,.16)' }}>
          <div style={{ padding: '11px 16px', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', gap: 5 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 10.5, opacity: .8 }}>wonderelo.com/{previewSlug}</span>
          </div>
          <div style={{ maxHeight: 760, overflowY: 'auto', overflowX: 'hidden', background: C.cream, padding: 16 }}>
            <SessionPreview embedded formData={formData} userEmail={userEmail} organizerName={organizerName} profileImageUrl={profileImageUrl} userSlug={userSlug} />
          </div>
        </div>
        <p style={{ margin: '12px 2px 0', fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.5 }}>Published rounds show up on your public event page.</p>
      </div>
    )}
      </div>
    </div>
  );
}