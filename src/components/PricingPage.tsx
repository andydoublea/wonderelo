import { useNavigate } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { PricingPanel } from './PricingPanel';
import { CtaSection } from './CtaSection';
import { useAccessToken } from '../stores';

export function PricingPage() {
  const navigate = useNavigate();
  const accessToken = useAccessToken();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation onGetStarted={() => navigate('/signup')} onSignIn={() => navigate('/signin')} />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-4xl">Simple, no worry pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free with up to 5 participants. Pay per event or subscribe for unlimited access.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6 flex-1">
        <div className="container mx-auto max-w-4xl">
          <PricingPanel accessToken={accessToken} />
        </div>
      </section>

      <CtaSection />

      <Footer />
    </div>
  );
}
