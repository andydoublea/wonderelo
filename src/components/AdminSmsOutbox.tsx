import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, Loader2, Send, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiBaseUrl } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';

interface ScheduleRow {
  id: string;
  kind: string;
  round_id: string;
  session_id: string;
  target_send_at: string;
  status: string;
  qstash_message_id: string | null;
  last_error: string | null;
  scheduled_at: string | null;
  dispatched_at: string | null;
  canceled_at: string | null;
  created_at: string;
}

interface OutboxRow {
  id: string;
  kind: string;
  participant_id: string;
  round_id: string;
  target_send_at: string;
  status: string;
  twilio_sid: string | null;
  twilio_delivery_status: string | null;
  twilio_error_code: string | null;
  phone_sent_to: string | null;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  created_at: string;
}

interface AdminSmsOutboxResponse {
  schedules: ScheduleRow[];
  outbox: OutboxRow[];
  summary: Record<string, number>;
}

function statusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['delivered', 'sent'].includes(status)) return 'default';
  if (['scheduled', 'pending', 'attempting'].includes(status)) return 'secondary';
  if (['failed', 'undelivered'].includes(status)) return 'destructive';
  if (status === 'canceled') return 'outline';
  return 'outline';
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('sk-SK', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtRelativeSeconds(a: string | null, b: string | null): string {
  if (!a || !b) return '—';
  const diff = (new Date(b).getTime() - new Date(a).getTime()) / 1000;
  return `${diff.toFixed(1)}s`;
}

interface AdminSmsOutboxProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminSmsOutbox({ accessToken, onBack }: AdminSmsOutboxProps) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');
  const [kindFilter, setKindFilter] = useState<'all' | 'round-starting-soon' | 'round-ended'>('all');

  const { data, isLoading, refetch, isFetching } = useQuery<AdminSmsOutboxResponse>({
    queryKey: ['adminSmsOutbox'],
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/admin/sms-outbox`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5s since SMS are real-time events
  });

  const resendMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/admin/sms-outbox/${id}/resend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast.success('Resend dispatched');
      qc.invalidateQueries({ queryKey: ['adminSmsOutbox'] });
    },
    onError: (e) => {
      errorLog('resend error', e);
      toast.error('Resend failed: ' + (e instanceof Error ? e.message : String(e)));
    },
  });

  const schedules = data?.schedules || [];
  const outbox = (data?.outbox || []).filter(r => {
    if (filter !== 'all') {
      if (filter === 'sent' && !['sent', 'delivered'].includes(r.status)) return false;
      if (filter === 'failed' && !['failed', 'undelivered'].includes(r.status)) return false;
      if (filter === 'pending' && !['attempting'].includes(r.status)) return false;
    }
    if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
    return true;
  });
  const summary = data?.summary || {};

  return (
    <div className="container mx-auto p-6 max-w-7xl flex-1">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <h1 className="text-3xl font-bold">SMS outbox</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-muted-foreground">Auto-refresh every 5s</span>
      </div>

      {/* Summary strip — last 24h by status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Delivered', key: 'total:delivered', icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Sent (pending delivery)', key: 'total:sent', icon: Send, color: 'text-blue-600' },
          { label: 'Attempting', key: 'total:attempting', icon: Clock, color: 'text-amber-600' },
          { label: 'Failed', key: 'total:failed', icon: XCircle, color: 'text-red-600' },
          { label: 'Undelivered', key: 'total:undelivered', icon: AlertTriangle, color: 'text-orange-600' },
        ].map(s => {
          const Ico = s.icon;
          return (
            <Card key={s.key}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Ico className={`h-5 w-5 ${s.color}`} />
                <div>
                  <div className="text-2xl font-bold">{summary[s.key] || 0}</div>
                  <div className="text-xs text-muted-foreground">{s.label} · 24h</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Schedules (one per round × kind) — last 200</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No schedules yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Kind</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">QStash ID</th>
                    <th className="py-2 pr-3">Dispatched</th>
                    <th className="py-2 pr-3">Jitter</th>
                    <th className="py-2 pr-3">Round</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.slice(0, 50).map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 pr-3">{s.kind === 'round-starting-soon' ? '🔔 start' : '🏁 end'}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtTime(s.target_send_at)}</td>
                      <td className="py-2 pr-3"><Badge variant={statusColor(s.status)}>{s.status}</Badge></td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={s.qstash_message_id || ''}>{(s.qstash_message_id || '—').slice(0, 14)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtTime(s.dispatched_at)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtRelativeSeconds(s.target_send_at, s.dispatched_at)}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={s.round_id}>{s.round_id.slice(-16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-sm text-muted-foreground self-center">Filter:</span>
        {(['all', 'sent', 'pending', 'failed'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
        <span className="w-2" />
        {(['all', 'round-starting-soon', 'round-ended'] as const).map(k => (
          <Button key={k} size="sm" variant={kindFilter === k ? 'default' : 'outline'} onClick={() => setKindFilter(k)}>
            {k === 'all' ? 'all kinds' : (k === 'round-starting-soon' ? '🔔 starting' : '🏁 ended')}
          </Button>
        ))}
      </div>

      {/* Outbox */}
      <Card>
        <CardHeader>
          <CardTitle>Outbox (per participant) — last 500 rows, filtered: {outbox.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {outbox.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No matching rows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Kind</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Delivery</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Twilio SID</th>
                    <th className="py-2 pr-3">Sent</th>
                    <th className="py-2 pr-3">Delivered</th>
                    <th className="py-2 pr-3">Err</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.slice(0, 200).map(r => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 pr-3">{r.kind === 'round-starting-soon' ? '🔔' : '🏁'}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtTime(r.target_send_at)}</td>
                      <td className="py-2 pr-3"><Badge variant={statusColor(r.status)}>{r.status}</Badge></td>
                      <td className="py-2 pr-3 text-xs">{r.twilio_delivery_status || '—'}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.phone_sent_to || '—'}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground" title={r.twilio_sid || ''}>{(r.twilio_sid || '—').slice(0, 12)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtTime(r.sent_at)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{fmtTime(r.delivered_at)}</td>
                      <td className="py-2 pr-3 text-xs text-red-600 max-w-[200px] truncate" title={r.last_error || ''}>{r.last_error?.slice(0, 40) || r.twilio_error_code || '—'}</td>
                      <td className="py-2 pr-3">
                        {['failed', 'undelivered'].includes(r.status) && (
                          <Button size="sm" variant="outline" onClick={() => resendMut.mutate(r.id)} disabled={resendMut.isPending}>
                            Resend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
