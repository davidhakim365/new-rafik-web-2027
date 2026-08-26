import { Permission } from "@/generated/model";

/** First dashboard path an assistant can open based on their permissions. */
export function getAssistantHomePath(permissions: readonly string[]): string {
  const has = (p: string) => permissions.includes(p);

  if (has(Permission.ViewStatistics)) return "/dashboard";
  if (has(Permission.ManageStudentApples)) return "/dashboard/student-apples-scanner";
  if (has(Permission.ManageAppleRewardsStore)) return "/dashboard/apple-rewards-store";
  if (has(Permission.AddStudents)) return "/dashboard/students/add";
  if (has(Permission.ManageStudents)) return "/dashboard/students";
  if (has(Permission.ManageCourses) || has(Permission.ManageLecture) || has(Permission.ManageLectureStudents)) {
    return "/dashboard/courses";
  }
  if (has(Permission.ManageCreditCodes) || has(Permission.GenerateCreditCodes)) {
    return "/dashboard/credit-codes";
  }
  if (has(Permission.ManageFiles)) return "/dashboard/files";
  if (has(Permission.ManageAssistants)) return "/dashboard/assistants";
  if (has(Permission.ManageGrantedAccess)) return "/dashboard/granted-access";
  if (has(Permission.ManageExpirationTime)) return "/dashboard/expiration-time";

  return "/dashboard/my-profile";
}
