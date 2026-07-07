import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import '../styles/wonderelo-public.css';
import '../styles/wonderelo-blog.css';

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
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const fallbackPosts: BlogPost[] = [
  {
    id: '6',
    slug: 'meeting-points-guide',
    title: 'Meeting points: the secret ingredient of great networking rounds',
    excerpt: 'Why designated meeting spots make networking less awkward, more efficient, and way more fun for everyone involved.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop',
    readTime: '5 min read',
    createdAt: '2025-01-30T00:00:00Z',
    updatedAt: '2025-01-30T00:00:00Z',
  },
  {
    id: '5',
    slug: 'how-to-promote-your-event',
    title: 'How to promote your event and get more signups',
    excerpt: 'From social media to on-site QR codes — practical ways to drive attendance and get people excited about networking rounds.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
    readTime: '6 min read',
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
  },
  {
    id: '4',
    slug: 'random-vs-ai-matching',
    title: 'Random vs AI matching: which one actually works?',
    excerpt: 'We tested both approaches at real events. The results surprised us — and changed how we think about networking.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
    readTime: '8 min read',
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
  },
  {
    id: '1',
    slug: '5-networking-tips',
    title: '5 networking tips to maximize your event ROI',
    excerpt: 'Learn how to create meaningful connections that drive real business value at your next event.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=400&fit=crop',
    readTime: '5 min read',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '2',
    slug: 'speed-dating-format',
    title: 'Why the speed dating format works for networking',
    excerpt: 'Discover the psychology behind structured networking and why it beats traditional mingling.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
    readTime: '7 min read',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: '3',
    slug: 'hybrid-events',
    title: 'How to run successful networking at hybrid events',
    excerpt: 'Bridge the gap between online and in-person attendees with these proven strategies.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    readTime: '6 min read',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
];

// Hardcoded category chips from the mock (used when posts carry no tags).
const fallbackCategories = [
  { label: 'All', count: 24, active: true },
  { label: 'Networking', count: 9 },
  { label: 'Event design', count: 6 },
  { label: 'Case studies', count: 4 },
  { label: 'Product', count: 3 },
  { label: 'Stories', count: 2 },
];

// Recent grid cover tag per mock (falls back to first tag / "Article").
const fallbackTags = ['Networking', 'Research', 'Networking', 'Event design', 'Hybrid', 'Case study'];

// Format an ISO date the way the mock shows it (e.g. "30 Jan", "30 January 2026").
function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}
function longDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

