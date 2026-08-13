import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { staggeredChildSlideUpVariants } from "@/lib/animation-variants"; // Import the shared variant

interface InputFieldProps {
  type?: string;
  error?: any; // Maintained existing 'any' type
  register: any; // Maintained existing 'any' type
  placeholder?: string;
  isPassword?: boolean;
  name: string;
  icon?: React.ReactNode;
  passwordShown?: boolean;
  setPasswordShown?: (value: boolean) => void;
  label?: string;
}

const InputField = ({
  type = "text",
  error,
  register,
  placeholder,
  isPassword,
  name,
  icon,
  passwordShown,
  setPasswordShown,
  label,
}: InputFieldProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [internalPasswordShown, setInternalPasswordShown] = useState(false);
  const isPasswordVisible = passwordShown ?? internalPasswordShown;

  const togglePassword = () => {
    const next = !isPasswordVisible;
    if (setPasswordShown) {
      setPasswordShown(next);
    } else {
      setInternalPasswordShown(next);
    }
  };

  return (
    <motion.div
      className="w-full space-y-2"
      variants={staggeredChildSlideUpVariants(isRTL)} // Use the imported variant
    >
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={isPassword ? (isPasswordVisible ? "text" : "password") : type}
          className={cn(
            "w-full px-4 py-3 rounded-lg border transition-all",
            "bg-white dark:bg-zinc-800",
            "text-zinc-900 dark:text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden",
            error
              ? "border-destructive"
              : "border-zinc-200 dark:border-zinc-700",
            icon && (isRTL ? "pr-12" : "pl-12"),
            isPassword && (isRTL ? "pl-12" : "pr-12")
          )}
          placeholder={placeholder}
          {...register(name)}
        />
        {icon && (
          <div
            className={cn(
              "absolute transform -translate-y-1/2 top-1/2 pointer-events-none",
              isRTL ? "right-3" : "left-3",
              "text-zinc-400 dark:text-zinc-500"
            )}
          >
            {icon}
          </div>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className={cn(
              "absolute z-10 flex h-8 w-8 items-center justify-center rounded-md transition-colors -translate-y-1/2 top-1/2",
              "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
              isRTL ? "left-2" : "right-2"
            )}
            aria-label={
              isPasswordVisible
                ? t("auth.forms.password.hide", { defaultValue: "Hide password" })
                : t("auth.forms.password.show", { defaultValue: "Show password" })
            }
          >
            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400 dark:text-red-300">
          {error.message}
        </p>
      )}
    </motion.div>
  );
};

export default InputField;
