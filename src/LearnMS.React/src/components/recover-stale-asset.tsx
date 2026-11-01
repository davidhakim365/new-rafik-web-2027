import Loading from "@/components/loading/loading";

/** Shown for the moment a stale tab reloads onto the latest published scripts. */
export function RecoverStaleAsset() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen">
      <Loading />
    </div>
  );
}
