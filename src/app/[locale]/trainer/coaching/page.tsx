import { TrainerWorkspace } from "@/components/features/portals/PortalWorkspace";

export default async function TrainerCoachingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div className="space-y-8"><h1 className="text-3xl font-bold">{locale === "en" ? "Athletes & coaching" : "Atleti e coaching"}</h1><TrainerWorkspace embedded /></div>;
}
