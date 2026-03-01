// Pricing configuration for Wonderelo frontend
// All prices in USD cents

export type CapacityTier = 'free' | '50' | '200' | '500' | '1000' | '5000';

export interface PricingTier {
  capacity: number;
  tier: CapacityTier;
  singleEventPrice: number; // in cents
  premiumMonthlyPrice: number; // in cents
  premiumAnnualPrice: number; // in cents (per year)
}

export const PRICING_TIERS: Record<CapacityTier, PricingTier> = {
  free: {
    capacity: 5,
    tier: 'free',
    singleEventPrice: 0,
    premiumMonthlyPrice: 0,
    premiumAnnualPrice: 0,
  },
  '50': {
    capacity: 50,
    tier: '50',
    singleEventPrice: 4900, // $49
    premiumMonthlyPrice: 9900, // $99/mo
    premiumAnnualPrice: 99000, // $990/yr ($82.50/mo, save $198)
  },
  '200': {
    capacity: 200,
    tier: '200',
    singleEventPrice: 9900, // $99
    premiumMonthlyPrice: 19900, // $199/mo
    premiumAnnualPrice: 199000, // $1990/yr ($165.83/mo, save $398)
  },
  '500': {
    capacity: 500,
    tier: '500',
    singleEventPrice: 19900, // $199
    premiumMonthlyPrice: 39900, // $399/mo
    premiumAnnualPrice: 399000, // $3990/yr ($332.50/mo, save $798)
  },
  '1000': {
    capacity: 1000,
    tier: '1000',
    singleEventPrice: 34900, // $349
    premiumMonthlyPrice: 69900, // $699/mo
    premiumAnnualPrice: 699000, // $6990/yr ($582.50/mo, save $1398)
  },
  '5000': {
    capacity: 5000,
    tier: '5000',
    singleEventPrice: 79900, // $799
    premiumMonthlyPrice: 149900, // $1499/mo
    premiumAnnualPrice: 1499000, // $14990/yr ($1249.17/mo, save $2998)
  },
};

export const CAPACITY_OPTIONS = [
  { value: 5, label: 'Up to 5 participants', tier: 'free' as CapacityTier },
  { value: 50, label: 'Up to 50 participants', tier: '50' as CapacityTier },
  { value: 200, label: 'Up to 200 participants', tier: '200' as CapacityTier },
  { value: 500, label: 'Up to 500 participants', tier: '500' as CapacityTier },
  { value: 1000, label: 'Up to 1000 participants', tier: '1000' as CapacityTier },
  { value: 5000, label: 'Up to 5000 participants', tier: '5000' as CapacityTier },
];

export function getTierForCapacity(capacity: number): CapacityTier {
  if (capacity <= 5) return 'free';
  if (capacity <= 50) return '50';
  if (capacity <= 200) return '200';
  if (capacity <= 500) return '500';
  if (capacity <= 1000) return '1000';
  return '5000';
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function getTierValue(tier: CapacityTier): number {
  return PRICING_TIERS[tier].capacity;
}
