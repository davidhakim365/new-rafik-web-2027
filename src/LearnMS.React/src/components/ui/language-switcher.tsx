import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger
          className={cn(
            "w-[100px] rounded-full text-navbar-foreground",
            className
          )}
        >
          <SelectValue placeholder={t("navbar.language")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en-US">{t("navbar.languages.english")}</SelectItem>
          <SelectItem value="ar">{t("navbar.languages.arabic")}</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};
