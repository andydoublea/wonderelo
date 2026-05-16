import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';
import { getParametersOrDefault } from '../utils/systemParameters';

interface AdminBpmnDiagramProps {
  onBack: () => void;
}

/**
 * BPMN-style process diagrams for the Wonderelo status model.
 *
 * Pure hand-built SVG (no diagram library dependency). The shapes follow BPMN
 * conventions:
 *  - thin circle      = start event
 *  - thick/double ring = end event (terminal)
 *  - rounded rectangle = state / task
 *  - diamond           = gateway (decision point)
 *  - labelled arrow    = sequence flow (the label is the trigger / condition)
 *
 * Source of truth for the transitions:
 *  - src/supabase/functions/server/db.ts  (VALID_STATUS_TRANSITIONS)
 *  - src/supabase/functions/server/participant-dashboard.tsx (auto-detections)
 *  - src/utils/sessionStatus.tsx (computed round status)
 * Keep this diagram in sync with AdminStatusesGuide.tsx.
 */

type NodeKind = 'start' | 'end' | 'state' | 'gateway' | 'note' | 'info';

interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: NodeKind;
  label: string;
  sub?: string;
  fill?: string;
  stroke?: string;
  textColor?: string;
}

type Side = 'left' | 'right' | 'top' | 'bottom';

interface DiagramEdge {
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
  label?: string;
  dashed?: boolean;
  color?: string;
  /** Vertical nudge for the label so it sits clear of arrows / boxes. */
  labelDy?: number;
}

const EDGE_COLOR = '#64748b'; // slate-500
const EDGE_OK = '#16a34a'; // green-600
const EDGE_BAD = '#dc2626'; // red-600

function anchor(n: DiagramNode, side: Side): { x: number; y: number } {
  switch (side) {
    case 'left':
      return { x: n.x, y: n.y + n.h / 2 };
    case 'right':
      return { x: n.x + n.w, y: n.y + n.h / 2 };
    case 'top':
      return { x: n.x + n.w / 2, y: n.y };
    case 'bottom':
      return { x: n.x + n.w / 2, y: n.y + n.h };
  }
}

