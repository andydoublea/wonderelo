import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import { Navigation } from './Navigation';
import { Cake, BookOpen, GitBranch, MapPin, Star, Music, GraduationCap, Users, Zap, Heart, Coffee, Mic, Monitor } from 'lucide-react';
import '../styles/wonderelo-public.css';
import '../styles/wonderelo-use-case.css';

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
  festivals: {
    slug: 'festivals',
    title: 'Wonderelo for Festivals & Parties',
    subtitle: 'Festival & Party Networking',
    heroHeadline: 'Turn your festival into an experience people never forget',
    heroDescription: 'Festivals and parties bring people together in one space – but most guests leave without meeting anyone new. Wonderelo adds a social layer that gets people talking, laughing, and connecting.',
    benefits: [
      { icon: Music, title: 'Energy booster', description: 'A networking round between sets or during a break adds a fun, unexpected activity that keeps the energy high.' },
      { icon: Heart, title: 'Mix the crowd', description: 'People come in groups and stay in groups. Wonderelo breaks the pattern and creates cross-group connections.' },
      { icon: MapPin, title: 'Use the whole venue', description: 'Set meeting points across your festival grounds – at the bar, by a food truck, or near the main stage.' },
      { icon: Star, title: 'Memorable moments', description: 'Random encounters create stories. Your guests will remember the person they met, not just the lineup.' },
    ],
    howItWorks: [
      'Display QR codes at the entrance, on wristbands, or on screens around the venue',
      'Guests register with a quick scan – no app needed',
      'Matching runs at times you choose throughout the event',
      'Matched pairs meet at fun locations around the festival grounds',
    ],
    cta: 'Add Wonderelo to your festival',
  },
  schools: {
    slug: 'schools',
    title: 'Wonderelo for Schools & Universities',
    subtitle: 'Education Networking',
    heroHeadline: 'Help students build connections that last beyond the classroom',
    heroDescription: 'Starting at a new school or university is exciting – and lonely. Wonderelo helps students meet each other in a structured, low-pressure way, so they feel at home faster and build a real community.',
    benefits: [
      { icon: GraduationCap, title: 'First-week icebreakers', description: 'Orientation weeks are the perfect time for networking rounds. Help freshmen meet each other before the semester even starts.' },
      { icon: Users, title: 'Cross-department connections', description: 'Students from different faculties rarely meet. Wonderelo pairs them randomly, sparking interdisciplinary friendships.' },
      { icon: BookOpen, title: 'Study group formation', description: 'Use matching rounds to help students find project partners or study buddies outside their usual circle.' },
      { icon: Zap, title: 'Easy for organizers', description: 'Student unions, professors, or event coordinators can set it up in minutes. No tech skills required.' },
    ],
    howItWorks: [
      'Share the QR code on slides, posters, or in the campus app',
      'Students register with their name – takes seconds',
      'Matching runs at your chosen time during an event or class',
      'Students meet at designated spots on campus for quick conversations',
    ],
    cta: 'Bring Wonderelo to your school',
  },
};

// Human-readable label for a use-case slug (used by the crumb + sibling switcher).
const useCaseLabels: Record<string, string> = {
  conferences: 'Conferences',
  meetups: 'Meetups',
  festivals: 'Festivals',
  weddings: 'Weddings',
  bars: 'Bars',
  schools: 'Schools',
  teams: 'Teams',
  barcamps: 'Barcamps',
  parties: 'Parties',
};

// Sibling switcher order (matches the mock's chip row). Only slugs present in
// `useCases` are rendered — derived from Object.keys below.
const siblingOrder = ['conferences', 'meetups', 'festivals', 'weddings', 'bars', 'schools', 'teams'];

// NEW content not in `useCases`: hero proof stats, logo strip, mini-scenarios and
// the testimonial. Phase 1 reuses the mock's (conferences) copy as a shared default
// across every slug — sensible per-variant tailoring can be layered in later.
const heroTag = (slug: string) => `Wonderelo for ${useCaseLabels[slug] || slug}`;

const proofStats = [
  { num: '240', accent: '+', label: 'Conferences & barcamps run on Wonderelo' },
  { num: '6', accent: 'min', label: 'From sign-up to your first round live' },
  { num: '81', accent: '%', label: 'Attendees say they made a useful contact' },
];

