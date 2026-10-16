import { notFound } from "next/navigation";
import { TrainerCourseModule } from "@/components/features/portals/TrainerCourses";

export default async function TrainerExercisePage({ params }: { params: Promise<{ slug: string; moduleId: string; exerciseId: string }> }) {
  const { slug, moduleId, exerciseId } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !/^[A-Za-z0-9_-]{1,64}$/.test(moduleId) || !/^[A-Za-z0-9_-]{1,80}$/.test(exerciseId)) notFound();
  return <TrainerCourseModule key={`${slug}:${moduleId}:${exerciseId}`} slug={slug} moduleId={moduleId} exerciseId={exerciseId} />;
}
