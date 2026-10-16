import { notFound } from "next/navigation";
import { TrainerCourseOverview } from "@/components/features/portals/TrainerCourses";

export default async function TrainerCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  return <TrainerCourseOverview key={slug} slug={slug} />;
}
