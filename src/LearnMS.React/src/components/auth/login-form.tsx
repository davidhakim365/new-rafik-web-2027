import { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginRequest, useLoginMutation } from "@/api/auth-api";
import { toast } from "@/components/ui/use-toast";
import { useModalStore } from "@/store/use-modal-store";
import InputField from "./input-field";
import { useTranslation } from "react-i18next";
import { Button as ShadButton } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LoginForm = () => {
  const { openModal } = useModalStore();
  const [passwordShown, setPasswordShown] = useState(false);
  const loginMutation = useLoginMutation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequest),
  });

  const loginErrors = loginForm.formState.errors;

  // Define all animations inline
  const formContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Each input appears 150ms after the previous one
        delayChildren: 0.1, // Small initial delay
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const inputVariants = {
    initial: {
      opacity: 0,
      x: isRTL ? -150 : 150, // Large x translation
      filter: "blur(10px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      x: isRTL ? 150 : -150,
      filter: "blur(10px)",
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const onLogin = (data: LoginRequest) => {
    loginMutation.mutate(data, {
      onError: (error) => {
        if (error.code === "auth/already-device-associated") {
          openModal("error-modal", {
            render: () =>
              "Another device is linked with this account, please contact assistants to register this device for you",
          });
        } else {
          toast({
            title: t("auth.forms.errors.loginFailed"),
            description: error.message,
            variant: "destructive",
          });
        }
      },
      onSuccess: (data) => {
        toast({
          title: t("auth.forms.errors.accountCreated"),
          description: t("auth.forms.errors.welcomeBack"),
        });
        if (data.data.role !== "Student") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      },
    });
  };

  return (
    <motion.form
      variants={formContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onSubmit={loginForm.handleSubmit(onLogin)}
      className="space-y-6"
    >
      {/* 1. Email Field - FIRST */}
      <motion.div variants={inputVariants}>
        <InputField
          type="email"
          error={loginErrors?.email}
          register={loginForm.register}
          placeholder={t("auth.forms.email.placeholder")}
          name="email"
          label={t("auth.forms.email.label")}
          icon={<Mail className="w-5 h-5" />}
        />
      </motion.div>

      {/* 2. Password Field - SECOND */}
      <motion.div variants={inputVariants}>
        <InputField
          error={loginErrors?.password}
          register={loginForm.register}
          placeholder={t("auth.forms.password.placeholder")}
          isPassword
          name="password"
          label={t("auth.forms.password.label")}
          passwordShown={passwordShown}
          setPasswordShown={setPasswordShown}
        />
      </motion.div>

      {/* 3. Forgot Password Link - THIRD */}
      <motion.div variants={inputVariants} className="flex justify-end">
        <ShadButton
          type="button"
          variant="link"
          onClick={() => openModal("forgot-password-modal")}
          className="text-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
        >
          {t("auth.forms.forgotPassword")}
        </ShadButton>
      </motion.div>

      {/* 4. Submit Button - FOURTH */}
      <motion.div variants={inputVariants}>
        <ShadButton
          type="submit"
          disabled={loginMutation.isPending}
          size="lg"
          className="w-full"
        >
          <LogIn className="w-5 h-5" />
          <span>{t("auth.forms.signIn")}</span>
        </ShadButton>
      </motion.div>
    </motion.form>
  );
};

export default LoginForm;
