import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { CourseModule } from "@/lib/api/types";
import { StatusBadge, type ModuleStatus } from "./StatusBadge";
import { cn } from "@/lib/utils";
import styles from "./course-home.module.css";

interface ModuleCardProps {
  module: CourseModule;
  status: ModuleStatus;
  completedLessonsCount: number;
  courseSlug: string;
}

export function ModuleCard({
  module,
  status,
  completedLessonsCount,
  courseSlug,
}: ModuleCardProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const formattedNumber = String(module.number).padStart(2, "0");

  const actionText = isCompleted
    ? isEn
      ? "Review Module"
      : "Rivedi Modulo"
    : isInProgress
    ? isEn
      ? "Continue Module"
      : "Continua Modulo"
    : isEn
    ? "Start Module"
    : "Inizia Modulo";

  return (
    <article
      className={cn(
        styles.moduleCard,
        isInProgress && styles.moduleCardActive,
        isCompleted && styles.moduleCardCompleted
      )}
    >
      <div>
        <div className={styles.moduleHeader}>
          <span className={styles.moduleNumber}>
            {module.isPractical
              ? isEn ? "PRACTICE" : "PRATICA"
              : `${isEn ? "MODULE" : "MODULO"} ${formattedNumber}`}
          </span>
          <StatusBadge status={status} />
        </div>
        <h3 className={styles.moduleTitle}>{module.title}</h3>
        {module.subtitle && <p className={styles.moduleSubtitle}>{module.subtitle}</p>}
        <p className={styles.moduleDescription}>{module.description}</p>
      </div>

      <div>
        <div className={styles.moduleMeta}>
          <span className={styles.moduleMetaItem}>
            <span aria-hidden="true">⏱</span> {module.durationMinutes} min
          </span>
          <span className={styles.moduleMetaItem}>
            <span aria-hidden="true">📚</span> {completedLessonsCount} / {module.lessonsCount} {isEn ? "lessons" : "lezioni"}
          </span>
        </div>

        <Link
          href={`/academy/corsi/${courseSlug}/learn/${module.id}` as any}
          className={cn(
            styles.moduleAction,
            isCompleted && styles.moduleActionCompleted
          )}
        >
          <span>{actionText}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
