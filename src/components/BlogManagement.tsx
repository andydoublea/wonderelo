import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { errorLog } from '../utils/debug';
import { useBlogPosts, useSaveBlogPost, useDeleteBlogPost } from '../hooks/useAdminQueries';

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

interface BlogManagementProps {
  accessToken: string;
}

export function BlogManagement({ accessToken }: BlogManagementProps) {
  // React Query hooks
  const { data: blogPosts = [], isLoading: loading, isFetching: isRefetching } = useBlogPosts(accessToken);
  const saveMutation = useSaveBlogPost(accessToken);
  const deleteMutation = useDeleteBlogPost(accessToken);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState('');
  const [published, setPublished] = useState(true);

  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const openCreateDialog = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setImageUrl('');
    setReadTime('5 min read');
    setPublished(true);
    setDialogOpen(true);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setImageUrl(post.imageUrl);
    setReadTime(post.readTime);
    setPublished(post.published);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !excerpt.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim(),
      readTime: readTime.trim(),
      published,
    };

    saveMutation.mutate(
      { id: editingPost?.id, data: postData },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    deleteMutation.mutate(postId);
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2>Blog management</h2>
            {isRefetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground">Create and manage your blog posts</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New post
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : blogPosts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No blog posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{post.title}</CardTitle>
                      {!post.published && (
                        <span className="px-2 py-0.5 text-xs bg-muted rounded">Draft</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>/{post.slug}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                      <span>•</span>
                      <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit blog post' : 'Create new blog post'}</DialogTitle>
            <DialogDescription>
              {editingPost ? 'Update your blog post details' : 'Fill in the details for your new blog post'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Auto-generate slug from title if creating new post
                  if (!editingPost) {
                    setSlug(generateSlugFromTitle(e.target.value));
                  }
                }}
                placeholder="5 networking tips to maximize your event ROI"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="5-networking-tips"
              />
              <p className="text-xs text-muted-foreground">
                This will be the URL: /blog/{slug || 'your-slug-here'}
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A brief summary of your post (1-2 sentences)"
                rows={2}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Featured image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
              <p className="text-xs text-muted-foreground">
                Use Unsplash or another image hosting service
              </p>
            </div>

            {/* Read Time */}
            <div className="space-y-2">
              <Label htmlFor="readTime">Read time</Label>
              <Input
                id="readTime"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="5 min read"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML) *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Your blog post content here...</p>"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can use HTML tags: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            {/* Published Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="published" className="cursor-pointer">
                {published ? (
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Published (visible to everyone)
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Draft (only visible to admins)
                  </span>
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (editingPost ? 'Update post' : 'Create post')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
