import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, ArrowRight, Calendar, Sparkles, Users } from 'lucide-react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { PRICING_TIERS, formatPrice } from '../config/pricing';

export function PricingPage() {
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'single' | 'monthly'>('single');

  const tiers = [
    {
      name: 'Free',
      description: 'Try it out with a small group',
      capacity: 10,
      singlePrice: 0,
      monthlyPrice: 0,
      featured: false,
      features: [
        'Up to 10 participants',
        '1 networking round',
        'QR code sign-up',
        'Automatic matching',
        'Contact sharing',
      ],
    },
    {
      name: 'Starter',
      description: 'For meetups and small events',
      capacity: 50,
      singlePrice: PRICING_TIERS['50'].singleEventPrice,
      monthlyPrice: PRICING_TIERS['50'].premiumMonthlyPrice,
      featured: false,
      features: [
        'Up to 50 participants',
        'Unlimited rounds',
        'Custom meeting points',
        'Email notifications',
        'Session reports',
        'Priority support',
      ],
    },
    {
      name: 'Professional',
      description: 'For conferences and corporate events',
      capacity: 200,
      singlePrice: PRICING_TIERS['200'].singleEventPrice,
      monthlyPrice: PRICING_TIERS['200'].premiumMonthlyPrice,
      featured: true,
      features: [
        'Up to 200 participants',
        'Unlimited rounds',
        'Custom meeting points',
        'Email & SMS notifications',
        'Session reports',
        'Ice breakers & topics',
        'Group matching',
        'Stage matching',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      description: 'For large-scale events and organizations',
      capacity: 500,
      singlePrice: PRICING_TIERS['500'].singleEventPrice,
      monthlyPrice: PRICING_TIERS['500'].premiumMonthlyPrice,
      featured: false,
      features: [
        'Up to 500 participants',
        'Everything in Professional',
        'Custom branding',
        'Dedicated account manager',
        'API access',
        'SSO integration',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation onGetStarted={() => navigate('/signup')} onSignIn={() => navigate('/signin')} />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-4xl">Simple, transparent pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Start free with up to 10 participants. Pay per event or subscribe for unlimited access.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1 mb-12">
            <button
              onClick={() => setBillingInterval('single')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingInterval === 'single'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Single event
            </button>
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Monthly subscription
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.featured ? 'border-primary border-2 shadow-lg' : ''
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  {/* Price */}
                  <div className="mb-6">
                    {tier.singlePrice === 0 ? (
                      <div>
                        <span className="text-4xl font-bold">Free</span>
                        <p className="text-sm text-muted-foreground mt-1">No credit card required</p>
                      </div>
                    ) : billingInterval === 'single' ? (
                      <div>
                        <span className="text-4xl font-bold">{formatPrice(tier.singlePrice)}</span>
                        <span className="text-muted-foreground ml-1">/ event</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          One-time payment, no subscription
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold">{formatPrice(tier.monthlyPrice)}</span>
                        <span className="text-muted-foreground ml-1">/ month</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Unlimited events, cancel anytime
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Capacity highlight */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Up to {tier.capacity} participants</span>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full mb-6"
                    variant={tier.featured ? 'default' : 'outline'}
                    onClick={() => navigate('/signup')}
                  >
                    {tier.singlePrice === 0 ? 'Get started free' : 'Start free trial'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Larger plans */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4">Need more capacity?</h2>
          <p className="text-muted-foreground mb-8">
            We offer plans for up to 5,000 participants. Get in touch to discuss your needs and get a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" onClick={() => navigate('/signup')}>
              See all plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center mb-12">Frequently asked questions</h2>

          <div className="space-y-8">
            <div>
              <h3 className="mb-2">What counts as a participant?</h3>
              <p className="text-sm text-muted-foreground">
                A participant is anyone who registers for at least one networking round at your event. The capacity limit applies per event.
              </p>
            </div>

            <div>
              <h3 className="mb-2">Can I switch between single event and subscription?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Start with a single event purchase and upgrade to a monthly subscription anytime. Your existing events and data carry over.
              </p>
            </div>

            <div>
              <h3 className="mb-2">What happens when I reach the participant limit?</h3>
              <p className="text-sm text-muted-foreground">
                New registrations will be paused until you upgrade your plan. Existing participants won't be affected.
              </p>
            </div>

            <div>
              <h3 className="mb-2">Is the free plan really free?</h3>
              <p className="text-sm text-muted-foreground">
                Yes — no credit card required, no time limit. You get full access to all features with up to 10 participants per event. Perfect for testing Wonderelo with a small group.
              </p>
            </div>

            <div>
              <h3 className="mb-2">Can I cancel my subscription?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely. Cancel anytime from your account settings. You'll keep access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4">Ready to make networking happen?</h2>
          <p className="text-muted-foreground mb-8">
            Start for free — set up your first networking session in minutes.
          </p>
          <Button onClick={() => navigate('/signup')} size="lg" className="bg-primary text-primary-foreground">
            <Calendar className="mr-2 h-5 w-5" />
            Start for free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
