import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';

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

type NodeKind = 'start' | 'end' | 'state' | 'gateway';

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
        <text x={cx} y={cy + r + 16} textAnchor="middle" fontSize={11} fontWeight={600} fill="#475569">
          {n.label}
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
              {e.label && (
                <g>
                  {e.label.split('\n').map((line, li, arr) => (
                    <text
                      key={li}
                      x={m.x}
                      y={m.y - 6 + (li - (arr.length - 1) / 2) * 13}
                      textAnchor="middle"
                      fontSize={11}
                      fill={color}
                      style={{ paintOrder: 'stroke' }}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {line}
                    </text>
                  ))}
                  {e.label.split('\n').map((line, li, arr) => (
                    <text
                      key={`t${li}`}
                      x={m.x}
                      y={m.y - 6 + (li - (arr.length - 1) / 2) * 13}
                      textAnchor="middle"
                      fontSize={11}
                      fill={color}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )}
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
const PB = { w: 132, h: 56 };
const TOP = 70;
const BOT = 320;
const PARTICIPANT_NODES: Record<string, DiagramNode> = {
  start: { id: 'start', x: 16, y: TOP + 12, w: 34, h: 34, kind: 'start', label: 'registers' },
  registered: { id: 'registered', x: 78, y: TOP, w: PB.w, h: PB.h, kind: 'state', label: 'registered', fill: '#f1f5f9', stroke: '#94a3b8' },
  g1: { id: 'g1', x: 270, y: TOP + 6, w: 44, h: 44, kind: 'gateway', label: 'before T-0?' },
  confirmed: { id: 'confirmed', x: 360, y: TOP, w: PB.w, h: PB.h, kind: 'state', label: 'confirmed', fill: '#dcfce7', stroke: '#16a34a' },
  g2: { id: 'g2', x: 552, y: TOP + 6, w: 44, h: 44, kind: 'gateway', label: 'matching\n@ T-0' },
  matched: { id: 'matched', x: 642, y: TOP, w: PB.w, h: PB.h, kind: 'state', label: 'matched', fill: '#f3e8ff', stroke: '#9333ea' },
  g3: { id: 'g3', x: 834, y: TOP + 6, w: 44, h: 44, kind: 'gateway', label: 'arrived in\nwalk time?' },
  checkedin: { id: 'checkedin', x: 924, y: TOP, w: PB.w, h: PB.h, kind: 'state', label: 'checked-in', fill: '#e0e7ff', stroke: '#6366f1' },
  g4: { id: 'g4', x: 1116, y: TOP + 6, w: 44, h: 44, kind: 'gateway', label: 'partner #\nconfirmed?' },
  met: { id: 'met', x: 1206, y: TOP, w: PB.w, h: PB.h, kind: 'state', label: 'met', fill: '#dbeafe', stroke: '#2563eb' },
  endok: { id: 'endok', x: 1390, y: TOP + 11, w: 38, h: 38, kind: 'end', label: 'success' },

  // Drop-off / terminal lane
  unconfirmed: { id: 'unconfirmed', x: 78, y: BOT, w: PB.w, h: PB.h, kind: 'state', label: 'unconfirmed', fill: '#feffb3', stroke: '#ca8a04', textColor: '#854d0e' },
  cancelled: { id: 'cancelled', x: 360, y: BOT, w: PB.w, h: PB.h, kind: 'state', label: 'cancelled', fill: '#fee2e2', stroke: '#dc2626', textColor: '#991b1b' },
  nomatch: { id: 'nomatch', x: 642, y: BOT, w: PB.w, h: PB.h, kind: 'state', label: 'no-match', fill: '#f1f5f9', stroke: '#64748b' },
  missed: { id: 'missed', x: 924, y: BOT, w: PB.w, h: PB.h, kind: 'state', label: 'missed', fill: '#fee2e2', stroke: '#dc2626', textColor: '#991b1b' },
  staysci: { id: 'staysci', x: 1206, y: BOT, w: PB.w, h: PB.h, kind: 'state', label: "stays\n'checked-in'", fill: '#e0e7ff', stroke: '#6366f1' },
};
const PARTICIPANT_EDGES: DiagramEdge[] = [
  { from: 'start', fromSide: 'right', to: 'registered', toSide: 'left' },
  { from: 'registered', fromSide: 'right', to: 'g1', toSide: 'left' },
  { from: 'g1', fromSide: 'right', to: 'confirmed', toSide: 'left', label: 'clicks Confirm', color: EDGE_OK },
  { from: 'g1', fromSide: 'bottom', to: 'unconfirmed', toSide: 'top', label: 'T-0 passed,\nnever confirmed (auto)', color: EDGE_BAD },
  { from: 'registered', fromSide: 'bottom', to: 'cancelled', toSide: 'left', label: 'unregisters', color: EDGE_BAD },
  { from: 'confirmed', fromSide: 'right', to: 'g2', toSide: 'left' },
  { from: 'g2', fromSide: 'right', to: 'matched', toSide: 'left', label: 'paired', color: EDGE_OK },
  { from: 'g2', fromSide: 'bottom', to: 'nomatch', toSide: 'top', label: 'odd one out /\nno compatible match', color: EDGE_BAD },
  { from: 'confirmed', fromSide: 'bottom', to: 'cancelled', toSide: 'top', label: 'unregisters\nbefore matching', color: EDGE_BAD },
  { from: 'matched', fromSide: 'right', to: 'g3', toSide: 'left' },
  { from: 'g3', fromSide: 'right', to: 'checkedin', toSide: 'left', label: "clicks\n'I am here'", color: EDGE_OK },
  { from: 'g3', fromSide: 'bottom', to: 'missed', toSide: 'top', label: 'walking deadline\nexpired (auto)', color: EDGE_BAD },
  { from: 'checkedin', fromSide: 'right', to: 'g4', toSide: 'left' },
  { from: 'g4', fromSide: 'right', to: 'met', toSide: 'left', label: 'confirms partner #\n(bilateral)', color: EDGE_OK },
  { from: 'g4', fromSide: 'bottom', to: 'staysci', toSide: 'top', label: 'nobody confirms\nby round end' },
  { from: 'met', fromSide: 'right', to: 'endok', toSide: 'left' },
];

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex-shrink-0">{swatch}</div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function AdminBpmnDiagram({ onBack }: AdminBpmnDiagramProps) {
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
            <Diagram nodes={PARTICIPANT_NODES} edges={PARTICIPANT_EDGES} width={1450} height={420} />
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Forward:</strong> registered → confirmed → matched → checked-in → met
              </p>
              <p>
                <strong>Terminal (no transitions out):</strong> met, unconfirmed, no-match, missed, cancelled
              </p>
              <p>
                <strong>checked-in → met is bilateral</strong> — only one of the pair must confirm the
                partner's number; the backend sets both to <code>met</code>.
              </p>
              <p>
                If neither confirms by round end the participant simply stays{' '}
                <code>checked-in</code> (no auto-transition).
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
