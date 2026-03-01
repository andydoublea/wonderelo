import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Check, Loader2, CreditCard, Calendar, AlertCircle, Sparkles, Coins, AlertTriangle, Download, FileText, ExternalLink, Settings } from 'lucide-react';
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
import { PRICING_TIERS, CAPACITY_OPTIONS, formatPrice, getTierForCapacity, type CapacityTier } from '../config/pricing';

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

interface BillingSettingsProps {
  accessToken: string;
}

export function BillingSettings({ accessToken }: BillingSettingsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<{ balance: number; capacityTier: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCapacity, setSelectedCapacity] = useState(50); // Default to 50
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);


  useEffect(() => {
    loadSubscription();
    loadCredits();
    loadInvoices();

    // Check for payment success/cancel in URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully!');
      // Remove query params from URL
      window.history.replaceState({}, '', '/billing');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled');
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
        setCredits(data.credits || null);
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

  const handleSubscribe = async (paymentType: 'single' | 'subscription') => {
    const tier = getTierForCapacity(selectedCapacity);
    if (tier === 'free') return;

    try {
      setActionLoading(true);
      const capacity = selectedCapacity;

      const endpoint = paymentType === 'subscription' 
        ? '/create-subscription'
        : '/create-event-payment';

      const body = paymentType === 'subscription'
        ? { capacity, interval: billingInterval === 'annual' ? 'yearly' : 'monthly' }
        : { capacity };

      const response = await fetch(
        `${apiBaseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      errorLog('Error creating payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment');
      setActionLoading(false);
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

  // Get the tier for current slider value
  const currentTier = getTierForCapacity(selectedCapacity);
  const currentPricing = PRICING_TIERS[currentTier];
  const isFree = currentTier === 'free';

  const displayedPrice = currentPricing.premiumMonthlyPrice;

  // Map capacity to slider value (0-5)
  const getSliderValue = (capacity: number): number => {
    const index = CAPACITY_OPTIONS.findIndex(opt => opt.value === capacity);
    return index >= 0 ? index : 1;
  };

  const getCapacityFromSlider = (value: number): number => {
    return CAPACITY_OPTIONS[value]?.value || 50;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing and subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <Card><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent><div className="space-y-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-40" /></div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-36" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      ) : (
        <>
          {/* Your plan — merged subscription + credits */}
          {(subscription || (credits && credits.balance > 0)) && (
            <Card className={`mb-8 ${subscription && (subscription.cancelAtPeriodEnd || subscription.status === 'cancelled') ? 'border-amber-200 dark:border-amber-800' : ''}`}>
              <CardHeader>
                <CardTitle>Your plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
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
                  {subscription && credits && credits.balance > 0 && (
                    <div className="border-t pt-1" />
                  )}

                  {/* Single event credits section */}
                  {credits && credits.balance > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Coins className="h-5 w-5 text-blue-500" />
                        Single event credits
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">{credits.balance}</div>
                        <div className="text-sm text-muted-foreground">
                          {credits.balance === 1 ? 'credit' : 'credits'} remaining
                          {credits.capacityTier && PRICING_TIERS[credits.capacityTier as CapacityTier] && (
                            <> · Up to {PRICING_TIERS[credits.capacityTier as CapacityTier].capacity} participants per event</>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{subscription ? 'Change plan' : 'Choose a plan'}</CardTitle>
              <CardDescription>
                Pricing is based on your event's capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Free tier notice */}
              <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Events up to 5 participants free for testing purposes
                  </p>
                </div>
              </div>

              {/* Capacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Event capacity</label>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      Up to {selectedCapacity} participants
                    </div>
                    {}
                  </div>
                </div>

                <div style={{ padding: '0 13px' }}>
                  <Slider
                    value={[getSliderValue(selectedCapacity)]}
                    onValueChange={(values) => {
                      const capacity = getCapacityFromSlider(values[0]);
                      setSelectedCapacity(capacity);
                    }}
                    min={0}
                    max={CAPACITY_OPTIONS.length - 1}
                    step={1}
                    className="w-full"
                  />

                  <div className="relative w-full h-5 mt-2">
                    {CAPACITY_OPTIONS.map((option, index) => {
                      const position = (index / (CAPACITY_OPTIONS.length - 1)) * 100;
                      // Match Radix slider thumb offset: thumbHalf * (1 - 2 * pct/100)
                      const thumbOffset = 12.5 * (1 - 2 * position / 100);

                      return (
                        <span
                          key={option.value}
                          className={`absolute text-xs text-muted-foreground -translate-x-1/2 ${
                            index === 0 || index === CAPACITY_OPTIONS.length - 1 ? '' : 'hidden sm:inline'
                          }`}
                          style={{ left: `calc(${position}% + ${thumbOffset}px)` }}
                        >
                          {option.value}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pricing Display */}
              {!isFree && (
                <div className="grid md:grid-cols-2 gap-4" style={{ marginTop: '2rem' }}>
                  {/* Single Event Payment */}
                  <Card className="border-2 flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Single event</CardTitle>
                      <div className="text-3xl font-bold">
                        {formatPrice(currentPricing.singleEventPrice)}
                      </div>
                      <CardDescription>One-time payment</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Up to {currentPricing.capacity} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Valid for one event</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Unlimited rounds</span>
                        </div>
                      </div>
                      <div className="flex-1" />
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleSubscribe('single')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay once
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Unlimited Events Subscription */}
                  <Card className="border-2 border-primary flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Unlimited events</CardTitle>
                        <Badge>Popular</Badge>
                      </div>
                      {/* Annually / Monthly toggle */}
                      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setBillingInterval('annual')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            billingInterval === 'annual'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Annually
                          <span className="ml-1 text-[10px] text-green-600 dark:text-green-400 font-semibold">-17%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval('monthly')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            billingInterval === 'monthly'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Monthly
                        </button>
                      </div>
                      <div className="space-y-1">
                        {billingInterval === 'monthly' ? (
                          <>
                            <div className="text-3xl font-bold">
                              {formatPrice(currentPricing.premiumMonthlyPrice)}
                            </div>
                            <CardDescription>per month</CardDescription>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl font-bold">
                              {formatPrice(Math.round(currentPricing.premiumAnnualPrice / 12))}
                            </div>
                            <CardDescription>
                              per month, billed {formatPrice(currentPricing.premiumAnnualPrice)} annually
                            </CardDescription>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Up to {currentPricing.capacity} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Unlimited events</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Priority support</span>
                        </div>
                      </div>
                      <div className="flex-1" />
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe('subscription')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isFree && (
                <div className="text-center py-6 bg-muted/50 rounded-lg" style={{ marginTop: '2rem' }}>
                  <p className="text-sm text-muted-foreground">
                    Free tier includes up to 5 participants — perfect for testing!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices & Receipts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices & receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                <div className="divide-y">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {invoice.number || invoice.description}
                          </span>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {invoice.status === 'paid' ? 'Paid' : invoice.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {invoice.type === 'subscription' ? 'Subscription' : 'Single event'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {invoice.date && (
                            <span>{new Date(invoice.date).toLocaleDateString()}</span>
                          )}
                          <span className="font-medium">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: invoice.currency || 'usd',
                            }).format(invoice.amount / 100)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Billing details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You'll be able to add and edit your billing details (company name, Tax ID, address) after your first payment. These details will appear on all your invoices.
              </p>
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