import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowRight, Users, Calendar, Clock, QrCode, Heart, Shield, Star, Coffee, MessageCircle, UserCheck, Shuffle, MapPin, Palette, HandHeart, Target, Mic, GitBranch, Music, Cake, BookOpen, CheckCircle, Loader2, GraduationCap, ImageIcon } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from './ui/carousel';
import { Navigation } from './Navigation';
import { toast } from 'sonner@2.0.3';
import { debugLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

const eventTypes = [
  { icon: Mic, title: 'Conferences & barcamps', description: 'Ensure everyone leaves with new contacts — even introverts and solo attendees.', path: '/for/conferences' },
  { icon: HandHeart, title: 'Meetups', description: 'Mix people beyond their usual circles and create fresh conversations every time.', path: '/for/meetups' },
  { icon: Music, title: 'Festivals & Parties', description: 'Break the ice between groups, make solo guests feel included, and help everyone actually get to know each other.', path: '/for/festivals' },
  { icon: Heart, title: 'Weddings', description: 'Help your guests make friends across groups and create unforgettable shared moments.', path: '/for/weddings' },
  { icon: Coffee, title: 'Bars & cafés', description: 'Host speed datings, quiz nights, board game evenings or after-work mixers — and give your regulars a reason to come back.', path: '/for/bars' },
  { icon: GraduationCap, title: 'Schools & universities', description: 'Help students get to know each other, form project teams, or break the ice at the start of a new semester.', path: '/for/schools' },
  { icon: GitBranch, title: 'Company teams', description: 'Build deeper relationships across departments and help remote colleagues connect face-to-face.', path: '/for/teams' },
];

const testimonials = [
  { quote: "It was the first event where we felt confident nobody was left out of networking.", author: "Anna Müller", event: "TechFuture Conference" },
  { quote: "Our attendees used to stick to their own groups. Wonderelo changed that in one evening.", author: "David Novak", event: "CreativeMinds Meetup" },
  { quote: "At our company offsite, the sales and manufacturing departments finally found their way to each other 🙂.", author: "Sophie Laurent", event: "BrightPath Consulting Offsite" },
  { quote: "Mixing the bride's team and the groom's team led to a massive party :-D.", author: "Marko & Elena", event: "Wedding in Vienna" },
  { quote: "We tried it at a café quiz night—people laughed, made new friends, and kept asking when the next one would be 🎉.", author: "Lucia Rossi", event: "Quiz Nights at Caffè Centrale" },
  { quote: "Setup took 5 minutes and participants figured it out on their own. Zero stress for the organizer.", author: "Jan Horváth", event: "EuroSummit Bratislava" },
];

const blogPosts = [
  { slug: 'meeting-points-guide', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop', title: 'Meeting points: the secret ingredient of great networking rounds', description: 'Why designated meeting spots make networking less awkward, more efficient, and way more fun for everyone involved.' },
  { slug: 'how-to-promote-your-event', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop', title: 'How to promote your event and get more signups', description: 'From social media to on-site QR codes — practical ways to drive attendance and get people excited about networking rounds.' },
  { slug: 'random-vs-ai-matching', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop', title: 'Random vs AI matching: which one actually works?', description: 'We tested both approaches at real events. The results surprised us — and changed how we think about networking.' },
  { slug: '5-networking-tips', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=400&fit=crop', title: '5 networking tips to maximize your event ROI', description: 'Learn how to create meaningful connections that drive real business value at your next event.' },
  { slug: 'speed-dating-format', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop', title: 'Why the speed dating format works for networking', description: 'Discover the psychology behind structured networking and why it beats traditional mingling.' },
  { slug: 'hybrid-events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop', title: 'How to run successful networking at hybrid events', description: 'Bridge the gap between online and in-person attendees with these proven strategies.' },
];

const trustedLogos = [
  { src: '/logos/ecommercebridge.svg', alt: 'Ecommerce Bridge', style: { height: '32px', width: 'auto', filter: 'brightness(0)' } as React.CSSProperties },
  { src: '/logos/upterdam-logo-dark.svg', alt: 'Upterdam', style: { height: '14px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/bezcyklenia.png', alt: 'Bez Cyklenia', style: { height: '30px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/Blancacademy.svg', alt: 'Blanc Academy', style: { height: '28px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/web-summit.svg', alt: 'Web Summit', style: { height: '20px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/sxsw.svg', alt: 'SXSW', style: { height: '22px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/slush.svg', alt: 'Slush', style: { height: '20px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/collision.svg', alt: 'Collision', style: { height: '18px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/techcrunch-disrupt.svg', alt: 'TechCrunch Disrupt', style: { height: '30px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/tnw.svg', alt: 'TNW', style: { height: '22px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/ces.svg', alt: 'CES', style: { height: '22px', width: 'auto' } as React.CSSProperties },
  { src: '/logos/founders-summit.svg', alt: 'Founders Summit', style: { height: '28px', width: 'auto' } as React.CSSProperties },
];

function TrustedLogosMobile({ logos }: { logos: typeof trustedLogos }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const groupSize = 3;
  const groupCount = Math.ceil(logos.length / groupSize);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % groupCount);
    }, 3000);
    return () => clearInterval(interval);
  }, [groupCount]);

  return (
    <div className="md:hidden">
      <div style={{ position: 'relative', height: '50px' }}>
        {Array.from({ length: groupCount }).map((_, groupIdx) => {
          const groupLogos = logos.slice(groupIdx * groupSize, groupIdx * groupSize + groupSize);
          return (
            <div
              key={groupIdx}
              className="flex items-center justify-center opacity-70"
              style={{
                position: 'absolute',
                inset: '0 1.5rem',
                gap: '1.5rem',
                transform: 'scale(0.85)',
                opacity: groupIdx === activeIndex ? 0.7 : 0,
                transition: 'opacity 0.6s ease-in-out',
              }}
            >
              {groupLogos.map((logo) => (
                <img key={logo.alt} src={logo.src} alt={logo.alt} style={logo.style} />
              ))}
            </div>
          );
        })}
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center" style={{ gap: '6px', marginTop: '12px' }}>
        {Array.from({ length: groupCount }).map((_, i) => (
          <button
            key={i}
            className="rounded-full"
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: i === activeIndex ? '#888' : '#ddd',
              transition: 'background-color 0.3s',
            }}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

interface HomepageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onResetPassword?: () => void;
  isOrganizerAuthenticated?: boolean;
}

export function Homepage({ onGetStarted, onSignIn, onResetPassword, isOrganizerAuthenticated }: HomepageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [participantCode, setParticipantCode] = useState('');

  // Lead magnet form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadEventType, setLeadEventType] = useState('');
  const [leadParticipantCount, setLeadParticipantCount] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Carousel state
  const [testimonialApi, setTestimonialApi] = useState<CarouselApi>();
  const [testimonialCurrent, setTestimonialCurrent] = useState(0);
  const [testimonialCount, setTestimonialCount] = useState(0);
  const [blogApi, setBlogApi] = useState<CarouselApi>();
  const [blogCurrent, setBlogCurrent] = useState(0);
  const [blogCount, setBlogCount] = useState(0);

  useEffect(() => {
    if (!testimonialApi) return;
    setTestimonialCount(testimonialApi.scrollSnapList().length);
    setTestimonialCurrent(testimonialApi.selectedScrollSnap());
    testimonialApi.on('select', () => {
      setTestimonialCurrent(testimonialApi.selectedScrollSnap());
    });
  }, [testimonialApi]);

  useEffect(() => {
    if (!blogApi) return;
    setBlogCount(blogApi.scrollSnapList().length);
    setBlogCurrent(blogApi.selectedScrollSnap());
    blogApi.on('select', () => {
      setBlogCurrent(blogApi.selectedScrollSnap());
    });
  }, [blogApi]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !leadName.trim()) return;

    setLeadSubmitting(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/public/lead-magnet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: leadEmail.trim(),
            name: leadName.trim(),
            eventType: leadEventType || undefined,
            participantCount: leadParticipantCount || undefined,
          }),
        }
      );

      if (response.ok) {
        setLeadSubmitted(true);
        debugLog('Lead magnet submitted successfully');
      }
    } catch (err) {
      debugLog('Error submitting lead magnet:', err);
    } finally {
      setLeadSubmitting(false);
    }
  };
  
  // Check authentication and redirect logic
  useEffect(() => {
    const allowBrowsing = sessionStorage.getItem('allow_participant_browsing');
    const token = localStorage.getItem('participant_token');
    
    debugLog('🔍 Homepage useEffect triggered');
    debugLog('  - isOrganizerAuthenticated:', isOrganizerAuthenticated);
    debugLog('  - allowBrowsing:', allowBrowsing);
    debugLog('  - participantToken:', token);
    
    // Priority 1: Redirect authenticated organizer to dashboard
    if (isOrganizerAuthenticated) {
      debugLog('🔄 Organizer authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Priority 2: Allow participant browsing
    if (allowBrowsing === 'true') {
      // Clear flag after use
      sessionStorage.removeItem('allow_participant_browsing');
      debugLog('✅ Participant is browsing events - no redirect');
      return;
    }
    
    // Priority 3: Redirect participant to their dashboard
    if (token) {
      debugLog('🔄 Participant token found, redirecting to dashboard:', token);
      navigate(`/p/${token}`, { replace: true });
      return;
    }
    
    debugLog('ℹ️  No authentication - showing public homepage');
  }, [navigate, location, isOrganizerAuthenticated]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation onGetStarted={onGetStarted} onSignIn={onSignIn} />

      {/* Participant entry - close to navigation */}
      <section className="py-3 px-6 border-b border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              Joining as a participant?
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground pointer-events-none z-10">#</span>
                <Input
                  type="text"
                  placeholder="Enter code here"
                  value={participantCode}
                  onChange={(e) => setParticipantCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && participantCode.trim()) {
                      const cleanCode = participantCode.trim().toLowerCase();
                      navigate(`/${cleanCode}`);
                    }
                  }}
                  className="pl-8 text-left h-8 w-40"
                />
              </div>
              <Button
                size="sm"
                disabled={!participantCode.trim()}
                className="h-8"
                onClick={() => {
                  const cleanCode = participantCode.trim().toLowerCase();
                  navigate(`/${cleanCode}`);
                }}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative px-6" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="mb-6 max-w-4xl mx-auto text-4xl">
              <span style={{ color: '#5C2277' }}>Add value to your event with{' '}<br />networking rounds!</span>
            </h1>
            <p className="mb-12 max-w-2xl mx-auto text-muted-foreground">
              Easily turn networking from side effect into program highlight! Perfect for conferences, meet-ups, festivals, internal meetings and private events.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button onClick={onGetStarted} className="bg-primary text-primary-foreground" size="lg">
                <Calendar className="mr-2 h-5 w-5" />
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hero image */}
          <div className="mx-auto mb-16" style={{ maxWidth: '600px', marginTop: '-20px' }}>
            <div className="rounded-lg overflow-hidden">
              <img
                src="/Wonderelo-hero-section-dog.png"
                alt="Wonderelo networking session"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">Five minute set up</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">For events of every size</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">No worry pricing</span>
            </div>
          </div>

        </div>
      </section>

      {/* Media Logos - As Seen In */}
      <section className="py-12 px-6 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <p className="text-center text-sm text-muted-foreground mb-8 tracking-wide uppercase">
            As seen in
          </p>
          <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:justify-between md:gap-10 opacity-60 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
            <img src="/logos/business-insider.svg" alt="Business Insider" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
            <img src="/logos/digital-journal.svg" alt="Digital Journal" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
            <img src="/logos/big-news-network.svg" alt="Big News Network" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
            <img src="/logos/techbullion.svg" alt="TechBullion" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
            <img src="/logos/ips.svg" alt="IPS" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
            <img src="/logos/starkville-daily-news.svg" alt="Starkville Daily News" className="h-7 max-w-[130px] w-auto object-contain mx-auto md:mx-0" />
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center" style={{ marginBottom: '24px' }}>
            <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Nine out of ten people go to events to{' '}<br />meet someone new</span></h2>
            <p className="text-muted-foreground text-lg">
              Here's the networking experience they usually get:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '430px', margin: '0 auto 24px' }}>
            <div className="flex items-center gap-2 bg-background rounded-xl py-2 border border-border/40" style={{ paddingLeft: '40px', paddingRight: '16px' }}>
              <div style={{ width: '100px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/experience-schnitzel.png" alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-sm text-muted-foreground">Food-line bonding over schnitzel</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-xl py-2 border border-border/40" style={{ paddingLeft: '40px', paddingRight: '16px' }}>
              <div style={{ width: '100px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/experience-wave.png" alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-sm text-muted-foreground">Brave "Hi…" to their seat neighbour</span>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-xl py-2 border border-border/40" style={{ paddingLeft: '40px', paddingRight: '16px' }}>
              <div style={{ width: '100px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/experience-fingers.png" alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-sm text-muted-foreground">Hope for accidental hallway collisions</span>
            </div>
          </div>

          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Too many attendees leave without new connections — approaching strangers is hard, groups stay closed, and solo participants get stuck on the sidelines.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Stop leaving networking to chance</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Give your attendees what they came for — new connections.<br />Run networking rounds at your event.
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ marginTop: '24px' }}>
              Setup takes minutes. Joining takes seconds.<br />This is how it works:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
            {/* Step 1 - Event page promotion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/30" style={{ aspectRatio: '16/9' }}>
                <img src="/how-it-works-1.png" alt="Event page promotion" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="mb-5">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mb-3">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ marginBottom: '12px' }}>Event page promotion</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Share your Event page link with attendees — show it on slides, screens, or roll-ups using a QR code or the event hashtag for instant access.
                </p>
              </div>
            </div>

            {/* Step 2 - Participant round registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/30 md:order-2" style={{ aspectRatio: '16/9' }}>
                <img src="/Hand-with-phone.png" alt="Participant round registration" className="w-full h-full object-cover" />
              </div>
              <div className="md:order-1">
                <div className="mb-5">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mb-3">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ marginBottom: '12px' }}>Participant round registration</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  People choose their time and optionally their topic or group. Zero attendee setup for the organizer.
                </p>
              </div>
            </div>

            {/* Step 3 - Attendance confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/30" style={{ aspectRatio: '16/9' }}>
                <img src="/how-it-works-3.png" alt="Attendance confirmation" className="w-full h-full object-cover" style={{ objectPosition: 'calc(50% + 55px) calc(50% + 7px)' }} />
              </div>
              <div>
                <div className="mb-5">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mb-3">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ marginBottom: '12px' }}>Attendance confirmation</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Participants get an SMS notification 5 minutes before the round to confirm attendance.
                </p>
              </div>
            </div>

            {/* Step 4 - Participants meet & network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/30 md:order-2" style={{ aspectRatio: '16/9' }}>
                <img src="/how-it-works-4.png" alt="Participants meet and network" className="w-full h-full object-cover" />
              </div>
              <div className="md:order-1">
                <div className="mb-5">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mb-3">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ marginBottom: '12px' }}>Participants meet & network</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Wonderelo shows every participant their match and designated meeting point. The round runs according to the preset duration and locations — ice breakers handle the rest.
                </p>
              </div>
            </div>

            {/* Step 5 - Contact exchange */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/30" style={{ aspectRatio: '16/9' }}>
                <img src="/how-it-works-5.png" alt="Contact exchange" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="mb-5">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mb-3">
                    <span className="text-lg font-bold text-primary">5</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ marginBottom: '12px' }}>Contact exchange</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  If both parties agree, contacts are exchanged 15 minutes after the round. New contacts are made, new worlds emerge.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center" style={{ marginTop: '100px' }}>
            <Button onClick={onGetStarted} className="bg-primary text-primary-foreground" size="lg">
              <Calendar className="mr-2 h-5 w-5" />
              Let's make your event better!
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-12 md:py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Every gathering is better when people connect</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wonderelo works for any setting where you want to bring people together
            </p>
          </div>

          {/* Mobile: compact list with dividers */}
          <div className="md:hidden divide-y divide-border" style={{ marginTop: '1.5rem' }}>
            {eventTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-start w-full py-4 text-left gap-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>

          {/* Desktop: card grid */}
          <div className="hidden md:flex flex-col gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-responsive-16">
              {eventTypes.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.path} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(item.path)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <span className="text-sm text-primary font-medium">Learn more →</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 md-flex-center gap-responsive-16">
              {eventTypes.slice(4).map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.path} className="cursor-pointer hover:border-primary/50 transition-colors card-w-quarter" onClick={() => navigate(item.path)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <span className="text-sm text-primary font-medium">Learn more →</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-80 items-center">
            {/* Left: image */}
            <div className="flex items-center justify-center">
              <img src="/Wonderelo-magic-by-networking.png" alt="Wonderelo magic by networking" className="w-full h-auto rounded-2xl" />
            </div>

            {/* Right: text content */}
            <div>
              <h2 className="mb-4 text-center md:text-left"><span style={{ color: '#5C2277' }}>Tailor each networking round to fit your event</span></h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '40px' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Flexible duration</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose the right length for each session, from speed chats to deeper conversations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Group size control</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Decide whether participants meet one-on-one or in groups.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Discussion topics</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add topics to spark conversations around shared interests.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Group matching</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose whether attendees meet within or across groups.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Meeting points</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define where participants should meet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Ice breakers</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provide optional starter questions to help participants begin the conversation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Shuffle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Matching memory</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sessions remember past pairings, so people always meet someone new.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Here's what happened when organizers used Wonderelo</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              And the best part — nothing was left to chance.
            </p>
          </div>

          {/* Mobile: carousel with peek */}
          <div className="md:hidden" style={{ marginTop: '1.5rem' }}>
            <Carousel
              setApi={setTestimonialApi}
              opts={{ align: 'center', containScroll: false }}
              className="w-full carousel-peek-bleed"
            >
              <CarouselContent>
                {testimonials.map((t, index) => (
                  <CarouselItem key={index}>
                    <Card className="h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                        <p className="text-sm mb-4">"{t.quote}"</p>
                        <div className="text-sm text-muted-foreground">
                          — {t.author}, {t.event}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Dot indicators - mobile only */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: testimonialCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => testimonialApi?.scrollTo(index)}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: index === testimonialCurrent ? 'var(--primary)' : 'var(--border)' }}
                />
              ))}
            </div>
          </div>

          {/* Desktop: show all cards in grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <Card key={index} className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">"{t.quote}"</p>
                  <div className="text-sm text-muted-foreground">
                    — {t.author}, {t.event}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Logos - Trusted By */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <p className="text-center text-sm text-muted-foreground mb-8 tracking-wide uppercase">
            Trusted by event organizers at
          </p>
          {/* Desktop: show all logos in 2 rows */}
          <div className="hidden md:grid opacity-70" style={{ gridTemplateColumns: 'repeat(6, auto)', justifyContent: 'center', justifyItems: 'center', alignItems: 'center', gap: '2rem 3rem' }}>
            {trustedLogos.map((logo) => (
              <img key={logo.alt} src={logo.src} alt={logo.alt} style={logo.style} />
            ))}
          </div>
          {/* Mobile: auto-rotating logos */}
          <TrustedLogosMobile logos={trustedLogos} />
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-10 md:py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Discover the magic of networking</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Insights, tips, and strategies to add more value to your networking events
            </p>
          </div>

          {/* Mobile: carousel */}
          <div className="md:hidden" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <Carousel setApi={setBlogApi} opts={{ align: 'center', containScroll: false }} className="w-full carousel-peek-bleed">
              <CarouselContent>
                {blogPosts.map((post) => (
                  <CarouselItem key={post.slug}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/blog/${post.slug}`)}>
                      <ImageWithFallback
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <CardContent className="pt-3">
                        <h3 className="text-lg mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{post.description}</p>
                        <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: blogCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => blogApi?.scrollTo(index)}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: index === blogCurrent ? 'var(--primary)' : 'var(--border)' }}
                />
              ))}
            </div>
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid grid-cols-3 gap-6 mb-8">
            {blogPosts.slice(0, 3).map((post) => (
              <Card key={post.slug} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/blog/${post.slug}`)}>
                <ImageWithFallback
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <CardContent className="pt-3">
                  <h3 className="text-lg mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{post.description}</p>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    Read more <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Find out more about networking <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Add value to your event with networking rounds!</span></h2>
          <p className="mb-8 text-muted-foreground">
            Be the event people remember for the connections they made.
          </p>

          <div className="flex justify-center">
            <Button size="lg" onClick={onGetStarted}>
              <Calendar className="mr-2 h-5 w-5" />
              Let's get unforgettable!
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">Five minute set up</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">For events of every size</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">No worry pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnet */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wide">Free guide</span>
              </div>
              <h2 className="mb-4"><span style={{ color: '#5C2277' }}>The Ultimate Guide to Event Networking</span></h2>
              <p className="text-muted-foreground mb-6">
                Learn proven strategies to turn networking from an afterthought into the highlight of your event. Includes templates, timelines, and real examples.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  How to structure networking sessions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  Ice breaker questions that actually work
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  Timing and group size best practices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  Post-event follow-up templates
                </li>
              </ul>
            </div>

            <Card>
              <CardContent className="p-6">
                {leadSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Check your inbox!</h3>
                    <p className="text-muted-foreground">
                      We've sent the guide to <strong>{leadEmail}</strong>. Enjoy!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">What type of events do you organize?</label>
                      <select
                        value={leadEventType}
                        onChange={(e) => setLeadEventType(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select (optional)</option>
                        <option value="conference">Conference or barcamp</option>
                        <option value="meetup">Community meetup</option>
                        <option value="company">Company event</option>
                        <option value="university">University or school</option>
                        <option value="party">Party or festival</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Expected participants</label>
                      <select
                        value={leadParticipantCount}
                        onChange={(e) => setLeadParticipantCount(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select (optional)</option>
                        <option value="10-30">10–30</option>
                        <option value="30-100">30–100</option>
                        <option value="100-500">100–500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={leadSubmitting || !leadName.trim() || !leadEmail.trim()}
                    >
                      {leadSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Get the free guide
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      No spam, ever. We only send useful content.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Logo */}
            <div className="col-span-2 md:col-span-1">
              <h2
                className="text-primary wonderelo-logo cursor-pointer hover:opacity-80 transition-opacity mb-4"
                onClick={() => navigate('/')}
              >
                Wonderelo
              </h2>
              <p className="text-sm text-muted-foreground">Magic by networking</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/our-story"
                    onClick={(e) => { e.preventDefault(); navigate('/our-story'); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Our story
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    onClick={(e) => { e.preventDefault(); navigate('/blog'); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Newsroom
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@wonderelo.com"
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/help"
                    onClick={(e) => { e.preventDefault(); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Help center
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => { e.preventDefault(); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Terms of use
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => { e.preventDefault(); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Privacy policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Wonderelo. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="sr-only">YouTube</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}