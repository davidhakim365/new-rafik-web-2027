import { useGetProfile } from "@/generated/api";
import { Permission } from "@/generated/model";

export function useDashboardPermissions() {
  const { data: profile } = useGetProfile();
  const isTeacher = profile?.data?.role === "Teacher";
  const assistantPermissions =
    profile?.data?.$type === "GetAssistantProfileResult"
      ? profile.data.permissions
      : [];

  const hasPermission = (permission: Permission | string) =>
    isTeacher || assistantPermissions.includes(permission as Permission);

  const hasAnyPermission = (permissions: (Permission | string)[]) =>
    isTeacher || permissions.some((p) => assistantPermissions.includes(p as Permission));

  return { isTeacher, hasPermission, hasAnyPermission, assistantPermissions };
}
