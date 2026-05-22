import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function AppShell() {
  const location = useLocation();
  const isLectureViewer = location.pathname.includes('/lectures/') && location.pathname.split('/').length > 2;

  // The lecture viewer has its own shell/layout, so we just render it directly
  if (isLectureViewer) {
    return (
      <div className="h-screen w-full bg-background text-foreground overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
