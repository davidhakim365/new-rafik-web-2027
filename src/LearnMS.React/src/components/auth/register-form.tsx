import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterRequest, useRegisterMutation, useLoginMutation } from "@/api/auth-api";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import InputField from "./input-field";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button as ShadButton } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RegisterFormProps {
  setIsLoginView: (value: boolean) => void;
}

const RegisterForm = ({ setIsLoginView }: RegisterFormProps) => {
  const [passwordShown, setPasswordShown] = useState(false);
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequest),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      level: "" as any,
      phoneNumber: "",
      school: "",
      parentPhoneNumber: "",
      studentCode: "",
      mode: "offline", // <-- new default value
    },
  });

  const mode = registerForm.watch("mode");
  const registerErrors = registerForm.formState.errors;

  const formContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
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

  const inputVariants = useMemo(
    () => ({
      initial: {
        opacity: 0,
        x: isRTL ? -150 : 150,
        filter: "blur(10px)",
      },
      animate: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
          duration: 0.6,
          ease: "easeOut",
        },
      },
      exit: {
        opacity: 0,
        x: isRTL ? 150 : -150,
        filter: "blur(10px)",
        transition: {
          duration: 0.3,
          ease: "easeIn",
        },
      },
    }),
    [isRTL]
  );

  const gridContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
const navigate = useNavigate();

  const generateStudentCode = () => {
    return `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const onRegister = async (data: RegisterRequest) => {
    try {
      const payload: RegisterRequest = {
        ...data,
        studentCode: data.mode === "online" ? generateStudentCode() : data.studentCode,
      };

      // Register the user
      await registerMutation.mutateAsync(payload);
      
      // Automatically login after successful registration
      const loginResult = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (loginResult.status) {
  toast({
    title: t("auth.forms.errors.accountCreated"),
    description: t("auth.forms.errors.welcomeBack"),
  });

  navigate("/"); // Redirect to homepage
} else {
  toast({
    title: t("auth.forms.success.registrationTitle"),
    description: t("auth.forms.success.registrationDescription"),
  });

  setIsLoginView(true);
}
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("auth.forms.errors.registrationFailed");
      toast({
        title: t("auth.forms.errors.registrationFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Check if either mutation is pending
  const isPending = registerMutation.isPending || loginMutation.isPending;

  return (
    <motion.form
      variants={formContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onSubmit={registerForm.handleSubmit(onRegister)}
      className="space-y-6"
    >
      {/* Full Name */}
      <motion.div variants={inputVariants}>
        <InputField
          error={registerErrors?.fullName}
          register={registerForm.register}
          placeholder={t("auth.forms.fullName.placeholder")}
          name="fullName"
          label={t("auth.forms.fullName.label")}
        />
      </motion.div>

      {/* Phone Numbers Grid */}
      <motion.div variants={gridContainerVariants} className="grid grid-cols-2 gap-6">
        <motion.div variants={inputVariants}>
          <InputField
            error={registerErrors?.phoneNumber}
            register={registerForm.register}
            placeholder={t("auth.forms.phoneNumber.placeholder")}
            name="phoneNumber"
            label={t("auth.forms.phoneNumber.label")}
          />
        </motion.div>
        <motion.div variants={inputVariants}>
          <InputField
            error={registerErrors?.parentPhoneNumber}
            register={registerForm.register}
            placeholder={t("auth.forms.parentPhoneNumber.placeholder")}
            name="parentPhoneNumber"
            label={t("auth.forms.parentPhoneNumber.label")}
          />
        </motion.div>
      </motion.div>

      {/* Mode Select */}
      <motion.div variants={inputVariants}>
        <label htmlFor="mode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Study Mode
        </label>
        <Controller
          control={registerForm.control}
          name="mode"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800">
                <SelectValue placeholder="Select study mode" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="offline">{t("auth.forms.mode.options.offline")}</SelectItem>
                <SelectItem value="online">{t("auth.forms.mode.options.online")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {registerErrors?.mode && (
          <p className="text-sm text-red-400 dark:text-red-300">
            {registerErrors.mode.message}
          </p>
        )}
      </motion.div>

      {/* Student Code */}
      {mode === "offline" && (
        <motion.div variants={inputVariants}>
          <InputField
            error={registerErrors?.studentCode}
            register={registerForm.register}
            placeholder={t("auth.forms.studentCode.placeholder")}
            name="studentCode"
            label={t("auth.forms.studentCode.label")}
          />
        </motion.div>
      )}

      {/* Level and School */}
      <motion.div variants={gridContainerVariants} className="grid grid-cols-2 gap-6">
        <motion.div variants={inputVariants} className="space-y-2">
          <label
            htmlFor="level"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t("auth.forms.level.label")}
          </label>
          <Controller
            control={registerForm.control}
            name="level"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                <SelectTrigger
                  id="level"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
                    registerErrors?.level
                      ? "border-red-400 dark:border-red-300"
                      : "border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <SelectValue placeholder={t("auth.forms.level.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Level0">{t("auth.forms.level.options.level0")}</SelectItem>
                  <SelectItem value="Level1">{t("auth.forms.level.options.level1")}</SelectItem>
                  <SelectItem value="Level2">{t("auth.forms.level.options.level2")}</SelectItem>
                  <SelectItem value="Level3">{t("auth.forms.level.options.level3")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {registerErrors?.level && (
            <p className="text-sm text-red-400 dark:text-red-300">
              {registerErrors.level.message}
            </p>
          )}
        </motion.div>

        <motion.div variants={inputVariants}>
          <InputField
            error={registerErrors?.school}
            register={registerForm.register}
            placeholder={t("auth.forms.school.placeholder")}
            name="school"
            label={t("auth.forms.school.label")}
          />
        </motion.div>
      </motion.div>

      {/* Email */}
      <motion.div variants={inputVariants}>
        <InputField
          type="email"
          error={registerErrors?.email}
          register={registerForm.register}
          placeholder={t("auth.forms.email.placeholder")}
          name="email"
          label={t("auth.forms.email.label")}
        />
      </motion.div>

      {/* Password */}
      <motion.div variants={inputVariants}>
        <InputField
          error={registerErrors?.password}
          register={registerForm.register}
          placeholder={t("auth.forms.password.placeholder")}
          isPassword
          name="password"
          label={t("auth.forms.password.label")}
          passwordShown={passwordShown}
          setPasswordShown={setPasswordShown}
        />
      </motion.div>

      {/* Confirm Password */}
      <motion.div variants={inputVariants}>
        <InputField
          error={registerErrors?.confirmPassword}
          register={registerForm.register}
          placeholder={t("auth.forms.confirmPassword.placeholder")}
          isPassword
          name="confirmPassword"
          label={t("auth.forms.confirmPassword.label")}
          passwordShown={passwordShown}
          setPasswordShown={setPasswordShown}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={inputVariants}>
        <ShadButton
          type="submit"
          disabled={isPending}
          size="lg"
          className="w-full flex gap-2 items-center justify-center"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          <span>
            {isPending 
              ? (loginMutation.isPending ? "Logging in..." : "Creating account...")
              : t("auth.forms.createAccount")
            }
          </span>
        </ShadButton>
      </motion.div>
    </motion.form>
  );
};

export default RegisterForm;
