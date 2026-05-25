import { ProfessionalPage } from "@/components/professional/ProfessionalPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfessionalPage section="opportunity-detail" id={id} />;
}
