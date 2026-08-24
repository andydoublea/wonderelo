import { useState } from 'react';
import { Slider } from './ui/slider';
import { Loader2 } from 'lucide-react';
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
  /** Show the "Events up to 5 participants free…" free-tier notice.
      Design shows it in the Billing plan-chooser but NOT on the standalone Pricing page. */
  showFreeTierNotice?: boolean;
}

// ── Inline icons (match the mock's SVG weights verbatim) ──────────────
const CheckMark = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const CardIco = (
  <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
);
const ArrowIco = (
  <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
);

/** Format an integer with thin-space thousands separators (matches the mock: "1 990"). */
const grp = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** "€99" split so the € can be styled as `.currency`. */
const euro = (cents: number) => (
  <><span className="currency">€</span>{grp(cents / 100)}</>
);

export function PricingPanel({ accessToken, hasSubscription, title, showFreeTierNotice = true }: PricingPanelProps) {
  // Design defaults the capacity slider to the 200-participant tier (Pricing.html idx=2).
  const [selectedCapacity, setSelectedCapacity] = useState(200);
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

  // Live-derived display values (mirror the mock's render()) ────────────
  const capValue = grp(currentPricing.capacity);
  const sliderIdx = getSliderValue(selectedCapacity);
  // Mock floors the per-month figure to whole euros: Math.floor(yr / 12 / 100) * 100 cents.
  const annualPerMonth = Math.floor(currentPricing.premiumAnnualPrice / 12 / 100) * 100;

  // ── Gift-card control (shared under the plans; opened from either foot) ──
  const giftCardControl = appliedGiftCard ? (
    <span className="pr-plan-foot" style={{ marginTop: 18 }}>
      <span style={{ fontFamily: 'var(--w-font-mono)', color: 'var(--w-success)', fontWeight: 600 }}>{appliedGiftCard.code}</span>
      {' · '}
      {appliedGiftCard.discountType === 'percentage' ? `${appliedGiftCard.discountValue}% off` : `€${appliedGiftCard.discountValue} off`}
      {' · '}
      <span className="w-link-i" role="button" tabIndex={0} onClick={removeGiftCard}>Remove</span>
    </span>
  ) : showGiftCardInput ? (
    <div className="pr-giftcard">
      <input
        type="text"
        className="pr-giftcard-input"
        placeholder="Enter code"
        value={giftCardCode}
        onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleValidateGiftCard()}
        autoFocus
      />
      <button
        type="button"
        className="w-btn w-btn-ghost w-btn-sm"
        onClick={handleValidateGiftCard}
        disabled={giftCardValidating || !giftCardCode.trim()}
      >
        {giftCardValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
      </button>
      <span className="w-link-i" role="button" tabIndex={0} onClick={() => { setShowGiftCardInput(false); setGiftCardCode(''); }}>Cancel</span>
    </div>
  ) : null;

  return (
    <>
      {/* ── Free-tier notice — design shows this in Billing's plan chooser but NOT on the standalone Pricing page ── */}
      {showFreeTierNotice && (
        <div className="pr-free-pill">
          <span className="w-diamond" />
          Events up to 5 participants free for testing purposes
        </div>
      )}

      {/* ── Capacity selector (data: CAPACITY_OPTIONS) ───────────────── */}
      <div className="pr-cap" data-component="CapacitySelector">
        <span className="pr-cap-deco">capacity</span>
        <div className="pr-cap-head">
          <div className="l">
            <span className="label">{title || (hasSubscription ? 'Change plan' : 'Event capacity')}</span>
            <div className="pr-cap-value">Up to {capValue}<em>participants</em></div>
          </div>
        </div>
        <div className="pr-slider">
          <Slider
            value={[sliderIdx]}
            onValueChange={(values) => setSelectedCapacity(getCapacityFromSlider(values[0]))}
            min={0}
            max={CAPACITY_OPTIONS.length - 1}
            step={1}
            className="w-full"
          />
          <div className="pr-stop-labels">
            {CAPACITY_OPTIONS.map((option, index) => {
              const position = (index / (CAPACITY_OPTIONS.length - 1)) * 100;
              return (
                <span
                  key={option.value}
                  className={`pr-stop-label${index === sliderIdx ? ' is-active' : ''}`}
                  style={{ left: `${position}%` }}
                >
                  {grp(option.value)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Plan cards (data: PRICING_TIERS[currentTier]) ────────────── */}
      {isFree ? (
        <div className="pr-free-note">
          Free tier includes up to 5 participants — perfect for testing! Choose a larger
          capacity above to see paid plans.
        </div>
      ) : (
        <div className="pr-plans">

          {/* Single event (pay per event) */}
          <article className="pr-plan" data-component="SingleEventCard">
            <div className="pr-plan-head">
              <div className="pr-plan-name">Single event</div>
            </div>
            <div className="pr-plan-price">
              <div className="num">{euro(currentPricing.singleEventPrice)}</div>
              <div className="unit">per event, billed<br/><em>once</em></div>
            </div>
            <ul className="pr-plan-feats">
              <li><span className="check">{CheckMark}</span>Up to <strong>{capValue} participants</strong></li>
              <li><span className="check">{CheckMark}</span>Valid for one event per credit</li>
              <li><span className="check">{CheckMark}</span>Unlimited rounds within event</li>
              <li><span className="check">{CheckMark}</span>Custom event page &amp; QR code</li>
              <li className="is-muted"><span className="check">{CheckMark}</span>Priority support</li>
            </ul>
            <div className="pr-plan-qty">
              <span className="label">Credits</span>
              <div className="pr-qty-ctrl">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setCreditQuantity(Math.max(1, creditQuantity - 1))}
                  disabled={creditQuantity <= 1}
                  style={{ opacity: creditQuantity <= 1 ? 0.4 : 1 }}
                >−</button>
                <span className="qty">{creditQuantity}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setCreditQuantity(Math.min(20, creditQuantity + 1))}
                  disabled={creditQuantity >= 20}
                  style={{ opacity: creditQuantity >= 20 ? 0.4 : 1 }}
                >+</button>
              </div>
            </div>
            <button
              className="w-btn w-btn-ghost pr-plan-cta"
              type="button"
              onClick={() => handleSubscribe('single')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><Loader2 className="w-ico animate-spin" /><span className="pr-pay-label">Processing…</span></>
              ) : (
                <>{CardIco}<span className="pr-pay-label">Pay {formatPrice(currentPricing.singleEventPrice * creditQuantity)} once</span></>
              )}
            </button>
            <div className="pr-plan-foot">
              One-time payment · No subscription · <span className="w-link-i" role="button" tabIndex={0} onClick={() => setShowGiftCardInput(true)}>Redeem gift card</span>
            </div>
          </article>

          {/* Unlimited subscription */}
          <article className="pr-plan is-featured" data-component="SubscriptionCard">
            <span className="pr-plan-tag"><span className="w-diamond" /> Most popular</span>
            <div className="pr-plan-head">
              <div className="pr-plan-name">Unlimited events</div>
              <div className="pr-plan-toggle" role="tablist">
                <button
                  className={billingInterval === 'annual' ? 'is-active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={billingInterval === 'annual'}
                  onClick={() => setBillingInterval('annual')}
                >
                  Annually <span className="pr-save">−17%</span>
                </button>
                <button
                  className={billingInterval === 'monthly' ? 'is-active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={billingInterval === 'monthly'}
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="pr-plan-price">
              {billingInterval === 'annual' ? (
                <>
                  <div className="num">{euro(annualPerMonth)}</div>
                  <div className="unit">per month, billed<br/><em>€{grp(currentPricing.premiumAnnualPrice / 100)} / year</em></div>
                </>
              ) : (
                <>
                  <div className="num">{euro(currentPricing.premiumMonthlyPrice)}</div>
                  <div className="unit">per month<br/><em>billed monthly</em></div>
                </>
              )}
            </div>
            <ul className="pr-plan-feats">
              <li className="is-bold"><span className="check">{CheckMark}</span>Unlimited events</li>
              <li><span className="check">{CheckMark}</span>Up to <strong>{capValue} participants</strong> each</li>
              <li><span className="check">{CheckMark}</span>Unlimited rounds &amp; sessions</li>
              <li><span className="check">{CheckMark}</span>Remove Wonderelo branding</li>
              <li><span className="check">{CheckMark}</span>Priority email support · 24h</li>
            </ul>
            <button
              className="w-btn w-btn-primary pr-plan-cta"
              type="button"
              onClick={() => handleSubscribe('subscription')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><Loader2 className="w-ico animate-spin" /><span className="pr-sub-label">Processing…</span></>
              ) : (
                <><span className="pr-sub-label">Subscribe {billingInterval === 'annual' ? 'annually' : 'monthly'}</span>{ArrowIco}</>
              )}
            </button>
            <div className="pr-plan-foot">
              Cancel anytime · No setup fee · All prices excl. VAT · <span className="w-link-i" role="button" tabIndex={0} onClick={() => setShowGiftCardInput(true)}>Redeem gift card</span>
            </div>
          </article>

        </div>
      )}

      {/* ── Gift-card input / applied badge (shared) ─────────────────── */}
      {!isFree && giftCardControl}
    </>
  );
}
