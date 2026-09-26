import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/BrandMark';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const pacientesActive = pathname === '/' || pathname.startsWith('/patient/');

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link to="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <BrandMark />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-foreground">Consultas médicas</div>
            <div className="truncate text-xs text-muted-foreground">Registro de pacientes</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pacientesActive} className="h-9">
                  <Link to="/" onClick={() => setOpenMobile(false)} aria-current={pathname === '/' ? 'page' : undefined}>
                    <Users />
                    <span>Pacientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="min-w-0 px-2 pb-1">
          <div className="text-xs text-muted-foreground">Sesión iniciada como</div>
          <div className="truncate text-sm font-medium text-foreground" title={user?.email ?? undefined}>
            {user?.email}
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="h-9">
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label="Mostrar u ocultar menú" title="Mostrar u ocultar menú" />
    </Sidebar>
  );
};

export const AppShell = () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
);

// Barra superior de cada página: botón del menú lateral + breadcrumb
export const PageHeader = ({ children }: { children?: ReactNode }) => (
  <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
    <SidebarTrigger className="-ml-1 h-9 w-9" aria-label="Mostrar u ocultar menú" />
    <Separator orientation="vertical" className="mr-1 h-4" />
    {children}
  </header>
);

export const PageContent = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">{children}</div>
);
