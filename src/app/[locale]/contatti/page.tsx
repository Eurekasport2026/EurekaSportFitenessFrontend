import type { Metadata } from "next";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { HomeAction } from "@/components/features/home/HomeAction";
import { ContactForm } from "@/components/features/contact/ContactForm";
import { T } from "@/components/layout/LanguageProvider";
import { SocialIcon } from "@/components/layout/SocialIcon";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/contact/contact.module.css";

export const metadata: Metadata = {
  title: "Contatti | Eureka! Sport & Fitness Academy",
  description: "Contatta il team Eureka! Sport & Fitness Academy per informazioni su corsi, allenamento e app.",
};

export default function ContactPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="contact" />
      <main className={styles.main} id="main">
        <div className={styles.intro}>
          <h1><T>Contattaci</T></h1>
          <p><T>Siamo qui per aiutarti. Scrivici per qualsiasi domanda</T><br /><T>o richiesta di informazioni.</T></p>
        </div>
        <div className={styles.columns}>
          <ContactForm />
          <aside className={styles.info} aria-label="Recapiti Eureka!">
            <div className={styles.infoItem}><HomeIcon name="location" /><div><h2><T>Sede</T></h2><p>Via dello Sport, 12<br />00100 Roma (RM)</p></div></div>
            <div className={styles.infoItem}><HomeIcon name="email" /><div><h2>Email</h2><a href="mailto:info@eurekasportfitness.it">info@eurekasportfitness.it</a></div></div>
            <div className={styles.infoItem}><HomeIcon name="phone" /><div><h2><T>Telefono</T></h2><a href="tel:+393511234567">+39 351 123 4567</a></div></div>
            <div className={styles.infoItem}><HomeIcon name="clock" /><div><h2><T>Orari</T></h2><p><T>Lun - Ven: 9:00 - 18:00</T></p></div></div>
            <div className={styles.socialSection}>
              <h2><T>Seguici su</T></h2>
              <div className={styles.socials} aria-label="Canali social">
                <HomeAction kind="social" title="Instagram" label="Instagram"><SocialIcon network="instagram" /></HomeAction>
                <HomeAction kind="social" title="Facebook" label="Facebook"><SocialIcon network="facebook" /></HomeAction>
                <HomeAction kind="social" title="YouTube" label="YouTube"><SocialIcon network="youtube" /></HomeAction>
                <HomeAction kind="social" title="TikTok" label="TikTok"><SocialIcon network="tiktok" /></HomeAction>
                <HomeAction kind="social" title="LinkedIn" label="LinkedIn"><SocialIcon network="linkedin" /></HomeAction>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
