import { useEffect, useState } from "react";

const DEVTOOLS_SIZE_THRESHOLD = 160;
const CHECK_INTERVAL_MS = 800;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/** Safari / iOS WebKit report large outer/inner gaps from browser chrome, not DevTools. */
function isSafariOrIOS(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Chrome/Firefox/Edge on iOS still use WebKit and share the same quirk.
  if (isIOS) return true;

  // Desktop Safari (exclude Chromium browsers that also include "Safari" in UA).
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua);
}

function isDevToolsOpenHeuristic(): boolean {
  // Size-gap detection is unreliable on Safari/iOS — skip to avoid false locks.
  if (isSafariOrIOS()) return false;

  // Some browsers report 0 for outer dimensions; treat as unknown / not open.
  if (!window.outerWidth || !window.outerHeight) return false;

  const widthGap = window.outerWidth - window.innerWidth;
  const heightGap = window.outerHeight - window.innerHeight;

  return (
    widthGap > DEVTOOLS_SIZE_THRESHOLD || heightGap > DEVTOOLS_SIZE_THRESHOLD
  );
}

function isDevToolsShortcut(e: KeyboardEvent): boolean {
  const key = e.key.toLowerCase();
  const ctrlOrMeta = e.ctrlKey || e.metaKey;

  if (e.key === "F12") return true;

  // Ctrl/Cmd+Shift+I/J/C — Inspect / Console / Element picker
  if (ctrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(key)) return true;

  // Ctrl/Cmd+U — view source
  if (ctrlOrMeta && key === "u") return true;

  // macOS: Cmd+Option+I/J/C
  if (e.metaKey && e.altKey && ["i", "j", "c"].includes(key)) return true;

  return false;
}

/**
 * Soft security lockdown for students: blocks right-click / DevTools shortcuts,
 * discourages copy, and detects docked DevTools via window size heuristic
 * (disabled on Safari/iOS where that heuristic false-positives).
 */
export function useStudentSecurityLock(enabled: boolean) {
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDevToolsOpen(false);
      return;
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isDevToolsShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onCopyOrCut = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const checkDevTools = () => {
      setDevToolsOpen(isDevToolsOpenHeuristic());
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("copy", onCopyOrCut, true);
    document.addEventListener("cut", onCopyOrCut, true);
    window.addEventListener("resize", checkDevTools);

    document.documentElement.classList.add("student-security-lock");
    checkDevTools();
    const interval = window.setInterval(checkDevTools, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onCopyOrCut, true);
      document.removeEventListener("cut", onCopyOrCut, true);
      window.removeEventListener("resize", checkDevTools);
      window.clearInterval(interval);
      document.documentElement.classList.remove("student-security-lock");
      setDevToolsOpen(false);
    };
  }, [enabled]);

  return { devToolsOpen };
}
