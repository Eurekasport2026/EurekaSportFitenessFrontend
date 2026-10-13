"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import type { HomeIconProps } from "@/components/features/home/HomeIcon";
import { CourseTabs } from "@/components/features/courses/CourseTabs";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Course, CourseModule } from "@/lib/api/types";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/course-detail.module.css";

const supportedFactIcons = new Set([
  "graduation", "dumbbell", "medal", "people", "growth", "search", "arrow",
  "menu", "close", "certificate", "practice", "support", "video", "location",
  "apple", "playstore", "mobile", "clipboard", "email", "phone", "clock"
]);

function getFactIconName(icon: string): HomeIconProps["name"] {
  return supportedFactIcons.has(icon) ? (icon as HomeIconProps["name"]) : "certificate";
}

interface CourseDetailDynamicProps {
  course: Course;
  modules: CourseModule[] | null;
  modulesError?: boolean;
}

export function CourseDetailDynamic({ course, modules, modulesError }: CourseDetailDynamicProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(isEn ? "en-US" : "it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main">
        <T>Vai al contenuto</T>
      </a>
      <HomeHeader activePage="academy" />
      <main id="main">
        <div className={styles.hero}>
          {course.heroImage ? (
            <Image
              src={course.heroImage}
              alt={course.title}
              fill
              unoptimized
              priority
              className={styles.heroImage}
            />
          ) : (
            <div
              className={styles.heroImage}
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #0b1e33 0%, #0d2345 100%)",
              }}
            />
          )}
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
                <HomeIcon name={getFactIconName(fact.icon)} />
                <dt>
                  {fact.label}
                </dt>
                <dd>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className={styles.purchase}>
            <p className={styles.price}>
              <strong>{formatPrice(course.price)}</strong>
              {course.originalPrice > course.price && (
                <del>{formatPrice(course.originalPrice)}</del>
              )}
            </p>
            <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href={{ pathname: "/academy/corsi/[slug]/learn", params: { slug: course.slug } }}
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

          <CourseTabs course={course} modules={modules} modulesError={modulesError} />
        </div>
      </main>
    </div>
  );
}
