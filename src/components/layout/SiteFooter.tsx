import { HomeAction } from "@/components/features/home/HomeAction";
import { Link } from "@/i18n/routing";
import { T } from "./LanguageProvider";
import { SocialIcon } from "./SocialIcon";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Eureka! Sport & Fitness — Home">EUREKA!<span>SPORT &amp; FITNESS</span></Link>
        <nav aria-label="Informazioni legali">
          <HomeAction kind="legal" title="Privacy">Privacy</HomeAction>
          <HomeAction kind="legal" title="Termini"><T>Termini</T></HomeAction>
          <HomeAction kind="legal" title="Cookie">Cookie</HomeAction>
        </nav>
        <div className={styles.social} aria-label="Eureka! Sport & Fitness social">
          <HomeAction kind="social" title="Facebook" label="Facebook" className={styles.socialButton}><SocialIcon network="facebook" /></HomeAction>
          <HomeAction kind="social" title="Instagram" label="Instagram" className={styles.socialButton}><SocialIcon network="instagram" /></HomeAction>
          <HomeAction kind="social" title="LinkedIn" label="LinkedIn" className={styles.socialButton}><SocialIcon network="linkedin" /></HomeAction>
        </div>
      </div>
    </footer>
  );
}
