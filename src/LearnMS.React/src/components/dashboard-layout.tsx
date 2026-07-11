import { GlowOrb, PhysicsGrid } from "@/components/ui/physics-graphics";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsFetching } from "@tanstack/react-query";
import { DownloadCloud } from "lucide-react";
import { Outlet } from "react-router-dom";
import DashboardSideBar from "./dashboard-side-bar";

export const DashboardLayout = () => {
  const isFetching = useIsFetching();

  return (
    <div className="relative h-screen overflow-hidden bg-dashboard">
      <PhysicsGrid className="opacity-50" />
      <GlowOrb
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 opacity-25 blur-3xl"
        color="from-color2/20 to-transparent"
      />

      <div className="relative z-10 flex h-full gap-0 p-2 md:p-3">
        <DashboardSideBar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-color2/10 bg-background/60 shadow-xl backdrop-blur-md">
          <ScrollArea className="h-full w-full">
            <Outlet />
          </ScrollArea>
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
