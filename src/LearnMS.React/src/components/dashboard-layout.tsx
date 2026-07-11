import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsFetching } from "@tanstack/react-query";
import { DownloadCloud } from "lucide-react";
import { Outlet } from "react-router-dom";
import DashboardSideBar from "./dashboard-side-bar";

export const DashboardLayout = () => {
  const isFetching = useIsFetching();

  return (
    <div className="relative h-screen p-2 bg-background">
      <div className="flex items-start w-full h-full border border-border rounded bg-card">
        <DashboardSideBar />
        <Separator orientation="vertical" />
        <ScrollArea className="w-full h-full p-2 bg-background">
          <Outlet />
        </ScrollArea>
      </div>
      {isFetching > 0 && (
        <div className="absolute flex items-center text-sm -translate-x-1/2 bottom-2 text-primary left-1/2 bg-card border border-border rounded-md px-3 py-1 shadow-md">
          <DownloadCloud className="mr-2 duration-300 animate-bounce" />
          Fetching
        </div>
      )}
    </div>
  );
};
