import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Check, Loader2, CreditCard, Sparkles, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiBaseUrl } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';
import { PRICING_TIERS, CAPACITY_OPTIONS, formatPrice, getTierForCapacity, type CapacityTier } from '../config/pricing';

interface PricingPanelProps {
  accessToken: string | null;
  /** If provided, shows "Change plan" instead of "Choose a plan" */
  hasSubscription?: boolean;
  /** Title override */
  title?: string;
}

export function PricingPanel({ accessToken, hasSubscription, title }: PricingPanelProps) {
  const [selectedCapacity, setSelectedCapacity] = useState(50);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [creditQuantity, setCreditQuantity] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [showGiftCardInput, setShowGiftCardInput] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardValidating, setGiftCardValidating] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    discountType: 'percentage' | 'absolute';
    discountValue: number;
  } | null>(null);

  const currentTier = getTierForCapacity(selectedCapacity);
  const currentPricing = PRICING_TIERS[currentTier];
  const isFree = currentTier === 'free';

  const getSliderValue = (capacity: number): number => {
    const index = CAPACITY_OPTIONS.findIndex(o => o.value === capacity);
    return index >= 0 ? index : 0;
  };

  const getCapacityFromSlider = (value: number): number => {
    return CAPACITY_OPTIONS[value]?.value || 50;
  };

  const handleValidateGiftCard = async () => {
    if (!giftCardCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }
    try {
      setGiftCardValidating(true);
      const response = await fetch(
        `${apiBaseUrl}/validate-gift-card`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ code: giftCardCode.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Invalid gift card code');
        return;
      }
      if (data.valid && data.giftCard) {
        setAppliedGiftCard(data.giftCard);
        toast.success(`Gift card applied: ${data.giftCard.discountType === 'percentage' ? `${data.giftCard.discountValue}% off` : `€${data.giftCard.discountValue} off`}`);
        setShowGiftCardInput(false);
      }
    } catch (error) {
      errorLog('Error validating gift card:', error);
      toast.error('Failed to validate gift card');
    } finally {
      setGiftCardValidating(false);
    }
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    toast.info('Gift card removed');
  };

  const handleSubscribe = async (paymentType: 'single' | 'subscription') => {
    const tier = getTierForCapacity(selectedCapacity);
    if (tier === 'free') return;

    if (!accessToken) {
      // Not logged in — redirect to signup
      window.location.href = '/signup';
      return;
    }

    try {
      setActionLoading(true);
      const capacity = selectedCapacity;

      const endpoint = paymentType === 'subscription'
        ? '/create-subscription'
        : '/create-event-payment';

      const body: any = paymentType === 'subscription'
        ? { capacity, interval: billingInterval === 'annual' ? 'yearly' : 'monthly' }
        : { capacity, quantity: creditQuantity };

      if (appliedGiftCard) {
        body.giftCardCode = appliedGiftCard.code;
      }

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

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      errorLog('Error creating payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment');
      setActionLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title || (hasSubscription ? 'Change plan' : 'Choose a plan')}</CardTitle>
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

        {/* Gift Card Code */}
        {!isFree && (
          <div style={{ marginTop: '12px' }}>
            {appliedGiftCard ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-700">
                  <span className="font-mono font-medium">{appliedGiftCard.code}</span>
                  {' · '}
                  {appliedGiftCard.discountType === 'percentage' ? `${appliedGiftCard.discountValue}% off` : `€${appliedGiftCard.discountValue} off`}
                </span>
                <button
                  type="button"
                  onClick={removeGiftCard}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            ) : showGiftCardInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateGiftCard()}
                  className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
                  style={{ width: '160px' }}
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateGiftCard}
                  disabled={giftCardValidating || !giftCardCode.trim()}
                  style={{ height: '32px' }}
                >
                  {giftCardValidating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowGiftCardInput(false); setGiftCardCode(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGiftCardInput(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
                style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Redeem gift card
              </button>
            )}
          </div>
        )}

        {/* Pricing Display */}
        {!isFree && (
          <div className="grid md:grid-cols-2 gap-4" style={{ marginTop: '1rem' }}>
            {/* Single Event Payment */}
            <Card className="border-2 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Single event</CardTitle>
                <div className="text-3xl font-bold">
                  {formatPrice(currentPricing.singleEventPrice)}
                </div>
                <CardDescription>per event credit</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Up to {currentPricing.capacity} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Valid for one event per credit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Unlimited rounds</span>
                  </div>
                </div>
                <div className="flex-1" />
                {/* Quantity selector */}
                <div className="flex items-center justify-between" style={{ padding: '8px 0' }}>
                  <span className="text-sm font-medium">Credits</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCreditQuantity(Math.max(1, creditQuantity - 1))}
                      disabled={creditQuantity <= 1}
                      className="flex items-center justify-center rounded-md border"
                      style={{ width: '28px', height: '28px', opacity: creditQuantity <= 1 ? 0.4 : 1 }}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-lg font-bold" style={{ minWidth: '24px', textAlign: 'center' }}>{creditQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setCreditQuantity(Math.min(20, creditQuantity + 1))}
                      disabled={creditQuantity >= 20}
                      className="flex items-center justify-center rounded-md border"
                      style={{ width: '28px', height: '28px', opacity: creditQuantity >= 20 ? 0.4 : 1 }}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
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
                      Pay {formatPrice(currentPricing.singleEventPrice * creditQuantity)}
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
          <div className="text-center py-6 bg-muted/50 rounded-lg" style={{ marginTop: '1rem' }}>
            <p className="text-sm text-muted-foreground">
              Free tier includes up to 5 participants — perfect for testing!
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground" style={{ marginTop: '12px', textAlign: 'right' }}>
          All prices excl. VAT
        </p>
      </CardContent>
    </Card>
  );
}
