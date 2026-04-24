import React, { useState } from 'react';
import { Key, Plus, Trash2, ToggleLeft, ToggleRight, Eye, Loader2, Copy, Check, Video } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAccessPasswords, useCreateAccessPassword, useToggleAccessPassword, useDeleteAccessPassword, useAccessPasswordLogs } from '../hooks/useAdminQueries';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface AccessPassword {
  id: string;
  personName: string;
  password: string;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  visitCount: number;
  lastVisitedAt: string | null;
  createdAt: string;
}

interface AccessLog {
  id: string;
  accessedAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  logType: string;
}

interface AdminAccessPasswordsProps {
  accessToken: string;
}

export function AdminAccessPasswords({ accessToken }: AdminAccessPasswordsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedPasswordId, setSelectedPasswordId] = useState<string | null>(null);
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formPersonName, setFormPersonName] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // React Query hooks
  const { data: passwords = [], isLoading: isFetching, isFetching: isRefetching } = useAccessPasswords(accessToken);
  const createMutation = useCreateAccessPassword(accessToken);
  const toggleMutation = useToggleAccessPassword(accessToken);
  const deleteMutation = useDeleteAccessPassword(accessToken);
  const { data: logs = [], isLoading: isLoadingLogs } = useAccessPasswordLogs(selectedPasswordId, accessToken);

  const isLoading = createMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  const handleCreate = () => {
    if (!formPersonName.trim()) {
      toast.error('Enter person name');
      return;
    }
    if (!formPassword.trim()) {
      toast.error('Enter password');
      return;
    }

    createMutation.mutate(
      { personName: formPersonName.trim(), password: formPassword.trim() },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setFormPersonName('');
          setFormPassword('');
        },
      }
    );
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string, personName: string) => {
    if (!confirm(`Delete access password for "${personName}"? This also removes all access logs.`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleViewLogs = (id: string, personName: string) => {
    setSelectedPasswordId(id);
    setSelectedPersonName(personName);
    setShowLogsDialog(true);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleViewRecordings = (personName: string) => {
    navigator.clipboard.writeText(personName);
    toast.success(`"${personName}" copied — paste into User ID (CS) filter`, { duration: 4000 });
    window.open(
      'https://app.contentsquare.com/#/session-replay?project=652868',
      '_blank'
    );
  };

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(result);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return '—';
    // Simple browser detection
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return ua.substring(0, 40) + '...';
  };

  const activeCount = (passwords as AccessPassword[]).filter(p => p.isActive).length;
  const totalAccesses = (passwords as AccessPassword[]).reduce((sum, p) => sum + p.accessCount, 0);
  const totalVisits = (passwords as AccessPassword[]).reduce((sum, p) => sum + (p.visitCount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="mb-2">Access passwords</h2>
                {(isFetching || isRefetching) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">
                Manage site access codes — each person gets a unique password for tracking
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create password
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total passwords</p>
                    <p className="text-2xl font-bold">{(passwords as AccessPassword[]).length}</p>
                  </div>
                  <Key className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{activeCount}</p>
                  </div>
                  <ToggleRight className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Password entries</p>
                    <p className="text-2xl font-bold">{totalAccesses}</p>
                  </div>
                  <Key className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total visits</p>
                    <p className="text-2xl font-bold">{totalVisits}</p>
                  </div>
                  <Eye className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Last visit</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(passwords as AccessPassword[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No access passwords yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (passwords as AccessPassword[]).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.personName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="bg-muted px-2 py-0.5 rounded text-sm">{p.password}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopy(p.password, p.id)}
                            >
                              {copiedId === p.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.isActive ? 'default' : 'secondary'}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.accessCount}</TableCell>
                        <TableCell>{p.visitCount || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(p.lastVisitedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRecordings(p.personName)}
                              title="View Hotjar recordings (copies name to clipboard)"
                            >
                              <Video className="h-4 w-4 text-orange-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLogs(p.id, p.personName)}
                              title="View access logs"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(p.id)}
                              disabled={isLoading}
                              title={p.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {p.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(p.id, p.personName)}
                              disabled={isLoading}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create access password</DialogTitle>
            <DialogDescription>
              Create a unique password for someone to access the site. Their sessions will be tracked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Person name</Label>
              <Input
                value={formPersonName}
                onChange={(e) => setFormPersonName(e.target.value)}
                placeholder="e.g. Jano, Peter, Investor X"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="e.g. abc123"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generatePassword} type="button">
                  Generate
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access logs dialog */}
      <Dialog open={showLogsDialog} onOpenChange={(open) => {
        setShowLogsDialog(open);
        if (!open) setSelectedPasswordId(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access logs — {selectedPersonName}</DialogTitle>
            <DialogDescription>
              Last 100 access entries for this password
            </DialogDescription>
          </DialogHeader>
          {isLoadingLogs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (logs as AccessLog[]).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No access logs yet</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>IP address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs as AccessLog[]).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{formatDate(log.accessedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={log.logType === 'visit' ? 'outline' : 'secondary'} className="text-xs">
                          {log.logType === 'visit' ? 'Visit' : 'Entry'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{parseUserAgent(log.userAgent)}</TableCell>
                      <TableCell className="text-sm font-mono">{log.ipAddress || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
