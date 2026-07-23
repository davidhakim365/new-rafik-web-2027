import PageFallBackOnError from "@/components/fallback-on-error";
import NavBar from "@/components/navbar";
import { StudentSecurityLock } from "@/components/security/student-security-lock";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router-dom";

const StudentLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
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
