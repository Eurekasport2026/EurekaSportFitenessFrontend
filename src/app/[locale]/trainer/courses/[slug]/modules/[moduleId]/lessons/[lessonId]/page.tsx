import { notFound } from "next/navigation";
import { TrainerCourseModule } from "@/components/features/portals/TrainerCourses";

export default async function TrainerLessonPage({ params }: { params: Promise<{ slug: string; moduleId: string; lessonId: string }> }) {
  const { slug, moduleId, lessonId } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !/^[A-Za-z0-9_-]{1,64}$/.test(moduleId) || !/^[A-Za-z0-9_-]{1,80}$/.test(lessonId)) notFound();
  return <TrainerCourseModule key={`${slug}:${moduleId}:${lessonId}`} slug={slug} moduleId={moduleId} lessonId={lessonId} />;
}
