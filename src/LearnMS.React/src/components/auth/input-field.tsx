import React from "react";
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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

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
          type={isPassword ? (passwordShown ? "text" : "password") : type}
          className={cn(
            "w-full px-4 py-3 rounded-lg border transition-all",
            "bg-white dark:bg-zinc-800",
            "text-zinc-900 dark:text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            error
              ? "border-destructive"
              : "border-zinc-200 dark:border-zinc-700",
            // Add padding based on RTL and icons
            isRTL
              ? icon
                ? "pr-12"
                : isPassword
                ? "pr-12"
                : ""
              : icon
              ? "pl-12"
              : isPassword
              ? "pr-12"
              : ""
          )}
          placeholder={placeholder}
          {...register(name)}
        />
        {icon && (
          <div
            className={cn(
              "absolute transform -translate-y-1/2 top-1/2",
              isRTL ? "right-3" : "left-3",
              "text-zinc-400 dark:text-zinc-500"
            )}
          >
            {icon}
          </div>
        )}
        {isPassword && setPasswordShown && (
          <button
            type="button"
            onClick={() => setPasswordShown(!passwordShown)}
            className={cn(
              "absolute transition-colors -translate-y-1/2 text-zinc-400 dark:text-zinc-500 top-1/2 hover:text-zinc-600 dark:hover:text-zinc-300",
              isRTL ? "left-3" : "right-3"
            )}
          >
            {passwordShown ? <EyeOff size={20} /> : <Eye size={20} />}
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
