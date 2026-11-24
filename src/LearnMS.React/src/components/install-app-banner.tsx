import { Button } from "@/components/ui/button";
import {
  getInstallMode,
  InstallMode,
  onInstallModeChange,
  promptInstall,
} from "@/lib/install-app";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const DISMISSED_KEY = "install-app-dismissed-at";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 4000;

function isSnoozed() {
  const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  return Date.now() - at < SNOOZE_MS;
}

/** Pages where a popup would get in the way of a timed quiz, exam, or video. */
function isBusyPage(pathname: string) {
  return /\/(quizzes|exams|lessons)\//.test(pathname);
}

export function InstallAppBanner() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<InstallMode>(getInstallMode);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(isSnoozed);

  useEffect(() => onInstallModeChange(() => setMode(getInstallMode())), []);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready || hidden || mode === "none" || isBusyPage(pathname)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setHidden(true);
  };

  const install = async () => {
    const accepted = await promptInstall();
    if (!accepted) dismiss();
  };

  return (
    <div
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-md rounded-2xl border border-color2/20 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 sm:bottom-5"
      role="dialog"
      aria-label={t("installApp.title")}
    >
      <div className="flex items-start gap-3">
        <img
          src="/icon-192.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl shadow-md"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold leading-tight">{t("installApp.title")}</p>
          <p className="text-sm text-muted-foreground">
            {t("installApp.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-m-1 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label={t("installApp.notNow")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mode === "prompt" ? (
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={dismiss}>
            {t("installApp.notNow")}
          </Button>
          <Button type="button" className="flex-1" onClick={() => void install()}>
            <Download className="me-2 h-4 w-4" />
            {t("installApp.install")}
          </Button>
        </div>
      ) : (
        <ol className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3 text-sm">
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span className="flex flex-wrap items-center gap-1">
              {t("installApp.iosStep1")}
              <Share className="h-4 w-4 text-blue-500" />
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span className="flex flex-wrap items-center gap-1">
              {t("installApp.iosStep2")}
              <PlusSquare className="h-4 w-4" />
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span>{t("installApp.iosStep3")}</span>
          </li>
        </ol>
      )}
    </div>
  );
}
