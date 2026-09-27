import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
          <SiteFooter />
        </LanguageProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
