import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <main className="w-full flex items-center justify-center">{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card px-4 md:px-6 shadow-sm">
            <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
              <div className="flex items-center gap-2 md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1280px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
