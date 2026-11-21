import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradientBackground from "@/components/ui/gradient-background";

const ASSISTANT_WHATSAPP = "201288335935";

type DeviceLockedScreenProps = {
  studentCode: string;
  onBack: () => void;
};

export function readLockedStudentCode(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const value = record.studentCode ?? record.StudentCode;
  return typeof value === "string" ? value.trim() : "";
}

const DeviceLockedScreen = ({
  studentCode,
  onBack,
}: DeviceLockedScreenProps) => {
  const [copied, setCopied] = useState(false);
  const code = studentCode.trim();

  const copyId = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement("textarea");
      input.value = code;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const contactAssistant = () => {
    const lines = [
      "Device locked",
      "الجهاز مقفل",
      code ? `Student ID: ${code}` : "",
      "Please unlock this device.",
    ].filter(Boolean);
    const href = `https://wa.me/${ASSISTANT_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <GradientBackground />
      <div
        dir="ltr"
        className="relative z-10 w-full max-w-md rounded-3xl border border-color2/15 bg-background/90 px-5 py-8 text-center shadow-xl shadow-color2/10 backdrop-blur-xl sm:px-8"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-color1 to-color2 text-white shadow-lg shadow-color2/25">
          <Lock className="size-7" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-heading sm:text-3xl">
          Device locked
        </h1>
        <p className="mt-1 text-base text-muted-foreground">الجهاز مقفل</p>

        <div className="mt-6 rounded-2xl border border-color2/15 bg-color2/5 px-4 py-5">
          <p className="text-sm text-muted-foreground">
            Student ID · كود الطالب
          </p>
          <p className="mt-2 break-all text-3xl font-bold tracking-wide text-color1 dark:text-color2">
            {code || "—"}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={copyId}
            disabled={!code}
            className="mt-4 rounded-xl border-color2/20 bg-background/80"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied · تم النسخ" : "Copy ID · نسخ الكود"}
          </Button>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Send this screenshot to the assistant to unlock your device.
        </p>
        <p
          className="mt-2 text-sm leading-relaxed text-muted-foreground"
          dir="rtl"
        >
          أرسل صورة هذه الصفحة للمساعد لفتح الجهاز.
        </p>

        <Button
          type="button"
          onClick={contactAssistant}
          className="mt-6 h-12 w-full whitespace-normal rounded-xl bg-gradient-to-r from-color1 to-color2 text-base font-semibold text-white hover:opacity-95"
        >
          Contact assistant · تواصل مع المساعد
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Back to login · العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
};

export default DeviceLockedScreen;
