import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, CreditCard, Calendar, AlertCircle, Coins, AlertTriangle, Download, FileText, ExternalLink, Settings, Mail, Pencil } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { apiBaseUrl } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';
import { PRICING_TIERS, formatPrice, type CapacityTier } from '../config/pricing';
import { PricingPanel } from './PricingPanel';

interface Subscription {
  plan: string;
  capacityTier: CapacityTier;
  status: string;
  currentPeriodEnd: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  cancelAtPeriodEnd?: boolean;
}

interface Invoice {
  id: string;
  type: 'subscription' | 'single_event';
  amount: number;
  currency: string;
  status: string;
  date: string | null;
  description: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
  number: string | null;
}

interface CreditTransaction {
  id: number;
  amount: number;
  type: string;       // 'purchase', 'consumed', 'refund'
  capacityTier: string;
  description: string | null;
  createdAt: string;
}

interface BillingDetails {
  name: string | null;
  email: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  taxIds: { type: string; value: string }[];
}

interface BillingSettingsProps {
  accessToken: string;
}

export function BillingSettings({ accessToken }: BillingSettingsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<{ balance: number; capacityTier: string }[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [billingDetailsLoading, setBillingDetailsLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceEmailEditing, setInvoiceEmailEditing] = useState(false);
  const [invoiceEmailSaving, setInvoiceEmailSaving] = useState(false);
  const [invoicesTab, setInvoicesTab] = useState<'invoices' | 'credits'>('invoices');

  useEffect(() => {
    loadSubscription();
    loadCredits();
    loadInvoices();
    loadBillingDetails();

    // Check for payment success/cancel/portal return in URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const portalReturn = params.get('portal');

    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully!');
      // Remove query params from URL
      window.history.replaceState({}, '', '/billing');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled');
      window.history.replaceState({}, '', '/billing');
    } else if (portalReturn === 'returned') {
      // Returned from Stripe Customer Portal — reload billing details
      toast.success('Billing details updated');
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/subscription`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load subscription');
      }

      const data = await response.json();
      
      if (data.hasSubscription) {
        setSubscription(data.subscription);
        // Set slider to current subscription capacity
        setSelectedCapacity(PRICING_TIERS[data.subscription.capacityTier].capacity);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      errorLog('Error loading subscription:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const loadCredits = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/credits`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Backend now returns array of credits per tier
        const creditsList = Array.isArray(data.credits) ? data.credits : (data.credits ? [data.credits] : []);
        setCredits(creditsList.filter((c: any) => c.balance > 0));
        // Store transactions for usage history
        if (Array.isArray(data.transactions)) {
          setCreditTransactions(data.transactions);
        }
      }
    } catch (error) {
      errorLog('Error loading credits:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      errorLog('Error loading invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadBillingDetails = async () => {
    try {
      setBillingDetailsLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/billing-details`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBillingDetails(data.billingDetails || null);
        if (data.billingDetails?.email) {
          setInvoiceEmail(data.billingDetails.email);
        }
      }
    } catch (error) {
      errorLog('Error loading billing details:', error);
    } finally {
      setBillingDetailsLoading(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      errorLog('Error opening billing portal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleSaveInvoiceEmail = async () => {
    if (!invoiceEmail.trim() || !invoiceEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setInvoiceEmailSaving(true);
      const response = await fetch(
        `${apiBaseUrl}/update-invoice-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email: invoiceEmail.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update email');
      }

      toast.success('Invoice email updated');
      setInvoiceEmailEditing(false);
      // Reload billing details to reflect the change
      loadBillingDetails();
    } catch (error) {
      errorLog('Error updating invoice email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice email');
    } finally {
      setInvoiceEmailSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    setShowCancelDialog(false);

    try {
      setActionLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      toast.success(data.message || 'Subscription cancelled successfully');
      
      // Reload subscription data
      await loadSubscription();
    } catch (error) {
      errorLog('Error cancelling subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      cancelling: { label: 'Cancelling', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
      past_due: { label: 'Past Due', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing and subscription</h1>
      </div>

      {loading ? (
        <div className="space-y-8">
          <Card><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent><div className="space-y-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-40" /></div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-36" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      ) : (
        <>
          {/* Your plan — merged subscription + credits */}
          {(subscription || credits.length > 0) && (
            <Card className={`mb-8 ${subscription && (subscription.cancelAtPeriodEnd || subscription.status === 'cancelled') ? 'border-amber-200 dark:border-amber-800' : ''}`}>
              <CardHeader>
                <CardTitle>Your plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Subscription section */}
                  {subscription && (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              Unlimited events
                            </h3>
                            {subscription.cancelAtPeriodEnd ? (
                              <Badge variant="destructive">Cancelled</Badge>
                            ) : (
                              getStatusBadge(subscription.status)
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Up to {PRICING_TIERS[subscription.capacityTier].capacity} participants · {formatPrice(PRICING_TIERS[subscription.capacityTier].premiumMonthlyPrice)}/month
                          </p>
                        </div>
                        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              'Cancel subscription'
                            )}
                          </Button>
                        )}
                      </div>

                      {subscription.cancelAtPeriodEnd || subscription.status === 'cancelled' ? (
                        <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                              Your subscription has been cancelled
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              You still have access until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. After that, you can subscribe again or purchase a single event to create events with more than 5 participants.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {subscription.status === 'past_due' && (
                        <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Payment failed</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Please update your payment method to continue your subscription.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider between subscription and credits */}
                  {subscription && credits.length > 0 && (
                    <div className="border-t pt-2" />
                  )}

                  {/* Single event credits section — one row per tier */}
                  {credits.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Coins className="h-5 w-5 text-blue-500" />
                        Single event credits
                      </h3>
                      {credits.map((credit) => (
                        <div key={credit.capacityTier} className="flex items-center gap-4">
                          <div className="text-3xl font-bold">{credit.balance}</div>
                          <div className="text-sm text-muted-foreground">
                            {credit.balance === 1 ? 'credit' : 'credits'} remaining
                            {PRICING_TIERS[credit.capacityTier as CapacityTier] && (
                              <> · Up to {PRICING_TIERS[credit.capacityTier as CapacityTier].capacity} participants per event</>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Selector */}
          <PricingPanel accessToken={accessToken} hasSubscription={!!subscription} />

          {/* Invoices & Credit history (tabbed) */}
          <Card className="mb-8">
            <CardHeader>
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setInvoicesTab('invoices')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: invoicesTab === 'invoices' ? 'var(--foreground)' : 'var(--muted-foreground)',
                    borderBottom: invoicesTab === 'invoices' ? '2px solid var(--foreground)' : '2px solid transparent',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: invoicesTab === 'invoices' ? 'var(--foreground)' : 'transparent',
                    cursor: 'pointer',
                    marginBottom: '-1px',
                  }}
                >
                  Invoices
                </button>
                {creditTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInvoicesTab('credits')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: invoicesTab === 'credits' ? 'var(--foreground)' : 'var(--muted-foreground)',
                      background: 'none',
                      border: 'none',
                      borderBottomWidth: '2px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: invoicesTab === 'credits' ? 'var(--foreground)' : 'transparent',
                      cursor: 'pointer',
                      marginBottom: '-1px',
                    }}
                  >
                    Credit history
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoicesTab === 'invoices' ? (
                <>
                  {invoicesLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No invoices yet. Invoices will appear here after your first payment.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px 8px 0', whiteSpace: 'nowrap' }}>Date</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px' }}>Description</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px', whiteSpace: 'nowrap' }}>Type</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'right', padding: '8px 12px', whiteSpace: 'nowrap' }}>Amount</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'center', padding: '8px 12px', whiteSpace: 'nowrap' }}>Status</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'right', padding: '8px 0 8px 12px', whiteSpace: 'nowrap' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td className="text-sm" style={{ padding: '10px 12px 10px 0', whiteSpace: 'nowrap' }}>
                                {invoice.date ? new Date(invoice.date).toLocaleDateString() : '—'}
                              </td>
                              <td className="text-sm" style={{ padding: '10px 12px' }}>
                                {invoice.number || invoice.description}
                              </td>
                              <td className="text-sm text-muted-foreground" style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                {invoice.type === 'subscription' ? 'Subscription' : 'Single event'}
                              </td>
                              <td className="text-sm font-medium" style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: invoice.currency || 'eur',
                                }).format(invoice.amount / 100)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                  {invoice.status === 'paid' ? 'Paid' : invoice.status}
                                </Badge>
                              </td>
                              <td style={{ padding: '10px 0 10px 12px', textAlign: 'right' }}>
                                {invoice.pdfUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3.5 w-3.5 mr-1.5" />
                                      PDF
                                    </a>
                                  </Button>
                                )}
                                {invoice.hostedUrl && !invoice.pdfUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                      View
                                    </a>
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {creditTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No credit transactions yet.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px 8px 0', whiteSpace: 'nowrap' }}>Date</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px' }}>Type</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'left', padding: '8px 12px' }}>Details</th>
                            <th className="text-xs font-medium text-muted-foreground" style={{ textAlign: 'right', padding: '8px 0 8px 12px', whiteSpace: 'nowrap' }}>Credits</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditTransactions.map((tx) => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td className="text-sm" style={{ padding: '10px 12px 10px 0', whiteSpace: 'nowrap' }}>
                                {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    tx.type === 'purchase' ? 'bg-green-500' :
                                    tx.type === 'consumed' ? 'bg-orange-500' :
                                    tx.type === 'refund' ? 'bg-blue-500' : 'bg-gray-400'
                                  }`} />
                                  <span className="text-sm">
                                    {tx.type === 'purchase' ? 'Purchased' :
                                     tx.type === 'consumed' ? 'Used for event' :
                                     tx.type === 'refund' ? 'Refunded' : tx.type}
                                  </span>
                                </div>
                              </td>
                              <td className="text-sm text-muted-foreground" style={{ padding: '10px 12px' }}>
                                {tx.description || (tx.capacityTier && PRICING_TIERS[tx.capacityTier as CapacityTier]
                                  ? `Up to ${PRICING_TIERS[tx.capacityTier as CapacityTier].capacity} participants`
                                  : '—')}
                              </td>
                              <td style={{ padding: '10px 0 10px 12px', textAlign: 'right' }}>
                                <span className={`text-sm font-medium ${
                                  tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Billing details
                </CardTitle>
                {billingDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenBillingPortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Edit billing details
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {billingDetailsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : billingDetails ? (
                <div className="space-y-3">
                  {/* Name */}
                  {billingDetails.name && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                      <p className="text-sm font-medium">{billingDetails.name}</p>
                    </div>
                  )}

                  {/* Address */}
                  {billingDetails.address && (billingDetails.address.line1 || billingDetails.address.city) && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Address</p>
                      <p className="text-sm">
                        {[
                          billingDetails.address.line1,
                          billingDetails.address.line2,
                          [billingDetails.address.city, billingDetails.address.postalCode].filter(Boolean).join(' '),
                          billingDetails.address.country,
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Tax IDs */}
                  {billingDetails.taxIds.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Tax ID</p>
                      {billingDetails.taxIds.map((tid, i) => (
                        <p key={i} className="text-sm font-medium">{tid.value}</p>
                      ))}
                    </div>
                  )}

                  {/* Invoice email */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Invoice email</p>
                    {invoiceEmailEditing ? (
                      <div className="flex items-center gap-2" style={{ marginTop: '4px' }}>
                        <input
                          type="email"
                          value={invoiceEmail}
                          onChange={(e) => setInvoiceEmail(e.target.value)}
                          className="flex-1 text-sm border rounded-md"
                          style={{ padding: '6px 10px', outline: 'none' }}
                          placeholder="email@company.com"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInvoiceEmail();
                            if (e.key === 'Escape') {
                              setInvoiceEmailEditing(false);
                              setInvoiceEmail(billingDetails.email || '');
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveInvoiceEmail}
                          disabled={invoiceEmailSaving}
                        >
                          {invoiceEmailSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInvoiceEmailEditing(false);
                            setInvoiceEmail(billingDetails.email || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{billingDetails.email || 'Not set'}</p>
                        <button
                          type="button"
                          onClick={() => setInvoiceEmailEditing(true)}
                          className="text-muted-foreground"
                          style={{ padding: '2px' }}
                          title="Edit invoice email"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* If no details filled yet (customer exists but empty) */}
                  {!billingDetails.name && !billingDetails.address?.line1 && billingDetails.taxIds.length === 0 && !billingDetails.email && (
                    <p className="text-sm text-muted-foreground">
                      No billing details set yet. Click "Edit billing details" to add your company name, address, and Tax ID.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Billing details will be available after your first payment. You'll be able to add your company name, address, and Tax ID.
                  </p>
                  {(subscription || credits.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenBillingPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Add billing details
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently asked questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">What's included in the free tier?</h4>
                <p className="text-sm text-muted-foreground">
                  Events with up to 5 participants are completely free and include all features — unlimited rounds, all networking modes, and full event management. It's the same experience as paid tiers, just with a smaller group size.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How does the subscription work?</h4>
                <p className="text-sm text-muted-foreground">
                  With a subscription, you get unlimited events at your chosen capacity. You can choose monthly or annual billing and cancel anytime — you'll keep access until the end of your billing period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How do I choose the right capacity?</h4>
                <p className="text-sm text-muted-foreground">
                  The event capacity is set when you create your event and cannot be changed during a round. Choose based on the expected number of participants for your event — for most events, this number is known in advance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Can I cancel my subscription?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel anytime. You'll retain access until the end of your current billing period.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel subscription?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period
              {subscription?.currentPeriodEnd && (
                <> ({new Date(subscription.currentPeriodEnd).toLocaleDateString()})</>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}