import { Bell, User } from 'lucide-react';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { GlobalSearchBar } from '../search/GlobalSearchBar';

export function TopNavbar() {
  const user = useAuthStore((state: any) => state.user);

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <GlobalSearchBar />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-4">
            <span className="sr-only">Your profile</span>
            <div className="h-8 w-8 rounded-full bg-surfaceHover flex items-center justify-center text-primary border border-border">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-medium leading-6 text-foreground" aria-hidden="true">
                {user?.name || 'User'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
