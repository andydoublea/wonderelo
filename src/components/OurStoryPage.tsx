import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Navigation } from './Navigation';
import { ArrowRight, Calendar } from 'lucide-react';

interface OurStoryPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function OurStoryPage({ onGetStarted, onSignIn }: OurStoryPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation onGetStarted={onGetStarted || (() => navigate('/signup'))} onSignIn={onSignIn || (() => navigate('/signin'))} />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Our Story</h1>

          {/* The story */}
          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <p className="text-xl text-muted-foreground leading-relaxed">
              It started at a 30th birthday party in Bratislava. Seventy-five guests, three friend groups that didn't know each other, and a host who wanted everyone to leave as friends.
            </p>

            <h2 className="text-2xl font-bold mt-12">The Birthday Experiment</h2>
            <p>
              Andy had a problem. His birthday was coming up, and the guest list included people from very different parts of his life: university friends, colleagues from his printing studio, and a bunch of international contacts from years of traveling. He knew from experience that these groups would cluster at their own tables, make polite small talk with strangers at the bar, and leave without ever really meeting anyone new.
            </p>
            <p>
              So he had an idea. What if a TV screen above the bar displayed random pairings every few minutes — two names at a time — and each pair had to meet at the bar for a shot of borovička? No choice, no escape, just pure randomness.
            </p>
            <p>
              His friend Martin Miko, a developer, programmed a quick prototype in a few days. The guest list went in, and the TV started cycling through random pairs.
            </p>

            <h2 className="text-2xl font-bold mt-12">What Happened Next</h2>
            <p>
              For about ninety minutes, the party transformed. People who would never have approached each other were suddenly standing at the bar together, laughing, sharing stories, discovering unexpected connections. The university mathematician found out that the graphic designer from the studio shared his obsession with board games. Two people who lived in the same building for three years but never spoken realized they had a mutual friend in another country.
            </p>
            <p>
              The energy in the room was electric. Guests kept checking the screen, waiting for their name to appear, excited about who they'd be paired with next. It wasn't networking — it was fun. And it worked better than any icebreaker game Andy had ever seen.
            </p>

            <h2 className="text-2xl font-bold mt-12">Eight Years Later</h2>
            <p>
              The party ended, life went on. Andy built a successful printing and branding studio. Martin continued building software. But the memory of that evening stuck with Andy. Every time he attended a conference, a meetup, or a corporate event and watched people awkwardly hover near the coffee station, he thought: why doesn't everyone do this?
            </p>
            <p>
              Then, in 2024, the pieces fell into place. Andy sold the printing studio and had the space to think about what to build next. The world had changed — phones were in every pocket, QR codes were second nature, and people were hungrier than ever for real, face-to-face connection.
            </p>
            <p>
              The birthday party hack was ready to become a real product.
            </p>

            <h2 className="text-2xl font-bold mt-12">Wonderelo Today</h2>
            <p>
              What started as a TV above a bar with random names is now a platform that any event organizer can use in minutes. No apps to download, no profiles to fill out, no AI trying to guess who you should meet. Just beautiful randomness — the same serendipity that made seventy-five guests fall in love with each other at a birthday party in Bratislava.
            </p>
            <p>
              We believe the best connections come from surprise. That the person you need to meet is often the one you'd never choose. And that all it takes to make it happen is a little structure and a lot of trust in randomness.
            </p>

            <p className="text-muted-foreground italic mt-12">
              — Andy Apel, Founder & CEO
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Try it yourself</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your first networking round in under a minute. Free for up to 10 participants.
          </p>
          <Button onClick={onGetStarted || (() => navigate('/signup'))} size="lg">
            <Calendar className="mr-2 h-5 w-5" />
            Start for free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Wonderelo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
