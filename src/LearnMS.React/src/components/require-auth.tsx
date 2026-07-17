import { Permission } from "@/api/profile-api";
import { useGetProfile } from "@/generated/api";
import { GetAssistantProfileResult } from "@/generated/model";
import { getAssistantHomePath } from "@/lib/assistant-home";
import { toast } from "@/lib/utils";
import LoadingPage from "@/pages/shared/loading-page";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

interface RequireAuthProps {
  children: JSX.Element;
  roles: ("Student" | "Teacher" | "Assistant")[];
  permissions?: Permission[];
  /** When true, assistant needs any listed permission instead of all */
  requireAnyPermission?: boolean;
}

const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  roles,
  permissions,
  requireAnyPermission = false,
}) => {
  const { data: profile, isError, isLoading, isFetching } = useGetProfile();

  useEffect(() => {
    if (
      !isError &&
      !isLoading &&
      profile?.status == true &&
      profile.data == null
    ) {
      toast({
        title: "Login First",
        description: profile.message,
        variant: "destructive",
      });
    }
  }, [isLoading, profile, isError]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isFetching && (isError || profile?.data == null)) {
    return <Navigate to="/sign-in-sign-up" replace />;
  }

  if (
    profile?.data &&
    !roles.includes(profile.data.role as (typeof roles)[number]) &&
    profile.data.role === "Student"
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    profile?.data &&
    !roles.includes(profile.data.role as (typeof roles)[number]) &&
    (profile.data.role === "Teacher" || profile.data.role === "Assistant")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    profile?.data &&
    profile.data.$type === "GetAssistantProfileResult" &&
    permissions
  ) {
    const assistantPermissions =
      (profile.data as GetAssistantProfileResult)?.permissions ?? [];
    const allowed = requireAnyPermission
      ? permissions.some((permission) =>
          assistantPermissions.includes(permission as any)
        )
      : permissions.every((permission) =>
          assistantPermissions.includes(permission as any)
        );

    if (!allowed) {
      // Hide denied pages — send assistants to a page they can open
      return (
        <Navigate to={getAssistantHomePath(assistantPermissions)} replace />
      );
    }
  }

  return children;
};

export default RequireAuth;
