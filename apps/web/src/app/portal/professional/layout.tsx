import { PortalLayout } from "@/components/layout/PortalLayout";
import { professionalLinks } from "@/lib/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout role="professional" title="Professional Portal" links={professionalLinks}>
      {children}
    </PortalLayout>
  );
}
