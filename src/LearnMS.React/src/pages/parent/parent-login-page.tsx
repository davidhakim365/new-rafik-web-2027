import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, Phone, Users } from "lucide-react";
import {
  ParentLoginRequest,
  getParentToken,
  useParentLoginMutation,
} from "@/api/parent-api";
import InputField from "@/components/auth/input-field";
import { Button as ShadButton } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heading } from "@/components/ui/heading";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import GradientBackground from "@/components/ui/gradient-background";

const ParentLoginPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const loginMutation = useParentLoginMutation();

  const form = useForm<ParentLoginRequest>({
    resolver: zodResolver(ParentLoginRequest),
    defaultValues: {
      studentCode: "",
      phoneNumber: "",
      parentPhoneNumber: "",
    },
  });

  useEffect(() => {
    if (getParentToken()) {
      navigate("/parent/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = (data: ParentLoginRequest) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: t("parent.login.successTitle"),
          description: t("parent.login.successDescription"),
        });
        navigate("/parent/dashboard");
      },
    });
  };

  const errors = form.formState.errors;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
    >
      <GradientBackground />

      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between sm:top-6 sm:inset-x-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-color2/15 bg-background/80 px-3 py-2 text-sm text-muted-foreground backdrop-blur-md transition hover:text-foreground"
        >
          <ArrowLeft className={cn("size-4", isRTL && "rotate-180")} />
          {t("parent.backHome")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-color2/15 bg-background/90 p-6 shadow-xl shadow-color2/5 backdrop-blur-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-color1 to-color2 text-white shadow-lg shadow-color2/25">
              <Users className="size-7" strokeWidth={1.5} />
            </div>
            <Heading className="text-2xl font-bold sm:text-3xl">
              {t("parent.login.title")}
            </Heading>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {t("parent.login.description")}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              name="studentCode"
              label={t("parent.login.studentCode")}
              placeholder={t("parent.login.studentCodePlaceholder")}
              register={form.register}
              error={errors.studentCode}
              icon={<Hash className="size-4" />}
            />
            <InputField
              name="phoneNumber"
              type="tel"
              label={t("parent.login.studentPhone")}
              placeholder={t("parent.login.studentPhonePlaceholder")}
              register={form.register}
              error={errors.phoneNumber}
              icon={<Phone className="size-4" />}
            />
            <InputField
              name="parentPhoneNumber"
              type="tel"
              label={t("parent.login.parentPhone")}
              placeholder={t("parent.login.parentPhonePlaceholder")}
              register={form.register}
              error={errors.parentPhoneNumber}
              icon={<Phone className="size-4" />}
            />

            <ShadButton
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-color1 to-color2 text-base font-semibold text-white hover:opacity-95"
            >
              {loginMutation.isPending
                ? t("parent.login.submitting")
                : t("parent.login.submit")}
            </ShadButton>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground sm:text-sm">
            {t("parent.login.hint")}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentLoginPage;
