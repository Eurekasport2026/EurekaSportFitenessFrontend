"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { CourseTabs } from "@/components/features/courses/CourseTabs";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Course, CourseModule } from "@/lib/api/types";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/course-detail.module.css";

interface CourseDetailDynamicProps {
  course: Course;
  modules: CourseModule[];
}

export function CourseDetailDynamic({ course, modules }: CourseDetailDynamicProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main">
        <T>Vai al contenuto</T>
      </a>
      <HomeHeader activePage="academy" />
      <main id="main">
        <div className={styles.hero}>
          <Image
            src={course.heroImage || "/images/eureka-personal-trainer-hero.webp"}
            alt={course.title}
            fill
            unoptimized
            priority
            className={styles.heroImage}
          />
        </div>
        <div className={styles.main}>
          <nav className={styles.breadcrumb} aria-label={isEn ? "Breadcrumb navigation" : "Percorso di navigazione"}>
            <Link href="/academy">{isEn ? "Academy" : "Accademia"}</Link>
            <span aria-hidden="true">›</span>
            <Link href="/academy/corsi">
              <T>Corsi</T>
            </Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{course.title}</span>
          </nav>

          <section className={styles.intro} aria-labelledby="course-title">
            <h1 id="course-title">{course.title}</h1>
            <p className={styles.lead}>{course.subtitle}</p>
            <p>{course.description}</p>
          </section>

          <dl className={styles.facts}>
            {course.facts.map((fact) => (
              <div key={fact.label}>
                <HomeIcon name={fact.icon} />
                <dt>
                  <T>{fact.label}</T>
                </dt>
                <dd>
                  <T>{fact.value}</T>
                </dd>
              </div>
            ))}
          </dl>

          <div className={styles.purchase}>
            <p className={styles.price}>
              <strong>€ {course.price}</strong>
              <del>€ {course.originalPrice}</del>
            </p>
            <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href={`/academy/corsi/${course.slug}/learn` as any}
                className={styles.enroll}
                style={{ background: "#059669", boxShadow: "0 3px 10px rgba(5, 150, 105, 0.3)" }}
              >
                <span>
                  <T>Accedi alle Lezioni</T>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
              <HomeAction
                kind="academy"
                title={isEn ? `Enrollment in ${course.title}` : `Iscrizione al corso ${course.title}`}
                className={styles.enroll}
              >
                <T>Iscriviti ora</T> <HomeIcon name="arrow" />
              </HomeAction>
            </div>
          </div>

          <CourseTabs course={course} modules={modules} />
        </div>
      </main>
    </div>
  );
}
