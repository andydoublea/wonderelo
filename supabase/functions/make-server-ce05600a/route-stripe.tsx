/**
 * Stripe Integration Routes
 * Handles: checkout sessions, subscriptions, single event payments, webhooks, credit system
 *
 * Required Supabase Secrets:
 *   STRIPE_SECRET_KEY     - Stripe secret key (sk_test_... or sk_live_...)
 *   STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret (whsec_...)
 *   APP_URL               - Frontend URL for redirect (e.g., https://wonderelo.com)
 */

import { Hono } from 'npm:hono';
import Stripe from 'npm:stripe';
import { getGlobalSupabaseClient } from './global-supabase.tsx';
import { errorLog, debugLog } from './debug.tsx';
import * as db from './db.ts';

// Lazy-init Stripe client
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    stripeClient = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  }
  return stripeClient;
}

// Get the frontend URL for Stripe redirects.
// Uses the request's Origin header so Stripe redirects back to the same origin
// (avoids localhost vs 127.0.0.1 mismatch which causes different localStorage = wrong session).
function getAppUrl(c: any): string {
  const origin = c.req.header('origin') || c.req.header('referer');
  if (origin) {
    try {
      const url = new URL(origin);
      return url.origin; // e.g. "http://localhost:3011"
    } catch { /* fall through */ }
  }
  return Deno.env.get('APP_URL') || 'https://wonderelo.com';
}

// Pricing tiers (must match frontend pricing.tsx) — all prices in EUR cents, excl. VAT
const PRICING_TIERS: Record<string, { capacity: number; singlePrice: number; monthlyPrice: number }> = {
  '50':   { capacity: 50,   singlePrice: 4900,   monthlyPrice: 9900 },
  '200':  { capacity: 200,  singlePrice: 9900,   monthlyPrice: 19900 },
  '500':  { capacity: 500,  singlePrice: 19900,  monthlyPrice: 39900 },
  '1000': { capacity: 1000, singlePrice: 34900,  monthlyPrice: 69900 },
  '5000': { capacity: 5000, singlePrice: 79900,  monthlyPrice: 149900 },
};

function getTierKey(capacity: number): string {
  if (capacity <= 50) return '50';
  if (capacity <= 200) return '200';
  if (capacity <= 500) return '500';
  if (capacity <= 1000) return '1000';
  return '5000';
}

// Helper: authenticate request and return user
async function authenticateUser(c: any): Promise<{ user: any } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await getGlobalSupabaseClient().auth.getUser(token);
  if (error || !user) return null;
  return { user };
}

// Helper: get Stripe customer ID for a user
// Checks subscriptions first, then falls back to credit_transactions (for credit-only users)
async function getStripeCustomerId(userId: string): Promise<string | null> {
  // 1. Check subscriptions table
  const subscription = await db.getSubscription(userId);
  if (subscription?.stripeCustomerId && subscription.stripeCustomerId !== 'admin_granted') {
    return subscription.stripeCustomerId;
  }

  // 2. Fallback: check credit_transactions for stripe_customer_id
  const { data } = await getGlobalSupabaseClient()
    .from('credit_transactions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data?.[0]?.stripe_customer_id) {
    return data[0].stripe_customer_id;
  }

  return null;
}

