import React from "react";
import { FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const PageFallBackOnError: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === "ar";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/80 dark:from-background dark:via-background dark:to-background">
      {/* Visual Element */}
      <div className="relative mb-8 text-destructive">
        <AlertTriangle className="w-24 h-24" strokeWidth={1.5} />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Headings */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-slate-900 dark:text-slate-100">
            {t("error.title")}
          </h1>
          <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            {t("error.description")}
          </p>
        </div>

        {/* Error Alert */}
        <Alert
          dir={isRTL ? "rtl" : "ltr"}
          variant="destructive"
          className="text-left shadow-lg rounded-xl bg-destructive/10 dark:bg-destructive/10 border-destructive/30 dark:border-destructive/40"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-destructive" />
            <div className="space-y-2">
              <AlertTitle
                className={cn(
                  "text-lg font-semibold text-destructive",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {t("error.errorDetails")}
              </AlertTitle>
              <AlertDescription className="p-3 font-mono text-sm break-words whitespace-pre-wrap text-destructive">
                {error.message || t("error.noErrorDetails")}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
          <Button
            onClick={resetErrorBoundary}
            size="lg"
            className="gap-3 px-8 py-6 text-lg transition-all rounded-full shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/10 active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            <span>{t("error.reloadPage")}</span>
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="gap-3 px-8 py-6 text-lg border-2 rounded-full text-accent-foreground active:scale-[0.98] hover:bg-accent/50 dark:hover:bg-accent/30"
          >
            <Home className="w-5 h-5" />
            <span>{t("error.goToHomepage")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PageFallBackOnError;
