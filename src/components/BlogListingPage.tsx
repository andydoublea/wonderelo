import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
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

const fallbackPosts: BlogPost[] = [
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
];

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <Navigation onGetStarted={() => navigate('/')} onSignIn={() => navigate('/')} />

      {/* Header */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-4"><span style={{ color: '#5C2277' }}>Discover the magic of networking</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Insights, tips, and strategies to add more value to your networking events
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Card 
                  key={post.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {(post.imageUrl || post.coverImage) && (
                    <ImageWithFallback
                      src={(post.imageUrl || post.coverImage)!}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      {post.readTime && <span>{post.readTime}</span>}
                      {post.author && <span>By {post.author}</span>}
                    </div>
                    <h3 className="text-lg mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {post.excerpt}
                    </p>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      Read more <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}