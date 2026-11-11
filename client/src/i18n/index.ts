import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ko from "./locales/ko.json";
import vi from "./locales/vi.json";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "ko", label: "한국어", short: "KO" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "language";

const isSupported = (code: string | null): code is LanguageCode => LANGUAGES.some((l) => l.code === code);

// Order: language the user picked before -> browser language -> English.
function detectLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    // localStorage can be blocked; ignore and fall through
  }
  const browser = navigator.language.slice(0, 2);
  return isSupported(browser) ? browser : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
    ko: { translation: ko },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes output
});

// Keep <html lang>, the tab title and localStorage in sync with the selected language.
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.title = i18n.t("app.name");
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});
document.documentElement.lang = i18n.language;
document.title = i18n.t("app.name");

export default i18n;
