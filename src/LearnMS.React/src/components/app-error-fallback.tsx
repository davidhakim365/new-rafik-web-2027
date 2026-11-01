import PageFallBackOnError from "@/components/fallback-on-error";
import { RecoverDomError } from "@/components/recover-dom-error";
import { RecoverStaleAsset } from "@/components/recover-stale-asset";
import { isDomConflictError } from "@/lib/dom-errors";
import { isStaleAssetError, reloadForNewVersion } from "@/lib/stale-asset";
import { FallbackProps } from "react-error-boundary";

let recoverCount = 0;
let recoverWindowStartedAt = 0;

export default function AppErrorFallback(props: FallbackProps) {
  const now = Date.now();
  if (now - recoverWindowStartedAt > 10_000) {
    recoverCount = 0;
    recoverWindowStartedAt = now;
  }

  if (isDomConflictError(props.error) && recoverCount < 3) {
    recoverCount += 1;
    return <RecoverDomError resetErrorBoundary={props.resetErrorBoundary} />;
  }

  if (isStaleAssetError(props.error) && reloadForNewVersion()) {
    return <RecoverStaleAsset />;
  }

  return <PageFallBackOnError {...props} />;
}
