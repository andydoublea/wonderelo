import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Check, Loader2, Plus, Settings, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export function AdminStyleGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container mx-auto" style={{ padding: '12px 24px' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>Style guide</h1>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto" style={{ padding: '24px', maxWidth: '900px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Typography */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Typography</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h1 className="text-4xl font-bold" style={{ letterSpacing: '-0.02em' }}>Heading 1 — text-4xl font-bold</h1>
                  <h2 className="text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>Heading 2 — text-3xl font-bold</h2>
                  <h2 className="text-2xl font-bold">Heading 3 — text-2xl font-bold</h2>
                  <h3 className="text-xl font-semibold">Heading 4 — text-xl font-semibold</h3>
                  <h3 className="text-lg font-semibold">Heading 5 — text-lg font-semibold</h3>
                  <p className="text-base">Body text — text-base (16px)</p>
                  <p className="text-sm">Small text — text-sm (14px)</p>
                  <p className="text-xs">Extra small — text-xs (12px)</p>
                  <p className="text-sm text-muted-foreground">Muted text — text-muted-foreground</p>
                  <p className="text-xs text-muted-foreground">Muted small — text-xs text-muted-foreground</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Buttons</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Default sizes */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Default variant (all sizes)</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button size="lg">Large button</Button>
                      <Button>Default button</Button>
                      <Button size="sm">Small button</Button>
                      <Button size="icon"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* Variants */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">All variants</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button>Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>

                  {/* With icons */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">With icons</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button><Calendar className="mr-2 h-4 w-4" />With left icon</Button>
                      <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Settings</Button>
                      <Button variant="ghost"><Sparkles className="mr-2 h-4 w-4" />Ghost icon</Button>
                    </div>
                  </div>

                  {/* States */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">States</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button disabled>Disabled</Button>
                      <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading</Button>
                      <Button variant="outline" disabled>Disabled outline</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Badges */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Badges</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card title</CardTitle>
                  <CardDescription>Card description text</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card content goes here. This shows a standard card layout with header and content.</p>
                </CardContent>
              </Card>

              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Highlighted card
                  </CardTitle>
                  <CardDescription>With primary border accent</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Action button</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Form elements */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Form elements</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  <div className="space-y-2">
                    <Label htmlFor="demo-input">Text input</Label>
                    <Input id="demo-input" placeholder="Placeholder text" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-disabled">Disabled input</Label>
                    <Input id="demo-disabled" disabled value="Disabled value" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Colors */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Semantic colors</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary flex-shrink-0" />
                    <span className="text-sm">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-secondary flex-shrink-0" />
                    <span className="text-sm">Secondary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-destructive flex-shrink-0" />
                    <span className="text-sm">Destructive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted flex-shrink-0" />
                    <span className="text-sm">Muted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex-shrink-0" style={{ background: '#22c55e' }} />
                    <span className="text-sm">Success (green-500)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex-shrink-0" style={{ background: '#f97316' }} />
                    <span className="text-sm">Warning (orange-500)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex-shrink-0" style={{ background: '#3b82f6' }} />
                    <span className="text-sm">Info (blue-500)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-accent flex-shrink-0" />
                    <span className="text-sm">Accent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Status indicators */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Status patterns</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Success */}
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-900">Success message pattern</p>
                    </div>
                  </div>
                  {/* Warning */}
                  <div className="p-3 border rounded-lg" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#d97706' }} />
                      <p className="text-sm font-medium" style={{ color: '#92400e' }}>Warning message pattern</p>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3 border rounded-lg" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: '#2563eb' }} />
                      <p className="text-sm font-medium" style={{ color: '#1e40af' }}>Info/tip message pattern</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Spacing reference */}
          <section style={{ paddingBottom: '40px' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '12px' }}>Spacing reference</h2>
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[4, 8, 12, 16, 24, 32].map(px => (
                    <div key={px} className="flex items-center gap-3">
                      <div style={{ width: `${px}px`, height: '12px', background: 'hsl(var(--primary))', borderRadius: '2px', flexShrink: 0 }} />
                      <span className="text-xs text-muted-foreground" style={{ minWidth: '50px' }}>{px}px</span>
                      <span className="text-xs text-muted-foreground">gap-{px / 4} / p-{px / 4} / m-{px / 4}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
