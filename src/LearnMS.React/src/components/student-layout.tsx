import AppErrorFallback from "@/components/app-error-fallback";
import NavBar from "@/components/navbar";
import { StudentSecurityLock } from "@/components/security/student-security-lock";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router-dom";

const StudentLayout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-clip bg-background text-foreground">
      <StudentSecurityLock />
      <NavBar />
      <ErrorBoundary
        resetKeys={[location.key]}
        FallbackComponent={AppErrorFallback}
      >
        <Outlet />
      </ErrorBoundary>
    </div>
  );
};

export default StudentLayout;
