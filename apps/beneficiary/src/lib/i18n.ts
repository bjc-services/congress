import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { z } from "zod/v4";

import enTranslation from "../../../../locals/en/translation.json";
import heTranslation from "../../../../locals/he/translation.json";

// Zod error map to ensure all errors use translation keys
const zodErrorMap: z.ZodErrorMap = (issue) => {
  // If a custom message was provided, use it (these are our translation keys)
  if (issue.message) {
    return { message: issue.message };
  }

  // Map Zod error codes to translation keys
  switch (issue.code) {
    case "invalid_type":
      if (issue.expected === "string") return { message: "zod_invalid_string" };
      if (issue.expected === "number") return { message: "zod_invalid_number" };
      if (issue.expected === "date") return { message: "zod_invalid_date" };
      return { message: "zod_invalid_type" };
    case "too_small":
      if (issue.origin === "string") return { message: "zod_string_too_short" };
      if (issue.origin === "number") return { message: "zod_number_too_small" };
      if (issue.origin === "array") return { message: "zod_array_too_short" };
      return { message: "zod_too_small" };
    case "too_big":
      if (issue.origin === "string") return { message: "zod_string_too_long" };
      if (issue.origin === "number") return { message: "zod_number_too_big" };
      if (issue.origin === "array") return { message: "zod_array_too_long" };
      return { message: "zod_too_big" };
    case "invalid_format":
      if (issue.format === "email") return { message: "zod_invalid_email" };
      if (issue.format === "url") return { message: "zod_invalid_url" };
      return { message: "zod_invalid_string_format" };
    case "invalid_value":
      return { message: "zod_invalid_option" };
    case "custom":
      return { message: "zod_validation_error" };
    default:
      return { message: "zod_validation_error" };
  }
};

// Set the global Zod error map
z.config({ customError: zodErrorMap });

export const resources = {
  en: {
    translation: enTranslation,
  },
  he: {
    translation: heTranslation,
  },
} as const;

export const defaultNS = "translation";

const i18nCookieName = "i18nextLng";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "he",
    supportedLngs: ["he", "en"],
    detection: {
      order: ["cookie"],
      lookupCookie: i18nCookieName,
      caches: ["cookie"],
      cookieMinutes: 60 * 24 * 365,
    },
    interpolation: { escapeValue: false },
  });

export const RTL_LANGUAGES = ["he", "ar", "fa", "ur"] as const;

export const getDirection = (language: string): "rtl" | "ltr" => {
  return RTL_LANGUAGES.some((rtl) => language.startsWith(rtl)) ? "rtl" : "ltr";
};

export const setSSRLanguage = createIsomorphicFn().server(async () => {
  const language = getCookie(i18nCookieName);
  await i18n.changeLanguage(language ?? "he");
});

export default i18n;
