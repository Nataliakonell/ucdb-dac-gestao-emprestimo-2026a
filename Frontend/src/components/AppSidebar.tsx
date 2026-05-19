import { useState, useEffect } from "react";
import {
  Monitor,
  ArrowRightLeft,
  Settings,
  Package,
  LogOut,
  Bell,
  ChevronsUpDown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const [hasPendingNotification, setHasPendingNotification] = useState(false);

  const getFirstName = (fullName?: string) => {
    if (!fullName) return "";
    return fullName.trim().split(" ")[0];
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    if (!user) return;
    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem("resource_buddy_token");
        const res = await fetch(`${apiUrl}/loans`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const loans = await res.json();
          // Exibe o ponto vermelho pulsante se houver qualquer empréstimo no status pendente
          const pending = loans.some((l: any) => l.status === "pendente");
          setHasPendingNotification(pending);
        }
      } catch (err) {
        console.error("Erro ao verificar notificações:", err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const mainItems = [];

  if (user?.role === "Administrador") {
    mainItems.push(
      { title: "Equipamentos", url: "/equipamentos", icon: Monitor },
      { title: "Notificação", url: "/emprestimos", icon: ArrowRightLeft },
      { title: "Aprovações", url: "/notificacoes", icon: Bell }
    );
  } else {
    mainItems.push(
      { title: "Solicitar Equipamentos", url: "/equipamentos", icon: Monitor },
      { title: "Notificação", url: "/emprestimos", icon: ArrowRightLeft }
    );
  }

  const systemItems = [
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-sidebar-foreground">
                SmartResource+
              </span>
              <span className="text-[11px] text-sidebar-foreground/60">
                Gestão de Recursos
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} className="w-full flex items-center relative" end>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? (
                        <div className="flex items-center justify-between w-full ml-2 min-w-0">
                          <span className="truncate">{item.title}</span>
                          {item.title === "Notificação" && hasPendingNotification && (
                            <span className="relative flex h-2 w-2 mr-1 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                      ) : (
                        item.title === "Notificação" && hasPendingNotification && (
                          <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                        )
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center justify-between outline-none"
                    tooltip={user.name}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
                        {getInitials(user.name)}
                      </div>
                      {!collapsed && (
                        <div className="flex flex-col text-left min-w-0">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {getFirstName(user.name)}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground">
                            {user.sector}
                          </span>
                        </div>
                      )}
                    </div>
                    {!collapsed && <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side={collapsed ? "right" : "top"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 py-1">
                      <p className="text-sm font-bold leading-none text-foreground">{user.name}</p>
                      <p className="text-[11px] leading-none text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">Tipo de Conta</span>
                    <span className="text-xs font-semibold text-foreground bg-primary/10 text-primary self-start px-2 py-0.5 rounded mt-0.5">{user.role}</span>
                  </div>
                  <div className="px-2 py-1.5 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">Setor</span>
                    <span className="text-xs font-semibold text-foreground">{user.sector}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-semibold py-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
