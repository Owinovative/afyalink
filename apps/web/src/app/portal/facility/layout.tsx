import { PortalLayout } from "@/components/layout/PortalLayout";
import { facilityLinks } from "@/lib/routes"; // Or whichever variable feeds facility links

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout role="facility" title="Facility Portal" navigation={facilityLinks}>
      {children}
    </PortalLayout>
  );
}
