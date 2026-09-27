import Image from "next/image";
import Link from "next/link";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import { academyBenefits, academyCourses, trainingBenefits, trainingGoals } from "./content";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "./marketing.module.css";

export interface MarketingPageProps {
  variant: "academy" | "training";
}

export function MarketingPage({ variant }: MarketingPageProps) {
  const isAcademy = variant === "academy";
  const benefits = isAcademy ? academyBenefits : trainingBenefits;
  const cards = isAcademy ? academyCourses : trainingGoals;
  const sectionId = isAcademy ? "corsi" : "obiettivi";

  return (
    <div className={cn(homeStyles.page, styles.page, !isAcademy && styles.training)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage={variant} />
      <main id="main">
        <section className={styles.hero} aria-labelledby="page-title">
          <Image
            src={`/images/eureka-${variant}-hero.webp`}
            alt={isAcademy ? "Personal trainer che guida un'atleta in palestra" : "Atleta che si allena con un manubrio in palestra"}
            fill
            unoptimized
            preload
            className={styles.heroImage}
          />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <h1 id="page-title">EUREKA!<span>{isAcademy ? "ACADEMY" : "TRAINING"}</span></h1>
            <h2>{isAcademy ? <><T>Diventa un professionista</T><br /><T>dello sport e del fitness.</T></> : <><T>Allenati dove vuoi.</T><br /><T>Raggiungi i tuoi obiettivi.</T></>}</h2>
            <p>{isAcademy ? <><T>Corsi, certificazioni e aggiornamenti</T><br /><T>per costruire la tua carriera nel mondo dello sport.</T></> : <T>Programmi personalizzati, video esercizi, monitoraggio dei progressi e molto altro. Tutto in un'unica app.</T>}</p>
            <Link href={isAcademy ? "/academy/corsi" : `#${sectionId}`} className={styles.heroButton}>
              <T>{isAcademy ? "Scopri tutti i corsi" : "Inizia ora"}</T><HomeIcon name="arrow" />
            </Link>
            {!isAcademy && <div className={styles.stores} aria-label="Scarica l'app Eureka! Training">
              <HomeAction kind="training" className={styles.storeBadge} label="Disponibilità su App Store">
                <HomeIcon name="apple" /><span><small><T>Scarica su</T></small><strong>App Store</strong></span>
              </HomeAction>
              <HomeAction kind="training" className={styles.storeBadge} label="Disponibilità su Google Play">
                <HomeIcon name="playstore" /><span><small><T>Disponibile su</T></small><strong>Google Play</strong></span>
              </HomeAction>
            </div>}
          </div>
          <p className={styles.manifesto}>
            {isAcademy ? <><T>CONOSCENZA</T><br /><T>ESPERIENZA</T><br /><T>PASSIONE</T><br /><T>RISULTATI</T></> : <><T>PIÙ FORZA</T><br /><T>PIÙ ENERGIA</T><br /><T>PIÙ BENESSERE</T><br /><T>UNA VERSIONE MIGLIORE DI TE</T></>}
          </p>
        </section>

        <section className={styles.benefits} aria-label={isAcademy ? "I vantaggi di Eureka! Academy" : "I vantaggi di Eureka! Training"}>
          {benefits.map((benefit) => <div className={styles.benefit} key={benefit.title}>
            <HomeIcon name={benefit.icon} />
            <h2><T>{benefit.title}</T></h2>
            <p><T>{benefit.description}</T></p>
          </div>)}
        </section>

        <section className={styles.catalog} id={sectionId} aria-labelledby="catalog-title">
          <div className={styles.sectionHeading}>
            <h2 id="catalog-title"><T>{isAcademy ? "I NOSTRI CORSI" : "SCEGLI IL TUO OBIETTIVO"}</T></h2>
            {isAcademy && <Link href="/academy/corsi"><T>Vedi tutti</T> <HomeIcon name="arrow" /></Link>}
          </div>
          <div className={cn(styles.cardGrid, !isAcademy && styles.goalGrid)} id={isAcademy ? "lista-corsi" : "lista-obiettivi"}>
            {cards.map((card) => <article className={styles.card} key={card.title}>
              <div
                className={styles.cardPhoto}
                role="img"
                aria-label={card.imageAlt}
                style={{ backgroundPosition: `${(card.tile % 4) * 100 / 3}% ${Math.floor(card.tile / 4) * 50}%` }}
              />
              <div className={styles.cardBody}>
                <h3><T>{card.title}</T></h3>
                {card.description && <p><T>{card.description}</T></p>}
                {isAcademy && card.title === "Personal Trainer" ?
                  <Link href="/academy/corsi/personal-trainer" className={styles.cardAction}><T>Scopri</T> <HomeIcon name="arrow" /></Link> :
                  <HomeAction
                    kind={isAcademy ? "academy" : "goal"}
                    title={card.title}
                    description={card.description}
                    className={styles.cardAction}
                    label={`${isAcademy ? "Scopri il corso" : "Esplora l'obiettivo"} ${card.title}`}
                  >
                    {isAcademy && <T>Scopri</T>}<HomeIcon name="arrow" />
                  </HomeAction>}
              </div>
            </article>)}
          </div>
        </section>
      </main>
    </div>
  );
}
