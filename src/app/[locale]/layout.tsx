import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eureka! Sport & Fitness | Forma. Allena. Evolvi.",
  description: "La piattaforma dedicata alla formazione dei professionisti e all'allenamento di chi vuole migliorarsi. Scopri Eureka! Academy e Eureka! Training.",
  icons: {
    icon: "/eureka-symbol.svg",
    shortcut: "/eureka-symbol.svg",
    apple: "/eureka-symbol.svg",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <LanguageProvider>
            {children}
            <SiteFooter />
          </LanguageProvider>
        </NextIntlClientProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
