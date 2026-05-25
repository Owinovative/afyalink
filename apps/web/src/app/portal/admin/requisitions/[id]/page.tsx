import { AdminPage } from "@/components/admin/AdminPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminPage section="requisition-detail" id={id} />;
}
