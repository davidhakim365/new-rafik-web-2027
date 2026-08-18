import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
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
 * Soft security lockdown for students: blocks right-click / DevTools shortcuts
 * and discourages copy. Does not detect open DevTools — that heuristic
 * false-positives on many real devices.
 */
export function useStudentSecurityLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

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

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("copy", onCopyOrCut, true);
    document.addEventListener("cut", onCopyOrCut, true);

    document.documentElement.classList.add("student-security-lock");

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onCopyOrCut, true);
      document.removeEventListener("cut", onCopyOrCut, true);
      document.documentElement.classList.remove("student-security-lock");
    };
  }, [enabled]);
}
