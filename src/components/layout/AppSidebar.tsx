import { NavLink, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  Tags,
  Clock,
  CalendarDays,
  UsersRound,
  Building2,
  UserCheck,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Hoje", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Processos", icon: Briefcase, href: "/cases" },
  { title: "Casos Externos", icon: Building2, href: "/external-cases" },
  { title: "Acordos", icon: Handshake, href: "/settlements" },
  { title: "Prazos", icon: Clock, href: "/deadlines" },
  { title: "Agenda", icon: CalendarDays, href: "/agenda" },
  { title: "Contatos", icon: Users, href: "/contacts" },
  { title: "Tags", icon: Tags, href: "/tags" },
];

const settingsItems = [
  { title: "Advogados Parceiros", icon: UserCheck, href: "/partner-lawyers" },
  { title: "Equipe", icon: UsersRound, href: "/team" },
  { title: "Configurações", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">ForJus</span>
            <span className="text-xs text-sidebar-foreground/60 truncate max-w-32">
              {organization?.name || "Carregando..."}
            </span>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3",
                        location.pathname === item.href && "bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3",
                        location.pathname === item.href && "bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full">
                      {profile?.full_name || "Usuário"}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56"
              >
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
