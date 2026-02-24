import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Navigation } from './Navigation';
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
        setBlogPosts(data.posts || []);
      } else {
        errorLog('Failed to fetch blog posts:', response.status);
      }
    } catch (error) {
      errorLog('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation onGetStarted={() => navigate('/')} onSignIn={() => navigate('/')} />

      {/* Header */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-4">Become a master of networking</h1>
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

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto max-w-6xl text-center">
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