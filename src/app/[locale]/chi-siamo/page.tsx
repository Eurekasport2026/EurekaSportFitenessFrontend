import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { T } from "@/components/layout/LanguageProvider";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Chi siamo | Eureka! Sport & Fitness",
  description: "Scopri l'idea di Eureka! Sport & Fitness: formazione professionale, allenamento e crescita personale.",
};

const values = [
  { icon: "certificate", title: "Formazione concreta", description: "Percorsi e aggiornamenti per costruire competenze nel mondo dello sport." },
  { icon: "dumbbell", title: "Allenamento con uno scopo", description: "Programmi, esercizi e progressi per allenarti verso i tuoi obiettivi." },
  { icon: "growth", title: "Crescita continua", description: "Strumenti per continuare a imparare, migliorare e andare oltre." },
] as const;

export default function AboutPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="about" />
      <main id="main">
        <section className={styles.hero} aria-labelledby="about-title">
          <Image src="/images/eureka-athletes.webp" alt="" fill unoptimized preload sizes="100vw" className={styles.heroImage} />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}><T>CHI SIAMO</T></p>
            <h1 id="about-title"><T>Lo sport è il punto di partenza.</T><span><T>La crescita è il nostro obiettivo.</T></span></h1>
            <p className={styles.heroLead}><T>Eureka! unisce formazione e allenamento per chi vuole trasformare la passione per il movimento in nuove possibilità.</T></p>
            <a href="#la-nostra-idea" className={styles.heroButton}><T>Scopri la nostra idea</T><HomeIcon name="arrow" /></a>
          </div>
        </section>

        <section className={styles.idea} id="la-nostra-idea" aria-labelledby="idea-title">
          <div className={styles.ideaIntro}>
            <p className={styles.sectionEyebrow}>EUREKA! SPORT &amp; FITNESS</p>
            <h2 id="idea-title"><T>Forma. Allena. Evolvi.</T></h2>
            <p><T>Crediamo in percorsi accessibili e motivanti, capaci di unire conoscenza, pratica e risultati. Con Eureka! puoi approfondire le tue competenze nel fitness o trovare un modo più consapevole di allenarti.</T></p>
          </div>
          <div className={styles.values}>
            {values.map((value) => <article className={styles.value} key={value.title}>
              <span className={styles.valueIcon}><HomeIcon name={value.icon} /></span>
              <h3><T>{value.title}</T></h3>
              <p><T>{value.description}</T></p>
            </article>)}
          </div>
        </section>

        <section className={styles.paths} aria-labelledby="paths-title">
          <div className={styles.pathsHeading}>
            <p className={styles.sectionEyebrow}><T>DUE PERCORSI, UNA PASSIONE</T></p>
            <h2 id="paths-title"><T>Scegli come crescere con noi.</T></h2>
          </div>
          <div className={styles.pathGrid}>
            <article className={cn(styles.pathCard, styles.academyCard)}>
              <Image src="/images/eureka-academy-hero.webp" alt="Personal trainer che segue un'atleta in palestra" fill unoptimized sizes="(max-width: 700px) 100vw, 50vw" className={styles.pathImage} />
              <div className={styles.pathShade} aria-hidden="true" />
              <div className={styles.pathContent}>
                <p>01 / EUREKA! ACADEMY</p>
                <h3><T>Trasforma la tua passione in professione.</T></h3>
                <Link href="/academy"><T>Esplora Academy</T><HomeIcon name="arrow" /></Link>
              </div>
            </article>
            <article className={cn(styles.pathCard, styles.trainingCard)}>
              <Image src="/images/eureka-training-hero.webp" alt="Atleta che si allena con un manubrio" fill unoptimized sizes="(max-width: 700px) 100vw, 50vw" className={styles.pathImage} />
              <div className={styles.pathShade} aria-hidden="true" />
              <div className={styles.pathContent}>
                <p>02 / EUREKA! TRAINING</p>
                <h3><T>Allenati per la versione migliore di te.</T></h3>
                <Link href="/training"><T>Esplora Training</T><HomeIcon name="arrow" /></Link>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.contact} aria-labelledby="contact-title">
          <div>
            <p className={styles.sectionEyebrow}><T>RESTIAMO IN CONTATTO</T></p>
            <h2 id="contact-title"><T>Hai una domanda? Parliamone.</T></h2>
            <p><T>Scrivici per conoscere i percorsi Eureka! e trovare quello giusto per te.</T></p>
          </div>
          <Link href="/contatti"><T>Contattaci</T><HomeIcon name="arrow" /></Link>
        </section>
      </main>
    </div>
  );
}
