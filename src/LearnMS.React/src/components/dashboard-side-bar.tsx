import { useLogoutMutation } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import { GlowOrb, PhysicsGrid } from "@/components/ui/physics-graphics";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { Permission } from "@/generated/model";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Apple,
  QrCode,
  Shield,
  Star,
  UserRound,
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
  permission?: Permission;
  anyPermissions?: Permission[];
  teacherOnly?: boolean;
  assistantOnly?: boolean;
};

const materialItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Statistics",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
    permission: Permission.ViewStatistics,
  },
  {
    to: "/dashboard/courses",
    label: "Courses",
    icon: BookOpen,
    match: (pathname) => pathname.startsWith("/dashboard/courses"),
    permission: Permission.ManageCourses,
  },
  {
    to: "/dashboard/important-lectures",
    label: "Important Lectures",
    icon: Star,
    match: (pathname) => pathname.startsWith("/dashboard/important-lectures"),
    permission: Permission.ManageLecture,
  },
  {
    to: "/dashboard/credit-codes",
    label: "Credit Codes",
    icon: QrCode,
    match: (pathname) => pathname.startsWith("/dashboard/credit-codes"),
    anyPermissions: [Permission.ManageCreditCodes, Permission.GenerateCreditCodes],
  },
  {
    to: "/dashboard/files",
    label: "Files",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/dashboard/files"),
    permission: Permission.ManageFiles,
  },
  {
    to: "/dashboard/questions",
    label: "Questions",
    icon: HelpCircle,
    match: (pathname) => pathname.startsWith("/dashboard/questions"),
    permission: Permission.ManageFiles,
  },
];

const userItems: NavItem[] = [
  {
    to: "/dashboard/students",
    label: "Students",
    icon: Users,
    match: (pathname) => pathname.startsWith("/dashboard/students"),
    permission: Permission.ManageStudents,
  },
  {
    to: "/dashboard/granted-access",
    label: "Granted Access",
    icon: Gift,
    match: (pathname) => pathname.startsWith("/dashboard/granted-access"),
    permission: Permission.ManageGrantedAccess,
  },
  {
    to: "/dashboard/expiration-time",
    label: "Expiration Time",
    icon: Clock,
    match: (pathname) => pathname.startsWith("/dashboard/expiration-time"),
    permission: Permission.ManageExpirationTime,
  },
  {
    to: "/dashboard/assistants",
    label: "Assistants",
    icon: Shield,
    match: (pathname) => pathname.startsWith("/dashboard/assistants"),
    permission: Permission.ManageAssistants,
  },
  {
    to: "/dashboard/assistant-rewards-scanner",
    label: "Reward Scanner",
    icon: QrCode,
    match: (pathname) => pathname.startsWith("/dashboard/assistant-rewards-scanner"),
    teacherOnly: true,
  },
  {
    to: "/dashboard/student-apples-scanner",
    label: "Apple Scanner",
    icon: Apple,
    match: (pathname) => pathname.startsWith("/dashboard/student-apples-scanner"),
    permission: Permission.ManageStudentApples,
  },
  {
    to: "/dashboard/apple-rewards-store",
    label: "Apple Rewards Store",
    icon: Gift,
    match: (pathname) => pathname.startsWith("/dashboard/apple-rewards-store"),
    permission: Permission.ManageStudentApples,
  },
  {
    to: "/dashboard/my-profile",
    label: "My Profile",
    icon: UserRound,
    match: (pathname) => pathname.startsWith("/dashboard/my-profile"),
    assistantOnly: true,
  },
  {
    to: "/dashboard/my-rewards",
    label: "My Rewards",
    icon: Apple,
    match: (pathname) => pathname.startsWith("/dashboard/my-rewards"),
    assistantOnly: true,
  },
];

function canSeeNavItem(
  item: NavItem,
  opts: {
    isTeacher: boolean;
    hasPermission: (p: Permission | string) => boolean;
    hasAnyPermission: (p: (Permission | string)[]) => boolean;
  }
) {
  if (item.teacherOnly && !opts.isTeacher) return false;
  if (item.assistantOnly && opts.isTeacher) return false;
  if (item.anyPermissions?.length) {
    return opts.hasAnyPermission(item.anyPermissions);
  }
  return !item.permission || opts.hasPermission(item.permission);
}

function NavLinkItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = item.match(pathname);
  const Icon = item.icon;

  return (
    <Link to={item.to} title={collapsed ? item.label : undefined} onClick={onNavigate}>
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

type DashboardSideBarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

const DashboardSideBar = ({
  variant = "desktop",
  onNavigate,
}: DashboardSideBarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const logoutMutation = useLogoutMutation();
  const { hasPermission, hasAnyPermission, isTeacher } = useDashboardPermissions();
  const isMobile = variant === "mobile";
  const isCollapsed = isMobile ? false : collapsed;

  const filterOpts = { isTeacher, hasPermission, hasAnyPermission };
  const visibleMaterialItems = materialItems.filter((item) =>
    canSeeNavItem(item, filterOpts)
  );
  const visibleUserItems = userItems.filter((item) => canSeeNavItem(item, filterOpts));

  const Wrapper = isMobile ? "div" : "aside";

  return (
    <Wrapper
      className={cn(
        "relative flex h-full flex-col border-color2/10 bg-card/70 backdrop-blur-xl transition-all duration-300",
        !isMobile && "shrink-0 border-r",
        !isMobile && (isCollapsed ? "w-[4.5rem]" : "w-64")
      )}
    >
      <PhysicsGrid className="opacity-40" />
      <GlowOrb
        className="absolute -left-10 top-10 h-32 w-32 opacity-30 blur-2xl"
        color="from-color2/20 to-color1/10"
      />

      <div className="relative z-10 flex h-full flex-col gap-4 p-3">
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-color2">
                Rafik
              </p>
              <p className="text-sm font-bold text-foreground">Dashboard</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!isCollapsed && !isMobile && <ThemeToggle />}
            {!isMobile && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => setCollapsed((prev) => !prev)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain">
          {visibleMaterialItems.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Materials
                </p>
              )}
              {visibleMaterialItems.map((item) => (
                <NavLinkItem
                  key={item.to}
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}

          {visibleUserItems.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Users
                </p>
              )}
              {visibleUserItems.map((item) => (
                <NavLinkItem
                  key={item.to}
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </nav>

        <Button
          variant="outline"
          className={cn(
            "w-full border-destructive/30 text-destructive hover:bg-destructive/10",
            isCollapsed && "px-0"
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Log out</span>}
        </Button>
      </div>
    </Wrapper>
  );
};

export default DashboardSideBar;
