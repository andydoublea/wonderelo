import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiBaseUrl } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';
import { PRICING_TIERS, formatPrice, type CapacityTier } from '../config/pricing';
import { PricingPanel } from './PricingPanel';
import { C, PageShell, PageHead, Italic } from './redesign/organizerAtoms';

export interface Subscription {
  plan: string;
  capacityTier: CapacityTier;
  status: string;
  currentPeriodEnd: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Invoice {
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

export interface CreditTransaction {
  id: number;
  amount: number;
  type: string;       // 'purchase', 'consumed', 'refund'
  capacityTier: string;
  description: string | null;
  createdAt: string;
}

export interface BillingDetails {
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

export interface BillingSettingsViewProps {
  loading: boolean;
  subscription: Subscription | null;
  credits: { balance: number; capacityTier: string }[];
  creditTransactions: CreditTransaction[];
  invoices: Invoice[];
  invoicesLoading: boolean;
  billingDetails: BillingDetails | null;
  billingDetailsLoading: boolean;
  invoicesTab: 'invoices' | 'credits';
  actionLoading: boolean;
  portalLoading: boolean;
  showCancelDialog: boolean;
  invoiceEmail: string;
  invoiceEmailEditing: boolean;
  invoiceEmailSaving: boolean;
  accessToken: string;
  onInvoicesTabChange: (tab: 'invoices' | 'credits') => void;
  onShowCancelDialog: (open: boolean) => void;
  onCancelSubscription: () => void;
  onOpenBillingPortal: () => void;
  onInvoiceEmailChange: (email: string) => void;
  onInvoiceEmailEditingChange: (editing: boolean) => void;
  onSaveInvoiceEmail: () => void;
}

type BadgeTone = 'green' | 'dark' | 'amber';

function subStatusBadge(status: string): { label: string; tone: BadgeTone } {
  const map: Record<string, { label: string; tone: BadgeTone }> = {
    active: { label: 'Active', tone: 'dark' },
    cancelling: { label: 'Cancelling', tone: 'amber' },
    cancelled: { label: 'Cancelled', tone: 'amber' },
    past_due: { label: 'Past Due', tone: 'amber' },
  };
  return map[status] || { label: status, tone: 'green' };
}

export function BillingSettingsView({
  loading,
  subscription,
  credits,
  creditTransactions,
  invoices,
  invoicesLoading,
  billingDetails,
  billingDetailsLoading,
  invoicesTab,
  actionLoading,
  portalLoading,
  showCancelDialog,
  invoiceEmail,
  invoiceEmailEditing,
  invoiceEmailSaving,
  accessToken,
  onInvoicesTabChange,
  onShowCancelDialog,
  onCancelSubscription,
  onOpenBillingPortal,
  onInvoiceEmailChange,
  onInvoiceEmailEditingChange,
  onSaveInvoiceEmail,
}: BillingSettingsViewProps) {
  // ── shared atoms (ported 1:1 from design/v06 screen-account-billing.jsx) ──
  const Card = ({ children, accent }: { children?: React.ReactNode; accent?: string }) => (
    <section style={{ background: '#fff', border: `1px solid ${accent || C.hair}`, borderRadius: 18, marginBottom: 20, overflow: 'hidden' }}>{children}</section>
  );
  const CardHead = ({ children, sub, right }: { children?: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) => (
    <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 18, color: C.purpleDeep, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 9 }}>{children}</h3>
        {sub && <p style={{ margin: '5px 0 0', fontSize: 13, color: C.ink, opacity: .65 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
  const Body = ({ children, style = {} }: { children?: React.ReactNode; style?: React.CSSProperties }) => <div style={{ padding: 24, ...style }}>{children}</div>;
  const Badge = ({ children, tone = 'green' }: { children?: React.ReactNode; tone?: BadgeTone }) => {
    const tones: Record<BadgeTone, { bg: string; fg: string }> = {
      green: { bg: 'rgba(34,197,94,.12)', fg: '#1f7a40' },
      dark:  { bg: C.purpleDeep, fg: '#fff' },
      amber: { bg: 'rgba(221,83,28,.12)', fg: C.orange },
    };
    const t = tones[tone] || tones.green;
    return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.03em', background: t.bg, color: t.fg }}>{children}</span>;
  };
  const OutBtn = ({ children, primary, full, onClick, disabled }: { children?: React.ReactNode; primary?: boolean; full?: boolean; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
      padding: '10px 16px', borderRadius: 11, width: full ? '100%' : undefined,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: primary ? C.orange : 'transparent',
      color: primary ? '#fff' : C.purpleDeep,
      border: primary ? '1px solid transparent' : `1.5px solid ${C.hairStrong}`,
      boxShadow: primary ? '0 6px 16px rgba(221,83,28,.22)' : 'none',
      opacity: disabled ? .6 : 1,
    }}>{children}</button>
  );
  const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const Sk = ({ w, h = 16 }: { w: number | string; h?: number }) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(76,25,77,.08)' }} />
  );

  const card = '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>';
  const coin = "<circle cx='12' cy='12' r='8'/><path d='M9.5 9.5h5M9.5 14.5h5'/>";
  const calIco = "<rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/>";
  const dlIco = "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>";
  const extIco = "<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/>";
  const gearIco = "<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>";
  const pencilIco = "<path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'/>";
  const warnIco = "<path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>";

  const totalCredits = credits.reduce((s, c) => s + c.balance, 0);
  const hasSub = !!subscription;
  const isCancelled = !!subscription && (subscription.cancelAtPeriodEnd || subscription.status === 'cancelled');

  return (
    <div className="wonderelo" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageShell nav={false} footer={false}>
        <PageHead
          eyebrow="Plan & payments"
          title={<>Billing & <Italic>subscription</Italic></>}
        />

        {loading ? (
          <>
            <Card>
              <Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Sk w={140} h={20} />
                  <Sk w={220} />
                  <Sk w={180} />
                </div>
              </Body>
            </Card>
            <Card>
              <Body><Sk w="100%" h={128} /></Body>
            </Card>
          </>
        ) : (
          <>
            {/* 1 · Your plan — only when there's a subscription or credits */}
            {(subscription || credits.length > 0) && (
              <Card accent={isCancelled ? 'rgba(221,83,28,.30)' : undefined}>
                <CardHead>Your plan</CardHead>
                <Body>
                  <div style={{ display: 'grid', gridTemplateColumns: (hasSub && credits.length > 0) ? '1fr 1fr' : '1fr', gap: 18 }}>
                    {subscription && (
                      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, border: `1.5px solid ${C.hairStrong}`, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Subscription</span>
                          {subscription.cancelAtPeriodEnd ? (
                            <Badge tone="amber">Cancelled</Badge>
                          ) : (
                            <Badge tone={subStatusBadge(subscription.status).tone}>{subStatusBadge(subscription.status).label}</Badge>
                          )}
                        </div>
                        <div style={{ marginTop: 12, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, color: C.purpleDeep, letterSpacing: '-0.02em' }}>Unlimited events</div>
                        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: C.ink, opacity: .75 }}>
                          Up to {PRICING_TIERS[subscription.capacityTier].capacity} participants · {formatPrice(PRICING_TIERS[subscription.capacityTier].premiumMonthlyPrice)}/month
                        </p>

                        {/* HIDDEN (kept): "Your subscription has been cancelled" banner —
                            not in the design; the next-billing row is always shown instead. */}
                        {false && isCancelled && (
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(221,83,28,.08)', border: '1px solid rgba(221,83,28,.25)' }}>
                            <span style={{ color: C.orange, display: 'inline-flex', marginTop: 1 }}><Ico d={warnIco} size={16} /></span>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.purpleDeep }}>Your subscription has been cancelled</p>
                              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: C.ink, opacity: .7, lineHeight: 1.5 }}>
                                You still have access until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. After that, you can subscribe again or purchase a single event to create events with more than 5 participants.
                              </p>
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, opacity: .7 }}>
                          <Ico d={calIco} size={15} /> Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>

                        {/* HIDDEN (kept): "Payment failed" past-due banner — not in the design. */}
                        {false && subscription.status === 'past_due' && (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.25)' }}>
                            <span style={{ color: '#c0392b', display: 'inline-flex', marginTop: 1 }}><Ico d={warnIco} size={16} /></span>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c0392b' }}>Payment failed</p>
                              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: C.ink, opacity: .7, lineHeight: 1.5 }}>Please update your payment method to continue your subscription.</p>
                            </div>
                          </div>
                        )}

                        <div style={{ flex: 1, minHeight: 16 }} />
                        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                          <div style={{ marginTop: 16 }}>
                            <OutBtn onClick={() => onShowCancelDialog(true)} disabled={actionLoading}>
                              {actionLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>) : 'Cancel subscription'}
                            </OutBtn>
                          </div>
                        )}
                      </div>
                    )}

                    {credits.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, border: `1.5px solid ${C.hairStrong}`, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.orange }}>Single-event credits</span>
                          <Badge tone="amber">{totalCredits} available</Badge>
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {credits.map((c) => {
                            const tier = PRICING_TIERS[c.capacityTier as CapacityTier];
                            return (
                              <div key={c.capacityTier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderRadius: 11, background: C.cream, border: `1px solid ${C.hair}` }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: C.purpleDeep, fontWeight: 600 }}>
                                  <span style={{ color: C.orange, display: 'inline-flex' }}><Ico d={coin} size={16} /></span>
                                  {tier ? <>Up to {tier.capacity} participants</> : 'Single-event credit'}
                                </span>
                                <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.02em' }}>{c.balance} {c.balance === 1 ? 'credit' : 'credits'}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ flex: 1, minHeight: 16 }} />
                        <p style={{ margin: '14px 0 0', fontSize: 12.5, color: C.ink, opacity: .6 }}>A credit is applied automatically when you publish an event of that size.</p>
                      </div>
                    )}
                  </div>
                </Body>
              </Card>
            )}

            {/* 2 · Change / Choose a plan — always rendered. Design shows the plan
                chooser even when subscribed, titled "Change plan". */}
            <PricingPanel accessToken={accessToken} hasSubscription={!!subscription} title={subscription ? 'Change plan' : 'Choose a plan'} />

            {/* 3 · Invoices / Credit history */}
            <Card>
              <div style={{ padding: '0 24px', borderBottom: `1px solid ${C.hair}`, display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => onInvoicesTabChange('invoices')} style={{ padding: '14px 14px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, color: invoicesTab === 'invoices' ? C.purpleDeep : C.ink, opacity: invoicesTab === 'invoices' ? 1 : .55, borderBottom: `2px solid ${invoicesTab === 'invoices' ? C.purpleDeep : 'transparent'}`, marginBottom: -1 }}>Invoices</button>
                {creditTransactions.length > 0 && (
                  <button type="button" onClick={() => onInvoicesTabChange('credits')} style={{ padding: '14px 14px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, color: invoicesTab === 'credits' ? C.purpleDeep : C.ink, opacity: invoicesTab === 'credits' ? 1 : .55, borderBottom: `2px solid ${invoicesTab === 'credits' ? C.purpleDeep : 'transparent'}`, marginBottom: -1 }}>Credit history</button>
                )}
              </div>
              <Body style={{ padding: 0 }}>
                {invoicesTab === 'invoices' ? (
                  invoicesLoading ? (
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Sk w="100%" h={40} />
                      <Sk w="100%" h={40} />
                    </div>
                  ) : invoices.length === 0 ? (
                    <p style={{ padding: '28px 24px', textAlign: 'center', fontSize: 13.5, color: C.ink, opacity: .6 }}>No invoices yet. Invoices will appear here after your first payment.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                            {(['Date', 'Description', 'Type', 'Amount', 'Status', ''] as const).map((h, i) => (
                              <th key={i} style={{ textAlign: i === 3 ? 'right' : i === 4 ? 'center' : i === 5 ? 'right' : 'left', padding: '14px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} style={{ borderBottom: `1px solid ${C.hair}` }}>
                              <td style={{ padding: '14px 16px', fontFamily: C.fontMono, fontSize: 12.5, color: C.ink, opacity: .8, whiteSpace: 'nowrap' }}>{invoice.date ? new Date(invoice.date).toLocaleDateString() : '—'}</td>
                              <td style={{ padding: '14px 16px', fontSize: 13.5, color: C.purpleDeep, fontWeight: 500 }}>{invoice.number || invoice.description}</td>
                              <td style={{ padding: '14px 16px', fontSize: 13, color: C.ink, opacity: .65 }}>{invoice.type === 'subscription' ? 'Subscription' : 'Single event'}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep, whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'eur' }).format(invoice.amount / 100)}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                {invoice.status === 'paid' ? <Badge>Paid</Badge> : <Badge tone="amber">{invoice.status}</Badge>}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                {invoice.pdfUrl && (
                                  <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, border: `1.5px solid ${C.hairStrong}`, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep, textDecoration: 'none' }}><Ico d={dlIco} size={13} /> PDF</a>
                                )}
                                {invoice.hostedUrl && !invoice.pdfUrl && (
                                  <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, border: `1.5px solid ${C.hairStrong}`, fontSize: 12.5, fontWeight: 600, color: C.purpleDeep, textDecoration: 'none' }}><Ico d={extIco} size={13} /> View</a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  creditTransactions.length === 0 ? (
                    <p style={{ padding: '28px 24px', textAlign: 'center', fontSize: 13.5, color: C.ink, opacity: .6 }}>No credit transactions yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                            {(['Date', 'Type', 'Details', 'Credits'] as const).map((h, i) => (
                              <th key={i} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '14px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.purple, opacity: .75 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {creditTransactions.map((tx) => {
                            const dot = tx.type === 'purchase' ? '#16a34a' : tx.type === 'consumed' ? C.orange : tx.type === 'refund' ? '#2563eb' : '#9ca3af';
                            const label = tx.type === 'purchase' ? 'Purchased' : tx.type === 'consumed' ? 'Used for event' : tx.type === 'refund' ? 'Refunded' : tx.type;
                            const tier = PRICING_TIERS[tx.capacityTier as CapacityTier];
                            const details = tx.description || (tier ? `Up to ${tier.capacity} participants` : '—');
                            return (
                              <tr key={tx.id} style={{ borderBottom: `1px solid ${C.hair}` }}>
                                <td style={{ padding: '14px 16px', fontFamily: C.fontMono, fontSize: 12.5, color: C.ink, opacity: .8, whiteSpace: 'nowrap' }}>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style={{ padding: '14px 16px', fontSize: 13.5, color: C.purpleDeep }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />{label}</span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: 13, color: C.ink, opacity: .65 }}>{details}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: tx.amount > 0 ? '#1f7a40' : C.orange }}>{tx.amount > 0 ? '+' : ''}{tx.amount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </Body>
            </Card>

            {/* 4 · Billing details */}
            <Card>
              <CardHead
                right={billingDetails ? (
                  <button type="button" onClick={onOpenBillingPortal} disabled={portalLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: `1.5px solid ${C.hairStrong}`, background: 'transparent', fontSize: 12.5, fontWeight: 600, color: C.purpleDeep, cursor: portalLoading ? 'default' : 'pointer', opacity: portalLoading ? .6 : 1, fontFamily: C.fontBody }}>
                    {portalLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening...</> : <><Ico d={extIco} size={13} /> Edit billing details</>}
                  </button>
                ) : undefined}
              >
                <span style={{ color: C.purpleDeep, display: 'inline-flex' }}><Ico d={gearIco} size={17} /></span>
                Billing details
              </CardHead>
              <Body>
                {billingDetailsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Sk w={200} />
                    <Sk w={280} />
                    <Sk w={160} />
                  </div>
                ) : billingDetails ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '20px 40px' }}>
                      {billingDetails.name && (
                        <BillingField label="Name" value={billingDetails.name} />
                      )}
                      {billingDetails.address && (billingDetails.address.line1 || billingDetails.address.city) && (
                        <BillingField
                          label="Address"
                          value={[
                            billingDetails.address.line1,
                            billingDetails.address.line2,
                            [billingDetails.address.city, billingDetails.address.postalCode].filter(Boolean).join(' '),
                            billingDetails.address.country,
                          ].filter(Boolean).join(', ')}
                        />
                      )}
                      {billingDetails.taxIds.length > 0 && (
                        <BillingField label="Tax ID" value={billingDetails.taxIds.map((t) => t.value).join(', ')} />
                      )}
                      <div>
                        <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink, opacity: .5 }}>Invoice email</p>
                        {invoiceEmailEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <input
                              type="email"
                              value={invoiceEmail}
                              onChange={(e) => onInvoiceEmailChange(e.target.value)}
                              placeholder="email@company.com"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveInvoiceEmail();
                                if (e.key === 'Escape') { onInvoiceEmailEditingChange(false); onInvoiceEmailChange(billingDetails.email || ''); }
                              }}
                              style={{ flex: 1, minWidth: 0, padding: '8px 11px', borderRadius: 9, border: `1.5px solid ${C.hairStrong}`, outline: 'none', fontFamily: C.fontBody, fontSize: 13.5, color: C.ink }}
                            />
                            <OutBtn primary onClick={onSaveInvoiceEmail} disabled={invoiceEmailSaving}>
                              {invoiceEmailSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                            </OutBtn>
                            <OutBtn onClick={() => { onInvoiceEmailEditingChange(false); onInvoiceEmailChange(billingDetails.email || ''); }}>Cancel</OutBtn>
                          </div>
                        ) : (
                          <p style={{ margin: '5px 0 0', fontSize: 14, color: C.purpleDeep, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {billingDetails.email || 'Not set'}
                            <button type="button" onClick={() => onInvoiceEmailEditingChange(true)} title="Edit invoice email" style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: C.ink, opacity: .5, display: 'inline-flex' }}><Ico d={pencilIco} size={13} /></button>
                          </p>
                        )}
                      </div>
                    </div>
                    {!billingDetails.name && !billingDetails.address?.line1 && billingDetails.taxIds.length === 0 && !billingDetails.email && (
                      <p style={{ margin: '16px 0 0', fontSize: 13.5, color: C.ink, opacity: .65 }}>No billing details set yet. Click "Edit billing details" to add your company name, address, and Tax ID.</p>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, fontSize: 13.5, color: C.ink, opacity: .65 }}>Billing details will be available after your first payment. You'll be able to add your company name, address, and Tax ID.</p>
                    {(subscription || credits.length > 0) && (
                      <OutBtn onClick={onOpenBillingPortal} disabled={portalLoading}>
                        {portalLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening...</> : <><Ico d={extIco} size={13} /> Add billing details</>}
                      </OutBtn>
                    )}
                  </div>
                )}
              </Body>
            </Card>

            {/* HIDDEN (kept): "Frequently asked questions" card — not in the design. */}
            {false && (
            <Card>
              <CardHead>Frequently asked questions</CardHead>
              <Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    ["What's included in the free tier?", "Events with up to 5 participants are completely free and include all features — unlimited rounds, all networking modes, and full event management. It's the same experience as paid tiers, just with a smaller group size."],
                    ['How does the subscription work?', "With a subscription, you get unlimited events at your chosen capacity. You can choose monthly or annual billing and cancel anytime — you'll keep access until the end of your billing period."],
                    ['How do I choose the right capacity?', 'The event capacity is set when you create your event and cannot be changed during a round. Choose based on the expected number of participants for your event — for most events, this number is known in advance.'],
                    ['Can I cancel my subscription?', "Yes, you can cancel anytime. You'll retain access until the end of your current billing period."],
                  ].map(([q, a]) => (
                    <div key={q}>
                      <h4 style={{ margin: 0, fontFamily: C.fontBody, fontWeight: 700, fontSize: 14.5, color: C.purpleDeep }}>{q}</h4>
                      <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.55, color: C.ink, opacity: .7 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </Body>
            </Card>
            )}
          </>
        )}
      </PageShell>

      {/* Cancel subscription confirmation dialog */}
      {showCancelDialog && (
        <div onClick={() => onShowCancelDialog(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,17,51,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 18, border: `1px solid ${C.hairStrong}`, boxShadow: '0 30px 70px rgba(75,29,81,.30)', padding: 28 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: C.purpleDeep }}>
              Cancel subscription?
            </h3>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: C.ink, opacity: .78 }}>
              You'll keep full access to <strong style={{ color: C.purpleDeep }}>Unlimited events</strong> until <strong style={{ color: C.purpleDeep }}>{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of your billing period'}</strong>. After that your account moves to the Free plan (events up to 5 participants). Any single-event credits you own stay available.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => onShowCancelDialog(false)} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: C.orange, color: '#fff', border: 'none', boxShadow: '0 6px 16px rgba(221,83,28,.22)' }}>Keep subscription</button>
              <button type="button" onClick={onCancelSubscription} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: '#c0392b', border: '1.5px solid rgba(192,57,43,.4)' }}>Cancel subscription</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Billing-details field cell — uppercase label + value (mock styling).
