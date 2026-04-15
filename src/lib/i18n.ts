export const languages = {
  en: "English",
  it: "Italiano",
};

export const defaultLang = "en";

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in languages) return lang;
  return defaultLang;
}
