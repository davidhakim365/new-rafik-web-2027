import { useEffect } from "react";
import Loading from "@/components/loading/loading";

/** Remount after a browser/extension DOM conflict instead of trapping the student on the error page. */
export function RecoverDomError({
  resetErrorBoundary,
}: {
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    resetErrorBoundary();
  }, [resetErrorBoundary]);

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[40vh]">
      <Loading />
    </div>
  );
}
