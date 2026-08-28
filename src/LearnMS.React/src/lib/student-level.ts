import type { GetStudentProfileResult } from "@/generated/model";
import { StudentLevel } from "@/generated/model";

export function studentLevelNumber(
  level: string | null | undefined
): string | null {
  const match = /Level(\d+)/.exec(level ?? "");
  return match?.[1] ?? null;
}

export function studentCoursesHref(
  level: string | null | undefined
): string {
  const n = studentLevelNumber(level);
  return n != null ? `/courses/levels/${n}` : "/courses";
}

export function isStudentProfile(
  data: unknown
): data is GetStudentProfileResult {
  return (
    !!data &&
    typeof data === "object" &&
    "$type" in data &&
    (data as { $type?: string }).$type === "GetStudentProfileResult"
  );
}

export function profileStudentLevel(
  profile:
    | { data?: { $type?: string; level?: StudentLevel } }
    | undefined
    | null
): StudentLevel | undefined {
  if (isStudentProfile(profile?.data)) {
    return profile.data.level;
  }
  return undefined;
}
