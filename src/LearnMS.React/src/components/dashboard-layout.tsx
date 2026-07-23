import { GlowOrb, PhysicsGrid } from "@/components/ui/physics-graphics";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsFetching } from "@tanstack/react-query";
import { DownloadCloud, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardSideBar from "./dashboard-side-bar";

export const DashboardLayout = () => {
  const isFetching = useIsFetching();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-dashboard pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:flex-row">
      <PhysicsGrid className="opacity-50" />
      <GlowOrb
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 opacity-25 blur-3xl"
        color="from-color2/20 to-transparent"
      />

      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-color2/10 bg-card/80 px-3 py-2.5 backdrop-blur-md lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-color2">
            Rafik
          </p>
          <p className="text-sm font-bold text-foreground">Dashboard</p>
        </div>
        <ThemeToggle />
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(85vw,280px)] p-0">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <DashboardSideBar
            variant="mobile"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex min-h-0 flex-1 gap-0 p-2 md:p-3">
        <div className="hidden h-full shrink-0 lg:block">
          <DashboardSideBar variant="desktop" />
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-color2/10 bg-background/60 shadow-xl backdrop-blur-md">
          <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
            <Outlet />
          </div>
        </main>
      </div>

      {isFetching > 0 && (
        <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-color2/20 bg-card/90 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur-md">
          <DownloadCloud className="h-4 w-4 animate-bounce text-color2" />
          Syncing data...
        </div>
      )}
    </div>
  );
};