// Author initials for the featured avatar (mock: "AK").
function initials(author?: string) {
  if (!author) return 'AK';
  const parts = author.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AK';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function BlogListingPage() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/blog/posts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('Blog posts:', data);
        const posts = data.posts || [];
        setBlogPosts(posts.length > 0 ? posts : fallbackPosts);
      } else {
        errorLog('Failed to fetch blog posts:', response.status);
        setBlogPosts(fallbackPosts);
      }
    } catch (error) {
      errorLog('Error fetching blog posts:', error);
      setBlogPosts(fallbackPosts);
    } finally {
      setLoading(false);
    }
  };

  const featured = blogPosts[0];
  const recent = blogPosts.slice(1);

  // Category chips: derive from post tags when present, else the mock's hardcoded set.
  const derivedCategories = (() => {
    const counts = new Map<string, number>();
    blogPosts.forEach((p) => (p.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    if (counts.size === 0) return null;
    const chips = [{ label: 'All', count: blogPosts.length, active: true }];
    counts.forEach((count, label) => chips.push({ label, count }));
    return chips;
  })();
  const categories = derivedCategories || fallbackCategories;

  const featuredTag = featured?.tags?.[0] || 'Networking';

  return (
    <div className="wonderelo w-public bl-page">
      {/* Nav */}
      <PublicNav onGetStarted={() => navigate('/')} onSignIn={() => navigate('/')} />

      <main className="w-shell">

        {/* Hero */}
        <section className="bl-hero">
          <span className="deco deco-1"></span>
          <span className="deco deco-2"></span>
          <span className="deco deco-3"></span>
          <span className="deco deco-4"></span>
          <span className="deco deco-5"></span>
          <span className="deco deco-6"></span>
          <span className="deco deco-7"></span>
          <span className="deco deco-8"></span>
          <span className="deco deco-9"></span>
          <span className="deco deco-10"></span>
          <span className="deco deco-11"></span>
          <span className="deco deco-12"></span>
          <div className="bl-hero-grid">
            <div>
              <span className="w-eyebrow">Our blog</span>
              <h1 className="w-display">The Wonderelo<br /><span className="w-italic">notebook</span></h1>
              <p className="w-lede" style={{ maxWidth: 540 }}>Practical guides on running networking rounds, dispatches from real events, and the occasional rabbit hole into the science of small talk.</p>
            </div>
            <div className="bl-issue">
            </div>
          </div>

          {/* Categories */}
          <div className="bl-cats">
            <span className="label">Topics</span>
            {categories.map((cat) => (
              <button key={cat.label} className={`bl-chip${cat.active ? ' is-active' : ''}`} type="button">
                {cat.label} <span className="count">· {cat.count}</span>
              </button>
            ))}
            <div className="bl-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" placeholder="Search articles" />
            </div>
          </div>
        </section>

        {/* Featured post */}
        {featured && (
          <section className="bl-featured">
            <a className="ft-cover" href={`/blog/${featured.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/blog/${featured.slug}`); }} aria-label="Read featured post">
              <span className="ft-tag"><span className="w-diamond"></span> Featured · {shortDate(featured.createdAt)}</span>
            </a>
            <div className="ft-body">
              <div className="ft-meta">
                <span className="pill">{featuredTag}</span>
                {featured.readTime && <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> {featured.readTime}</span>}
                <span>{longDate(featured.createdAt)}</span>
              </div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="ft-author">
                <span className="av">{initials(featured.author)}</span>
                <span><strong>{featured.author || 'Andy K.'}</strong> · Founder, Wonderelo</span>
              </div>
              <a className="w-btn w-btn-primary ft-cta" href={`/blog/${featured.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/blog/${featured.slug}`); }}>
                Read the article
                <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </a>
            </div>
          </section>
        )}

        {/* Recent grid */}
        <section>
          <div className="bl-section-head">
            <div>
              <span className="w-eyebrow">More from the notebook</span>
              <h2 className="w-h1">Recent <span className="w-italic">posts</span></h2>
            </div>
            <div className="actions"></div>
          </div>

          <div className="bl-grid">
            {recent.map((post, i) => (
              <a
                key={post.id}
                className={`bl-post is-c${(i % 6) + 1}`}
                href={`/blog/${post.slug}`}
                onClick={(e) => { e.preventDefault(); navigate(`/blog/${post.slug}`); }}
              >
                <div className="cover"><div className="pattern"></div><span className="tag">{post.tags?.[0] || fallbackTags[i % fallbackTags.length]}</span></div>
                <div className="body">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="meta"><span>{shortDate(post.createdAt)}{post.readTime ? ` · ${post.readTime}` : ''}</span><span className="arrow">Read →</span></div>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          <div className="bl-pagination">
            <button className="is-current" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button className="dots" type="button">…</button>
            <button type="button">8</button>
            <button type="button" aria-label="Next">→</button>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bl-news">
          <span className="deco-italic">subscribe</span>
          <div>
            <span className="w-eyebrow">Subscribe to our newsletter</span>
            <h2 className="w-h1">Get the next one in your <span className="w-italic">inbox</span></h2>
            <p>One email a month with our newest field notes, a behind-the-scenes look at a real event, and an idea you can steal for yours.</p>
          </div>
          <div>
            <form onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="your.email@where.you.work" />
              <button className="w-btn w-btn-primary" type="submit">
                Subscribe
                <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
