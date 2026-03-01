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

// Pricing tiers (must match frontend pricing.tsx)
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
      const { capacity, interval } = body;

      const tierKey = getTierKey(capacity);
      const tier = PRICING_TIERS[tierKey];
      if (!tier) return c.json({ error: 'Invalid capacity' }, 400);

      const stripe = getStripe();
      const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';

      // Get or create Stripe customer (skip admin_granted fake customer IDs)
      const profile = await db.getOrganizerById(auth.user.id);
      const existingSub = await db.getSubscription(auth.user.id);
      let customerId = existingSub?.stripeCustomerId;

      if (!customerId || customerId === 'admin_granted') {
        const customer = await stripe.customers.create({
          email: profile?.email || auth.user.email,
          metadata: {
            userId: auth.user.id,
            organizerName: profile?.organizerName || '',
          },
        });
        customerId = customer.id;
      }

      // Create Checkout Session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'usd',
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
        },
      });

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
      const { capacity } = body;

      const tierKey = getTierKey(capacity);
      const tier = PRICING_TIERS[tierKey];
      if (!tier) return c.json({ error: 'Invalid capacity' }, 400);

      const stripe = getStripe();
      const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';

      // Get or create Stripe customer (skip admin_granted fake customer IDs)
      const profile = await db.getOrganizerById(auth.user.id);
      const existingSubForPayment = await db.getSubscription(auth.user.id);
      let customerId = existingSubForPayment?.stripeCustomerId;

      if (!customerId || customerId === 'admin_granted') {
        const customer = await stripe.customers.create({
          email: profile?.email || auth.user.email,
          metadata: {
            userId: auth.user.id,
            organizerName: profile?.organizerName || '',
          },
        });
        customerId = customer.id;
      }

      // Create Checkout Session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Wonderelo Single Event – Up to ${tier.capacity} participants`,
              description: 'One networking event credit',
            },
            unit_amount: tier.singlePrice,
          },
          quantity: 1,
        }],
        success_url: `${appUrl}/billing?payment=success`,
        cancel_url: `${appUrl}/billing?payment=cancelled`,
        metadata: {
          userId: auth.user.id,
          capacityTier: tierKey,
          paymentType: 'single_event',
        },
      });

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
            // Add event credit to user
            await db.addCredits(userId, 1, {
              type: 'purchase',
              capacityTier,
              stripeSessionId: session.id,
              stripeCustomerId: session.customer as string,
            });
            debugLog('✅ Event credit added for user:', userId);
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

      const subscription = await db.getSubscription(auth.user.id);

      // Admin-granted subscriptions have no invoices
      if (!subscription?.stripeCustomerId || subscription.stripeCustomerId === 'admin_granted') {
        return c.json({ invoices: [] });
      }

      const stripe = getStripe();

      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 50,
      });

      // Also fetch one-time payment charges (checkout sessions in payment mode)
      const charges = await stripe.charges.list({
        customer: subscription.stripeCustomerId,
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

  // Check available credits
  const credits = await db.getCredits(userId);
  if (credits.balance > 0) {
    // Find which tier the credits are for
    const tierKey = credits.capacityTier || '50';
    const tierCapacity = PRICING_TIERS[tierKey]?.capacity || 50;
    if (requestedCapacity <= tierCapacity) {
      return {
        allowed: true,
        reason: `Event credit available (up to ${tierCapacity} participants)`,
        currentTier: tierKey,
      };
    } else {
      return {
        allowed: false,
        reason: `Your event credit allows up to ${tierCapacity} participants`,
        currentTier: tierKey,
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

export async function consumeEventCredit(userId: string, sessionId: string): Promise<boolean> {
  const credits = await db.getCredits(userId);
  if (credits.balance <= 0) return false;

  await db.deductCredit(userId, 1, {
    type: 'consumed',
    sessionId,
    description: 'Event credit used for first participant registration',
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