const logoBrands = [
  { text: 'Forum', accent: '26' },
  { text: 'TechFuture' },
  { text: 'DesignDays' },
  { text: 'Founder', accent: 'Summit' },
  { text: 'BarCamp BA' },
  { text: 'CodeWeek' },
];

const scenarios = [
  {
    num: 'A',
    label: 'Opening · before the keynote',
    title: <>A <em>15-minute</em> warmup before the first talk</>,
    body: 'Run a single, fast pair-round while attendees are still finding seats. By the keynote, the room already feels warm. Works at 100 or 2 000 people.',
    meta: ['1 round · 5 min · pairs', 'Recommended for 100–2 000'],
  },
  {
    num: 'B',
    label: 'Between talks · the coffee slot',
    title: <>Three <em>tight</em> rounds across two breaks</>,
    body: 'The classic. Two coffee breaks, three networking rounds, named meeting points. Most popular setup — also the easiest to staff.',
    meta: ['3 rounds · 4 min each', 'Pairs or trios'],
  },
  {
    num: 'C',
    label: 'Evening · the after-party',
    title: <>One <em>long</em> round with drinks &amp; matches</>,
    body: "Lower lighting, drink in hand, longer match windows (8–10 min). The conference's social wrap-up that people actually stay for.",
    meta: ['1 round · 10 min · trios', 'Add ice-breaker prompts'],
  },
];

const testimonial = {
  cap: 'Anna M. · TechFuture Conf · Vienna',
  quote: (
    <>
      It was the first event where we felt confident <strong>nobody was left out of networking</strong> — even the people who'd usually slip out after the last talk. Three speakers asked us afterwards if it would run again.
    </>
  ),
  name: 'Anna Müller',
  role: 'Programme lead · TechFuture Conference',
  stat: <><em>1 600 attendees</em> · 3 rounds · 18 meeting points</>,
};

// ── Inline icons (kept verbatim from the mock, width/height preserved) ──────────
const ArrowIco = (
  <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);
const PlayIco = (
  <svg className="w-ico" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);

