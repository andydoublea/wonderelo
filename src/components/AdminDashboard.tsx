import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Shield, MessageCircle, Users, ArrowLeft, UserCheck, BookOpen, ListOrdered, Calendar, Palette, Settings, Mail, Gift, FileText, Eye, TrendingDown, CreditCard, ChevronRight, SwatchBook, DollarSign, KeyRound, Contact, Languages } from 'lucide-react';
import { BUILD_VERSION } from '../BUILD_VERSION';
import { Badge } from './ui/badge';

interface AdminDashboardProps {
  accessToken: string;
  onBack: () => void;
}

const adminTools = [
  {
    id: 'crm',
    title: 'CRM',
    description: 'Contacts, pipeline, email, reports',
    icon: Contact,
    route: '/crm',
    category: 'user-management',
  },
  {
    id: 'organizers',
    title: 'Organizers',
    description: 'Manage event organizers and their sessions',
    icon: Users,
    route: '/admin/organizers',
    category: 'user-management',
  },
  {
    id: 'participants',
    title: 'Participants',
    description: 'Search and manage participants across sessions',
    icon: UserCheck,
    route: '/admin/participants',
    category: 'user-management',
  },
  {
    id: 'sessions',
    title: 'Sessions',
    description: 'Browse all networking sessions',
    icon: Calendar,
    route: '/admin/sessions',
    category: 'user-management',
  },
  {
    id: 'registration-funnel',
    title: 'Registration funnel',
    description: 'Analytics on organizer signup flow',
    icon: TrendingDown,
    route: '/admin/registration-funnel',
    category: 'user-management',
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Grant subscriptions, manage credits',
    icon: CreditCard,
    route: '/admin/billing',
    category: 'user-management',
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Configure tier prices',
    icon: DollarSign,
    route: '/admin/pricing',
    category: 'settings',
  },
  {
    id: 'theme',
    title: 'Theme manager',
    description: 'Visual themes and color palettes',
    icon: Palette,
    route: '/admin/theme',
    category: 'settings',
  },
  {
    id: 'parameters',
    title: 'Parameters',
    description: 'Timing, validation, and system defaults',
    icon: Settings,
    route: '/admin/parameters',
    category: 'settings',
  },
  {
    id: 'ice-breakers',
    title: 'Ice breakers',
    description: 'Manage question pool for events',
    icon: MessageCircle,
    route: '/admin/ice-breakers',
    category: 'settings',
  },
  {
    id: 'notification-texts',
    title: 'Notification texts',
    description: 'SMS and email templates',
    icon: Mail,
    route: '/admin/notification-texts',
    category: 'settings',
  },
  {
    id: 'gift-cards',
    title: 'Gift cards',
    description: 'Create and manage promo codes',
    icon: Gift,
    route: '/admin/gift-cards',
    category: 'settings',
  },
  {
    id: 'access-passwords',
    title: 'Access passwords',
    description: 'Manage site access codes and logs',
    icon: KeyRound,
    route: '/admin/access-passwords',
    category: 'settings',
  },
  {
    id: 'leads',
    title: 'Lead submissions',
    description: 'Lead magnet form entries',
    icon: FileText,
    route: '/admin/leads',
    category: 'settings',
  },
  {
    id: 'blog',
    title: 'Blog',
    description: 'Manage blog posts and content',
    icon: BookOpen,
    route: '/admin/blog',
    category: 'settings',
  },
  {
    id: 'translations',
    title: 'Translations',
    description: 'Manage languages and translations',
    icon: Languages,
    route: '/admin/translations',
    category: 'settings',
  },
  {
    id: 'default-rules',
    title: 'Default round rules',
    description: 'Organizer request defaults',
    icon: ListOrdered,
    route: '/admin/organizer-requests',
    category: 'settings',
  },
  {
    id: 'page-preview',
    title: 'Page preview',
    description: 'Preview public-facing pages',
    icon: Eye,
    route: '/admin/page-preview',
    category: 'settings',
  },
  {
    id: 'statuses-guide',
    title: 'Statuses guide',
    description: 'Reference for all status flags',
    icon: BookOpen,
    route: '/admin/statuses-guide',
    category: 'documentation',
  },
  {
    id: 'participant-flow',
    title: 'Participant flow',
    description: 'Status transition documentation',
    icon: UserCheck,
    route: '/admin/participant-flow',
    category: 'documentation',
  },
  {
    id: 'style-guide',
    title: 'Style guide',
    description: 'Buttons, typography, colors, patterns',
    icon: SwatchBook,
    route: '/admin/style-guide',
    category: 'documentation',
  },
];

const categories = [
  { id: 'user-management', title: 'User management' },
  { id: 'settings', title: 'Settings' },
  { id: 'documentation', title: 'Documentation' },
];

export function AdminDashboard({ accessToken, onBack }: AdminDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container mx-auto" style={{ padding: '12px 24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h1
                className="text-lg font-semibold cursor-pointer"
                onClick={onBack}
                style={{ letterSpacing: '-0.01em' }}
              >
                Admin
              </h1>
              <Badge variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                {BUILD_VERSION}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto" style={{ padding: '24px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {categories.map((category) => {
            const toolsInCategory = adminTools.filter((tool) => tool.category === category.id);

            return (
              <div key={category.id}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginBottom: '8px', paddingLeft: '4px' }}>
                  {category.title}
                </h2>

                <div className="border rounded-lg overflow-hidden" style={{ background: 'white' }}>
                  {toolsInCategory.map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(tool.route)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: index < toolsInCategory.length - 1 ? '1px solid #f0f0f0' : 'none',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f8f8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f4f4f5',
                          flexShrink: 0,
                        }}>
                          <Icon className="text-muted-foreground" style={{ width: '16px', height: '16px' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="text-sm font-medium" style={{ lineHeight: '1.3' }}>{tool.title}</div>
                          <div className="text-xs text-muted-foreground" style={{ lineHeight: '1.3' }}>{tool.description}</div>
                        </div>
                        <ChevronRight className="text-muted-foreground" style={{ width: '14px', height: '14px', flexShrink: 0, opacity: 0.4 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
