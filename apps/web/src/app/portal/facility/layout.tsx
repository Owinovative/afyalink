import { PortalLayout } from "@/components/layout/PortalLayout";
import { facilityLinks } from "@/lib/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout role="facility" title="Facility Portal" links={facilityLinks}>
      {children}
    </PortalLayout>
  );
}
