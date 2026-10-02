import type { Metadata } from "next";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { CourseCatalog } from "@/components/features/courses/CourseCatalog";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/courses.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "All Courses | Eureka! Academy" : "Tutti i corsi | Eureka! Academy",
    description: isEn
      ? "Discover Eureka! Academy courses to build your career in sports and fitness."
      : "Scopri i corsi Eureka! Academy per costruire il tuo futuro nello sport e nel fitness.",
  };
}

export default function CoursesPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="academy" />
      <main className={styles.main} id="main">
        <h1><T>Tutti i corsi</T></h1>
        <p className={styles.subtitle}><T>Scegli il percorso più adatto a te e costruisci il tuo futuro nello sport.</T></p>
        <CourseCatalog />
      </main>
    </div>
  );
}
