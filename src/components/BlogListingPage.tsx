import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
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
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const fallbackPosts: BlogPost[] = [
  {
    id: '6',
    slug: 'meeting-points-guide',
    category: 'Networking',
    title: 'Meeting points: the secret ingredient of great networking rounds',
    excerpt: 'Why designated meeting spots make networking less awkward, more efficient, and way more fun for everyone involved. With practical examples from three real events.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop',
    readTime: '5 min read',
    createdAt: '2026-01-30T00:00:00Z',
    updatedAt: '2026-01-30T00:00:00Z',
  },
  {
    id: '5',
    slug: 'how-to-promote-your-event',
    category: 'Event design',
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
    category: 'Case studies',
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
    category: 'Networking',
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
    category: 'Event design',
    title: 'Why the speed-dating format works for networking',
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
    category: 'Product',
    title: 'Running networking at hybrid events',
    excerpt: 'Bridge the gap between online and in-person attendees with these proven strategies.',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    readTime: '6 min read',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: '7',
    slug: 'techfuture-2025-case-study',
    category: 'Stories',
    title: 'TechFuture 2025: 1 600 attendees, 18 rounds',
    excerpt: "How Europe's largest design conference used Wonderelo to make sure no one left without a handful of new contacts.",
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
    readTime: '9 min read',
    createdAt: '2024-12-28T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z',
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

// Build a compact page list (e.g. [1, 2, 3, 'dots', 8]) for the pagination bar.
function buildPageItems(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | 'dots')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) items.push('dots');
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push('dots');
  items.push(total);
  return items;
}

export function BlogListingPage() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const POSTS_PER_PAGE = 6;

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  // Reset to the first page whenever the active filter or search changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

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

  // Client-side filtering: category chips + search box, over the loaded posts.
  const isFiltering = selectedCategory !== 'All' || searchQuery.trim() !== '';

  const matchesCategory = (p: BlogPost) => {
    if (selectedCategory === 'All') return true;
    const sel = selectedCategory.toLowerCase();
    if (p.category && p.category.toLowerCase() === sel) return true;
    return (p.tags || []).some((t) => t.toLowerCase() === sel);
  };
  const matchesSearch = (p: BlogPost) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.category ? p.category.toLowerCase().includes(q) : false) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  };
  const filteredPosts = blogPosts.filter((p) => matchesCategory(p) && matchesSearch(p));

  // The featured hero belongs to the default (unfiltered) view; while filtering
  // or searching, every match — including the newest post — flows into the grid.
  const featured = isFiltering ? undefined : blogPosts[0];
  const gridSource = isFiltering ? filteredPosts : blogPosts.slice(1);

  const totalPages = Math.max(1, Math.ceil(gridSource.length / POSTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const recent = gridSource.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const pageItems = buildPageItems(page, totalPages);

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

  const featuredTag = featured?.tags?.[0] || featured?.category || 'Networking';

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setNewsletterSubmitting(true);
    try {
      // Reuse the Homepage lead-magnet endpoint (POST /public/lead-magnet); it
      // requires a name, so derive one from the email's local part.
      const response = await fetch(`${apiBaseUrl}/public/lead-magnet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name: email.split('@')[0], eventType: 'newsletter' }),
      });
      if (response.ok) {
        toast.success('You are subscribed! Check your inbox to confirm.');
        setNewsletterEmail('');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (err) {
      errorLog('Error subscribing to newsletter:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="wonderelo w-public bl-page">
      {/* Nav */}
      <PublicNav onGetStarted={() => navigate('/signup')} onSignIn={() => navigate('/signin')} />

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
              <button
                key={cat.label}
                className={`bl-chip${selectedCategory === cat.label ? ' is-active' : ''}`}
                type="button"
                onClick={() => setSelectedCategory(cat.label)}
              >
                {cat.label} <span className="count">· {cat.count}</span>
              </button>
            ))}
            <div className="bl-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Search articles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <div className="cover"><div className="pattern"></div><span className="tag">{post.tags?.[0] || post.category || fallbackTags[i % fallbackTags.length]}</span></div>
                <div className="body">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="meta"><span>{shortDate(post.createdAt)}{post.readTime ? ` · ${post.readTime}` : ''}</span><span className="arrow">Read →</span></div>
                </div>
              </a>
            ))}
          </div>

          {isFiltering && filteredPosts.length === 0 && (
            <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--w-ink)', opacity: 0.55 }}>
              No articles match your search yet. Try a different topic or keyword.
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bl-pagination">
              {page > 1 && (
                <button type="button" aria-label="Previous" onClick={() => setCurrentPage(page - 1)}>←</button>
              )}
              {pageItems.map((item, idx) =>
                item === 'dots' ? (
                  <button key={`dots-${idx}`} className="dots" type="button" disabled>…</button>
                ) : (
                  <button
                    key={item}
                    className={item === page ? 'is-current' : undefined}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                )
              )}
              {page < totalPages && (
                <button type="button" aria-label="Next" onClick={() => setCurrentPage(page + 1)}>→</button>
              )}
            </div>
          )}
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
            <form onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="your.email@where.you.work"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button className="w-btn w-btn-primary" type="submit" disabled={newsletterSubmitting}>
                Subscribe
                <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* Footer — Blog.html uses the shared dark `.w-footer` markup, i.e. the
          same PublicFooter as every other public page (Our Story, Use Case,
          Blog Post). Use it here too for 1:1 parity and cross-page consistency. */}
      <PublicFooter />
    </div>
  );
}