/** Orthogonal 3-segment elbow router between two anchors. */
function edgePath(p1: { x: number; y: number }, s1: Side, p2: { x: number; y: number }, s2: Side): string {
  // Same row, flowing left→right: straight line.
  if (s1 === 'right' && s2 === 'left' && Math.abs(p1.y - p2.y) < 2) {
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }
  // Vertical drop into a lower lane (gateway/state bottom → target top).
  if (s1 === 'bottom' && s2 === 'top') {
    const midY = (p1.y + p2.y) / 2;
    return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
  }
  // Right → top (curl up/down into a node from its top).
  if (s1 === 'right' && s2 === 'top') {
    return `M ${p1.x} ${p1.y} L ${(p1.x + p2.x) / 2} ${p1.y} L ${(p1.x + p2.x) / 2} ${p2.y - 20} L ${p2.x} ${p2.y - 20} L ${p2.x} ${p2.y}`;
  }
  // Bottom → left.
  if (s1 === 'bottom' && s2 === 'left') {
    return `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
  }
  // Fallback: straight.
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

function midPoint(p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function NodeShape({ n }: { n: DiagramNode }) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const fill = n.fill || '#ffffff';
  const stroke = n.stroke || '#475569';
  const textColor = n.textColor || '#0f172a';

  const labelLines = n.label.split('\n');
  const renderLabel = (centerY: number) => (
    <text
      x={cx}
      textAnchor="middle"
      fontSize={13}
      fontWeight={600}
      fill={textColor}
      style={{ pointerEvents: 'none' }}
    >
      {labelLines.map((line, i) => (
        <tspan key={i} x={cx} y={centerY + (i - (labelLines.length - 1) / 2) * 15}>
          {line}
        </tspan>
      ))}
    </text>
  );

  if (n.kind === 'start' || n.kind === 'end') {
    const r = Math.min(n.w, n.h) / 2;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={n.kind === 'end' ? 4 : 2} />
        {n.kind === 'end' && <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={stroke} strokeWidth={1.5} />}
        <text x={cx} textAnchor="middle" fontSize={11} fontWeight={600} fill="#475569">
          {n.label.split('\n').map((line, i) => (
            <tspan key={i} x={cx} y={cy + r + 16 + i * 13}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  if (n.kind === 'note' || n.kind === 'info') {
    // SMS annotation (amber) or post-status informational box (slate) —
    // dashed border signals "this is not a persisted status transition".
    const isNote = n.kind === 'note';
    return (
      <g>
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={8}
          fill={n.fill || (isNote ? '#fffbeb' : '#f8fafc')}
          stroke={n.stroke || (isNote ? '#d97706' : '#94a3b8')}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text
          x={cx}
          textAnchor="middle"
          fontSize={11}
          fontWeight={500}
          fill={n.textColor || (isNote ? '#92400e' : '#475569')}
          style={{ pointerEvents: 'none' }}
        >
          {labelLines.map((line, i) => (
            <tspan key={i} x={cx} y={cy + (i - (labelLines.length - 1) / 2) * 14 + 4}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  if (n.kind === 'gateway') {
    const hs = Math.min(n.w, n.h) / 2;
    const pts = `${cx},${cy - hs} ${cx + hs},${cy} ${cx},${cy + hs} ${cx - hs},${cy}`;
    return (
      <g>
        <polygon points={pts} fill="#fef9c3" stroke="#ca8a04" strokeWidth={2} />
        <text x={cx} y={cy + hs + 14} textAnchor="middle" fontSize={11} fill="#475569">
          {n.label.split('\n').map((line, i) => (
            <tspan key={i} x={cx} y={cy + hs + 14 + i * 13}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  // state / task
  return (
    <g>
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} fill={fill} stroke={stroke} strokeWidth={2} />
      {renderLabel(n.sub ? cy - 6 : cy)}
      {n.sub && (
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#64748b" style={{ pointerEvents: 'none' }}>
          {n.sub}
        </text>
      )}
    </g>
  );
}

function Diagram({
  nodes,
  edges,
  width,
  height,
}: {
  nodes: Record<string, DiagramNode>;
  edges: DiagramEdge[];
  width: number;
  height: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="max-w-none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOR} />
          </marker>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_OK} />
          </marker>
          <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_BAD} />
          </marker>
        </defs>

        {/* Edges first so nodes paint on top */}
        {edges.map((e, i) => {
          const fromN = nodes[e.from];
          const toN = nodes[e.to];
          if (!fromN || !toN) return null;
          const p1 = anchor(fromN, e.fromSide);
          const p2 = anchor(toN, e.toSide);
          const color = e.color || EDGE_COLOR;
          const marker =
            color === EDGE_OK ? 'url(#arrowGreen)' : color === EDGE_BAD ? 'url(#arrowRed)' : 'url(#arrow)';
          const m = midPoint(p1, p2);
          return (
            <g key={i}>
              <path
                d={edgePath(p1, e.fromSide, p2, e.toSide)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={e.dashed ? '6 5' : undefined}
                markerEnd={marker}
              />
              {e.label && (() => {
                const lines = e.label.split('\n');
                const cy = m.y + (e.labelDy ?? 0);
                const lh = 14;
                const maxChars = Math.max(...lines.map((l) => l.length));
                const rectW = maxChars * 6.3 + 12;
                const rectH = lines.length * lh + 8;
                return (
                  <g>
                    <rect
                      x={m.x - rectW / 2}
                      y={cy - rectH / 2}
                      width={rectW}
                      height={rectH}
                      rx={4}
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />
                    <text textAnchor="middle" fontSize={11} fontWeight={500} fill={color}>
                      {lines.map((line, li) => (
                        <tspan key={li} x={m.x} y={cy - (lines.length - 1) * lh / 2 + li * lh + 4}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {Object.values(nodes).map((n) => (
          <NodeShape key={n.id} n={n} />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SESSION lifecycle (4 DB-stored statuses)
// ============================================================
const SESSION_NODES: Record<string, DiagramNode> = {
  start: { id: 'start', x: 20, y: 70, w: 36, h: 36, kind: 'start', label: 'create' },
  draft: { id: 'draft', x: 95, y: 64, w: 130, h: 50, kind: 'state', label: 'draft', fill: '#f1f5f9', stroke: '#94a3b8' },
  scheduled: { id: 'scheduled', x: 300, y: 64, w: 130, h: 50, kind: 'state', label: 'scheduled', fill: '#eff6ff', stroke: '#3b82f6' },
  published: { id: 'published', x: 505, y: 64, w: 130, h: 50, kind: 'state', label: 'published', fill: '#dcfce7', stroke: '#16a34a' },
  completed: { id: 'completed', x: 710, y: 64, w: 130, h: 50, kind: 'state', label: 'completed', fill: '#f1f5f9', stroke: '#94a3b8' },
  end: { id: 'end', x: 905, y: 70, w: 36, h: 36, kind: 'end', label: 'archived' },
};
const SESSION_EDGES: DiagramEdge[] = [
  { from: 'start', fromSide: 'right', to: 'draft', toSide: 'left' },
  { from: 'draft', fromSide: 'right', to: 'scheduled', toSide: 'left', label: 'schedule for\nlater date' },
  { from: 'scheduled', fromSide: 'right', to: 'published', toSide: 'left', label: 'auto @ registrationStart' },
  { from: 'published', fromSide: 'right', to: 'completed', toSide: 'left', label: 'auto when all\nrounds end' },
  { from: 'completed', fromSide: 'right', to: 'end', toSide: 'left' },
  { from: 'draft', fromSide: 'bottom', to: 'published', toSide: 'bottom', label: 'publish now (skip schedule)', color: EDGE_OK },
];

// ============================================================
// ROUND lifecycle (8 computed statuses — never stored)
// ============================================================
const RB = { y: 70, w: 150, h: 50 };
const RX = (i: number) => 30 + i * 178;
const ROUND_NODES: Record<string, DiagramNode> = {
  start: { id: 'start', x: 0, y: 76, w: 34, h: 34, kind: 'start', label: 'T-∞' },
  draft: { id: 'draft', x: RX(0), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'draft', fill: '#f1f5f9', stroke: '#94a3b8' },
  scheduled: { id: 'scheduled', x: RX(1), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'scheduled', fill: '#eff6ff', stroke: '#3b82f6' },
  regopen: { id: 'regopen', x: RX(2), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'registration-open', fill: '#dcfce7', stroke: '#16a34a' },
  confwin: { id: 'confwin', x: RX(3), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'confirmation-window', fill: '#fef9c3', stroke: '#ca8a04' },
  walking: { id: 'walking', x: RX(4), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'walking', fill: '#dbeafe', stroke: '#3b82f6' },
  finding: { id: 'finding', x: RX(5), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'finding', fill: '#cffafe', stroke: '#0891b2' },
  networking: { id: 'networking', x: RX(6), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'networking', fill: '#e0e7ff', stroke: '#6366f1' },
  completed: { id: 'completed', x: RX(7), y: RB.y, w: RB.w, h: RB.h, kind: 'state', label: 'completed', fill: '#f1f5f9', stroke: '#94a3b8' },
  end: { id: 'end', x: RX(8), y: 76, w: 34, h: 34, kind: 'end', label: 'done' },
};
const ROUND_EDGES: DiagramEdge[] = [
  { from: 'start', fromSide: 'right', to: 'draft', toSide: 'left' },
  { from: 'draft', fromSide: 'right', to: 'scheduled', toSide: 'left', label: 'session\npublished' },
  { from: 'scheduled', fromSide: 'right', to: 'regopen', toSide: 'left', label: 'reg. opens' },
  { from: 'regopen', fromSide: 'right', to: 'confwin', toSide: 'left', label: 'T − confWin' },
  { from: 'confwin', fromSide: 'right', to: 'walking', toSide: 'left', label: 'T-0\n(matching)' },
  { from: 'walking', fromSide: 'right', to: 'finding', toSide: 'left', label: '+ walking' },
  { from: 'finding', fromSide: 'right', to: 'networking', toSide: 'left', label: '+ finding' },
  { from: 'networking', fromSide: 'right', to: 'completed', toSide: 'left', label: '+ duration' },
  { from: 'completed', fromSide: 'right', to: 'end', toSide: 'left' },
];

// ============================================================
// PARTICIPANT lifecycle (9 DB-stored statuses)
// ============================================================
// Layout rule that fixes the "line passes through a box" confusion:
// every drop-off terminal sits DIRECTLY BELOW its own source (gateway or
// state) so its red edge is a clean straight drop and never crosses an
// unrelated status box.
interface ParticipantTimes {
  confirmationWindowMinutes: number;
  safetyWindowMinutes: number;
  walkingTimeMinutes: number;
  findingTimeMinutes: number;
  networkingDurationMinutes: number;
  contactSharingDelayMinutes: number;
}

function buildParticipantModel(t: ParticipantTimes): {
  nodes: Record<string, DiagramNode>;
  edges: DiagramEdge[];
  width: number;
  height: number;
} {
  const BW = 156;
  const BH = 58;
  // Tall header band so the stacked top annotations never collide:
  //   y 4..40   SMS pills
  //   y 46..96  late-registration start event + caption
  //   y ~140    happy-path edge labels (sit just above the row)
  const ROW = 178; // box top of the happy path
  const CY = ROW + BH / 2; // vertical centre of the happy row
  const GS = 50; // gateway size
  const GY = CY - GS / 2;
  const TERM = 450; // box top of the terminal lane

  // Happy-path X (left edges) — generous so multi-line labels fit above.
  const x = {
    start: 22,
    registered: 80,
    g1: 285,
    confirmed: 400,
    g2: 615,
    matched: 730,
    g3: 945,
    checkedin: 1060,
    g4: 1275,
    met: 1390,
    networking: 1610,
    feedback: 1830,
    endok: 2055,
  };
  const center = (lx: number, w: number) => lx + w / 2;

  const C = t.confirmationWindowMinutes;
  const S = t.safetyWindowMinutes;
  const W = t.walkingTimeMinutes;
  const F = t.findingTimeMinutes;
  const D = t.networkingDurationMinutes;
  const SH = t.contactSharingDelayMinutes;

  const nodes: Record<string, DiagramNode> = {
    start: { id: 'start', x: x.start, y: CY - 18, w: 36, h: 36, kind: 'start', label: `registers early\n(before T−${C}m)` },
    registered: { id: 'registered', x: x.registered, y: ROW, w: BW, h: BH, kind: 'state', label: 'registered', fill: '#f1f5f9', stroke: '#94a3b8' },
    g1: { id: 'g1', x: x.g1, y: GY, w: GS, h: GS, kind: 'gateway', label: 'confirmed\nbefore T-0?' },
    confirmed: { id: 'confirmed', x: x.confirmed, y: ROW, w: BW, h: BH, kind: 'state', label: 'confirmed', fill: '#dcfce7', stroke: '#16a34a' },
    g2: { id: 'g2', x: x.g2, y: GY, w: GS, h: GS, kind: 'gateway', label: 'matching\n@ T-0' },
    matched: { id: 'matched', x: x.matched, y: ROW, w: BW, h: BH, kind: 'state', label: 'matched', fill: '#f3e8ff', stroke: '#9333ea' },
    g3: { id: 'g3', x: x.g3, y: GY, w: GS, h: GS, kind: 'gateway', label: 'at meeting\npoint?' },
    checkedin: { id: 'checkedin', x: x.checkedin, y: ROW, w: BW, h: BH, kind: 'state', label: 'checked-in', fill: '#e0e7ff', stroke: '#6366f1' },
    g4: { id: 'g4', x: x.g4, y: GY, w: GS, h: GS, kind: 'gateway', label: 'partner #\nconfirmed?' },
    met: { id: 'met', x: x.met, y: ROW, w: BW, h: BH, kind: 'state', label: 'met', fill: '#dbeafe', stroke: '#2563eb' },

    // Late-registration alternative START (auto-confirm), above `confirmed`.
    lateStart: { id: 'lateStart', x: center(x.confirmed, BW) - 18, y: 50, w: 36, h: 36, kind: 'start', label: 'late reg.' },

    // Post-`met` informational chain — NOT status changes (dashed grey).
    networking: { id: 'networking', x: x.networking, y: ROW, w: BW, h: BH, kind: 'info', label: `networking\n(${D}m round)` },
    feedback: { id: 'feedback', x: x.feedback, y: ROW, w: BW, h: BH, kind: 'info', label: 'feedback /\ncontact-sharing' },
    endok: { id: 'endok', x: x.endok, y: CY - 20, w: 40, h: 40, kind: 'end', label: 'round done' },

    // SMS annotations (amber, dashed) — when each SMS goes out.
    sms1: { id: 'sms1', x: center(x.g1, GS) - 110, y: 6, w: 220, h: 36, kind: 'note', label: `📱 "Confirm attendance" SMS\n@ T−${C}m → registered & confirmed` },
    sms2: { id: 'sms2', x: center(x.networking, BW) - 115, y: 6, w: 230, h: 36, kind: 'note', label: `📱 "Round ended" SMS\n@ T+${D}m → links to feedback page` },

    // Terminal lane — each centred under its source.
    cancelled: { id: 'cancelled', x: center(x.registered, BW) - BW / 2, y: TERM, w: BW, h: BH, kind: 'state', label: 'cancelled', fill: '#fee2e2', stroke: '#dc2626', textColor: '#991b1b' },
    unconfirmed: { id: 'unconfirmed', x: center(x.g1, GS) - BW / 2, y: TERM, w: BW, h: BH, kind: 'state', label: 'unconfirmed', fill: '#fef9c3', stroke: '#ca8a04', textColor: '#854d0e' },
    nomatch: { id: 'nomatch', x: center(x.g2, GS) - BW / 2, y: TERM, w: BW, h: BH, kind: 'state', label: 'no-match', fill: '#f1f5f9', stroke: '#64748b' },
    missed: { id: 'missed', x: center(x.g3, GS) - BW / 2, y: TERM, w: BW, h: BH, kind: 'state', label: 'missed', fill: '#fee2e2', stroke: '#dc2626', textColor: '#991b1b' },
    staysci: { id: 'staysci', x: center(x.g4, GS) - BW / 2, y: TERM, w: BW, h: BH, kind: 'state', label: "stays\n'checked-in'", fill: '#e0e7ff', stroke: '#6366f1' },
  };

  const edges: DiagramEdge[] = [
    { from: 'start', fromSide: 'right', to: 'registered', toSide: 'left' },
    { from: 'registered', fromSide: 'right', to: 'g1', toSide: 'left' },
    { from: 'g1', fromSide: 'right', to: 'confirmed', toSide: 'left', color: EDGE_OK, label: `clicks "Confirm"\n(T−${C}m … T-0)`, labelDy: -56 },
    // Late registration during the confirmation window → auto-confirmed,
    // skipping the manual Confirm step entirely.
    { from: 'lateStart', fromSide: 'bottom', to: 'confirmed', toSide: 'top', color: EDGE_OK, label: `registers in [T−${C}m … T−${S}m]\n→ auto-confirmed (no manual Confirm)`, labelDy: 6 },
    // Drop-offs: each a clean straight drop directly under its source.
    { from: 'g1', fromSide: 'bottom', to: 'unconfirmed', toSide: 'top', color: EDGE_BAD, label: 'not confirmed\nby T-0 (auto)' },
    { from: 'registered', fromSide: 'bottom', to: 'cancelled', toSide: 'top', color: EDGE_BAD, label: 'unregisters\n(while registered)', labelDy: -92 },
    { from: 'confirmed', fromSide: 'right', to: 'g2', toSide: 'left' },
    { from: 'g2', fromSide: 'right', to: 'matched', toSide: 'left', color: EDGE_OK, label: 'paired by\nalgorithm', labelDy: -56 },
    { from: 'g2', fromSide: 'bottom', to: 'nomatch', toSide: 'top', color: EDGE_BAD, label: 'no compatible match\n/ odd one out' },
    { from: 'confirmed', fromSide: 'bottom', to: 'cancelled', toSide: 'top', color: EDGE_BAD, label: 'unregisters\n(before matching)', labelDy: 70 },
    { from: 'matched', fromSide: 'right', to: 'g3', toSide: 'left' },
    { from: 'g3', fromSide: 'right', to: 'checkedin', toSide: 'left', color: EDGE_OK, label: `clicks "I am here"\n(≤ ${W}m after T-0)`, labelDy: -56 },
    { from: 'g3', fromSide: 'bottom', to: 'missed', toSide: 'top', color: EDGE_BAD, label: `no check-in within\n${W}m of T-0 (auto)` },
    { from: 'checkedin', fromSide: 'right', to: 'g4', toSide: 'left' },
    { from: 'g4', fromSide: 'right', to: 'met', toSide: 'left', color: EDGE_OK, label: `confirms partner #\n(≤ ${F}m, bilateral)`, labelDy: -56 },
    { from: 'g4', fromSide: 'bottom', to: 'staysci', toSide: 'top', label: 'nobody confirms\nby round end' },
    // Post-met informational chain (dashed grey — status stays `met`).
    { from: 'met', fromSide: 'right', to: 'networking', toSide: 'left', dashed: true, label: "status stays\n'met'", labelDy: -54 },
    { from: 'networking', fromSide: 'right', to: 'feedback', toSide: 'left', dashed: true, label: `after ${D}m`, labelDy: -54 },
    { from: 'feedback', fromSide: 'right', to: 'endok', toSide: 'left', dashed: true, label: `contacts shared\n+${SH}m`, labelDy: -54 },
  ];

  return { nodes, edges, width: 2150, height: 560 };
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex-shrink-0">{swatch}</div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function AdminBpmnDiagram({ onBack }: AdminBpmnDiagramProps) {
  const params = getParametersOrDefault();
  // networkingDurationMinutes is the per-round duration; fall back to the
  // documented default (15) when the param isn't configured/loaded.
  const netDur = (params as { networkingDurationMinutes?: number }).networkingDurationMinutes ?? 15;
  const contactDelay = params.contactSharingDelayMinutes ?? 5;
  const participant = buildParticipantModel({
    confirmationWindowMinutes: params.confirmationWindowMinutes,
    safetyWindowMinutes: params.safetyWindowMinutes,
    walkingTimeMinutes: params.walkingTimeMinutes,
    findingTimeMinutes: params.findingTimeMinutes,
    networkingDurationMinutes: netDur,
    contactSharingDelayMinutes: contactDelay,
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Process diagram (BPMN)</h1>
              <p className="text-sm text-muted-foreground">
                Every status and exactly how &amp; when it changes — session, round and participant lifecycles
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl space-y-8">
        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <circle cx="17" cy="12" r="9" fill="#fff" stroke="#475569" strokeWidth="2" />
                  </svg>
                }
                label="Start event"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <circle cx="17" cy="12" r="9" fill="#fff" stroke="#475569" strokeWidth="3.5" />
                    <circle cx="17" cy="12" r="5" fill="none" stroke="#475569" strokeWidth="1.2" />
                  </svg>
                }
                label="End event (terminal)"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <rect x="3" y="3" width="28" height="18" rx="4" fill="#fff" stroke="#475569" strokeWidth="2" />
                  </svg>
                }
                label="State / status"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <polygon points="17,2 30,12 17,22 4,12" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2" />
                  </svg>
                }
                label="Gateway (decision)"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <line x1="3" y1="12" x2="27" y2="12" stroke="#16a34a" strokeWidth="2" markerEnd="url(#lg)" />
                    <defs>
                      <marker id="lg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" />
                      </marker>
                    </defs>
                  </svg>
                }
                label="Happy-path flow"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <line x1="3" y1="12" x2="27" y2="12" stroke="#dc2626" strokeWidth="2" markerEnd="url(#lb)" />
                    <defs>
                      <marker id="lb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
                      </marker>
                    </defs>
                  </svg>
                }
                label="Drop-off / failure flow"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <rect x="3" y="4" width="28" height="16" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" />
                  </svg>
                }
                label="📱 SMS annotation"
              />
              <LegendItem
                swatch={
                  <svg width="34" height="24">
                    <rect x="3" y="4" width="28" height="16" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                  </svg>
                }
                label="Informational (no status change)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Participant lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle>Participant lifecycle (9 statuses, DB-stored)</CardTitle>
            <p className="text-sm text-muted-foreground">
              One status per participant per round registration. Green = forward / happy path. Red = drop-off.
              Auto = applied by the dashboard poll, not a user action.
            </p>
          </CardHeader>
          <CardContent>
            <Diagram nodes={participant.nodes} edges={participant.edges} width={participant.width} height={participant.height} />
            <div className="mt-4 rounded-lg bg-slate-50 border p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Timing (current configured values)</p>
              <p>
                <strong>T-0</strong> = round start (matching runs). Registration closes{' '}
                <code>{params.safetyWindowMinutes}m</code> before T-0.
              </p>
              <p>
                <strong>Confirmation window:</strong> <code>{params.confirmationWindowMinutes}m</code> before T-0
                — existing registrations must press <em>Confirm</em>; late sign-ups in this window auto-confirm.
              </p>
              <p>
                <strong>Walking time:</strong> <code>{params.walkingTimeMinutes}m</code> after T-0 to reach the
                meeting point and press <em>"I am here"</em> (else → <code>missed</code>).
              </p>
              <p>
                <strong>Finding time:</strong> <code>{params.findingTimeMinutes}m</code> to confirm the
                partner's number (bilateral — one confirm sets both to <code>met</code>).
              </p>
              <p>
                <strong>Networking:</strong> <code>{netDur}m</code> (the round
                duration). Then the feedback / contact-sharing page; contacts are shared{' '}
                <code>+{contactDelay}m</code> after networking starts.
              </p>
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-1">
              <p className="font-medium">📱 SMS schedule</p>
              <p>
                <strong>"Confirm attendance" SMS</strong> — sent exactly at{' '}
                <code>T−{params.confirmationWindowMinutes}m</code> (the moment the Confirm button appears),
                to every <code>registered</code> &amp; <code>confirmed</code> participant with a phone &amp;
                notifications on; the link opens their confirm page. One SMS per participant (deduplicated).
              </p>
              <p>
                <strong>"Round ended" SMS</strong> — sent at <code>T+{netDur}m</code>{' '}
                (networking countdown hits 0); links to the feedback / contact-sharing page. Controlled by
                the <code>smsRoundEnded</code> toggle.
              </p>
              <p className="text-xs">
                A pg_cron job fires every minute; per-participant deduplication means a missed tick is
                retried on the next one (still only once).
              </p>
            </div>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Forward:</strong> registered → confirmed → matched → checked-in → met
              </p>
              <p>
                <strong>"registers early"</strong> = signs up <em>before</em> the confirmation window
                opens, i.e. before <code>T−{params.confirmationWindowMinutes}m</code> → lands in{' '}
                <code>registered</code> and must press <em>Confirm</em> (or use the SMS link) during the
                window, else → <code>unconfirmed</code> at T-0.
              </p>
              <p>
                <strong>"late reg."</strong> = signs up <em>after</em> the confirmation window has
                opened but while registration is still open — in{' '}
                <code>[T−{params.confirmationWindowMinutes}m … T−{params.safetyWindowMinutes}m]</code>{' '}
                → skips <code>registered</code> and is <strong>auto-confirmed</strong> straight to{' '}
                <code>confirmed</code> (no manual Confirm needed).
              </p>
              <p className="text-xs">
                ⚠️ With the current values this late window is{' '}
                {params.safetyWindowMinutes < params.confirmationWindowMinutes ? (
                  <>
                    open: registration closes <code>T−{params.safetyWindowMinutes}m</code>, after the
                    window opens at <code>T−{params.confirmationWindowMinutes}m</code>.
                  </>
                ) : (
                  <>
                    <strong>empty / unreachable</strong>: registration closes{' '}
                    <code>T−{params.safetyWindowMinutes}m</code> <em>before</em> the confirmation window
                    even opens (<code>T−{params.confirmationWindowMinutes}m</code>). Late auto-confirm
                    only happens when <code>safetyWindowMinutes</code> &lt;{' '}
                    <code>confirmationWindowMinutes</code> (registration stays open into the window).
                  </>
                )}
              </p>
              <p>
                <strong>Terminal (no transitions out):</strong> met, unconfirmed, no-match, missed, cancelled
              </p>
              <p>
                If neither partner confirms by round end the participant simply stays{' '}
                <code>checked-in</code> (no auto-transition). The networking &amp; feedback steps after{' '}
                <code>met</code> are informational — the status stays <code>met</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Session lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle>Session lifecycle (4 statuses, DB-stored)</CardTitle>
            <p className="text-sm text-muted-foreground">
              The persisted <code>session.status</code>. The public event page only shows a session once it is{' '}
              <code>published</code> AND <code>now ≥ registrationStart</code>.
            </p>
          </CardHeader>
          <CardContent>
            <Diagram nodes={SESSION_NODES} edges={SESSION_EDGES} width={970} height={210} />
          </CardContent>
        </Card>

        {/* Round lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle>Round lifecycle (8 statuses, computed — never stored)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Calculated on the fly by <code>getRoundStatus()</code> from the session status, current time
              and system parameters. T = round start time. confWin = confirmationWindowMinutes.
            </p>
          </CardHeader>
          <CardContent>
            <Diagram nodes={ROUND_NODES} edges={ROUND_EDGES} width={1640} height={170} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            For the full textual reference (every trigger, who sets it, allowed transitions table) see{' '}
            <strong>Admin → Statuses guide</strong>. This diagram and that guide must be kept in sync.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
