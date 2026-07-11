import { Permission } from "@/api/profile-api";
import { useGetProfile } from "@/generated/api";
import { GetAssistantProfileResult } from "@/generated/model";
import { toast } from "@/lib/utils";
import LoadingPage from "@/pages/shared/loading-page";
import PermissionDeniedPage from "@/pages/shared/permission-denied-page";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

interface RequireAuthProps {
  children: JSX.Element;
  roles: ("Student" | "Teacher" | "Assistant")[];
  permissions?: Permission[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  roles,
  permissions,
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
    return <Navigate to='/sign-in-sign-up' />;
  }

  if (
    profile?.data &&
    !roles.includes(profile.data.role) &&
    profile.data.role === "Student"
  ) {
    return <Navigate to='/' />;
  }

  if (
    profile?.data &&
    !roles.includes(profile.data.role) &&
    (profile.data.role === "Teacher" || profile.data.role === "Assistant")
  ) {
    return <Navigate to='/dashboard' />;
  }

  if (
    profile?.data &&
    profile.data.$type === "GetAssistantProfileResult" &&
    permissions &&
    !permissions.every((permission) =>
      (profile.data as GetAssistantProfileResult)?.permissions.includes(
        permission as any
      )
    )
  ) {
    return <PermissionDeniedPage permissions={permissions} />;
  }

  return children;
};

export default RequireAuth;
