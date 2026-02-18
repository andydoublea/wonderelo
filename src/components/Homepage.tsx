import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowRight, Users, Calendar, Clock, QrCode, Heart, Shield, Zap, Star, Coffee, MessageCircle, UserCheck, Shuffle, MapPin, Palette, HandHeart, Lightbulb, Target, Mic, Monitor, GitBranch, Music, Cake, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Navigation } from './Navigation';
import { toast } from 'sonner@2.0.3';
import { debugLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !leadName.trim()) return;

    setLeadSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/public/lead-magnet`,
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

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Participant entry */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-3">
              Joining as a participant?
            </p>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
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
                  className="pl-8 text-center"
                />
              </div>
              <Button 
                size="sm" 
                disabled={!participantCode.trim()}
                onClick={() => {
                  // Navigate to user's event page
                  const cleanCode = participantCode.trim().toLowerCase();
                  navigate(`/${cleanCode}`);
                }}
              >
                Join
              </Button>
            </div>
          </div>

          <div className="text-center mb-16">
            <h1 className="mb-6 max-w-4xl mx-auto text-4xl">
              Turn networking from side effect into program highlight!
            </h1>
            <p className="mb-12 max-w-2xl mx-auto text-muted-foreground">
              Add value to your event – with timed sessions that bring new people together. Perfect for conferences, meet-ups, internal meetings and private events.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button onClick={onGetStarted} className="bg-primary text-primary-foreground" size="lg">
                <Calendar className="mr-2 h-5 w-5" />
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Networking photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <div className="rounded-lg overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1549299513-83dceea1f48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlb3BsZSUyMG5ldHdvcmtpbmclMjBjb25mZXJlbmNlfGVufDF8fHx8MTc1NzQzOTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Business people networking at conference"
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1517916358207-1e49f666e851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBuZXR3b3JraW5nJTIwZXZlbnQlMjBtZWV0aW5nfGVufDF8fHx8MTc1NzQzOTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professional networking event meeting"
                className="w-full h-64 object-cover"
              />
            </div>
          </div>


        </div>
      </section>

      {/* Customer Logos - Trusted By */}
      <section className="py-12 px-6 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <p className="text-center text-sm text-muted-foreground mb-8 tracking-wide uppercase">
            Trusted by event organizers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {/* TechFuture Conference */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Zap className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">TechFuture</span>
            </div>
            {/* CreativeMinds */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Lightbulb className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">CreativeMinds</span>
            </div>
            {/* BrightPath Consulting */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Star className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">BrightPath</span>
            </div>
            {/* Caffè Centrale */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Coffee className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">Caffè Centrale</span>
            </div>
            {/* EuroSummit */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Calendar className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">EuroSummit</span>
            </div>
            {/* NovaTech */}
            <div className="flex items-center gap-2 text-foreground/70 hover:text-foreground/90 transition-colors">
              <Monitor className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">NovaTech</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Coffee breaks aren't a networking strategy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Relying on coffee breaks and hallway chats means leaving networking to luck. The chance for real connections slips away—and so does the value of your event.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg">
                    <Users className="h-5 w-5 text-destructive" />
                  </div>
                  <span>No new contacts</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Many participants leave without meeting anyone new.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <span>Hard for introverts</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Approaching strangers feels uncomfortable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg">
                    <Shield className="h-5 w-5 text-destructive" />
                  </div>
                  <span>Closed circles</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Groups stick together, outsiders stay out.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg">
                    <UserCheck className="h-5 w-5 text-destructive" />
                  </div>
                  <span>Alone all day</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Solo attendees often spend the event on their own.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Sessions that make networking happen</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wonderelo turns casual encounters into structured sessions—easy for you to set up, reliable for participants to join, and designed so everyone meets someone new
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <span>Program-ready sessions</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Schedule them as part of your program or let them run alongside your event.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <span>Easy sign-up</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your participants join with a simple QR code, no app required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span>Reliable attendance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatic notifications help your participants show up on time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Shuffle className="h-5 w-5 text-primary" />
                  </div>
                  <span>Unexpected matches</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Wonderelo pairs people at random, sparking serendipitous conversations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span>Meeting made easy</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You define meeting points, or let participants agree on their own.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <span>See the shape, meet the person</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Colorful Olishapes™ guide participants together while keeping names and photos hidden as a surprise.
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <HandHeart className="h-5 w-5 text-primary" />
                  </div>
                  <span>No-pressure contacts</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Shared only if both agree, delivered later to avoid awkward moments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Networking, thoughtfully designed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tailor each networking session to fit your event perfectly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span>Flexible duration</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose the right length for each session, from speed chats to deeper conversations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>Group size control</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Decide whether participants meet one-on-one or in groups.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <span>Discussion topics</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add topics to spark conversations around shared interests.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <span>Ice breakers</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Provide optional starter questions to help participants begin the conversation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>
                  <span>Group matching</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose whether attendees meet within or across groups.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Shuffle className="h-5 w-5 text-primary" />
                  </div>
                  <span>Matching memory</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sessions remember past pairings, so people always meet someone new.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <span>Optional moderators</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Assign moderators in larger groups to keep the conversation flowing and give everyone a chance to speak.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <span>Stage matching</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional feature for smaller events where pairing happens live on screen as part of the show.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Every event is better when people really connect</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From conferences to private parties—Wonderelo helps you bring people together and make your event more impactful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Conferences & barcamps</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ensure everyone leaves with new contacts—even introverts and solo attendees.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <HandHeart className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Meetups & communities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mix people beyond their usual circles and create fresh conversations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Companies & teams</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Help team members build deeper relationships and connect across departments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Schools & universities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From getting to know each other while waiting for a lecture to creating teams for collaboration in classrooms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Festivals & parties</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Break the ice, connect people beyond their own groups, and make solo goers feel included.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Coffee className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Cafés & bars</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From quizzes and speed datings to board game evenings and after-work mixers.
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Cake className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Private events</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From weddings to birthdays, make your family and friends actually know each other.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Event organizers are going bananas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wonderelo helped them unlock the full potential of their events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  "It was the first event where we felt confident nobody was left out of networking."
                </p>
                <div className="text-sm text-muted-foreground">
                  — Anna Müller, TechFuture Conference
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  "Stage matching turned our meetup into a show—people loved the energy."
                </p>
                <div className="text-sm text-muted-foreground">
                  — David Novak, CreativeMinds Meetup
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  "At our company offsite, the sales and manufacturing departments finally found their way to each other 🙂."
                </p>
                <div className="text-sm text-muted-foreground">
                  — Sophie Laurent, BrightPath Consulting Offsite
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  "Mixing the bride's team and the groom's team led to a massive party :-D."
                </p>
                <div className="text-sm text-muted-foreground">
                  — Marko & Elena, Wedding in Vienna
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-4">
                  "We tried it at a café quiz night—people laughed, made new friends, and kept asking when the next one would be 🎉."
                </p>
                <div className="text-sm text-muted-foreground">
                  — Lucia Rossi, Quiz Nights at Caffè Centrale
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Media Logos - As Seen In */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <p className="text-center text-sm text-muted-foreground mb-8 tracking-wide uppercase">
            As seen in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-500">
            {/* Forbes */}
            <span className="text-2xl font-bold tracking-tight text-foreground/80 italic" style={{ fontFamily: 'Georgia, serif' }}>Forbes</span>
            {/* TechCrunch */}
            <span className="text-2xl font-bold tracking-tight text-foreground/80" style={{ fontFamily: 'system-ui, sans-serif' }}>TechCrunch</span>
            {/* CNBC */}
            <span className="text-2xl font-bold tracking-tight text-foreground/80 uppercase" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.1em' }}>CNBC</span>
            {/* Eventbrite Blog */}
            <span className="text-2xl font-bold tracking-tight text-foreground/80" style={{ fontFamily: 'system-ui, sans-serif' }}>Eventbrite</span>
            {/* The Next Web */}
            <span className="text-2xl font-bold tracking-tight text-foreground/80 uppercase" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em' }}>TNW</span>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">Become a master of networking</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Insights, tips, and strategies to add more value to your networking events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Blog post 1 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/blog/5-networking-tips')}>
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=400&fit=crop"
                alt="Networking event"
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground mb-2">5 min read</div>
                <h3 className="text-lg mb-2">5 networking tips to maximize your event ROI</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how to create meaningful connections that drive real business value at your next event.
                </p>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Read more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Blog post 2 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/blog/speed-dating-format')}>
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop"
                alt="Speed networking"
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground mb-2">7 min read</div>
                <h3 className="text-lg mb-2">Why the speed dating format works for networking</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover the psychology behind structured networking and why it beats traditional mingling.
                </p>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Read more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Blog post 3 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/blog/hybrid-events')}>
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"
                alt="Hybrid event"
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground mb-2">6 min read</div>
                <h3 className="text-lg mb-2">How to run successful networking at hybrid events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bridge the gap between online and in-person attendees with these proven strategies.
                </p>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Read more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Find out more about networking <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4">Ready to transform networking?</h2>
          <p className="mb-8 text-muted-foreground">
            Join the movement to make human connections more intentional, structured, and meaningful.
          </p>
          
          <div className="flex justify-center">
            <Button size="lg" onClick={onGetStarted}>
              <Calendar className="mr-2 h-5 w-5" />
              Start organizing now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">Easy to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">Instant results</span>
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
              <h2 className="mb-4">The Ultimate Guide to Event Networking</h2>
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
                className="text-primary cursor-pointer hover:opacity-80 transition-opacity mb-4" 
                onClick={() => navigate('/')}
              >
                Wonderelo
              </h2>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    How it works
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Our story
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/blog')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Newsroom
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact us
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Help center
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of use
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy policy
                  </button>
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