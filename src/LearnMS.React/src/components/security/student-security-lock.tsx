import { useStudentSecurityLock } from "@/hooks/use-student-security-lock";
import { useGetProfile } from "@/generated/api";
import { ShieldAlert } from "lucide-react";

/**
 * Site-wide soft lockdown for Student role only.
 * Teachers / Assistants are unaffected.
 */
export function StudentSecurityLock() {
  const { data: profile } = useGetProfile();
  const isStudent = profile?.data?.role === "Student";
  const { devToolsOpen } = useStudentSecurityLock(!!isStudent);

  if (!isStudent || !devToolsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 p-6 text-foreground backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="devtools-lock-title"
      aria-describedby="devtools-lock-desc"
    >
      <div className="max-w-md space-y-4 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
        <h2 id="devtools-lock-title" className="text-2xl font-semibold">
          Developer tools detected
        </h2>
        <p id="devtools-lock-desc" className="text-muted-foreground">
          Close Inspect / Developer Tools to continue using the site. Right-click
          and DevTools shortcuts are disabled for students.
        </p>
      </div>
    </div>
  );
}