// Helper: validate and create Stripe coupon from a gift card code
async function validateAndCreateCoupon(
  code: string,
  userId: string,
  applicableTo: string, // 'single_event' | 'monthly_subscription' | 'yearly_subscription'
): Promise<{ couponId: string; card: any } | { error: string }> {
  const cards = await db.getAllGiftCards();
  const card = cards.find((c: any) => c.code === code.toUpperCase().trim());

  if (!card) return { error: 'Invalid gift card code' };
  if (!card.isActive) return { error: 'This gift card is no longer active' };
  if (card.validUntil && new Date(card.validUntil) < new Date()) return { error: 'This gift card has expired' };
  if (card.validFrom && new Date(card.validFrom) > new Date()) return { error: 'This gift card is not yet valid' };
  if (card.maxUses && (card.usedCount || 0) >= card.maxUses) return { error: 'This gift card has reached its maximum uses' };

  const usedBy = card.usedBy || [];
  if (usedBy.some((u: any) => u.organizerId === userId)) return { error: 'You have already used this gift card' };

  // Check applicableTo matches
  if (card.applicableTo !== applicableTo) {
    const label = card.applicableTo === 'single_event' ? 'single event payments' :
                  card.applicableTo === 'monthly_subscription' ? 'monthly subscriptions' : 'yearly subscriptions';
    return { error: `This gift card is only valid for ${label}` };
  }

  // Create one-time Stripe coupon
  const stripe = getStripe();
  const couponParams: any = {
    name: `Gift card: ${card.code}`,
    max_redemptions: 1,
    metadata: { giftCardCode: card.code },
  };

  if (card.discountType === 'percentage') {
    couponParams.percent_off = card.discountValue;
  } else {
    couponParams.amount_off = Math.round(card.discountValue * 100); // convert € to cents
    couponParams.currency = 'eur';
  }

  const coupon = await stripe.coupons.create(couponParams);
  return { couponId: coupon.id, card };
}

// Helper: mark gift card as used by a user
async function markGiftCardUsed(code: string, userId: string, userEmail: string) {
  const cards = await db.getAllGiftCards();
  const card = cards.find((c: any) => c.code === code);
  if (!card) return;

  card.usedCount = (card.usedCount || 0) + 1;
  if (!card.usedBy) card.usedBy = [];
  card.usedBy.push({
    organizerId: userId,
    organizerEmail: userEmail,
    usedAt: new Date().toISOString(),
  });

  await db.saveGiftCards(cards);
}

// ============================================================
// Stripe Route Registration
// ============================================================

