import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Shield, MessageCircle, Users, ArrowLeft, UserCheck, BookOpen, Bug, TestTube2, ListOrdered, Search, Database, Calendar, Palette, Eye, Settings, Mail, Gift } from 'lucide-react';
import { BUILD_VERSION } from '../BUILD_VERSION';
import { Badge } from './ui/badge';

interface AdminDashboardProps {
  accessToken: string;
  onBack: () => void;
}

const adminTools = [
  {
    id: 'organizers',
    title: 'Organizer management',
    icon: Users,
    route: '/admin/organizers',
    color: 'bg-purple-500',
    category: 'user-management',
  },
  {
    id: 'participants',
    title: 'Participant management',
    icon: UserCheck,
    route: '/admin/participants',
    color: 'bg-green-500',
    category: 'user-management',
  },
  {
    id: 'sessions',
    title: 'Session management',
    icon: Calendar,
    route: '/admin/sessions',
    color: 'bg-orange-500',
    category: 'user-management',
  },
  {
    id: 'participant-preview',
    title: 'Participant preview tool',
    icon: Eye,
    route: '/admin/participant-preview',
    color: 'bg-teal-500',
    category: 'debugging',
  },
  {
    id: 'debug',
    title: 'Debug tools',
    icon: Bug,
    route: '/admin/debug',
    color: 'bg-red-500',
    category: 'debugging',
  },
  {
    id: 'debug-data',
    title: 'Debug event data',
    icon: Search,
    route: '/admin/debug-data',
    color: 'bg-purple-500',
    category: 'debugging',
  },
  {
    id: 'full-dump',
    title: 'Full database dump',
    icon: Database,
    route: '/admin/full-dump',
    color: 'bg-indigo-500',
    category: 'debugging',
  },
  {
    id: 'tests',
    title: 'Test panel',
    icon: TestTube2,
    route: '/admin/tests',
    color: 'bg-cyan-500',
    category: 'debugging',
  },
  {
    id: 'theme',
    title: 'Theme manager',
    icon: Palette,
    route: '/admin/theme',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    category: 'settings',
  },
  {
    id: 'parameters',
    title: 'Parameters',
    icon: Settings,
    route: '/admin/parameters',
    color: 'bg-emerald-500',
    category: 'settings',
  },
  {
    id: 'ice-breakers',
    title: 'Ice breakers',
    icon: MessageCircle,
    route: '/admin/ice-breakers',
    color: 'bg-blue-500',
    category: 'settings',
  },
  {
    id: 'notification-texts',
    title: 'Notification texts',
    icon: Mail,
    route: '/admin/notification-texts',
    color: 'bg-indigo-500',
    category: 'settings',
  },
  {
    id: 'gift-cards',
    title: 'Gift cards',
    icon: Gift,
    route: '/admin/gift-cards',
    color: 'bg-pink-500',
    category: 'settings',
  },
  {
    id: 'blog',
    title: 'Blog management',
    icon: BookOpen,
    route: '/admin/blog',
    color: 'bg-indigo-500',
    category: 'settings',
  },
  {
    id: 'default-rules',
    title: 'Default round rules',
    icon: ListOrdered,
    route: '/admin/organizer-requests',
    color: 'bg-pink-500',
    category: 'settings',
  },
  {
    id: 'statuses-guide',
    title: 'Statuses and flags guide',
    icon: BookOpen,
    route: '/admin/statuses-guide',
    color: 'bg-orange-500',
    category: 'documentation',
  },
  {
    id: 'participant-flow',
    title: 'Participant flow',
    icon: UserCheck,
    route: '/admin/participant-flow',
    color: 'bg-blue-500',
    category: 'documentation',
  },
];

const categories = [
  { id: 'user-management', title: 'User management' },
  { id: 'debugging', title: 'Debugging' },
  { id: 'settings', title: 'Settings' },
  { id: 'documentation', title: 'Documentation' },
];

export function AdminDashboard({ accessToken, onBack }: AdminDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 
                    className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors" 
                    onClick={onBack}
                  >
                    Oliwonder admin
                  </h1>
                  <p className="text-sm text-muted-foreground">Platform administration</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {categories.map((category) => {
            const toolsInCategory = adminTools.filter((tool) => tool.category === category.id);
            
            return (
              <div key={category.id}>
                {/* Category Header */}
                <h2 className="text-2xl font-bold mb-6 text-slate-800">{category.title}</h2>
                
                {/* Category Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {toolsInCategory.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Card
                        key={tool.id}
                        className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden relative"
                        onClick={() => navigate(tool.route)}
                      >
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 group-hover:from-slate-50 group-hover:to-white transition-all duration-300" />
                        
                        {/* Content */}
                        <div className="relative p-6 flex flex-col items-center justify-center min-h-[180px] text-center">
                          {/* Icon */}
                          <div className={`${tool.color} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Title */}
                          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-primary transition-colors">
                            {tool.title}
                          </h3>
                          
                          {/* Hover Arrow */}
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="text-primary text-sm font-medium">
                              Open →
                            </div>
                          </div>
                        </div>

                        {/* Bottom Border Accent */}
                        <div className={`h-1 ${tool.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                      </Card>
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