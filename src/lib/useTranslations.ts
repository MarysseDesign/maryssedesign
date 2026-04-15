import { en } from "../i18n/en";
import { it } from "../i18n/it";

export function useTranslations(lang: string) {
  return lang === "it" ? it : en;
}
