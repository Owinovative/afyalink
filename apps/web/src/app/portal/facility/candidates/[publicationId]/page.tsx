import { FacilityPage } from "@/components/facility/FacilityPages";

export default async function Page({ params }: { params: Promise<{ publicationId: string }> }) {
  const { publicationId } = await params;
  return <FacilityPage section="candidate-detail" publicationId={publicationId} />;
}
