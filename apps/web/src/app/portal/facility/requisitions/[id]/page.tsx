import { FacilityPage } from "@/components/facility/FacilityPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacilityPage section="requisition-detail" id={id} />;
}
