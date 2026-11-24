type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallMode = "prompt" | "ios" | "none";

const CHANGE_EVENT = "install-app-change";
let deferredPrompt: BeforeInstallPromptEvent | null = null;

function publish() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function isInstalledApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getInstallMode(): InstallMode {
  if (isInstalledApp()) return "none";
  if (deferredPrompt) return "prompt";
  if (isIos()) return "ios";
  return "none";
}

export function onInstallModeChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Opens Chrome's own install dialog. Returns true when the user accepted. */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null;
  publish();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === "accepted";
}

/**
 * Chrome fires its install event once, early. Call this before React mounts
 * so the event is kept for the banner instead of being lost.
 */
export function setupInstallApp() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    publish();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    publish();
  });

  // Chrome only offers install once a service worker controls the site.
  if ("serviceWorker" in navigator) {
    const register = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }
}
