import { notFound } from "next/navigation";
import { TrainerCourseModule } from "@/components/features/portals/TrainerCourses";

export default async function TrainerModulePage({ params }: { params: Promise<{ slug: string; moduleId: string }> }) {
  const { slug, moduleId } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !/^[A-Za-z0-9_-]{1,64}$/.test(moduleId)) notFound();
  return <TrainerCourseModule key={`${slug}:${moduleId}`} slug={slug} moduleId={moduleId} />;
}
