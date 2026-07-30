import { Button } from "@/components/ui/button";
import { useGetProfile } from "@/generated/api";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

function chooseHomeworkEmbedUrl(formUrl: string) {
  try {
    const url = new URL(formUrl);
    url.searchParams.set("embedded", "true");
    return url.toString();
  } catch {
    const sep = formUrl.includes("?") ? "&" : "?";
    return `${formUrl}${sep}embedded=true`;
  }
}

/**
 * Google's sign-in pages refuse to run inside iframes and often navigate the
 * top window away. Sandbox blocks top navigation; popups let students sign in
 * with Google and keep our site open.
 */
const FORM_IFRAME_SANDBOX = [
  "allow-scripts",
  "allow-same-origin",
  "allow-forms",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-modals",
].join(" ");

type ChooseHomeworkFormEmbedProps = {
  formUrl: string;
  title?: string;
  className?: string;
  iframeClassName?: string;
};

export function ChooseHomeworkFormEmbed({
  formUrl,
  title,
  className,
  iframeClassName = "h-[70vh] min-h-[480px] w-full border-0",
}: ChooseHomeworkFormEmbedProps) {
  const { t } = useTranslation();
  const { data: profile } = useGetProfile();
  const studentCode =
    profile?.data?.$type === "GetStudentProfileResult"
      ? profile.data.studentCode
      : undefined;
  const embedUrl = chooseHomeworkEmbedUrl(formUrl);
  const heading = title ?? t("lectures.chooseHomeworkForm");

  const openGoogleSignInPopup = () => {
    const width = Math.min(520, window.screen.availWidth - 40);
    const height = Math.min(720, window.screen.availHeight - 40);
    const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
    window.open(
      embedUrl,
      "choose-homework-google-form",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
    );
  };

  return (
    <div className={className ?? "space-y-3"}>
      {studentCode && (
        <div className="rounded-lg border border-color2/20 bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {t("lectures.enterStudentIdInForm")}:{" "}
          </span>
          <span className="font-mono font-semibold text-foreground">
            {studentCode}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t("lectures.chooseHomeworkGoogleSignInHint")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={openGoogleSignInPopup}
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          {t("lectures.chooseHomeworkOpenWithGoogle")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-color2/20 bg-background">
        <iframe
          title={heading}
          src={embedUrl}
          className={iframeClassName}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox={FORM_IFRAME_SANDBOX}
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
