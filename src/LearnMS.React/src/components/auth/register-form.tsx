import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkPublicStudentAvailability,
  RegisterRequest,
  useRegisterMutation,
  useLoginMutation,
} from "@/api/auth-api";
import { toast } from "@/components/ui/use-toast";
import {
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

const STEPS = [
  { id: 0, titleKey: "Study mode" },
  { id: 1, titleKey: "Student info" },
  { id: 2, titleKey: "Account" },
] as const;

const stepFields: Record<number, (keyof RegisterRequest)[]> = {
  0: ["mode", "studentCode"],
  1: ["fullName", "phoneNumber", "parentPhoneNumber", "school", "level"],
  2: ["email", "password", "confirmPassword"],
};

const generateStudentCode = () => {
  return `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
};

const RegisterForm = ({ setIsLoginView }: RegisterFormProps) => {
  const [passwordShown, setPasswordShown] = useState(false);
  const [step, setStep] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

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
      mode: "offline",
    },
    mode: "onTouched",
  });

  const mode = registerForm.watch("mode");
  const registerErrors = registerForm.formState.errors;
  const isPending = registerMutation.isPending || loginMutation.isPending;
  const isBusy = isPending || checkingAvailability;

  const formContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
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
        x: isRTL ? -80 : 80,
        filter: "blur(8px)",
      },
      animate: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
          duration: 0.45,
          ease: "easeOut",
        },
      },
      exit: {
        opacity: 0,
        x: isRTL ? 80 : -80,
        filter: "blur(8px)",
        transition: {
          duration: 0.25,
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
        staggerChildren: 0.08,
      },
    },
  };

  const goNext = async () => {
    const valid = await registerForm.trigger(stepFields[step], {
      shouldFocus: true,
    });
    if (!valid) return;

    const values = registerForm.getValues();

    try {
      setCheckingAvailability(true);

      if (step === 0 && values.mode === "offline" && values.studentCode) {
        const availability = await checkPublicStudentAvailability({
          studentCode: values.studentCode.trim(),
        });
        if (availability?.studentCodeTaken) {
          registerForm.setError("studentCode", {
            type: "manual",
            message: "ID already assigned with another account",
          });
          return;
        }
      }

      if (step === 1 && values.phoneNumber) {
        const availability = await checkPublicStudentAvailability({
          phoneNumber: values.phoneNumber.trim(),
        });
        if (availability?.phoneNumberTaken) {
          registerForm.setError("phoneNumber", {
            type: "manual",
            message: "Phone number already assigned with another account",
          });
          return;
        }
      }
    } catch {
      return;
    } finally {
      setCheckingAvailability(false);
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onRegister = async (data: RegisterRequest) => {
    const studentCode =
      data.mode === "online" ? generateStudentCode() : data.studentCode;

    try {
      setCheckingAvailability(true);
      const availability = await checkPublicStudentAvailability({
        studentCode: data.mode === "offline" ? studentCode : undefined,
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.trim(),
      });

      if (availability?.studentCodeTaken) {
        registerForm.setError("studentCode", {
          type: "manual",
          message: "ID already assigned with another account",
        });
        setStep(0);
        return;
      }

      if (availability?.phoneNumberTaken) {
        registerForm.setError("phoneNumber", {
          type: "manual",
          message: "Phone number already assigned with another account",
        });
        setStep(1);
        return;
      }

      if (availability?.emailTaken) {
        registerForm.setError("email", {
          type: "manual",
          message: "Email already exists",
        });
        return;
      }
    } catch {
      return;
    } finally {
      setCheckingAvailability(false);
    }

    try {
      const payload: RegisterRequest = {
        ...data,
        studentCode,
      };

      await registerMutation.mutateAsync(payload);

      const loginResult = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (loginResult.status) {
        toast({
          title: t("auth.forms.errors.accountCreated"),
          description: t("auth.forms.errors.welcomeBack"),
        });
        navigate("/");
      } else {
        toast({
          title: t("auth.forms.success.registrationTitle"),
          description: t("auth.forms.success.registrationDescription"),
        });
        setIsLoginView(true);
      }
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (error as { message?: string })?.message ||
        t("auth.forms.errors.registrationFailed");
      toast({
        title: t("auth.forms.errors.registrationFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.form
      variants={formContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onSubmit={registerForm.handleSubmit(onRegister)}
      className="space-y-5"
    >
      <motion.ol
        variants={inputVariants}
        className="grid grid-cols-3 gap-2"
      >
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-lg border px-2 py-2 text-center transition-colors",
                active && "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800",
                done && "border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30",
                !active && !done && "border-zinc-200 dark:border-zinc-700"
              )}
            >
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {s.id + 1}
              </p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {s.titleKey}
              </p>
            </li>
          );
        })}
      </motion.ol>

      <fieldset disabled={isBusy} className="space-y-5">
        {step === 0 && (
          <>
            <motion.div variants={inputVariants}>
              <label
                htmlFor="mode"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
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
                      <SelectItem value="offline">
                        {t("auth.forms.mode.options.offline")}
                      </SelectItem>
                      <SelectItem value="online">
                        {t("auth.forms.mode.options.online")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Online students get an ID automatically.
              </p>
              {registerErrors?.mode && (
                <p className="text-sm text-red-400 dark:text-red-300">
                  {registerErrors.mode.message}
                </p>
              )}
            </motion.div>

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
          </>
        )}

        {step === 1 && (
          <>
            <motion.div variants={inputVariants}>
              <InputField
                error={registerErrors?.fullName}
                register={registerForm.register}
                placeholder={t("auth.forms.fullName.placeholder")}
                name="fullName"
                label={t("auth.forms.fullName.label")}
              />
            </motion.div>

            <motion.div
              variants={gridContainerVariants}
              className="grid grid-cols-2 gap-4"
            >
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

            <motion.div
              variants={gridContainerVariants}
              className="grid grid-cols-2 gap-4"
            >
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue=""
                    >
                      <SelectTrigger
                        id="level"
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
                          registerErrors?.level
                            ? "border-red-400 dark:border-red-300"
                            : "border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        <SelectValue
                          placeholder={t("auth.forms.level.placeholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Level0">
                          {t("auth.forms.level.options.level0")}
                        </SelectItem>
                        <SelectItem value="Level1">
                          {t("auth.forms.level.options.level1")}
                        </SelectItem>
                        <SelectItem value="Level2">
                          {t("auth.forms.level.options.level2")}
                        </SelectItem>
                        <SelectItem value="Level3">
                          {t("auth.forms.level.options.level3")}
                        </SelectItem>
                        <SelectItem value="Level4">
                          {t("auth.forms.level.options.level4")}
                        </SelectItem>
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
          </>
        )}

        {step === 2 && (
          <>
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
          </>
        )}
      </fieldset>

      <motion.div
        variants={inputVariants}
        className="flex items-center justify-between gap-2 pt-1"
      >
        <ShadButton
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 0 || isBusy}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </ShadButton>

        {step < STEPS.length - 1 ? (
          <ShadButton
            type="button"
            onClick={goNext}
            disabled={isBusy}
            className="gap-1"
          >
            {checkingAvailability ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </ShadButton>
        ) : (
          <ShadButton
            type="submit"
            disabled={isBusy}
            className="flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            <span>
              {checkingAvailability
                ? "Checking..."
                : isPending
                  ? loginMutation.isPending
                    ? "Logging in..."
                    : "Creating account..."
                  : t("auth.forms.createAccount")}
            </span>
          </ShadButton>
        )}
      </motion.div>
    </motion.form>
  );
};

export default RegisterForm;
