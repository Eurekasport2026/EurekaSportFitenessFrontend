import { getRequestConfig } from "next-intl/server";
import { hasLocale, type AbstractIntlMessages } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const rawMessages = (await import(`../../messages/${locale}.json`)).default;
  const messages: AbstractIntlMessages = {};
  for (const [key, value] of Object.entries(rawMessages)) {
    messages[key.replaceAll(".", "\u2024")] = value as AbstractIntlMessages[string];
  }

  return {
    locale,
    messages,
  };
});