function BillingField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink, opacity: .5 }}>{label}</p>
      <p style={{ margin: '5px 0 0', fontSize: 14, color: C.purpleDeep, fontWeight: label === 'Address' ? 400 : 500 }}>{value}</p>
    </div>
  );
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

  return (
    <BillingSettingsView
      loading={loading}
      subscription={subscription}
      credits={credits}
      creditTransactions={creditTransactions}
      invoices={invoices}
      invoicesLoading={invoicesLoading}
      billingDetails={billingDetails}
      billingDetailsLoading={billingDetailsLoading}
      invoicesTab={invoicesTab}
      actionLoading={actionLoading}
      portalLoading={portalLoading}
      showCancelDialog={showCancelDialog}
      invoiceEmail={invoiceEmail}
      invoiceEmailEditing={invoiceEmailEditing}
      invoiceEmailSaving={invoiceEmailSaving}
      accessToken={accessToken}
      onInvoicesTabChange={setInvoicesTab}
      onShowCancelDialog={setShowCancelDialog}
      onCancelSubscription={handleCancelSubscription}
      onOpenBillingPortal={handleOpenBillingPortal}
      onInvoiceEmailChange={setInvoiceEmail}
      onInvoiceEmailEditingChange={setInvoiceEmailEditing}
      onSaveInvoiceEmail={handleSaveInvoiceEmail}
    />
  );
}
