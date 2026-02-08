import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Check, Loader2, CreditCard, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
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
  isYearly?: boolean;
}

interface BillingSettingsProps {
  accessToken: string;
}

export function BillingSettings({ accessToken }: BillingSettingsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCapacity, setSelectedCapacity] = useState(50); // Default to 50
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadSubscription();

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
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/subscription`,
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
        ? { capacity, interval: billingInterval }
        : { capacity };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a${endpoint}`,
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

    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/cancel-subscription`,
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

  // Calculate yearly pricing (10 months instead of 12)
  const yearlyPrice = currentPricing.premiumMonthlyPrice * 10;
  const yearlySavings = currentPricing.premiumMonthlyPrice * 2;
  const displayedPrice = billingInterval === 'yearly' ? yearlyPrice : currentPricing.premiumMonthlyPrice;

  // Map capacity to slider value (0-5)
  const getSliderValue = (capacity: number): number => {
    const index = CAPACITY_OPTIONS.findIndex(opt => opt.value === capacity);
    return index >= 0 ? index : 1;
  };

  const getCapacityFromSlider = (value: number): number => {
    return CAPACITY_OPTIONS[value]?.value || 50;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing and subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Free Tier Notice */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              Events up to 10 participants free for testing purposes
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Try Oliwonder for free with events up to 10 participants. Perfect for testing the platform before scaling up!
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Current Subscription */}
          {subscription && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Current subscription</CardTitle>
                <CardDescription>Your active subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          Premium - Up to {PRICING_TIERS[subscription.capacityTier].capacity} participants
                        </h3>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(PRICING_TIERS[subscription.capacityTier].premiumMonthlyPrice)}/month
                      </p>
                    </div>
                    {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
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

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {subscription.cancelAtPeriodEnd ? (
                      <span>
                        Subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>

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
              </CardContent>
            </Card>
          )}

          {/* Pricing Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{subscription ? 'Change plan' : 'Choose a plan'}</CardTitle>
              <CardDescription>
                Select the capacity that best fits your event needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Capacity Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Event capacity</label>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      Up to {selectedCapacity} participants
                    </div>
                    {isFree && (
                      <div className="text-xs text-muted-foreground">Free tier</div>
                    )}
                  </div>
                </div>

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

                <div className="relative w-full mt-2">
                  {CAPACITY_OPTIONS.map((option, index) => {
                    // Calculate position: each step is evenly distributed
                    const position = (index / (CAPACITY_OPTIONS.length - 1)) * 100;
                    
                    return (
                      <span 
                        key={option.value} 
                        className={`absolute text-xs text-muted-foreground -translate-x-1/2 ${
                          index === 0 || index === CAPACITY_OPTIONS.length - 1 ? '' : 'hidden sm:inline'
                        }`}
                        style={{ left: `${position}%` }}
                      >
                        {option.value}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Display */}
              {!isFree && (
                <>
                  {/* Billing Interval Toggle */}
                  <div className="flex items-center justify-center gap-3 pt-4 border-t">
                    <span className={`text-sm font-medium transition-colors ${billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-primary"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Yearly
                    </span>
                    {billingInterval === 'yearly' && (
                      <Badge variant="secondary" className="ml-1">
                        <Sparkles className="h-3 w-3 mr-1" />
                        2 months free
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Single Event Payment */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Single event</CardTitle>
                        <div className="text-3xl font-bold">
                          {formatPrice(currentPricing.singleEventPrice)}
                        </div>
                        <CardDescription>One-time payment</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
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

                    {/* Premium Subscription */}
                    <Card className="border-2 border-primary">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Premium subscription</CardTitle>
                          <Badge>Popular</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-3xl font-bold">
                            {formatPrice(displayedPrice)}
                          </div>
                          {billingInterval === 'yearly' ? (
                            <CardDescription>
                              per year (billed annually)
                            </CardDescription>
                          ) : (
                            <CardDescription>per month</CardDescription>
                          )}
                        </div>
                        {billingInterval === 'yearly' && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Save {formatPrice(yearlySavings)} per year
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
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
                </>
              )}

              {isFree && (
                <div className="text-center py-6 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Free tier includes up to 10 participants - perfect for testing!
                  </p>
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
                  Events with up to 10 participants are completely free - perfect for testing Oliwonder and running smaller networking sessions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How does yearly billing work?</h4>
                <p className="text-sm text-muted-foreground">
                  With yearly billing, you pay for 10 months upfront and get 2 months free - that's a 16.7% discount compared to monthly billing!
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">What happens if I exceed my participant limit?</h4>
                <p className="text-sm text-muted-foreground">
                  You can upgrade your plan at any time. If you're on a single event payment, you'll need to purchase a higher tier for your next event.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Can I cancel my subscription?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel anytime. You'll retain access until the end of your current billing period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">What's the difference between single event and subscription?</h4>
                <p className="text-sm text-muted-foreground">
                  Single event is a one-time payment for a specific event. Premium subscription gives you unlimited events with monthly or yearly billing.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}