import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Video, BrainCircuit, Settings, LogOut } from 'lucide-react';
import { cn } from '../../design-system/utils';
import { useAuthStore } from '../../infrastructure/stores/authStore';

export function Sidebar() {
  const logout = useAuthStore((state: any) => state.logout);

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', to: '/courses', icon: BookOpen },
    { name: 'Lectures', to: '/lectures', icon: Video },
    { name: 'AI Workspace', to: '/workspace', icon: BrainCircuit },
  ];

  return (
    <div className="flex h-full w-60 flex-col border-r border-border/40 bg-background">
      <div className="flex h-14 shrink-0 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Classroom
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) => cn(
                "group flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-secondary/40 text-foreground" 
                  : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-2.5 h-4 w-4 flex-shrink-0 transition-colors",
                  "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="shrink-0 p-3">
        <div className="space-y-0.5">
          <NavLink 
            to="/settings"
            className={({ isActive }: { isActive: boolean }) => cn(
              "group flex w-full items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors",
              isActive 
                ? "bg-secondary/40 text-foreground" 
                : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
            )}
          >
            <Settings className="mr-2.5 h-4 w-4 flex-shrink-0" />
            Settings
          </NavLink>
          <button 
            onClick={logout}
            className="group flex w-full items-center px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="mr-2.5 h-4 w-4 flex-shrink-0" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
