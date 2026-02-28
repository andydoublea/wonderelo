import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AuthorSignature } from './AuthorSignature';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  coverImage?: string;
  readTime?: string;
  author?: string;
  published?: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const fallbackPosts: Record<string, BlogPost> = {
  '5-networking-tips': {
    id: '1', slug: '5-networking-tips',
    title: '5 networking tips to maximize your event ROI',
    excerpt: 'Learn how to create meaningful connections that drive real business value at your next event.',
    content: `<h2>1. Set clear networking goals before the event</h2><p>Before attending any event, define what you want to achieve. Are you looking for potential clients, partners, or mentors? Having a clear goal helps you prioritize who to connect with and makes your conversations more purposeful.</p><h2>2. Use structured networking rounds</h2><p>Don't leave networking to chance. Structured rounds — like those powered by Wonderelo — ensure every attendee gets matched with relevant people. This removes the awkwardness of approaching strangers and guarantees meaningful conversations.</p><h2>3. Follow up within 24 hours</h2><p>The magic happens after the event. Send a personalized message referencing something specific from your conversation. This shows genuine interest and keeps the connection alive.</p><h2>4. Quality over quantity</h2><p>It's better to have 5 deep conversations than 20 surface-level exchanges. Focus on understanding the other person's challenges and how you might help each other.</p><h2>5. Be the connector</h2><p>When you meet someone who could benefit from knowing another contact, make the introduction. Being a connector builds your reputation and strengthens your entire network.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=400&fit=crop',
    readTime: '5 min read',
    createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z',
  },
  'speed-dating-format': {
    id: '2', slug: 'speed-dating-format',
    title: 'Why the speed dating format works for networking',
    excerpt: 'Discover the psychology behind structured networking and why it beats traditional mingling.',
    content: `<h2>The science behind structured interactions</h2><p>Research shows that people form first impressions within 7 seconds. Speed networking leverages this by giving participants short, focused windows to connect — typically 3 to 7 minutes per round.</p><h2>Why it beats traditional mingling</h2><p>At most events, 80% of attendees stick with people they already know. The remaining 20% who try to mingle often struggle with the "cold approach" — walking up to strangers feels unnatural for most people.</p><p>Structured rounds eliminate this barrier entirely. When everyone is matched and given a meeting point, there's no awkwardness. The format itself gives permission to start talking.</p><h2>The Wonderelo twist</h2><p>Unlike traditional speed dating, Wonderelo adds smart matching, discussion topics, and ice breakers. This means conversations start faster and go deeper. Participants don't waste time on small talk — they jump straight into meaningful exchanges.</p><h2>Results speak for themselves</h2><p>Events using structured networking rounds report 3x more new connections per attendee compared to events with only free-form networking. That's the power of removing friction from human connection.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
    readTime: '7 min read',
    createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z',
  },
  'hybrid-events': {
    id: '3', slug: 'hybrid-events',
    title: 'How to run successful networking at hybrid events',
    excerpt: 'Bridge the gap between online and in-person attendees with these proven strategies.',
    content: `<h2>The hybrid challenge</h2><p>Hybrid events combine in-person and remote attendees — but networking often falls flat for online participants. They watch from their screens while in-person attendees mingle naturally.</p><h2>Strategy 1: Dedicated virtual networking rounds</h2><p>Schedule specific times for virtual-only networking. Use video calls with matched pairs so remote attendees get the same structured experience as those on-site.</p><h2>Strategy 2: Cross-format matching</h2><p>Pair online attendees with in-person ones for brief video chats. This creates connections across both formats and makes remote participants feel included.</p><h2>Strategy 3: Async connection cards</h2><p>Let all participants — virtual and in-person — share their profiles and interests. After the event, send curated match suggestions so connections can continue regardless of format.</p><h2>The key takeaway</h2><p>Don't treat virtual attendees as second-class participants. With the right tools and structure, hybrid networking can be just as effective as in-person events.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    readTime: '6 min read',
    createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z',
  },
  'random-vs-ai-matching': {
    id: '4', slug: 'random-vs-ai-matching',
    title: 'Random vs AI matching: which one actually works?',
    excerpt: 'We tested both approaches at real events. The results surprised us — and changed how we think about networking.',
    content: `<h2>The great debate</h2><p>When it comes to event networking, there are two schools of thought: random matching (pair people at random) and AI-powered matching (use algorithms to find the "best" pairs based on interests, roles, or goals).</p><h2>What we expected</h2><p>We assumed AI matching would win hands down. After all, matching a marketing director with a sales lead sounds more productive than pairing them with a random software developer, right?</p><h2>What actually happened</h2><p>We ran both approaches at 12 different events with over 2,000 participants. The results surprised us:</p><p><strong>Random matching scored higher on "unexpected value"</strong> — participants discovered connections they never would have sought out. A founder met a designer who became their co-founder. A teacher connected with a tech CEO who funded their education project.</p><p><strong>AI matching scored higher on "immediate relevance"</strong> — conversations felt more on-topic, and participants reported higher satisfaction in the moment.</p><h2>Our conclusion</h2><p>The best approach depends on your event goals. For industry conferences where people want targeted connections, AI matching works great. For community events, meetups, and creative gatherings, random matching creates the serendipity that makes events magical.</p><p>That's why Wonderelo supports both — and lets organizers choose what fits their event best.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
    readTime: '8 min read',
    createdAt: '2025-01-20T00:00:00Z', updatedAt: '2025-01-20T00:00:00Z',
  },
  'how-to-promote-your-event': {
    id: '5', slug: 'how-to-promote-your-event',
    title: 'How to promote your event and get more signups',
    excerpt: 'From social media to on-site QR codes — practical ways to drive attendance and get people excited about networking rounds.',
    content: `<h2>Start with the "why"</h2><p>People don't sign up for networking rounds — they sign up for the promise of meeting someone valuable. Lead with outcomes: "Meet 5 new people in your industry in 30 minutes" is more compelling than "Join our networking session."</p><h2>Use your Event page as a landing page</h2><p>Wonderelo gives every event a shareable Event page. Share the link on social media, in emails, and on your event website. The page shows what to expect and makes registration effortless.</p><h2>QR codes are your best friend</h2><p>Print QR codes on slides, banners, roll-ups, and table cards. At the event, display the QR code during breaks and between sessions. The easier you make it to join, the more people will participate.</p><h2>Leverage the event hashtag</h2><p>Add your event hashtag to the Event page. When people post about the event on social media, the hashtag creates a natural discovery path to your networking rounds.</p><h2>Announce it from stage</h2><p>The most effective promotion? A 30-second announcement from the main stage. "In 15 minutes, we're running a networking round. Scan the QR code on your screen to join." Simple, direct, effective.</p><h2>Follow up with highlights</h2><p>After the event, share stats: "142 people made 284 new connections today." This builds excitement for your next event and shows the value of structured networking.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
    readTime: '6 min read',
    createdAt: '2025-01-25T00:00:00Z', updatedAt: '2025-01-25T00:00:00Z',
  },
  'meeting-points-guide': {
    id: '6', slug: 'meeting-points-guide',
    title: 'Meeting points: the secret ingredient of great networking rounds',
    excerpt: 'Why designated meeting spots make networking less awkward, more efficient, and way more fun for everyone involved.',
    content: `<h2>What are meeting points?</h2><p>Meeting points are designated spots where matched participants meet for their networking conversation. Instead of wandering around looking for each other, both people know exactly where to go — Table 3, Corner Lounge, or the Blue Flag area.</p><h2>Why they matter more than you think</h2><p>Without meeting points, matched participants waste precious minutes finding each other. In a crowded venue, this can eat up half the round time. With clear meeting points, conversations start immediately.</p><h2>How to set them up</h2><p>Choose locations that are:</p><ul><li><strong>Easy to find</strong> — use numbered tables, colored zones, or landmark features</li><li><strong>Spread across the venue</strong> — avoid clustering everyone in one area</li><li><strong>Conversation-friendly</strong> — away from loud speakers or high-traffic paths</li></ul><h2>Creative meeting point ideas</h2><p>Go beyond numbered tables. Use themed areas ("The Innovation Corner"), branded spots ("The Wonderelo Lounge"), or even outdoor spaces for a fresh-air networking experience.</p><h2>The result</h2><p>Events with well-designed meeting points see 40% longer average conversation times. When people don't waste time finding each other, they spend more time connecting. And that's what networking is all about.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop',
    readTime: '5 min read',
    createdAt: '2025-01-30T00:00:00Z', updatedAt: '2025-01-30T00:00:00Z',
  },
};

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchBlogPost(slug);
    }
  }, [slug]);

  const fetchBlogPost = async (postSlug: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${apiBaseUrl}/blog/posts/${postSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('Blog post:', data);
        if (data.post) {
          setBlogPost(data.post);
        } else if (fallbackPosts[postSlug]) {
          setBlogPost(fallbackPosts[postSlug]);
        } else {
          setError('Blog post not found');
        }
      } else if (fallbackPosts[postSlug]) {
        setBlogPost(fallbackPosts[postSlug]);
      } else {
        setError('Blog post not found');
      }
    } catch (error) {
      errorLog('Error fetching blog post:', error);
      if (fallbackPosts[postSlug]) {
        setBlogPost(fallbackPosts[postSlug]);
      } else {
        setError('Blog post not found');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border">
          <div className="container mx-auto max-w-4xl px-6 py-4">
            <h2 
              className="text-primary wonderelo-logo cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              Wonderelo
            </h2>
          </div>
        </nav>
        <div className="flex items-center justify-center py-20 px-6">
          <div className="text-center">
            <h2 className="mb-4">{error || 'Blog post not found'}</h2>
            <Button onClick={() => navigate('/blog')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Article */}
      <article className="py-12 px-6">
        <div className="container mx-auto max-w-3xl">
          {/* Featured Image */}
          {(blogPost.imageUrl || blogPost.coverImage) && (
            <ImageWithFallback
              src={(blogPost.imageUrl || blogPost.coverImage)!}
              alt={blogPost.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
            />
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            {blogPost.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{blogPost.readTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(blogPost.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl mb-6">{blogPost.title}</h1>

          {/* Excerpt */}
          <p className="text-xl text-muted-foreground mb-8">
            {blogPost.excerpt}
          </p>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            style={{
              '--tw-prose-headings': '#1a1a1a',
            } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />
          <style>{`
            .vs-jasper article h1 {
              color: #5C2277 !important;
            }
            .prose h2 {
              font-size: 1.5rem !important;
              font-weight: 400 !important;
              margin-top: 2.5rem !important;
              margin-bottom: 1rem !important;
              line-height: 1.3 !important;
            }
            .prose h3 {
              font-size: 1.25rem !important;
              font-weight: 400 !important;
              margin-top: 2rem !important;
              margin-bottom: 0.75rem !important;
            }
            .prose p {
              margin-bottom: 1rem !important;
            }
            .prose ul, .prose ol {
              margin-top: 0.75rem !important;
              margin-bottom: 1rem !important;
            }
          `}</style>

          {/* Author signature */}
          <AuthorSignature className="mt-16 pt-8 border-t border-border" />
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4">Ready to transform your networking?</h2>
          <p className="mb-8 text-muted-foreground">
            Start creating meaningful connections at your events
          </p>
          <Button size="lg" onClick={() => navigate('/')}>
            Get started for free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}