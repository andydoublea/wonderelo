import { NavLink, Outlet, Link } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Activity,
  Eye,
  Mail,
  CheckSquare,
  Filter,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../ui/utils';

const navigationItems = [
  { label: 'Dashboard', to: '/crm', icon: LayoutDashboard, end: true },
  { label: 'Contacts', to: '/crm/contacts', icon: Users },
  { label: 'Companies', to: '/crm/companies', icon: Building2 },
  { label: 'Pipeline', to: '/crm/pipeline', icon: Kanban },
  { label: 'Activities', to: '/crm/activities', icon: Activity },
  { label: 'Visitors', to: '/crm/visitors', icon: Eye },
  { label: 'Email', to: '/crm/email', icon: Mail },
  { label: 'Tasks', to: '/crm/tasks', icon: CheckSquare },
  { label: 'Segments', to: '/crm/segments', icon: Filter },
  { label: 'Reports', to: '/crm/reports', icon: BarChart3 },
  { label: 'Settings', to: '/crm/settings', icon: Settings },
];

export default function CrmLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r bg-white">
        {/* Sidebar header */}
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-semibold tracking-tight">Wonderelo CRM</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="flex flex-col gap-0.5">
            {navigationItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t px-3 py-3">
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Admin panel
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#fafafa]">
        <Outlet />
      </main>
    </div>
  );
}
