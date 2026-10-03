"use client";

import Image from "next/image";
import { HomeAction } from "@/components/features/home/HomeAction";
import { Link } from "@/i18n/routing";
import { T, useLanguage } from "./LanguageProvider";
import { SocialIcon } from "./SocialIcon";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const { language } = useLanguage();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={language === "en" ? "Eureka! Sport & Fitness Academy — Home" : "Eureka! Sport & Fitness Academy — Inizio"}>
          <Image
            src="/images/logo/eureka-logo-bianco.png"
            alt="Eureka! Sport & Fitness Academy"
            width={126}
            height={40}
            className={styles.footerLogoImage}
          />
        </Link>
        <nav aria-label={language === "en" ? "Legal information" : "Informazioni legali"}>
          <HomeAction kind="legal" title={language === "en" ? "Privacy Policy" : "Informativa Privacy"}>{language === "en" ? "Privacy Policy" : "Informativa Privacy"}</HomeAction>
          <HomeAction kind="legal" title={language === "en" ? "Terms of Service" : "Termini di Servizio"}>{language === "en" ? "Terms of Service" : "Termini di Servizio"}</HomeAction>
          <HomeAction kind="legal" title={language === "en" ? "Cookie Policy" : "Informativa Cookie"}>{language === "en" ? "Cookie Policy" : "Informativa Cookie"}</HomeAction>
        </nav>
        <div className={styles.social} aria-label={language === "en" ? "Eureka! Sport & Fitness social media" : "Eureka! Sport & Fitness social"}>
          <HomeAction kind="social" title="Facebook" label="Facebook" className={styles.socialButton}><SocialIcon network="facebook" /></HomeAction>
          <HomeAction kind="social" title="Instagram" label="Instagram" className={styles.socialButton}><SocialIcon network="instagram" /></HomeAction>
          <HomeAction kind="social" title="LinkedIn" label="LinkedIn" className={styles.socialButton}><SocialIcon network="linkedin" /></HomeAction>
        </div>
      </div>
    </footer>
  );
}
