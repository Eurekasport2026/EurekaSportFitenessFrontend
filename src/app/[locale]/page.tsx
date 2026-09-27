import Image from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { T } from "@/components/layout/LanguageProvider";
import styles from "@/components/features/home/home.module.css";

const benefits = [
  { icon: "medal", title: "Formazione certificata", description: "Corsi riconosciuti e aggiornati" },
  { icon: "people", title: "Professionisti del settore", description: "Docenti esperti e qualificati" },
  { icon: "growth", title: "Risultati reali", description: "Per la tua carriera e il tuo benessere" },
] as const;

export default function Home() {
  return (
    <div className={styles.page} id="home">
      <a className={styles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <div className={styles.backdrop} aria-hidden="true">
        <Image src="/images/eureka-athletes.webp" alt="" fill unoptimized preload className={styles.photograph} />
      </div>
      <HomeHeader />
      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <Image className={styles.symbol} src="/eureka-symbol.svg" width={82} height={85} alt="" priority />
          <h1 id="hero-title" className={styles.wordmark}>
            EUREKA!
            <span className={styles.wordmarkSub}>SPORT &amp; FITNESS</span>
            <span className={styles.wordmarkAcademy}>ACADEMY</span>
          </h1>
          <h2 className={styles.headline}><T>FORMA. ALLENA. EVOLVI.</T></h2>
          <p className={styles.intro}><T>La piattaforma dedicata alla formazione dei professionisti e all'allenamento di chi vuole migliorarsi.</T></p>
        </section>
        <section className={styles.paths} aria-label="Scegli il tuo percorso">
          <article className={cn(styles.pathCard, styles.academy)} id="academy">
            <p className={styles.eyebrow}><T>VOGLIO DIVENTARE</T><br /><T>UN PROFESSIONISTA</T></p>
            <HomeIcon name="graduation" className={styles.pathIcon} />
            <h2>EUREKA! <span>ACADEMY</span></h2>
            <Link href="/academy" className={styles.cta}><T>Scopri i corsi</T> <HomeIcon name="arrow" /></Link>
          </article>
          <article className={cn(styles.pathCard, styles.training)} id="training">
            <p className={styles.eyebrow}><T>VOGLIO ALLENARMI</T></p>
            <HomeIcon name="dumbbell" className={styles.pathIcon} />
            <h2>EUREKA! <span>TRAINING</span></h2>
            <Link href="/training" className={styles.cta}><T>Scopri l'app</T> <HomeIcon name="arrow" /></Link>
          </article>
        </section>
        <section id="benefits" className={styles.benefits} aria-label="Perché scegliere Eureka">
          {benefits.map((benefit) => (
            <div className={styles.benefit} key={benefit.icon}>
              <HomeIcon name={benefit.icon} />
              <h2><T>{benefit.title}</T></h2>
              <p><T>{benefit.description}</T></p>
            </div>
          ))}
        </section>
        <blockquote className={styles.quote}><T>“Impara. Allenati. Supera i tuoi limiti.”</T></blockquote>
      </main>
    </div>
  );
}
