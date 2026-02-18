import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Navigation } from './Navigation';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  readTime: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

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
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/blog/posts/${postSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('Blog post:', data);
        setBlogPost(data.post);
      } else if (response.status === 404) {
        setError('Blog post not found');
      } else {
        errorLog('Failed to fetch blog post:', response.status);
        setError('Failed to load blog post');
      }
    } catch (error) {
      errorLog('Error fetching blog post:', error);
      setError('Network error');
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Article */}
      <article className="py-12 px-6">
        <div className="container mx-auto max-w-3xl">
          {/* Featured Image */}
          <ImageWithFallback 
            src={blogPost.imageUrl}
            alt={blogPost.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
          />

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{blogPost.readTime}</span>
            </div>
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
          <h1 className="mb-6">{blogPost.title}</h1>

          {/* Excerpt */}
          <p className="text-xl text-muted-foreground mb-8">
            {blogPost.excerpt}
          </p>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />
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

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <a 
              href="https://wonderelo.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Wonderelo
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}