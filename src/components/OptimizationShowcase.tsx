import { useState } from 'react';
import { SessionListWithQuery } from './SessionListWithQuery';
import { SessionMutationExample } from './examples/SessionMutationExample';
import { OptimizedImageExample } from './examples/OptimizedImageExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Zap, 
  Database, 
  Image, 
  Wifi, 
  WifiOff, 
  Download,
  CheckCircle2,
  Code,
  ListTodo,
  ExternalLink
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

/**
 * Optimization Showcase
 * 
 * Demonstrates all the new optimization features:
 * - React Query integration (caching, background refetching)
 * - Zustand state management
 * - Optimized images (lazy loading, placeholders)
 * - PWA capabilities
 * - Offline support
 */

export function OptimizationShowcase() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          <h1>Optimization showcase</h1>
        </div>
        <p className="text-muted-foreground">
          Explore the performance optimizations integrated into Oliwonder
        </p>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            React Query
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Code className="h-3 w-3" />
            Zustand Stores
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Image className="h-3 w-3" />
            Image Optimization
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Download className="h-3 w-3" />
            PWA Support
          </Badge>
          {isOnline ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
              <Wifi className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="react-query">React Query</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="pwa">PWA</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* React Query */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <CardTitle>React Query</CardTitle>
                </div>
                <CardDescription>
                  Powerful data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <FeatureItem>Automatic caching & deduplication</FeatureItem>
                <FeatureItem>Background refetching</FeatureItem>
                <FeatureItem>Optimistic updates</FeatureItem>
                <FeatureItem>Request retry & error handling</FeatureItem>
                <FeatureItem>Offline support via cache</FeatureItem>
              </CardContent>
            </Card>

            {/* Zustand */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-500" />
                  <CardTitle>Zustand stores</CardTitle>
                </div>
                <CardDescription>
                  Minimal state management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <FeatureItem>4 specialized stores (App, Session, Participant, UI)</FeatureItem>
                <FeatureItem>Persistent auth state</FeatureItem>
                <FeatureItem>Optimized selectors</FeatureItem>
                <FeatureItem>DevTools integration</FeatureItem>
                <FeatureItem>TypeScript support</FeatureItem>
              </CardContent>
            </Card>

            {/* Image Optimization */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-green-500" />
                  <CardTitle>Image optimization</CardTitle>
                </div>
                <CardDescription>
                  Fast & efficient loading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <FeatureItem>Lazy loading with Intersection Observer</FeatureItem>
                <FeatureItem>Blur placeholders</FeatureItem>
                <FeatureItem>Error handling & fallbacks</FeatureItem>
                <FeatureItem>Responsive images</FeatureItem>
                <FeatureItem>Improved Core Web Vitals</FeatureItem>
              </CardContent>
            </Card>

            {/* PWA */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-orange-500" />
                  <CardTitle>PWA capabilities</CardTitle>
                </div>
                <CardDescription>
                  App-like experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <FeatureItem>Service Worker caching</FeatureItem>
                <FeatureItem>Offline support</FeatureItem>
                <FeatureItem>Install to home screen</FeatureItem>
                <FeatureItem>Push notifications (ready)</FeatureItem>
                <FeatureItem>Background sync</FeatureItem>
              </CardContent>
            </Card>
          </div>

          {/* Performance metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance improvements</CardTitle>
              <CardDescription>
                Expected benefits from these optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-2xl">~40%</div>
                  <div className="text-sm text-muted-foreground">
                    Reduced initial load time
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl">~60%</div>
                  <div className="text-sm text-muted-foreground">
                    Fewer API requests
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl">~80%</div>
                  <div className="text-sm text-muted-foreground">
                    Better offline resilience
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          {/* Progress overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Implementation roadmap</CardTitle>
                  <CardDescription>
                    Tracking the integration of optimization features
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <ListTodo className="h-3 w-3" />
                  5 / 12 steps
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall progress</span>
                  <span className="text-muted-foreground">42%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Completed steps (5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RoadmapStep
                title="Step 1: QueryProvider wrapper"
                status="completed"
                description="Wrapped app in React Query provider for caching and sync"
              />
              <RoadmapStep
                title="Step 2: PWA initialization"
                status="completed"
                description="Service worker registered, offline support active"
              />
              <RoadmapStep
                title="Step 3: Cleanup duplicates"
                status="completed"
                description="Removed duplicate files and consolidated code"
              />
              <RoadmapStep
                title="Step 4: Zustand stores wrapper"
                status="completed"
                description="Added state management stores to AppRouter"
              />
              <RoadmapStep
                title="Step 5: React Query hooks demo"
                status="completed"
                description="Created demo components showing optimization features"
              />
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
                Next steps (7)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RoadmapStep
                title="Step 6: Migrate Dashboard components to React Query"
                status="pending"
                priority="high"
                description="Replace useEffect + fetch with useSessions(), useDashboardStats()"
                impact="60% fewer API requests, automatic caching"
              />
              <RoadmapStep
                title="Step 7: Zustand state management migration"
                status="pending"
                priority="medium"
                description="Replace local useState with centralized stores"
                impact="Less prop drilling, persistent state"
              />
              <RoadmapStep
                title="Step 8: Replace images with OptimizedImage"
                status="pending"
                priority="high"
                description="Migrate all <img> tags to OptimizedImage component"
                impact="40% faster initial load, better Core Web Vitals"
              />
              <RoadmapStep
                title="Step 9: PWA install prompt UI"
                status="pending"
                priority="medium"
                description="Add user-facing install prompt and UI"
                impact="Better app engagement, offline access"
              />
              <RoadmapStep
                title="Step 10: Accessibility features"
                status="pending"
                priority="medium"
                description="Integrate focus traps, keyboard nav, ARIA labels"
                impact="WCAG 2.1 compliance, better UX"
              />
              <RoadmapStep
                title="Step 11: Performance monitoring"
                status="pending"
                priority="low"
                description="Track Core Web Vitals and cache performance"
                impact="Data-driven optimization insights"
              />
              <RoadmapStep
                title="Step 12: Cleanup and documentation"
                status="pending"
                priority="low"
                description="Remove unused code, update docs"
                impact="Better maintainability"
              />
            </CardContent>
          </Card>

          {/* Priority matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Priority matrix</CardTitle>
              <CardDescription>
                Recommended implementation order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    High priority
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Step 6: React Query migration</div>
                    <div>• Step 8: OptimizedImage migration</div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Medium priority
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Step 7: Zustand stores</div>
                    <div>• Step 9: PWA install UI</div>
                    <div>• Step 10: Accessibility</div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Low priority
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Step 11: Performance monitoring</div>
                    <div>• Step 12: Cleanup</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Full implementation details are available in the roadmap document:
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                /OPTIMIZATION_ROADMAP.md
              </code>
            </CardContent>
          </Card>
        </TabsContent>

        {/* React Query Tab */}
        <TabsContent value="react-query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>React Query examples</CardTitle>
              <CardDescription>
                See how React Query simplifies data fetching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Query example */}
              <div>
                <h3 className="mb-2">Fetching data with caching</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This session list automatically caches data, refetches in the background, 
                  and handles loading/error states.
                </p>
                <SessionListWithQuery />
              </div>

              {/* Mutation example */}
              <div>
                <h3 className="mb-2">Mutations with optimistic updates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create, update, and delete with automatic cache invalidation.
                </p>
                <SessionMutationExample />
              </div>

              {/* Cache info */}
              <div className="border-t pt-6">
                <h3 className="mb-2">Cache status</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  React Query cache contains:{' '}
                  {queryClient.getQueryCache().getAll().length} queries
                </p>
                <button
                  onClick={() => queryClient.clear()}
                  className="text-sm text-destructive hover:underline"
                >
                  Clear all cache
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <OptimizedImageExample />
        </TabsContent>

        {/* PWA Tab */}
        <TabsContent value="pwa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PWA capabilities</CardTitle>
              <CardDescription>
                Progressive Web App features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2">Service Worker</h3>
                <p className="text-sm text-muted-foreground">
                  The service worker caches assets and API responses for offline access.
                </p>
              </div>

              <div>
                <h3 className="mb-2">Install prompt</h3>
                <p className="text-sm text-muted-foreground">
                  Users can install Oliwonder as a standalone app on their device.
                </p>
              </div>

              <div>
                <h3 className="mb-2">Offline support</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The app works offline by serving cached content. Try disconnecting 
                  your internet to see it in action.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Currently online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600">Currently offline - using cache</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2">Push notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Infrastructure ready for real-time notifications about round updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// Roadmap step component
function RoadmapStep({ 
  title, 
  status, 
  description, 
  priority, 
  impact 
}: { 
  title: string;
  status: 'completed' | 'pending';
  description: string;
  priority?: 'high' | 'medium' | 'low';
  impact?: string;
}) {
  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  };

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      {status === 'completed' ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <ListTodo className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm">
            {title}
          </h4>
          {priority && (
            <Badge variant="outline" className={`text-xs ${priorityColors[priority]}`}>
              {priority}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        {impact && (
          <p className="text-xs text-muted-foreground italic">
            💡 {impact}
          </p>
        )}
      </div>
    </div>
  );
}