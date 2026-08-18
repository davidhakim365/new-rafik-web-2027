import { useStudentSecurityLock } from "@/hooks/use-student-security-lock";
import { useGetProfile } from "@/generated/api";

/**
 * Site-wide soft lockdown for Student role only.
 * Teachers / Assistants are unaffected.
 */
export function StudentSecurityLock() {
  const { data: profile } = useGetProfile();
  const isStudent = profile?.data?.role === "Student";
  useStudentSecurityLock(!!isStudent);
  return null;
}
