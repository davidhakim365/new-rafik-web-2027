import { useLogoutMutation } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import { GlowOrb, PhysicsGrid } from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gift,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  QrCode,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  match: (pathname: string) => boolean;
};

const materialItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Statistics",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    to: "/dashboard/courses",
    label: "Courses",
    icon: BookOpen,
    match: (pathname) => pathname.startsWith("/dashboard/courses"),
  },
  {
    to: "/dashboard/important-lectures",
    label: "Important Lectures",
    icon: Star,
    match: (pathname) => pathname.startsWith("/dashboard/important-lectures"),
  },
  {
    to: "/dashboard/credit-codes",
    label: "Credit Codes",
    icon: QrCode,
    match: (pathname) => pathname.startsWith("/dashboard/credit-codes"),
  },
  {
    to: "/dashboard/files",
    label: "Files",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/dashboard/files"),
  },
  {
    to: "/dashboard/questions",
    label: "Questions",
    icon: HelpCircle,
    match: (pathname) => pathname.startsWith("/dashboard/questions"),
  },
];

const userItems: NavItem[] = [
  {
    to: "/dashboard/students",
    label: "Students",
    icon: Users,
    match: (pathname) => pathname.startsWith("/dashboard/students"),
  },
  {
    to: "/dashboard/granted-access",
    label: "Granted Access",
    icon: Gift,
    match: (pathname) => pathname.startsWith("/dashboard/granted-access"),
  },
  {
    to: "/dashboard/assistants",
    label: "Assistants",
    icon: Shield,
    match: (pathname) => pathname.startsWith("/dashboard/assistants"),
  },
];

function NavLinkItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const { pathname } = useLocation();
  const active = item.match(pathname);
  const Icon = item.icon;

  return (
    <Link to={item.to} title={collapsed ? item.label : undefined}>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-gradient-to-r from-color1/90 to-color2/90 text-white shadow-md shadow-color2/20"
            : "text-muted-foreground hover:bg-color2/5 hover:text-foreground"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-white" : "text-color2 group-hover:text-color2"
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>
    </Link>
  );
}

const DashboardSideBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const logoutMutation = useLogoutMutation();

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-color2/10 bg-card/70 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <PhysicsGrid className="opacity-40" />
      <GlowOrb
        className="absolute -left-10 top-10 h-32 w-32 opacity-30 blur-2xl"
        color="from-color2/20 to-color1/10"
      />

      <div className="relative z-10 flex flex-col h-full p-3 gap-4">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-color2">
                Rafik
              </p>
              <p className="text-sm font-bold text-foreground">Dashboard</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!collapsed && <ThemeToggle />}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Materials
              </p>
            )}
            {materialItems.map((item) => (
              <NavLinkItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Users
              </p>
            )}
            {userItems.map((item) => (
              <NavLinkItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        <Button
          variant="outline"
          className={cn(
            "w-full border-destructive/30 text-destructive hover:bg-destructive/10",
            collapsed && "px-0"
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Log out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSideBar;
