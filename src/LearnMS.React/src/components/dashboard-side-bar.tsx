import { useLogoutMutation } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { File, LogOut, QrCode, School, Shield, Star, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

const DashboardSideBar = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const logoutMutation = useLogoutMutation();
  const { pathname } = useLocation();

  const is = (path: string) => pathname.startsWith(`/dashboard${path}`);

  return (
    <div className="relative">
      {!isSidebarVisible && (
        <Button
          className="fixed z-50 top-2 left-2"
          onClick={() => setSidebarVisible(true)}
          style={{ position: "fixed", zIndex: 9999 }} // Ensure it is on top
        >
          Show Sidebar
        </Button>
      )}
      {isSidebarVisible && (
        <div className="flex">
          <div className="border-r border-border self-stretch flex flex-col gap-4 p-2 max-w-[16rem] bg-card">
            <div className="flex items-center justify-between mb-2">
              <Button onClick={() => setSidebarVisible(false)}>
                Hide Sidebar
              </Button>
              <ThemeToggle />
            </div>
            <div className="space-y-2 ">
              <h2 className="text-2xl font-bold text-foreground">Materials</h2>
              <div className="space-y-1">
                <Link to="/dashboard">
                  <Button
                    variant={pathname == "/dashboard" ? "default" : "secondary"}
                    className={cn("inline-flex justify-start w-full")}
                  >
                    <School className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link to="/dashboard/courses">
                  <Button
                    variant={is("/courses") ? "default" : "secondary"}
                    className={cn("inline-flex justify-start w-full")}
                  >
                    <School className="w-4 h-4 mr-2" />
                    Courses
                  </Button>
                </Link>
                <Link to="/dashboard/important-lectures">
                  <Button
                    variant={
                      is("/important-lectures") ? "default" : "secondary"
                    }
                    className={cn("inline-flex justify-start w-full")}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Important Lectures
                  </Button>
                </Link>
                <Link to="/dashboard/credit-codes">
                  <Button
                    variant={is("/credit-codes") ? "default" : "secondary"}
                    className="inline-flex justify-start w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Credit Codes
                  </Button>
                </Link>
                <Link to="/dashboard/files">
                  <Button
                    variant={is("/files") ? "default" : "secondary"}
                    className="inline-flex justify-start w-full"
                  >
                    <File className="w-4 h-4 mr-2" />
                    Files
                  </Button>
                </Link>
                <Link to="/dashboard/questions">
                  <Button
                    variant={is("/questions") ? "default" : "secondary"}
                    className="inline-flex justify-start w-full"
                  >
                    <QuestionMarkCircledIcon className="w-4 h-4 mr-2" />
                    Questions
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Users</h2>
              <div className="space-y-1">
                <Link to="/dashboard/students">
                  <Button
                    variant={is("/students") ? "default" : "secondary"}
                    className="inline-flex justify-start w-full"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Students
                  </Button>
                </Link>
              </div>
              <div className="space-y-1">
                <Link to="/dashboard/assistants">
                  <Button
                    variant={is("/assistants") ? "default" : "secondary"}
                    className="inline-flex justify-start w-full"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Assistants
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-auto">
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSideBar;
