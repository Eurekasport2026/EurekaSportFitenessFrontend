import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { CourseTabs } from "@/components/features/courses/CourseTabs";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/course-detail.module.css";

export const metadata: Metadata = {
  title: "Personal Trainer | Eureka! Academy",
  description: "Scopri il corso Personal Trainer di Eureka! Academy, con formazione online e pratica per il mondo del fitness.",
};

const facts = [
  { icon: "medal", label: "Durata", value: "6 mesi" },
  { icon: "video", label: "Modalità", value: "Online + pratica" },
  { icon: "certificate", label: "Certificazione", value: "Riconosciuta" },
  { icon: "clipboard", label: "Accesso", value: "Materiale didattico" },
] as const;

export default function PersonalTrainerPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="academy" />
      <main id="main">
        <div className={styles.hero}>
          <Image src="/images/eureka-personal-trainer-hero.webp" alt="Personal trainer impegnato in un esercizio con un manubrio in palestra" fill unoptimized preload className={styles.heroImage} />
        </div>
        <div className={styles.main}>
          <nav className={styles.breadcrumb} aria-label="Percorso di navigazione"><Link href="/academy">Academy</Link><span aria-hidden="true">›</span><Link href="/academy/corsi"><T>Corsi</T></Link><span aria-hidden="true">›</span><span aria-current="page">Personal Trainer</span></nav>
          <section className={styles.intro} aria-labelledby="course-title">
            <h1 id="course-title">Personal Trainer</h1>
            <p className={styles.lead}><T>Diventa un professionista del fitness</T></p>
            <p><T>Un corso completo per acquisire tutte le competenze necessarie per lavorare come Personal Trainer.</T></p>
          </section>
          <dl className={styles.facts}>
            {facts.map((fact) => <div key={fact.label}><HomeIcon name={fact.icon} /><dt><T>{fact.label}</T></dt><dd><T>{fact.value}</T></dd></div>)}
          </dl>
          <div className={styles.purchase}>
            <p className={styles.price}><strong>€ 990</strong><del>€ 1.200</del></p>
            <HomeAction kind="academy" title="Iscrizione al corso Personal Trainer" className={styles.enroll}><T>Iscriviti ora</T> <HomeIcon name="arrow" /></HomeAction>
          </div>
          <CourseTabs />
        </div>
      </main>
    </div>
  );
}
