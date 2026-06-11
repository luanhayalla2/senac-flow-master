import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import senacLogo from "@/assets/senac-logo.png";
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  ListChecks,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { ROLE_LABEL } from "@/lib/senac";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const router = useRouter();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { profile, roles } = useSession();

  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const itemsPrincipal = [
    { title: "Portal", url: "/portal", icon: Inbox, show: true },
    { title: "Novo chamado", url: "/chamados/novo", icon: PlusCircle, show: true },
    { title: "Meus chamados", url: "/chamados", icon: ListChecks, show: true },
  ];
  const itemsTrabalho = [
    { title: "Fila de atendimento", url: "/fila", icon: Inbox, show: true },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, show: true },
  ];
  const itemsAdmin = [
    { title: "Administração", url: "/admin", icon: ShieldCheck, show: true },
  ];

  const initials = (profile?.nome_completo ?? "?")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <img src={senacLogo} alt="SENAC" width={36} height={36} className="h-9 w-9 rounded-md object-contain shrink-0" />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="font-display font-bold text-sm text-sidebar-foreground">Service Desk</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">SENAC-MA</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Solicitante</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsPrincipal.filter((i) => i.show).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Atendimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsTrabalho.filter((i) => i.show).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsAdmin.filter((i) => i.show).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.nome_completo ?? "..."}</div>
              <div className="text-[10px] text-sidebar-foreground/70 truncate flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {roles.map((r) => ROLE_LABEL[r]).join(", ") || "Solicitante"}
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.navigate({ to: "/auth", replace: true });
            }}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
