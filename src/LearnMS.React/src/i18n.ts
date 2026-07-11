import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import type { InitOptions } from "i18next";

import enTranslation from "./locales/en/translation.json";
import arTranslation from "./locales/ar/translation.json";

const options: InitOptions = {
  resources: {
    en: {
      translation: enTranslation,
    },
    ar: {
      translation: arTranslation,
    },
  },
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
  },
};

i18n.use(LanguageDetector).use(initReactI18next).init(options);

export default i18n;
