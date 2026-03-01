import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Plus, Trash2, RefreshCw, Loader2, ArrowLeft, Users, Crown, Coins } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAdminBilling, useGrantSubscription, useCancelAdminSubscription, useAddCredits, useResetCredits } from '../hooks/useAdminQueries';
import { PRICING_TIERS, formatPrice, type CapacityTier } from '../config/pricing';
import { apiBaseUrl } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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

interface Organizer {
  id: string;
  email: string;
  name?: string;
  urlSlug?: string;
}

interface AdminBillingProps {
  accessToken: string;
  onBack: () => void;
}

const PAID_TIERS: CapacityTier[] = ['50', '200', '500', '1000', '5000'];

export function AdminBilling({ accessToken, onBack }: AdminBillingProps) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState<Organizer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Dialogs
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<CapacityTier>('50');
  const [creditAmount, setCreditAmount] = useState(1);
  const [creditTier, setCreditTier] = useState<CapacityTier>('50');

  // Hooks
  const { data: billingData, isLoading: isLoadingBilling, refetch: refetchBilling } = useAdminBilling(selectedUserId, accessToken);
  const grantSubscription = useGrantSubscription(accessToken);
  const cancelSubscription = useCancelAdminSubscription(accessToken);
  const addCredits = useAddCredits(accessToken);
  const resetCredits = useResetCredits(accessToken);

  // Fetch organizers on mount
  useEffect(() => {
    fetchOrganizers();
  }, []);

  // Filter organizers
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrganizers(organizers);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredOrganizers(
        organizers.filter(o =>
          (o.email || '').toLowerCase().includes(q) ||
          (o.name || '').toLowerCase().includes(q) ||
          (o.urlSlug || '').toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, organizers]);

  const fetchOrganizers = async () => {
    try {
      setIsLoadingOrganizers(true);
      const response = await fetch(`${apiBaseUrl}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        setOrganizers(result.users || []);
        setFilteredOrganizers(result.users || []);
      } else {
        toast.error('Failed to fetch organizers');
      }
    } catch (error) {
      errorLog('Error fetching organizers:', error);
      toast.error('Network error');
    } finally {
      setIsLoadingOrganizers(false);
    }
  };

  const selectedOrganizer = organizers.find(o => o.id === selectedUserId);
  const subscription = billingData?.subscription;
  const credits = billingData?.credits;
  const transactions = billingData?.transactions || [];

  const handleGrantSubscription = () => {
    if (!selectedUserId) return;
    grantSubscription.mutate({ userId: selectedUserId, capacityTier: subscriptionTier });
    setShowSubscriptionDialog(false);
  };

  const handleCancelSubscription = () => {
    if (!selectedUserId) return;
    if (!confirm('Cancel this subscription?')) return;
    cancelSubscription.mutate(selectedUserId);
  };

  const handleAddCredits = () => {
    if (!selectedUserId) return;
    addCredits.mutate({ userId: selectedUserId, amount: creditAmount, capacityTier: creditTier });
    setShowCreditsDialog(false);
    setCreditAmount(1);
  };

  const handleResetCredits = () => {
    if (!selectedUserId) return;
    if (!confirm('Reset credits to zero?')) return;
    resetCredits.mutate(selectedUserId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'trialing': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'past_due': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600';
      case 'consumed': return 'text-orange-600';
      case 'refund': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <CreditCard className="w-6 h-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Billing management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Organizer list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Organizers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoadingOrganizers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-1">
                  {filteredOrganizers.map(org => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedUserId(org.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedUserId === org.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="truncate font-medium">{org.name || 'No name'}</div>
                      <div className="truncate text-xs text-muted-foreground">{org.email}</div>
                    </button>
                  ))}
                  {filteredOrganizers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No organizers found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Billing details */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedUserId ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Select an organizer to manage billing</p>
              </CardContent>
            </Card>
          ) : isLoadingBilling ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selected organizer header */}
              <div className="text-sm text-muted-foreground">
                Managing: <span className="font-medium text-foreground">{selectedOrganizer?.name || selectedOrganizer?.email}</span>
                {selectedOrganizer?.urlSlug && <span className="ml-1">({selectedOrganizer.urlSlug})</span>}
              </div>

              {/* Subscription card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Subscription
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {subscription && ['active', 'trialing'].includes(subscription.status) ? (
                        <Button variant="destructive" size="sm" onClick={handleCancelSubscription} disabled={cancelSubscription.isPending}>
                          {cancelSubscription.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                          Cancel
                        </Button>
                      ) : null}
                      <Button size="sm" onClick={() => setShowSubscriptionDialog(true)} disabled={grantSubscription.isPending}>
                        {grantSubscription.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        Grant subscription
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="flex flex-wrap gap-3 items-center">
                      <Badge variant="outline" className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                      <span className="text-sm">
                        Tier: <strong>{subscription.capacityTier}</strong> (up to {PRICING_TIERS[subscription.capacityTier as CapacityTier]?.capacity || '?'} participants)
                      </span>
                      {subscription.currentPeriodEnd && (
                        <span className="text-xs text-muted-foreground">
                          Expires: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      )}
                      {subscription.stripeCustomerId === 'admin_granted' && (
                        <Badge variant="outline" className="text-xs">Admin granted</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No subscription</p>
                  )}
                </CardContent>
              </Card>

              {/* Credits card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Coins className="w-4 h-4 text-blue-500" />
                      Event credits
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {credits && credits.balance > 0 && (
                        <Button variant="outline" size="sm" onClick={handleResetCredits} disabled={resetCredits.isPending}>
                          {resetCredits.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                          Reset
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setShowCreditsDialog(true)} disabled={addCredits.isPending}>
                        {addCredits.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        Add credits
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold">{credits?.balance ?? 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {credits?.capacityTier ? (
                        <>Tier: {credits.capacityTier} (up to {PRICING_TIERS[credits.capacityTier as CapacityTier]?.capacity || '?'} participants per event)</>
                      ) : (
                        'No credits'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction history */}
              {transactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Transaction history</CardTitle>
                    <CardDescription>Last {transactions.length} transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-xs">
                              {new Date(tx.createdAt || tx.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTransactionColor(tx.type)}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </TableCell>
                            <TableCell className="text-xs">{tx.capacityTier || tx.capacity_tier || '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {tx.description || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grant Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant subscription</DialogTitle>
            <DialogDescription>
              Simulates a Stripe subscription purchase for {selectedOrganizer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Capacity tier</Label>
              <Select value={subscriptionTier} onValueChange={(v) => setSubscriptionTier(v as CapacityTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAID_TIERS.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      Up to {PRICING_TIERS[tier].capacity} participants — {formatPrice(PRICING_TIERS[tier].premiumMonthlyPrice)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>Cancel</Button>
            <Button onClick={handleGrantSubscription} disabled={grantSubscription.isPending}>
              {grantSubscription.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Grant subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add credits</DialogTitle>
            <DialogDescription>
              Simulates a single-event credit purchase for {selectedOrganizer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Number of credits</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={creditAmount}
                onChange={e => setCreditAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity tier</Label>
              <Select value={creditTier} onValueChange={(v) => setCreditTier(v as CapacityTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAID_TIERS.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      Up to {PRICING_TIERS[tier].capacity} participants — {formatPrice(PRICING_TIERS[tier].singleEventPrice)}/event
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditsDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCredits} disabled={addCredits.isPending}>
              {addCredits.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add {creditAmount} credit{creditAmount > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