export function registerStripeRoutes(app: Hono) {
  const prefix = '/make-server-ce05600a';

  // ── GET /subscription ─────────────────────────────────────
  // Returns current subscription status for the authenticated user
  app.get(`${prefix}/subscription`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const profile = await db.getOrganizerById(auth.user.id);
      if (!profile) return c.json({ error: 'Profile not found' }, 404);

      // Check if user has an active subscription in our DB
      const subscription = await db.getSubscription(auth.user.id);

      if (!subscription) {
        return c.json({ hasSubscription: false });
      }

      // If there's a real Stripe subscription (not admin-granted), verify its status
      const isAdminGranted = subscription.stripeCustomerId === 'admin_granted' || subscription.stripeSubscriptionId?.startsWith('admin_');
      if (subscription.stripeSubscriptionId && !isAdminGranted) {
        try {
          const stripe = getStripe();
          const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

          // Update local status if it changed
          if (stripeSub.status !== subscription.status) {
            await db.updateSubscription(auth.user.id, {
              status: stripeSub.status,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
            });
            subscription.status = stripeSub.status;
            subscription.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
            subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
          }
        } catch (stripeErr) {
          // If Stripe is unreachable, return local data
          errorLog('Could not verify Stripe subscription:', stripeErr);
        }
      }

      // Show subscription if active OR cancelled but still within paid period
      const isActiveStatus = ['active', 'trialing', 'past_due'].includes(subscription.status);
      const isCancelledButValid = subscription.status === 'cancelled' &&
        subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) > new Date();

      return c.json({
        hasSubscription: isActiveStatus || isCancelledButValid,
        subscription: {
          plan: subscription.plan || 'premium',
          capacityTier: subscription.capacityTier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        },
      });
    } catch (error) {
      errorLog('Error getting subscription:', error);
      return c.json({ error: 'Failed to get subscription' }, 500);
    }
  });

  // ── POST /create-subscription ─────────────────────────────
  // Creates a Stripe Checkout Session for a recurring subscription
  app.post(`${prefix}/create-subscription`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const { capacity, interval, giftCardCode } = body;

      const tierKey = getTierKey(capacity);
      const tier = PRICING_TIERS[tierKey];
      if (!tier) return c.json({ error: 'Invalid capacity' }, 400);

      const stripe = getStripe();
      const appUrl = getAppUrl(c);

      // Get or create Stripe customer (checks subscriptions + credit_transactions)
      const profile = await db.getOrganizerById(auth.user.id);
      let customerId = await getStripeCustomerId(auth.user.id);

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email || auth.user.email,
          metadata: {
            userId: auth.user.id,
            organizerName: profile?.organizerName || '',
          },
        });
        customerId = customer.id;
      }

      // Handle gift card discount
      let discounts: any[] | undefined;
      const applicableTo = interval === 'yearly' ? 'yearly_subscription' : 'monthly_subscription';
      if (giftCardCode) {
        const couponResult = await validateAndCreateCoupon(giftCardCode, auth.user.id, applicableTo);
        if ('error' in couponResult) {
          return c.json({ error: couponResult.error }, 400);
        }
        discounts = [{ coupon: couponResult.couponId }];
      }

      // Create Checkout Session for subscription
      const sessionParams: any = {
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        customer_update: { name: 'auto' },
        automatic_tax: { enabled: true },
        line_items: [{
          price_data: {
            currency: 'eur',
            tax_behavior: 'exclusive',
            product_data: {
              name: `Wonderelo Premium – Up to ${tier.capacity} participants`,
              description: 'Unlimited networking events with premium features',
            },
            unit_amount: tier.monthlyPrice,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        subscription_data: {
          metadata: {
            userId: auth.user.id,
            capacityTier: tierKey,
            type: 'subscription',
          },
        },
        success_url: `${appUrl}/billing?payment=success`,
        cancel_url: `${appUrl}/billing?payment=cancelled`,
        metadata: {
          userId: auth.user.id,
          capacityTier: tierKey,
          paymentType: 'subscription',
          ...(giftCardCode ? { giftCardCode } : {}),
        },
      };

      if (discounts) {
        sessionParams.discounts = discounts;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      debugLog('✅ Created Stripe checkout session for subscription:', session.id);

      return c.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      errorLog('Error creating subscription checkout:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Failed to create checkout' }, 500);
    }
  });

  // ── POST /create-event-payment ────────────────────────────
  // Creates a Stripe Checkout Session for a single event payment (credits)
  app.post(`${prefix}/create-event-payment`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const { capacity, quantity: rawQuantity, giftCardCode } = body;
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(rawQuantity) || 1)));

      const tierKey = getTierKey(capacity);
      const tier = PRICING_TIERS[tierKey];
      if (!tier) return c.json({ error: 'Invalid capacity' }, 400);

      const stripe = getStripe();
      const appUrl = getAppUrl(c);

      // Get or create Stripe customer (checks subscriptions + credit_transactions)
      const profile = await db.getOrganizerById(auth.user.id);
      let customerId = await getStripeCustomerId(auth.user.id);

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email || auth.user.email,
          metadata: {
            userId: auth.user.id,
            organizerName: profile?.organizerName || '',
          },
        });
        customerId = customer.id;
      }

      // Handle gift card discount
      let discounts: any[] | undefined;
      if (giftCardCode) {
        const couponResult = await validateAndCreateCoupon(giftCardCode, auth.user.id, 'single_event');
        if ('error' in couponResult) {
          return c.json({ error: couponResult.error }, 400);
        }
        discounts = [{ coupon: couponResult.couponId }];
      }

      // Create Checkout Session for one-time payment
      const sessionParams: any = {
        customer: customerId,
        mode: 'payment',
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        customer_update: { name: 'auto' },
        automatic_tax: { enabled: true },
        line_items: [{
          price_data: {
            currency: 'eur',
            tax_behavior: 'exclusive',
            product_data: {
              name: `Wonderelo Single Event – Up to ${tier.capacity} participants`,
              description: quantity > 1 ? `${quantity} networking event credits` : 'One networking event credit',
            },
            unit_amount: tier.singlePrice,
          },
          quantity,
        }],
        // Generate proper invoice with PDF download (not just a charge receipt)
        invoice_creation: {
          enabled: true,
        },
        success_url: `${appUrl}/billing?payment=success`,
        cancel_url: `${appUrl}/billing?payment=cancelled`,
        metadata: {
          userId: auth.user.id,
          capacityTier: tierKey,
          paymentType: 'single_event',
          quantity: String(quantity),
          ...(giftCardCode ? { giftCardCode } : {}),
        },
      };

      if (discounts) {
        sessionParams.discounts = discounts;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      debugLog('✅ Created Stripe checkout session for single event:', session.id);

      return c.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      errorLog('Error creating event payment checkout:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Failed to create checkout' }, 500);
    }
  });

  // ── POST /cancel-subscription ─────────────────────────────
  // Cancels an active subscription (at period end)
  app.post(`${prefix}/cancel-subscription`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const subscription = await db.getSubscription(auth.user.id);
      if (!subscription?.stripeSubscriptionId) {
        return c.json({ error: 'No active subscription found' }, 404);
      }

      // Admin-granted subscriptions: cancel directly in DB (no Stripe call)
      if (subscription.stripeCustomerId === 'admin_granted' || subscription.stripeSubscriptionId?.startsWith('admin_')) {
        await db.updateSubscription(auth.user.id, {
          cancelAtPeriodEnd: true,
        });
      } else {
        const stripe = getStripe();

        // Cancel at period end (user keeps access until billing period expires)
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await db.updateSubscription(auth.user.id, {
          cancelAtPeriodEnd: true,
        });
      }

      debugLog('✅ Subscription cancelled at period end for user:', auth.user.id);

      return c.json({
        success: true,
        message: 'Subscription will be cancelled at the end of your current billing period',
      });
    } catch (error) {
      errorLog('Error cancelling subscription:', error);
      return c.json({ error: 'Failed to cancel subscription' }, 500);
    }
  });

  // ── POST /stripe-webhook ──────────────────────────────────
  // Handles Stripe webhook events (checkout.session.completed, subscription updates, etc.)
  app.post(`${prefix}/stripe-webhook`, async (c) => {
    try {
      const stripe = getStripe();
      const sig = c.req.header('stripe-signature');
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      if (!sig || !webhookSecret) {
        return c.json({ error: 'Missing signature or webhook secret' }, 400);
      }

      const body = await c.req.text();
      let event: Stripe.Event;

      try {
        event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      } catch (err) {
        errorLog('⚠️ Webhook signature verification failed:', err);
        return c.json({ error: 'Invalid signature' }, 400);
      }

      debugLog('📩 Stripe webhook event:', event.type);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const capacityTier = session.metadata?.capacityTier;
          const paymentType = session.metadata?.paymentType;

          if (!userId || !capacityTier) {
            errorLog('Missing metadata in checkout session:', session.id);
            break;
          }

          if (paymentType === 'subscription') {
            // Save subscription data
            await db.upsertSubscription(userId, {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              capacityTier,
              status: 'active',
              plan: 'premium',
              currentPeriodEnd: '', // Will be updated by subscription.updated event
              cancelAtPeriodEnd: false,
            });
            debugLog('✅ Subscription created for user:', userId);
          } else if (paymentType === 'single_event') {
            // Add event credit(s) to user
            const creditQuantity = Math.max(1, parseInt(session.metadata?.quantity || '1', 10));
            await db.addCredits(userId, creditQuantity, {
              type: 'purchase',
              capacityTier,
              stripeSessionId: session.id,
              stripeCustomerId: session.customer as string,
            });
            debugLog(`✅ ${creditQuantity} event credit(s) added for user:`, userId);
          }

          // Mark gift card as used if one was applied
          const giftCardCode = session.metadata?.giftCardCode;
          if (giftCardCode) {
            try {
              const userEmail = session.customer_details?.email || session.metadata?.userId || '';
              await markGiftCardUsed(giftCardCode, userId, userEmail);
              debugLog('✅ Gift card marked as used:', giftCardCode, 'by user:', userId);
            } catch (gcError) {
              errorLog('Error marking gift card as used:', gcError);
              // Don't fail the webhook for this
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId) {
            await db.updateSubscription(userId, {
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            });
            debugLog('✅ Subscription updated for user:', userId);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId) {
            await db.updateSubscription(userId, {
              status: 'cancelled',
              cancelAtPeriodEnd: false,
            });
            debugLog('✅ Subscription deleted for user:', userId);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;

          if (subscriptionId) {
            // Find user by subscription ID and mark as past_due
            const sub = await db.getSubscriptionByStripeId(subscriptionId);
            if (sub) {
              await db.updateSubscription(sub.userId, { status: 'past_due' });
              debugLog('⚠️ Payment failed for subscription:', subscriptionId);
            }
          }
          break;
        }

        default:
          debugLog('Unhandled webhook event:', event.type);
      }

      return c.json({ received: true });
    } catch (error) {
      errorLog('Error processing webhook:', error);
      return c.json({ error: 'Webhook processing failed' }, 500);
    }
  });

  // ── GET /credits ──────────────────────────────────────────
  // Returns current credit balance for the authenticated user
  app.get(`${prefix}/credits`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const credits = await db.getCredits(auth.user.id);
      const transactions = await db.getCreditTransactions(auth.user.id);

      return c.json({
        success: true,
        credits,
        transactions,
      });
    } catch (error) {
      errorLog('Error getting credits:', error);
      return c.json({ error: 'Failed to get credits' }, 500);
    }
  });

  // ── GET /invoices ─────────────────────────────────────────
  // Returns list of invoices/charges for the authenticated user from Stripe
  app.get(`${prefix}/invoices`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      // Use helper that checks both subscriptions and credit_transactions
      const customerId = await getStripeCustomerId(auth.user.id);

      if (!customerId) {
        return c.json({ invoices: [] });
      }

      const stripe = getStripe();

      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 50,
      });

      // Also fetch one-time payment charges (checkout sessions in payment mode)
      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 50,
      });

      // Map invoices (subscription payments)
      const invoiceItems = invoices.data.map((inv) => ({
        id: inv.id,
        type: 'subscription' as const,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        description: inv.lines?.data?.[0]?.description || 'Subscription payment',
        pdfUrl: inv.invoice_pdf || null,
        hostedUrl: inv.hosted_invoice_url || null,
        number: inv.number,
      }));

      // Map charges (one-time payments) — only include those not already in invoices
      const invoiceChargeIds = new Set(invoices.data.map(inv => inv.charge).filter(Boolean));
      const chargeItems = charges.data
        .filter(ch => ch.paid && !invoiceChargeIds.has(ch.id))
        .map((ch) => ({
          id: ch.id,
          type: 'single_event' as const,
          amount: ch.amount,
          currency: ch.currency,
          status: ch.paid ? 'paid' : ch.status,
          date: new Date(ch.created * 1000).toISOString(),
          description: ch.description || 'Single event payment',
          pdfUrl: ch.receipt_url || null,
          hostedUrl: ch.receipt_url || null,
          number: null,
        }));

      // Combine and sort by date descending
      const allInvoices = [...invoiceItems, ...chargeItems].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );

      return c.json({ invoices: allInvoices });
    } catch (error) {
      errorLog('Error getting invoices:', error);
      return c.json({ error: 'Failed to get invoices' }, 500);
    }
  });

  // ── POST /create-portal-session ──────────────────────────
  // Creates a Stripe Customer Portal session for billing details, invoices, payment methods
  app.post(`${prefix}/create-portal-session`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const customerId = await getStripeCustomerId(auth.user.id);
      if (!customerId) {
        return c.json({ error: 'No payment history found. Make a payment first to manage billing details.' }, 400);
      }

      const stripe = getStripe();
      const appUrl = getAppUrl(c);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/billing?portal=returned`,
      });

      debugLog('✅ Created Stripe Customer Portal session for user:', auth.user.id);

      return c.json({ portalUrl: portalSession.url });
    } catch (error) {
      errorLog('Error creating portal session:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Failed to create portal session' }, 500);
    }
  });

  // ── GET /billing-details ────────────────────────────────
  // Returns billing details (name, address, tax IDs) from Stripe customer
  app.get(`${prefix}/billing-details`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const customerId = await getStripeCustomerId(auth.user.id);
      if (!customerId) {
        return c.json({ billingDetails: null });
      }

      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ['tax_ids'],
      }) as Stripe.Customer;

      // Customer might be deleted
      if (customer.deleted) {
        return c.json({ billingDetails: null });
      }

      const taxIds = (customer.tax_ids?.data || []).map((tid: any) => ({
        type: tid.type,
        value: tid.value,
      }));

      return c.json({
        billingDetails: {
          name: customer.name || null,
          email: customer.email || null,
          address: customer.address ? {
            line1: customer.address.line1,
            line2: customer.address.line2,
            city: customer.address.city,
            state: customer.address.state,
            postalCode: customer.address.postal_code,
            country: customer.address.country,
          } : null,
          taxIds,
        },
      });
    } catch (error) {
      errorLog('Error getting billing details:', error);
      return c.json({ error: 'Failed to get billing details' }, 500);
    }
  });

  // ── POST /update-invoice-email ────────────────────────────
  // Updates the Stripe customer's email (used for invoices)
  app.post(`${prefix}/update-invoice-email`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const { email } = body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return c.json({ error: 'Valid email is required' }, 400);
      }

      const customerId = await getStripeCustomerId(auth.user.id);
      if (!customerId) {
        return c.json({ error: 'No payment history found' }, 400);
      }

      const stripe = getStripe();
      await stripe.customers.update(customerId, { email: email.trim() });

      return c.json({ success: true, email: email.trim() });
    } catch (error) {
      errorLog('Error updating invoice email:', error);
      return c.json({ error: 'Failed to update invoice email' }, 500);
    }
  });

  // ── GET /capacity-check ───────────────────────────────────
  // Checks if user can create/publish a session with given participant count
  app.get(`${prefix}/capacity-check`, async (c) => {
    try {
      const auth = await authenticateUser(c);
      if (!auth) return c.json({ error: 'Unauthorized' }, 401);

      const requestedCapacity = parseInt(c.req.query('capacity') || '10');

      const { allowed, reason, currentTier, suggestion } = await checkCapacity(auth.user.id, requestedCapacity);

      return c.json({
        allowed,
        reason,
        currentTier,
        suggestion,
        requestedCapacity,
      });
    } catch (error) {
      errorLog('Error checking capacity:', error);
      return c.json({ error: 'Failed to check capacity' }, 500);
    }
  });
}

// ============================================================
// Capacity Check Logic (Phase 5F)
// ============================================================

export async function checkCapacity(userId: string, requestedCapacity: number): Promise<{
  allowed: boolean;
  reason: string;
  currentTier: string;
  suggestion?: string;
}> {
  // Free tier: up to 10 participants
  if (requestedCapacity <= 10) {
    return { allowed: true, reason: 'Free tier', currentTier: 'free' };
  }

  // Check active subscription
  const subscription = await db.getSubscription(userId);
  if (subscription && ['active', 'trialing'].includes(subscription.status)) {
    const subCapacity = PRICING_TIERS[subscription.capacityTier]?.capacity || 0;
    if (requestedCapacity <= subCapacity) {
      return {
        allowed: true,
        reason: `Active subscription (up to ${subCapacity} participants)`,
        currentTier: subscription.capacityTier,
      };
    } else {
      return {
        allowed: false,
        reason: `Your subscription allows up to ${subCapacity} participants`,
        currentTier: subscription.capacityTier,
        suggestion: `Upgrade to a higher tier to support ${requestedCapacity} participants`,
      };
    }
  }

  // Check available credits (now an array of tiers)
  const creditsList = await db.getCredits(userId);
  if (creditsList.length > 0) {
    // Find the best matching tier that can handle the requested capacity
    const matching = creditsList
      .filter(c => (PRICING_TIERS[c.capacityTier]?.capacity || 50) >= requestedCapacity)
      .sort((a, b) => (PRICING_TIERS[a.capacityTier]?.capacity || 50) - (PRICING_TIERS[b.capacityTier]?.capacity || 50));

    if (matching.length > 0) {
      const best = matching[0];
      const tierCapacity = PRICING_TIERS[best.capacityTier]?.capacity || 50;
      return {
        allowed: true,
        reason: `Event credit available (up to ${tierCapacity} participants)`,
        currentTier: best.capacityTier,
      };
    } else {
      // Has credits but none large enough
      const largest = creditsList.sort((a, b) =>
        (PRICING_TIERS[b.capacityTier]?.capacity || 50) - (PRICING_TIERS[a.capacityTier]?.capacity || 50)
      )[0];
      const tierCapacity = PRICING_TIERS[largest.capacityTier]?.capacity || 50;
      return {
        allowed: false,
        reason: `Your largest event credit allows up to ${tierCapacity} participants`,
        currentTier: largest.capacityTier,
        suggestion: `Purchase a higher tier credit for ${requestedCapacity} participants`,
      };
    }
  }

  // No subscription and no credits
  return {
    allowed: false,
    reason: 'No active subscription or event credits',
    currentTier: 'free',
    suggestion: 'Purchase a single event credit or subscribe to Premium',
  };
}

// ============================================================
// Credit consumption (called when first participant registers)
// ============================================================

export async function consumeEventCredit(userId: string, sessionId: string, capacityTier?: string, sessionName?: string): Promise<boolean> {
  const creditsList = await db.getCredits(userId);
  if (creditsList.length === 0) return false;

  // If a specific tier is given, use it; otherwise use the smallest tier with credits
  let tierToConsume: string;
  if (capacityTier && creditsList.some(c => c.capacityTier === capacityTier)) {
    tierToConsume = capacityTier;
  } else {
    // Sort by capacity ascending and use the smallest available
    tierToConsume = creditsList.sort((a, b) =>
      (PRICING_TIERS[a.capacityTier]?.capacity || 50) - (PRICING_TIERS[b.capacityTier]?.capacity || 50)
    )[0].capacityTier;
  }

  const tierCapacity = PRICING_TIERS[tierToConsume]?.capacity || tierToConsume;
  const tierLabel = `Up to ${tierCapacity} participants`;
  const description = sessionName
    ? `Credit used for "${sessionName}" (${tierLabel})`
    : `Credit used for event (${tierLabel})`;

  await db.deductCredit(userId, 1, {
    type: 'consumed',
    capacityTier: tierToConsume,
    sessionId,
    description,
  });

  return true;
}

// Refund credit if session deleted with zero registrations
export async function refundEventCredit(userId: string, sessionId: string): Promise<boolean> {
  // Check if there was a credit consumed for this session
  const transactions = await db.getCreditTransactions(userId);
  const consumed = transactions.find(
    (t: any) => t.type === 'consumed' && t.sessionId === sessionId
  );

  if (!consumed) return false;

  // Check if any registrations exist
  // (caller should verify this before calling)
  await db.addCredits(userId, 1, {
    type: 'refund',
    sessionId,
    description: 'Credit refunded – session deleted with no registrations',
  });

  return true;
}
