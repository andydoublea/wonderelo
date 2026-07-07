import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import { AuthorSignature } from './AuthorSignature';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import '../styles/wonderelo-public.css';
import '../styles/wonderelo-blog-post.css';

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

// Related-post cover accent classes, cycled across the (up to) three cards.
const relatedCoverClass = ['is-c1', 'is-c2', 'is-c3'];

interface TocItem {
  id: string;
  text: string;
}

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlogPost(slug);
      fetchRelatedPosts(slug);
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

  // Fetch a small set of recent posts to surface as "Keep reading", excluding
  // the current one. Falls back to the built-in sample posts on any failure so
  // the related grid always has three cards like the mock.
  const fetchRelatedPosts = async (currentSlug: string) => {
    const pickFallback = () =>
      Object.values(fallbackPosts).filter((p) => p.slug !== currentSlug).slice(0, 3);
    try {
      const response = await fetch(`${apiBaseUrl}/blog/posts`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        const posts: BlogPost[] = data.posts || [];
        const others = posts.filter((p) => p.slug !== currentSlug).slice(0, 3);
        setRelatedPosts(others.length ? others : pickFallback());
      } else {
        setRelatedPosts(pickFallback());
      }
    } catch (err) {
      errorLog('Error fetching related posts:', err);
      setRelatedPosts(pickFallback());
    }
  };

  // Derive the table of contents from the H2s inside the rendered article, and
  // (nice-to-have) track the active section as the reader scrolls.
  useEffect(() => {
    if (!blogPost || !bodyRef.current) return;
    const headings = Array.from(bodyRef.current.querySelectorAll('h2')) as HTMLHeadingElement[];
    const items: TocItem[] = headings.map((h, i) => {
      if (!h.id) h.id = `section-${i + 1}`;
      return { id: h.id, text: h.textContent || '' };
    });
    setToc(items);
    setActiveId(items[0]?.id || '');

    if (!('IntersectionObserver' in window) || items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActiveId((top.target as HTMLElement).id);
        }
      },
      { rootMargin: '-96px 0px -66% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [blogPost]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formattedDate = blogPost
    ? new Date(blogPost.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const coverImage = blogPost?.coverImage || blogPost?.imageUrl;

  if (loading) {
    return (
      <div
        className="wonderelo w-public bpg-page"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p style={{ color: 'var(--w-ink)', opacity: 0.6 }}>Loading…</p>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="wonderelo w-public bpg-page">
        <PublicNav onGetStarted={() => navigate('/')} onSignIn={() => navigate('/')} />
        <main className="w-shell">
          <header className="bp-header">
            <h1>{error || 'Blog post not found'}</h1>
            <p className="deck">
              <a
                className="w-btn w-btn-primary"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/blog')}
              >
                Back to blog
              </a>
            </p>
          </header>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="wonderelo w-public bpg-page">
      {/* Nav */}
      <PublicNav onGetStarted={() => navigate('/')} onSignIn={() => navigate('/')} />

      <main className="w-shell">

        {/* Article header */}
        <header className="bp-header">
          <div className="tags">
            <span className="tag">Networking</span>
            <span className="tag is-purple">Event design</span>
            {blogPost.readTime && <span className="tag is-purple">{blogPost.readTime}</span>}
          </div>
          <h1>{blogPost.title}</h1>
          {blogPost.excerpt && <p className="deck">{blogPost.excerpt}</p>}

          <div className="bp-byline">
            <span className="av">AA</span>
            <div className="who">
              <span className="name">Andy Abel</span>
              <span className="role">Founder, Wonderelo</span>
            </div>
            <span className="dot"></span>
            <div className="meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> {formattedDate}</span>
              {blogPost.readTime && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {blogPost.readTime}</span>}
            </div>
            <div className="share">
              <button type="button" aria-label="Share on X"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
              <button type="button" aria-label="Share on LinkedIn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 18V10H5v8zM6.5 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M18 18v-4.5c0-1.4-1.1-2.5-2.5-2.5S13 12.1 13 13.5V18h-3v-8h3v1.2c.5-.8 1.6-1.4 2.5-1.4 1.9 0 3.5 1.6 3.5 3.5V18z"/></svg></button>
              <button type="button" aria-label="Copy link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
            </div>
          </div>
        </header>

        {/* Cover — real image if available, gradient placeholder otherwise */}
        <section
          className="bp-cover"
          style={coverImage ? {
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
        </section>

        {/* Body */}
        <section className="bp-grid">

          {/* TOC — derived from the article's H2s */}
          <aside className="bp-toc">
            <span className="label">In this article</span>
            <ol>
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={item.id === activeId ? 'is-active' : undefined}
                  onClick={() => scrollToHeading(item.id)}
                >
                  {item.text}
                </li>
              ))}
            </ol>
          </aside>

          {/* Article body — injected post.content inherits `.bp-body` styles */}
          <article className="bp-body">
            <div ref={bodyRef} dangerouslySetInnerHTML={{ __html: blogPost.content }} />

            {/* Tags + share strip */}
            <div className="bp-foot">
              <div className="tag-row">
                <span>networking</span><span>event design</span><span>venue</span><span>practical</span>
              </div>
              <div className="share-row">
                Share —
                <button type="button" aria-label="X"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
                <button type="button" aria-label="LinkedIn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 18V10H5v8zM6.5 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M18 18v-4.5c0-1.4-1.1-2.5-2.5-2.5S13 12.1 13 13.5V18h-3v-8h3v1.2c.5-.8 1.6-1.4 2.5-1.4 1.9 0 3.5 1.6 3.5 3.5V18z"/></svg></button>
                <button type="button" aria-label="Copy link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
              </div>
            </div>

            {/* Author signature (kept from legacy — wrapped in the mock's block) */}
            <section className="bp-author">
              <AuthorSignature />
            </section>

          </article>
        </section>

        {/* Related */}
        <section className="bp-related">
          <div className="bp-related-head">
            <div>
              <span className="w-eyebrow">Keep reading</span>
              <h2 className="w-h1">More from the <span className="w-italic">blog</span></h2>
            </div>
            <a
              className="w-btn w-btn-ghost w-btn-sm"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/blog')}
            >
              Browse all articles →
            </a>
          </div>
          <div className="bp-related-grid">
            {relatedPosts.map((post, i) => (
              <a
                key={post.id}
                className={`bp-related-post ${relatedCoverClass[i % relatedCoverClass.length]}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <div
                  className="cover"
                  style={(post.coverImage || post.imageUrl) ? {
                    backgroundImage: `url(${post.coverImage || post.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : undefined}
                ></div>
                <div className="body">
                  <h3>{post.title}</h3>
                  <div className="meta">{post.readTime ? `Networking · ${post.readTime}` : 'Networking'}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bp-cta">
          <span className="deco"></span>
          <span className="deco-italic">try it</span>
          <div>
            <h2>Ready to transform <span className="w-italic">your</span> networking?</h2>
            <p>Spin up a free Wonderelo event in two minutes, name your meeting points, share the QR code — done. Free up to 5 participants.</p>
          </div>
          <a
            className="w-btn w-btn-primary w-btn-lg"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
          >
            Start for free
            <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </section>

      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
