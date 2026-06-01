import { PortalLayout } from "@/components/layout/PortalLayout";
import { professionalLinks } from "@/lib/routes"; // Or whichever variable feeds professional links

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout role="professional" title="Professional Portal" navigation={professionalLinks}>
      {children}
    </PortalLayout>
  );
}