// Benefit-card icons in mock order (featured card first). Reused for every slug so
// the featured card always leads with the "connections/people" glyph from the mock.
const benefitIcons = [
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
];

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

  const activeSlug = data.slug;
  const siblings = siblingOrder.filter((s) => useCases[s]);
  const label = useCaseLabels[activeSlug] || activeSlug;

  return (
    <div className="wonderelo w-public uc-page">
      <PublicNav onGetStarted={onGetStarted} onSignIn={onSignIn} />

      <main className="w-shell">

        {/* Crumb + sibling switcher */}
        <div className="uc-crumb">
          <a className="uc-crumb-link" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Who's it for</a>{' '}
          <span className="sep">/</span> <span>{data.title.replace('Wonderelo for ', '')}</span>
          <div className="case-row">
            {siblings.map((slug) => (
              <a
                key={slug}
                className={slug === activeSlug ? 'is-active' : undefined}
                href="#"
                onClick={(e) => { e.preventDefault(); navigate(`/for/${slug}`); }}
              >
                {useCaseLabels[slug] || slug}
              </a>
            ))}
          </div>
        </div>

        {/* Hero */}
        <section className="uc-hero">
          <span className="deco-1" />
          <span className="deco-2" />
          <span className="deco-3" />

          <div className="uc-hero-grid">
            <div>
              <span className="uc-tag"><span className="w-diamond" /> {heroTag(activeSlug)}</span>
              <h1 className="w-display">{data.heroHeadline}</h1>
              <p className="lede">{data.heroDescription}</p>
              <div className="actions">
                <a className="w-btn w-btn-primary w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>
                  {data.cta}
                  {ArrowIco}
                </a>
                <a className="w-btn w-btn-ghost w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); navigate('/demo'); }}>
                  {PlayIco}
                  See a 90-sec demo
                </a>
              </div>
              <div className="proof">
                {proofStats.map((s, i) => (
                  <div key={i}>
                    <div className="num">{s.num}<em>{s.accent}</em></div>
                    <div className="l">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue scene illustration — decorative, CSS-only */}
            <div className="uc-hero-scene">
              <div className="pattern" />
              <div className="stage">
                <span className="qr" />
              </div>
              <div className="meeting-pt mp-1"><span className="w-diamond" /> Coffee bar · A</div>
              <div className="meeting-pt mp-2"><span className="w-diamond" /> Foyer · B</div>
              <div className="meeting-pt mp-3"><span className="w-diamond" /> Atrium · C</div>
              <div className="meeting-pt mp-4"><span className="w-diamond" /> Stage left · D</div>
              <span className="person p1" />
              <span className="person is-purple p2" />
              <span className="line l1" />
              <span className="person is-purple p3" />
              <span className="person p4" />
              <span className="line l2" />
              <span className="person p5" />
              <span className="person is-purple p6" />
              <div className="scene-cap">
                <span>Round 02 · pairs · 5 min</span>
                <span><em>64</em> attendees matched</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Logo strip (full-bleed) */}
      <section className="uc-logos">
        <div className="uc-logos-inner">
          <div className="l-label">Trusted by organizers at</div>
          <div className="l-list">
            {logoBrands.map((b, i) => (
              <span key={i} className="lg">{b.text}{b.accent && <em>{b.accent}</em>}</span>
            ))}
          </div>
        </div>
      </section>

      <main className="w-shell">

        {/* Benefits */}
        <section className="uc-benefits">
          <div className="uc-benefits-head">
            <span className="w-eyebrow">Why {label.toLowerCase()} pick Wonderelo</span>
            <h2 className="w-h1">More than a coffee break with <span className="w-italic">name tags</span></h2>
            <p>You spent months on the talks. Don't leave the most-valuable part of the day to chance.</p>
          </div>

          <div className="uc-grid">
            {data.benefits.map((benefit, i) => (
              <article key={i} className={`uc-card${i === 0 ? ' is-featured' : ''}`}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <div className="ico-wrap">
                  {benefitIcons[i] || benefitIcons[benefitIcons.length - 1]}
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="uc-how">
          <div className="deco-italic">setup</div>
          <div className="uc-how-head">
            <span className="w-eyebrow">Setup, end to end</span>
            <h2 className="w-h1">Four steps. Six <span className="w-italic">minutes</span></h2>
          </div>
          <div className="uc-steps">
            {data.howItWorks.map((step, i) => (
              <div key={i} className="uc-step">
                <div className="num-circle">{String(i + 1).padStart(2, '0')}</div>
                <h4>{step}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section className="uc-scenarios">
          <div className="uc-scenarios-head">
            <div>
              <span className="w-eyebrow">Real conference setups</span>
              <h2 className="w-h1">Three <span className="w-italic">ways</span> to slot it in</h2>
            </div>
            <a className="w-btn w-btn-ghost w-btn-sm" href="#" onClick={(e) => e.preventDefault()}>See all case studies →</a>
          </div>
          <div className="uc-scenarios-grid">
            {scenarios.map((s, i) => (
              <article key={i} className="uc-scenario">
                <div className="head"><div className="num">{s.num}</div><div className="l">{s.label}</div></div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
                <div className="meta">
                  {s.meta.map((m, j) => <span key={j}>{m}</span>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="uc-quote">
          <span className="deco-italic">"</span>
          <span className="deco-d" />
          <div className="pic">
            <div className="cap">{testimonial.cap}</div>
          </div>
          <div>
            <blockquote>
              {testimonial.quote}
            </blockquote>
            <div className="author">
              <div>
                <div className="name">{testimonial.name}</div>
                <div className="role">{testimonial.role}</div>
              </div>
              <span className="stat">{testimonial.stat}</span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="uc-cta">
          <span className="deco-1" />
          <span className="deco-2" />
          <span className="deco-italic">go</span>
          <h2>Add networking to your <span className="w-italic">{label.toLowerCase()}</span> — in the next six minutes</h2>
          <p>Free for events up to 5 participants — perfect for testing before you commit. No card, no sales call, no integration.</p>
          <div className="actions">
            <a className="w-btn w-btn-ghost w-btn-lg" href="#" onClick={(e) => e.preventDefault()}>Talk to us first</a>
            <a className="w-btn w-btn-primary w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>
              Start for free
              <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
          </div>
          <div className="small"><em>3 200+</em> organizers · No credit card · Cancel anytime</div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
