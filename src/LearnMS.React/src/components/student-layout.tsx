import PageFallBackOnError from "@/components/fallback-on-error";
import NavBar from "@/components/navbar";
import { StudentSecurityLock } from "@/components/security/student-security-lock";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router-dom";

const StudentLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] w-screen flex-col bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <StudentSecurityLock />
      <NavBar />
      <ErrorBoundary
        resetKeys={[location.key]}
        FallbackComponent={PageFallBackOnError}
      >
        <Outlet />
      </ErrorBoundary>
    </div>
  );
};

export default StudentLayout;
