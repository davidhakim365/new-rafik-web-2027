const RELOAD_KEY = "lms-stale-asset-reload";

/** The open tab is still pointing at a script from the previous publish. */
export function isStaleAssetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Unable to preload CSS")
  );
}

/** One full reload picks up the new index. A second failure stays on the error page. */
export function reloadForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    // Private mode can block storage; still reload once.
  }
  window.location.reload();
  return true;
}

export function clearStaleAssetReload() {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // Ignore storage failures.
  }
}
