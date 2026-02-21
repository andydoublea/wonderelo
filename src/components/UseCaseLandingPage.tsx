import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Navigation } from './Navigation';
import { ArrowRight, Calendar, CheckCircle, Users, Zap, Heart, Coffee, Mic, Monitor, Cake, BookOpen, GitBranch, MapPin, Star } from 'lucide-react';

interface UseCaseData {
  slug: string;
  title: string;
  subtitle: string;
  heroHeadline: string;
  heroDescription: string;
  benefits: Array<{ icon: any; title: string; description: string }>;
  howItWorks: string[];
  cta: string;
}

const useCases: Record<string, UseCaseData> = {
  conferences: {
    slug: 'conferences',
    title: 'Wonderelo for Conferences',
    subtitle: 'Conference Networking',
    heroHeadline: 'Give your attendees what they actually came for – connections',
    heroDescription: 'Most conference-goers say networking is their #1 reason for attending, yet most of them leave without a single meaningful new contact. Wonderelo changes that with structured 1-on-1 or small-group matching during breaks.',
    benefits: [
      { icon: Users, title: 'Break the bubble', description: 'Attendees meet people outside their usual circle – across industries, departments, and experience levels.' },
      { icon: Zap, title: 'Zero friction', description: 'No profiles to fill, no apps to download. Scan a QR code, get matched, meet at a meeting point – done.' },
      { icon: MapPin, title: 'Uses your venue', description: 'Place meeting point signs around your venue. Participants find each other at designated spots – tables, stands, or rollups.' },
      { icon: Star, title: 'Memorable experience', description: 'Attendees remember the conversations, not the slides. Structured networking makes your event stand out.' },
    ],
    howItWorks: [
      'Display the QR code on a slide, screen, or rollup banner',
      'Attendees scan and register in seconds – name and email only',
      'At round start, each participant gets a match + meeting point',
      'They meet, talk, and optionally exchange contacts after',
    ],
    cta: 'Add networking to your conference',
  },
  meetups: {
    slug: 'meetups',
    title: 'Wonderelo for Meetups',
    subtitle: 'Meetup Networking',
    heroHeadline: 'Turn "I should network" into "I just met 5 amazing people"',
    heroDescription: 'Meetups are all about community. But standing in a room full of strangers is awkward. Wonderelo gives every attendee a reason to approach someone new, breaking the ice before the conversation even starts.',
    benefits: [
      { icon: Heart, title: 'Inclusive by design', description: 'Introverts and first-timers get paired just like regulars. Everyone meets someone new.' },
      { icon: Coffee, title: 'Perfect for any format', description: 'Before the talk, during the break, or as the main event – networking rounds slot into any schedule.' },
      { icon: Users, title: 'Build real community', description: 'When people meet face-to-face in small groups, they come back next time. Retention goes up.' },
      { icon: Zap, title: 'Takes 30 seconds to set up', description: 'Create a round, set the time, share the QR code. That\'s it. No paid add-ons required.' },
    ],
    howItWorks: [
      'Share your event page link or QR code with attendees',
      'Participants register before or at the venue',
      'Matching runs automatically at the time you set',
      'Each person gets a partner and a meeting point – conversation happens naturally',
    ],
    cta: 'Launch your first networking round',
  },
  weddings: {
    slug: 'weddings',
    title: 'Wonderelo for Weddings',
    subtitle: 'Wedding Networking',
    heroHeadline: 'Help your guests make friends, not just small talk',
    heroDescription: 'At every wedding, there are groups who know each other and everyone else. Wonderelo mixes the crowd so your uncle from Berlin meets your college roommate from London – and they actually have a great time.',
    benefits: [
      { icon: Cake, title: 'Unique entertainment', description: 'Forget the bouquet toss. Give your guests a genuinely fun, memorable activity that gets everyone involved.' },
      { icon: Heart, title: 'Connect your worlds', description: 'Friends from school, colleagues from work, family from abroad – finally, they all meet each other.' },
      { icon: Users, title: 'No awkward wallflowers', description: 'Everyone gets matched. No one sits alone wondering when they can leave.' },
      { icon: Star, title: 'Talking point for years', description: 'Guests will tell the story of the wedding where they were randomly matched and met someone amazing.' },
    ],
    howItWorks: [
      'Put a QR code on the table cards or display it on a screen',
      'Guests scan and register – takes less than a minute',
      'Set the round to go off between dinner courses or during the party',
      'Guests meet at the bar, the dance floor, or any designated spot',
    ],
    cta: 'Add Wonderelo to your wedding',
  },
  bars: {
    slug: 'bars',
    title: 'Wonderelo for Bars & Cafes',
    subtitle: 'Venue Networking',
    heroHeadline: 'Turn your venue into the place where people actually meet',
    heroDescription: 'People go to bars and cafes hoping to meet someone interesting. But starting a conversation with a stranger is hard. Wonderelo gives them a reason – and a structured, comfortable way to do it.',
    benefits: [
      { icon: Coffee, title: 'Regular events = loyal customers', description: 'Run weekly or monthly networking nights. Guests come back because they know they\'ll meet someone new.' },
      { icon: MapPin, title: 'Works with your space', description: 'Use your existing tables, booths, or bar stools as meeting points. No special equipment needed.' },
      { icon: Users, title: 'Fill quiet nights', description: 'Turn a slow Tuesday into "Networking Tuesday" and watch your bar fill up with regulars and newcomers.' },
      { icon: Heart, title: 'Create connections', description: 'When your bar becomes the place where people make genuine connections, they remember it – and return.' },
    ],
    howItWorks: [
      'Put a QR code on a table stand or chalkboard',
      'Guests scan and register when they arrive',
      'Set rounds at regular intervals throughout the evening',
      'Matched pairs meet at a table, booth, or spot at the bar',
    ],
    cta: 'Start networking nights at your venue',
  },
  teams: {
    slug: 'teams',
    title: 'Wonderelo for Company Teams',
    subtitle: 'Team Networking',
    heroHeadline: 'Help your team know each other beyond Slack profiles',
    heroDescription: 'In growing companies, people work in silos. Wonderelo creates cross-team connections through quick, structured coffee chats – whether in the office or fully remote with video calls.',
    benefits: [
      { icon: GitBranch, title: 'Cross-team connections', description: 'Break silos by matching people from different departments. Innovation happens at the intersections.' },
      { icon: Monitor, title: 'Works remote & hybrid', description: 'Use virtual meeting points with video call links. Remote team members participate seamlessly.' },
      { icon: Users, title: 'Onboard new hires faster', description: 'New team members get matched with colleagues across the company. They build their network from day one.' },
      { icon: Zap, title: 'No coordination overhead', description: 'Set it up once, run it weekly. Matching is automatic. No manual spreadsheets or calendar juggling.' },
    ],
    howItWorks: [
      'Share the event page link in Slack or email',
      'Team members register with one click',
      'At the scheduled time, everyone gets a match',
      'They meet at a coffee corner, meeting room, or video call link',
    ],
    cta: 'Connect your team with Wonderelo',
  },
  barcamps: {
    slug: 'barcamps',
    title: 'Wonderelo for Barcamps',
    subtitle: 'Barcamp Networking',
    heroHeadline: 'Your unconference already breaks the format – now break the social barriers too',
    heroDescription: 'Barcamps attract curious, open-minded people. But even at unconferences, attendees tend to stick with people they already know. Wonderelo ensures everyone meets someone unexpected.',
    benefits: [
      { icon: Mic, title: 'Session break networking', description: 'Use the gaps between sessions for quick 1-on-1 meetings. Attendees discover people with shared interests.' },
      { icon: Users, title: 'Cross-pollinate ideas', description: 'Random matching leads to unexpected conversations that spark new collaborations and session ideas.' },
      { icon: Zap, title: 'Fits the barcamp spirit', description: 'No hierarchy, no gatekeeping, no profiles. Just two people meeting at a spot and talking.' },
      { icon: Star, title: 'Enhance participation', description: 'People who connect in networking rounds are more likely to propose their own sessions and stay engaged.' },
    ],
    howItWorks: [
      'Display the QR code on the session board or a nearby screen',
      'Participants register between sessions',
      'Matching runs automatically at your chosen time',
      'Quick, energizing conversations happen at your designated spots',
    ],
    cta: 'Add Wonderelo to your barcamp',
  },
  parties: {
    slug: 'parties',
    title: 'Wonderelo for Parties',
    subtitle: 'Party Networking',
    heroHeadline: 'Make your party the one everyone talks about',
    heroDescription: 'Every great party needs a moment that gets everyone buzzing. Wonderelo creates that moment – random matching that forces people out of their comfort zone and into surprising conversations.',
    benefits: [
      { icon: Cake, title: 'The ultimate icebreaker', description: 'No more standing in the kitchen with the three people you already know. Everyone gets matched, everyone meets someone new.' },
      { icon: Heart, title: 'Stories worth telling', description: 'The best party memories come from unexpected encounters. Wonderelo manufactures serendipity.' },
      { icon: Coffee, title: 'Works with drinks', description: 'Match people at the bar, near the snack table, or by the DJ booth. Location becomes part of the fun.' },
      { icon: Star, title: 'Bring different groups together', description: 'Birthday parties, housewarming, farewell – when different friend groups meet, magic happens.' },
    ],
    howItWorks: [
      'Print a QR code or share it on the party invite',
      'Guests register when they arrive',
      'Hit the button when the time is right – matching takes seconds',
      'Guests find their match at a fun location in your space',
    ],
    cta: 'Make your next party unforgettable',
  },
};

interface UseCaseLandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

export function UseCaseLandingPage({ onGetStarted, onSignIn }: UseCaseLandingPageProps) {
  const { useCase } = useParams<{ useCase: string }>();
  const navigate = useNavigate();

  const data = useCase ? useCases[useCase] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onGetStarted={onGetStarted} onSignIn={onSignIn} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Page not found</h1>
          <p className="text-muted-foreground mb-8">This use case doesn't exist yet.</p>
          <Button onClick={() => navigate('/')}>Back to homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation onGetStarted={onGetStarted} onSignIn={onSignIn} />

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-primary font-medium mb-4 text-sm tracking-wider uppercase">
            {data.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {data.heroHeadline}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            {data.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="lg" className="bg-primary text-primary-foreground">
              <Calendar className="mr-2 h-5 w-5" />
              {data.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Wonderelo works for {data.slug === 'teams' ? 'teams' : data.slug}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="space-y-6">
            {data.howItWorks.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-lg pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to try it?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your first networking round in under a minute. No credit card needed. Free for up to 10 participants.
          </p>
          <Button onClick={onGetStarted} size="lg" className="bg-primary text-primary-foreground">
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
